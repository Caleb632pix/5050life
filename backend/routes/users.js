const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// GET /users/:username — get public profile
router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { username: req.params.username },
      attributes: [
        'id', 'username', 'firstName', 'lastName',
        'avatarUrl', 'bio', 'kycStatus', 'role',
        'followersCount', 'followingCount', 'postsCount',
        'totalBets', 'totalWins', 'totalWagered', 'totalWon',
        'createdAt'
      ]
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// PATCH /users/me — update own profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const allowed = ['bio', 'firstName', 'lastName', 'timezone', 'notifyBetResult', 'notifyFollowers', 'notifyMessages', 'notifyPromotions'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    await req.user.update(updates);
    res.json({ success: true, message: 'Profile updated', data: { user: req.user.toPublicJSON() } });
  } catch (err) { next(err); }
});

// GET /users/me/stats — own betting stats
router.get('/me/stats', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        totalBets:    req.user.totalBets,
        totalWins:    req.user.totalWins,
        totalWagered: req.user.totalWagered,
        totalWon:     req.user.totalWon,
        winRate:      req.user.totalBets > 0
          ? ((req.user.totalWins / req.user.totalBets) * 100).toFixed(1)
          : 0
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
