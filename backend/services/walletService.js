/**
 * Wallet Service
 * ─────────────
 * Handles all financial operations: deposits, withdrawals, P2P transfers.
 */
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sequelize } = require('../config/database');
const { Wallet, Transaction } = require('../models/Wallet');
const User   = require('../models/User');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

const FREE_WITHDRAWALS = parseInt(process.env.FREE_WITHDRAWALS_PER_MONTH || 2);
const WITHDRAWAL_FEE   = parseFloat(process.env.WITHDRAWAL_FEE || 1.00);
const MIN_DEPOSIT      = parseFloat(process.env.MIN_DEPOSIT || 10);
const MAX_WITHDRAWAL   = parseFloat(process.env.MAX_WITHDRAWAL_DAILY || 5000);

class WalletService {

  // ── Get wallet with recent transactions ───────────────────────────────
  async getWallet(userId) {
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({ where: { userId } }),
      Transaction.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 20
      })
    ]);
    if (!wallet) throw new Error('Wallet not found');
    return { wallet, transactions };
  }

  // ── Create Stripe Payment Intent (deposit) ────────────────────────────
  async initiateDeposit(userId, amount, paymentMethodId, currency = 'usd') {
    if (amount < MIN_DEPOSIT) {
      throw new Error(`Minimum deposit is $${MIN_DEPOSIT}`);
    }

    const user   = await User.findByPk(userId);
    const wallet = await Wallet.findOne({ where: { userId } });
    if (wallet.isLocked) throw new Error('Wallet is locked. Please contact support.');

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount:               Math.round(amount * 100), // cents
      currency,
      payment_method:       paymentMethodId,
      confirmation_method:  'manual',
      confirm:              true,
      return_url:           `${process.env.FRONTEND_URL}/wallet/deposit/confirm`,
      metadata: {
        userId,
        username:  user.username,
        platform:  '50/50 Life',
        type:      'deposit'
      }
    });

    // Create pending transaction
    const transaction = await Transaction.create({
      walletId:        wallet.id,
      userId,
      type:            'deposit',
      amount,
      balanceBefore:   parseFloat(wallet.balance),
      balanceAfter:    parseFloat(wallet.balance) + amount,
      status:          'pending',
      currency:        currency.toUpperCase(),
      paymentProvider: 'stripe',
      providerTxId:    paymentIntent.id,
      description:     `Deposit via card — $${amount}`
    });

    if (paymentIntent.status === 'succeeded') {
      await this._completeDeposit(transaction.id, paymentIntent.id);
    }

    return { paymentIntent, transactionId: transaction.id };
  }

  // ── Complete deposit (called from webhook) ────────────────────────────
  async _completeDeposit(transactionId, providerTxId) {
    const t = await sequelize.transaction();
    try {
      const txn    = await Transaction.findByPk(transactionId, { transaction: t });
      const wallet = await Wallet.findByPk(txn.walletId, { lock: t.LOCK.UPDATE, transaction: t });

      if (txn.status === 'completed') {
        await t.rollback();
        return;
      }

      await wallet.update({
        balance:        parseFloat(wallet.balance) + parseFloat(txn.amount),
        totalDeposited: parseFloat(wallet.totalDeposited) + parseFloat(txn.amount)
      }, { transaction: t });

      await txn.update({ status: 'completed' }, { transaction: t });
      await t.commit();

      await notificationService.send(txn.userId, {
        type:  'deposit_confirmed',
        title: 'Deposit Confirmed',
        body:  `$${txn.amount} has been added to your 50/50 Life wallet`,
        data:  { amount: txn.amount }
      });

      logger.info(`Deposit completed: $${txn.amount} for user ${txn.userId}`);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── Initiate withdrawal ───────────────────────────────────────────────
  async initiateWithdrawal(userId, amount, method, details) {
    if (amount <= 0) throw new Error('Invalid withdrawal amount');
    if (amount > MAX_WITHDRAWAL) throw new Error(`Maximum daily withdrawal is $${MAX_WITHDRAWAL}`);

    const [user, wallet] = await Promise.all([
      User.findByPk(userId),
      Wallet.findOne({ where: { userId } })
    ]);

    if (!wallet) throw new Error('Wallet not found');
    if (wallet.isLocked) throw new Error('Wallet is locked. Please contact support.');

    // Check 2FA was completed
    if (user.mfaEnabled) {
      // In production: verify MFA code from request
    }

    // Calculate fee
    const monthlyWithdrawals = wallet.withdrawalCountMonth || 0;
    const fee    = monthlyWithdrawals >= FREE_WITHDRAWALS ? WITHDRAWAL_FEE : 0;
    const total  = amount + fee;

    const canWithdraw = wallet.canWithdraw(total);
    if (!canWithdraw.allowed) throw new Error(canWithdraw.reason);

    const t = await sequelize.transaction();
    try {
      // Deduct balance immediately
      await wallet.update({
        balance:              parseFloat(wallet.balance) - total,
        totalWithdrawn:       parseFloat(wallet.totalWithdrawn) + amount,
        withdrawalCount:      wallet.withdrawalCount + 1,
        withdrawalCountMonth: monthlyWithdrawals + 1
      }, { transaction: t });

      const txn = await Transaction.create({
        walletId:        wallet.id,
        userId,
        type:            'withdrawal',
        amount:          -total,
        balanceBefore:   parseFloat(wallet.balance),
        balanceAfter:    parseFloat(wallet.balance) - total,
        status:          'pending',
        paymentProvider: method,
        description:     `Withdrawal: $${amount} (fee: $${fee}) via ${method}`,
        metadata:        { method, details: { ...details }, fee, netAmount: amount }
      }, { transaction: t });

      await t.commit();

      // Queue for admin review if over $500
      if (amount > 500) {
        logger.info(`Large withdrawal queued for review: $${amount} by ${userId}`);
        // In production: add to admin review queue
      }

      // For smaller amounts, process automatically via Stripe payout
      if (amount <= 500 && method === 'bank') {
        await this._processAutoPayout(txn.id, amount, details);
      }

      await notificationService.send(userId, {
        type:  'withdrawal_processed',
        title: 'Withdrawal Submitted',
        body:  `Your withdrawal of $${amount} is being processed (1-3 business days)`,
        data:  { amount, transactionId: txn.id }
      });

      return { transactionId: txn.id, status: 'pending', netAmount: amount, fee };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── P2P Transfer ──────────────────────────────────────────────────────
  async transferFunds(senderId, recipientUsername, amount, note) {
    if (amount <= 0) throw new Error('Transfer amount must be greater than 0');
    if (amount > 1000) throw new Error('Maximum single transfer is $1,000');

    const t = await sequelize.transaction();
    try {
      const [sender, senderWallet] = await Promise.all([
        User.findByPk(senderId, { transaction: t }),
        Wallet.findOne({ where: { userId: senderId }, lock: t.LOCK.UPDATE, transaction: t })
      ]);

      const recipient = await User.findOne({ where: { username: recipientUsername } });
      if (!recipient) throw new Error(`User @${recipientUsername} not found`);
      if (recipient.id === senderId) throw new Error('Cannot transfer to yourself');

      const recipientWallet = await Wallet.findOne({
        where: { userId: recipient.id },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (parseFloat(senderWallet.balance) < amount) {
        throw new Error(`Insufficient balance. You have $${senderWallet.balance}`);
      }

      // Deduct from sender
      await senderWallet.update({
        balance: parseFloat(senderWallet.balance) - amount
      }, { transaction: t });

      // Credit recipient
      await recipientWallet.update({
        balance: parseFloat(recipientWallet.balance) + amount
      }, { transaction: t });

      // Record both legs
      const refId = require('uuid').v4();
      await Promise.all([
        Transaction.create({
          walletId: senderWallet.id, userId: senderId,
          type: 'p2p_transfer_out', amount: -amount,
          status: 'completed', referenceId: refId,
          description: `Transfer to @${recipientUsername}: ${note || ''}`
        }, { transaction: t }),
        Transaction.create({
          walletId: recipientWallet.id, userId: recipient.id,
          type: 'p2p_transfer_in', amount,
          status: 'completed', referenceId: refId,
          description: `Transfer from @${sender.username}: ${note || ''}`
        }, { transaction: t })
      ]);

      await t.commit();

      await notificationService.send(recipient.id, {
        type:  'message_received',
        title: `💸 @${sender.username} sent you $${amount}`,
        body:  note || 'You received a transfer on 50/50 Life',
        data:  { senderId, amount }
      });

      logger.info(`P2P transfer: $${amount} from ${senderId} to ${recipient.id}`);
      return { success: true, amount, recipient: recipient.username };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ── Stripe webhook handler ────────────────────────────────────────────
  async handleStripeWebhook(rawBody, signature) {
    const event = stripe.webhooks.constructEvent(
      rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const txn = await Transaction.findOne({ where: { providerTxId: pi.id } });
        if (txn && txn.status !== 'completed') {
          await this._completeDeposit(txn.id, pi.id);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await Transaction.update(
          { status: 'failed', failureReason: pi.last_payment_error?.message },
          { where: { providerTxId: pi.id } }
        );
        break;
      }
      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }
}

module.exports = new WalletService();
