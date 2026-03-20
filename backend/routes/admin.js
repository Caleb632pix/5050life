const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { Bet } = require('../models/Bet');
const { Transaction } = require('../models/Wallet');

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// GET /admin/stats — platform overview
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalBets, pendingWithdrawals] = await Promise.all([
      User.count(),
      Bet.count(),
      Transaction.count({ where: { type: 'withdrawal', status: 'pending' } })
    ]);
    res.json({
      success: true,
      data: { totalUsers, totalBets, pendingWithdrawals }
    });
  } catch (err) { next(err); }
});

// GET /admin/users — list users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows: users, count } = await User.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });
    res.json({ success: true, data: { users, total: count } });
  } catch (err) { next(err); }
});

module.exports = router;
