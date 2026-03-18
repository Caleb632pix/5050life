/**
 * Wallet Routes — /api/v1/wallet
 */
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireVerified } = require('../middleware/auth');
const { depositLimiter } = require('../middleware/rateLimiter');
const walletService = require('../services/walletService');
const { Wallet, Transaction } = require('../models/Wallet');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// GET /wallet — get wallet balance and recent transactions
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { wallet, transactions } = await walletService.getWallet(req.user.id);
    res.json({
      success: true,
      data: {
        balance:       parseFloat(wallet.balance),
        escrowBalance: parseFloat(wallet.escrowBalance),
        totalBalance:  wallet.getTotalBalance(),
        currency:      wallet.currency,
        stats: {
          totalDeposited:      parseFloat(wallet.totalDeposited),
          totalWithdrawn:      parseFloat(wallet.totalWithdrawn),
          totalWagered:        parseFloat(wallet.totalWagered),
          totalWon:            parseFloat(wallet.totalWon),
          totalCommissionPaid: parseFloat(wallet.totalCommissionPaid)
        },
        transactions
      }
    });
  } catch (err) { next(err); }
});

// POST /wallet/deposit — initiate a deposit
router.post('/deposit',
  authenticate,
  requireVerified,
  depositLimiter,
  [
    body('amount').isFloat({ min: 10, max: 50000 }).withMessage('Deposit amount must be between $10 and $50,000'),
    body('paymentMethodId').notEmpty().withMessage('Payment method required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, paymentMethodId, currency = 'usd' } = req.body;
      const result = await walletService.initiateDeposit(req.user.id, amount, paymentMethodId, currency);
      res.json({
        success: true,
        message: `Deposit of $${amount} initiated!`,
        data: result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// POST /wallet/withdraw
router.post('/withdraw',
  authenticate,
  requireVerified,
  [
    body('amount').isFloat({ min: 10 }).withMessage('Minimum withdrawal is $10'),
    body('method').isIn(['bank', 'paypal', 'skrill', 'neteller']).withMessage('Invalid withdrawal method'),
    body('details').isObject().withMessage('Account details required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, method, details, note } = req.body;
      const result = await walletService.initiateWithdrawal(req.user.id, amount, method, details);
      res.json({
        success: true,
        message: `Withdrawal of $${amount} submitted. Processing time: 1-3 business days.`,
        data: result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// POST /wallet/transfer — P2P transfer
router.post('/transfer',
  authenticate,
  requireVerified,
  [
    body('recipientUsername').notEmpty().withMessage('Recipient username required'),
    body('amount').isFloat({ min: 1, max: 1000 }).withMessage('Transfer must be between $1 and $1,000'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { recipientUsername, amount, note } = req.body;
      const result = await walletService.transferFunds(req.user.id, recipientUsername, amount, note);
      res.json({
        success: true,
        message: `$${amount} sent to @${recipientUsername} successfully!`,
        data: result
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// GET /wallet/transactions — paginated transaction history
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const where  = { userId: req.user.id };
    if (type)   where.type   = type;
    if (status) where.status = status;

    const { rows, count } = await Transaction.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset
    });
    res.json({ success: true, data: { transactions: rows, total: count } });
  } catch (err) { next(err); }
});

module.exports = router;
