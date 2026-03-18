/**
 * Cron Jobs Service
 * Auto-settle bets, fetch live scores, expire open bets, monthly resets
 */
const cron   = require('node-cron');
const { Op } = require('sequelize');
const { Bet } = require('../models/Bet');
const sportsData    = require('./sportsData');
const bettingEngine = require('./bettingEngine');
const logger        = require('../config/logger');
const { emitEventScore } = require('../sockets/socketHandler');

function startCronJobs() {

  // ── Poll live scores every 30 seconds ────────────────────────────────
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Get all active bets with events in progress
      const activeBets = await Bet.findAll({
        where: { status: ['open', 'matched'], eventStartTime: { [Op.lte]: new Date() } },
        attributes: ['id', 'eventId', 'sport', 'status']
      });

      const uniqueEvents = [...new Set(activeBets.map(b => b.eventId).filter(Boolean))];
      for (const eventId of uniqueEvents) {
        const score = await sportsData.getLiveScore(eventId).catch(() => null);
        if (score) emitEventScore(eventId, score);
      }
    } catch (err) {
      logger.error('Score poll error:', err.message);
    }
  });

  // ── Check for settled events every 2 minutes ──────────────────────
  cron.schedule('*/2 * * * *', async () => {
    try {
      const betsToSettle = await Bet.findAll({
        where: {
          status:    'matched',
          eventId:   { [Op.ne]: null },
          eventStartTime: { [Op.lte]: new Date() }
        },
        limit: 50
      });

      for (const bet of betsToSettle) {
        try {
          const result = await sportsData.getEventResult(bet.eventId, bet.sport);
          if (result?.isFinished) {
            await bettingEngine.settleBet(bet.id, result);
            logger.info(`Auto-settled bet ${bet.id}`);
          }
        } catch (err) {
          logger.warn(`Failed to settle bet ${bet.id}:`, err.message);
        }
      }
    } catch (err) {
      logger.error('Settlement cron error:', err.message);
    }
  });

  // ── Expire open P2P bets every 5 minutes ──────────────────────────
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expired = await Bet.findAll({
        where: {
          status:    'open',
          expiresAt: { [Op.lt]: new Date() }
        }
      });

      for (const bet of expired) {
        await bettingEngine.cancelBet(bet.id, bet.creatorId, 'Bet expired').catch(() => {});
      }

      if (expired.length > 0) logger.info(`Expired ${expired.length} open bets`);
    } catch (err) {
      logger.error('Expiry cron error:', err.message);
    }
  });

  // ── Reset monthly withdrawal counter on 1st of each month ─────────
  cron.schedule('0 0 1 * *', async () => {
    try {
      const { Wallet } = require('../models/Wallet');
      await Wallet.update(
        { withdrawalCountMonth: 0, withdrawalMonthReset: new Date() },
        { where: {} }
      );
      logger.info('Monthly withdrawal counters reset');
    } catch (err) {
      logger.error('Monthly reset error:', err.message);
    }
  });

  // ── Daily active bet report at midnight ───────────────────────────
  cron.schedule('0 0 * * *', async () => {
    try {
      const { sequelize } = require('../config/database');
      const [[stats]] = await sequelize.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'open')    AS open_bets,
          COUNT(*) FILTER (WHERE status = 'matched') AS matched_bets,
          SUM(stake) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS daily_volume,
          SUM(commission_amount) FILTER (WHERE DATE(settled_at) = CURRENT_DATE) AS daily_commission
        FROM bets
      `);
      logger.info(`Daily report: open=${stats.open_bets} matched=${stats.matched_bets} volume=$${stats.daily_volume || 0} commission=$${stats.daily_commission || 0}`);
    } catch (err) {
      logger.error('Daily report error:', err.message);
    }
  });

  logger.info('✅ Cron jobs started');
}

module.exports = { startCronJobs };
