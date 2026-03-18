/**
 * Betting Engine Service
 * ─────────────────────
 * Core business logic for creating, matching, and settling bets.
 * 50/50 Life takes 10% commission on every bet payout.
 */
const { sequelize } = require('../config/database');
const { Bet, BetParticipant } = require('../models/Bet');
const { Wallet, Transaction } = require('../models/Wallet');
const User = require('../models/User');
const { Post } = require('../models/Social');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || 0.10);

class BettingEngine {

  // ── Create a new bet ──────────────────────────────────────────────────
  async createBet(userId, betData) {
    const t = await sequelize.transaction();
    try {
      const user   = await User.findByPk(userId, { transaction: t });
      const wallet = await Wallet.findOne({ where: { userId }, transaction: t });

      // Validate user can bet
      const canBet = user.canBet();
      if (!canBet.allowed) throw new Error(canBet.reason);

      // Validate sufficient balance
      const stake = parseFloat(betData.stake);
      if (parseFloat(wallet.balance) < stake) {
        throw new Error(`Insufficient balance. You have $${wallet.balance} but need $${stake}.`);
      }

      // Calculate payout and commission
      const odds           = parseFloat(betData.odds || 2.0);
      const potentialPayout  = stake * odds;
      const commissionAmount = potentialPayout * COMMISSION_RATE;
      const netPayout        = potentialPayout - commissionAmount;

      // Create the bet
      const bet = await Bet.create({
        creatorId:       userId,
        type:            betData.type || 'p2p',
        sport:           betData.sport,
        eventId:         betData.eventId,
        eventName:       betData.eventName,
        eventStartTime:  betData.eventStartTime,
        market:          betData.market,
        selection:       betData.selection,
        odds,
        stake,
        potentialPayout,
        commissionRate:  COMMISSION_RATE,
        commissionAmount,
        netPayout,
        status:          'open',
        expiresAt:       betData.expiresAt,
        visibility:      betData.visibility || 'public',
        description:     betData.description,
        roomId:          betData.roomId
      }, { transaction: t });

      // Add creator as participant
      await BetParticipant.create({
        betId:    bet.id,
        userId,
        role:     'creator',
        selection: betData.selection,
        stake,
        potentialPayout: netPayout
      }, { transaction: t });

      // Escrow the funds
      await wallet.update({
        balance:       parseFloat(wallet.balance) - stake,
        escrowBalance: parseFloat(wallet.escrowBalance) + stake
      }, { transaction: t });

      // Record transaction
      await Transaction.create({
        walletId:      wallet.id,
        userId,
        type:          'bet_stake',
        amount:        -stake,
        balanceBefore: parseFloat(wallet.balance),
        balanceAfter:  parseFloat(wallet.balance) - stake,
        status:        'completed',
        referenceId:   bet.id,
        referenceType: 'bet',
        description:   `Bet stake: ${betData.eventName} — ${betData.selection}`
      }, { transaction: t });

      await t.commit();

      // Post to social feed
      if (betData.shareToFeed !== false && bet.visibility === 'public') {
        await this._shareToFeed(bet, user);
      }

      logger.info(`Bet created: ${bet.id} by user ${userId} — stake $${stake}`);
      return bet;

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── Accept / join a P2P bet ───────────────────────────────────────────
  async acceptBet(betId, acceptorId, selection) {
    const t = await sequelize.transaction();
    try {
      const bet = await Bet.findByPk(betId, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!bet) throw new Error('Bet not found');
      if (bet.status !== 'open') throw new Error('This bet is no longer open');
      if (bet.creatorId === acceptorId) throw new Error('You cannot accept your own bet');
      if (bet.expiresAt && bet.expiresAt < new Date()) throw new Error('This bet has expired');

      const [acceptor, acceptorWallet, creator] = await Promise.all([
        User.findByPk(acceptorId, { transaction: t }),
        Wallet.findOne({ where: { userId: acceptorId }, transaction: t }),
        User.findByPk(bet.creatorId)
      ]);

      // Validate acceptor can bet
      const canBet = acceptor.canBet();
      if (!canBet.allowed) throw new Error(canBet.reason);

      const stake = parseFloat(bet.stake);
      if (parseFloat(acceptorWallet.balance) < stake) {
        throw new Error(`Insufficient balance. This bet requires $${stake}.`);
      }

      // Update bet status to matched
      await bet.update({ status: 'matched' }, { transaction: t });

      // Add acceptor as participant
      const acceptorOdds   = parseFloat(bet.odds);
      const potentialPayout  = stake * acceptorOdds;
      const commissionAmount = potentialPayout * COMMISSION_RATE;
      const netPayout        = potentialPayout - commissionAmount;

      await BetParticipant.create({
        betId:    bet.id,
        userId:   acceptorId,
        role:     'acceptor',
        selection,
        stake,
        potentialPayout: netPayout,
        commissionPaid:  commissionAmount
      }, { transaction: t });

      // Escrow acceptor funds
      await acceptorWallet.update({
        balance:       parseFloat(acceptorWallet.balance) - stake,
        escrowBalance: parseFloat(acceptorWallet.escrowBalance) + stake
      }, { transaction: t });

      await Transaction.create({
        walletId:      acceptorWallet.id,
        userId:        acceptorId,
        type:          'bet_stake',
        amount:        -stake,
        balanceBefore: parseFloat(acceptorWallet.balance),
        balanceAfter:  parseFloat(acceptorWallet.balance) - stake,
        status:        'completed',
        referenceId:   bet.id,
        referenceType: 'bet',
        description:   `Bet accepted: ${bet.eventName} — ${selection}`
      }, { transaction: t });

      await t.commit();

      // Notify both users
      await notificationService.send(bet.creatorId, {
        type:   'bet_accepted',
        title:  'Your bet was accepted!',
        body:   `${acceptor.username} just accepted your bet on ${bet.eventName}`,
        data:   { betId: bet.id }
      });

      logger.info(`Bet ${betId} accepted by ${acceptorId}`);
      return bet;

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── Settle a bet (called by cron after result confirmed) ─────────────
  async settleBet(betId, officialResult, resultSource = 'sports_api') {
    const t = await sequelize.transaction();
    try {
      const bet          = await Bet.findByPk(betId, { lock: t.LOCK.UPDATE, transaction: t });
      const participants = await BetParticipant.findAll({ where: { betId }, transaction: t });

      if (!bet) throw new Error('Bet not found');
      if (bet.status === 'settled') throw new Error('Bet already settled');

      // Determine winners based on official result
      const settlements = this._calculateSettlements(bet, participants, officialResult);

      for (const settlement of settlements) {
        const wallet = await Wallet.findOne({ where: { userId: settlement.userId }, transaction: t });
        const participant = participants.find(p => p.userId === settlement.userId);

        if (settlement.result === 'win') {
          // Release escrow + add winnings (minus commission)
          const escrowRelease = parseFloat(participant.stake);
          const winnings      = parseFloat(settlement.netPayout);
          const commission    = parseFloat(settlement.commission);

          await wallet.update({
            balance:             parseFloat(wallet.balance) + winnings,
            escrowBalance:       parseFloat(wallet.escrowBalance) - escrowRelease,
            totalWon:            parseFloat(wallet.totalWon) + winnings,
            totalCommissionPaid: parseFloat(wallet.totalCommissionPaid) + commission
          }, { transaction: t });

          await Transaction.create({
            walletId:      wallet.id,
            userId:        settlement.userId,
            type:          'bet_win',
            amount:        winnings,
            balanceBefore: parseFloat(wallet.balance),
            balanceAfter:  parseFloat(wallet.balance) + winnings,
            status:        'completed',
            referenceId:   betId,
            referenceType: 'bet',
            description:   `Bet won (10% commission deducted): ${bet.eventName}`
          }, { transaction: t });

          // Record commission transaction (for platform revenue tracking)
          await Transaction.create({
            walletId:      wallet.id,
            userId:        settlement.userId,
            type:          'bet_commission',
            amount:        -commission,
            status:        'completed',
            referenceId:   betId,
            referenceType: 'bet',
            description:   `50/50 Life commission (10%): ${bet.eventName}`
          }, { transaction: t });

          await participant.update({ result: 'win', payoutReceived: winnings, paidAt: new Date() }, { transaction: t });

        } else if (settlement.result === 'loss') {
          // Just release escrow (no refund)
          await wallet.update({
            escrowBalance: parseFloat(wallet.escrowBalance) - parseFloat(participant.stake)
          }, { transaction: t });
          await participant.update({ result: 'loss' }, { transaction: t });

        } else if (settlement.result === 'void') {
          // Refund stake
          await wallet.update({
            balance:       parseFloat(wallet.balance) + parseFloat(participant.stake),
            escrowBalance: parseFloat(wallet.escrowBalance) - parseFloat(participant.stake)
          }, { transaction: t });

          await Transaction.create({
            walletId:      wallet.id,
            userId:        settlement.userId,
            type:          'bet_refund',
            amount:        parseFloat(participant.stake),
            status:        'completed',
            referenceId:   betId,
            referenceType: 'bet',
            description:   `Bet voided — full refund: ${bet.eventName}`
          }, { transaction: t });

          await participant.update({ result: 'void', payoutReceived: parseFloat(participant.stake) }, { transaction: t });
        }
      }

      // Update bet record
      const winner = settlements.find(s => s.result === 'win');
      await bet.update({
        status:         'settled',
        result:         winner ? 'win' : settlements[0]?.result || 'void',
        winnerId:       winner?.userId,
        settledAt:      new Date(),
        settledBy:      'auto',
        officialResult,
        resultSource
      }, { transaction: t });

      // Update user stats
      for (const settlement of settlements) {
        const user = await User.findByPk(settlement.userId, { transaction: t });
        await user.update({
          totalBets: user.totalBets + 1,
          totalWins: settlement.result === 'win' ? user.totalWins + 1 : user.totalWins
        }, { transaction: t });
      }

      await t.commit();

      // Send notifications
      for (const settlement of settlements) {
        const notifType = settlement.result === 'win' ? 'bet_won' : settlement.result === 'void' ? 'bet_void' : 'bet_lost';
        await notificationService.send(settlement.userId, {
          type:  notifType,
          title: settlement.result === 'win'  ? '🎉 You won your bet!'
               : settlement.result === 'void' ? 'Bet voided — full refund'
               : 'Bet settled — better luck next time',
          body: `${bet.eventName}: ${bet.selection}`,
          data: { betId }
        });
      }

      logger.info(`Bet ${betId} settled. Winner: ${winner?.userId || 'void'}`);
      return { betId, settlements };

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── Calculate settlements ─────────────────────────────────────────────
  _calculateSettlements(bet, participants, officialResult) {
    return participants.map(p => {
      // Check if participant's selection matches the official result
      const isWinner = this._isWinningSelection(p.selection, officialResult, bet.market);
      const stake    = parseFloat(p.stake);
      const payout   = stake * parseFloat(bet.odds);
      const commission = payout * COMMISSION_RATE;
      const netPayout  = payout - commission;

      return {
        userId:     p.userId,
        result:     officialResult.voided ? 'void' : isWinner ? 'win' : 'loss',
        netPayout:  isWinner ? netPayout : 0,
        commission: isWinner ? commission : 0
      };
    });
  }

  _isWinningSelection(selection, officialResult, market) {
    // Normalise for comparison
    const sel    = selection.toLowerCase().trim();
    const result = (officialResult.winner || officialResult.outcome || '').toLowerCase().trim();
    return sel === result || sel === officialResult.score || sel === officialResult.result;
  }

  // ── Share bet to social feed ──────────────────────────────────────────
  async _shareToFeed(bet, user) {
    try {
      await Post.create({
        userId:    user.id,
        username:  user.username,
        avatarUrl: user.avatarUrl,
        type:      'bet_challenge',
        content:   `🎯 I just placed a bet! Who wants to take the other side? #${bet.sport} #5050Life`,
        linkedBetId: bet.id,
        betData: {
          sport:     bet.sport,
          eventName: bet.eventName,
          selection: bet.selection,
          odds:      bet.odds,
          stake:     bet.stake
        },
        hashtags: [bet.sport, '5050Life', 'bet']
      });
    } catch (err) {
      logger.warn('Failed to share bet to feed:', err.message);
    }
  }

  // ── Cancel / void a bet ───────────────────────────────────────────────
  async cancelBet(betId, userId, reason) {
    const t = await sequelize.transaction();
    try {
      const bet = await Bet.findByPk(betId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!bet) throw new Error('Bet not found');
      if (bet.creatorId !== userId) throw new Error('Only the bet creator can cancel');
      if (bet.status === 'matched') throw new Error('Cannot cancel a matched bet');
      if (bet.status === 'settled') throw new Error('Cannot cancel a settled bet');

      const participant = await BetParticipant.findOne({ where: { betId, userId }, transaction: t });
      const wallet      = await Wallet.findOne({ where: { userId }, transaction: t });

      // Refund escrow
      await wallet.update({
        balance:       parseFloat(wallet.balance) + parseFloat(participant.stake),
        escrowBalance: parseFloat(wallet.escrowBalance) - parseFloat(participant.stake)
      }, { transaction: t });

      await bet.update({ status: 'cancelled' }, { transaction: t });

      await Transaction.create({
        walletId:     wallet.id,
        userId,
        type:         'bet_refund',
        amount:       parseFloat(participant.stake),
        status:       'completed',
        referenceId:  betId,
        description:  `Bet cancelled: ${bet.eventName}`
      }, { transaction: t });

      await t.commit();
      logger.info(`Bet ${betId} cancelled by ${userId}`);
      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

module.exports = new BettingEngine();
