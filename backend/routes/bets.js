/**
 * Bet Routes — /api/v1/bets
 */
const router = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticate, requireVerified } = require('../middleware/auth');
const { betLimiter } = require('../middleware/rateLimiter');
const bettingEngine  = require('../services/bettingEngine');
const { Bet, BetParticipant } = require('../models/Bet');
const User = require('../models/User');
const { Op } = require('sequelize');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
}

// ── GET /bets — browse open bets ──────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { sport, type, status = 'open', page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    const where = { visibility: 'public' };
    if (sport)  where.sport  = sport;
    if (type)   where.type   = type;
    if (status) where.status = status;

    const order = sort === 'highest_stake' ? [['stake', 'DESC']]
                : sort === 'lowest_stake'  ? [['stake', 'ASC']]
                : [['createdAt', 'DESC']];

    const { rows: bets, count } = await Bet.findAndCountAll({
      where, order, limit: parseInt(limit), offset: parseInt(offset)
    });

    // Attach creator info
    const userIds = [...new Set(bets.map(b => b.creatorId))];
    const users   = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'avatarUrl', 'kycStatus']
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const betsWithCreator = bets.map(b => ({
      ...b.toJSON(),
      creator: userMap[b.creatorId]
    }));

    res.json({
      success: true,
      data: {
        bets: betsWithCreator,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
      }
    });
  } catch (err) { next(err); }
});

// ── GET /bets/:id — get single bet ────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const bet = await Bet.findByPk(req.params.id);
    if (!bet) return res.status(404).json({ success: false, message: 'Bet not found' });

    const [creator, participants] = await Promise.all([
      User.findByPk(bet.creatorId, { attributes: ['id', 'username', 'avatarUrl'] }),
      BetParticipant.findAll({ where: { betId: bet.id } })
    ]);

    // Attach usernames to participants
    const partUserIds = participants.map(p => p.userId);
    const partUsers   = await User.findAll({
      where: { id: partUserIds },
      attributes: ['id', 'username', 'avatarUrl']
    });
    const partMap = Object.fromEntries(partUsers.map(u => [u.id, u]));

    res.json({
      success: true,
      data: {
        bet: {
          ...bet.toJSON(),
          creator,
          participants: participants.map(p => ({
            ...p.toJSON(),
            user: partMap[p.userId]
          }))
        }
      }
    });
  } catch (err) { next(err); }
});

// ── POST /bets — create a bet ─────────────────────────────────────────────
router.post('/',
  authenticate,
  requireVerified,
  betLimiter,
  [
    body('type').isIn(['sportsbook', 'p2p', 'group']).withMessage('Invalid bet type'),
    body('sport').notEmpty().withMessage('Sport is required'),
    body('eventName').notEmpty().withMessage('Event name is required'),
    body('selection').notEmpty().withMessage('Selection is required'),
    body('stake').isFloat({ min: 1, max: 10000 }).withMessage('Stake must be between $1 and $10,000'),
    body('odds').isFloat({ min: 1.01 }).withMessage('Odds must be greater than 1.01')
  ],
  validate,
  async (req, res, next) => {
    try {
      const bet = await bettingEngine.createBet(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Bet created! Your stake has been placed in escrow.',
        data: { bet }
      });
    } catch (err) {
      if (err.message.includes('Insufficient') || err.message.includes('KYC')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    }
  }
);

// ── POST /bets/:id/accept — accept a P2P bet ──────────────────────────────
router.post('/:id/accept',
  authenticate,
  requireVerified,
  betLimiter,
  [body('selection').notEmpty().withMessage('Your selection is required')],
  validate,
  async (req, res, next) => {
    try {
      const bet = await bettingEngine.acceptBet(req.params.id, req.user.id, req.body.selection);
      res.json({
        success: true,
        message: "Bet accepted! It's on. May the best side win! 🎯",
        data: { bet }
      });
    } catch (err) {
      if (err.message.includes('Insufficient') || err.message.includes('already settled')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    }
  }
);

// ── DELETE /bets/:id — cancel a bet ──────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await bettingEngine.cancelBet(req.params.id, req.user.id, req.body.reason);
    res.json({ success: true, message: 'Bet cancelled. Your stake has been refunded.' });
  } catch (err) {
    if (err.message.includes('Cannot')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

// ── GET /bets/my/history — user's bet history ─────────────────────────────
router.get('/my/history', authenticate, async (req, res, next) => {
  try {
    const { status, sport, result, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const participations = await BetParticipant.findAll({
      where: { userId: req.user.id },
      attributes: ['betId', 'selection', 'stake', 'result', 'payoutReceived', 'paidAt']
    });
    const betIds = participations.map(p => p.betId);

    const where = { id: betIds };
    if (status) where.status = status;
    if (sport)  where.sport  = sport;
    if (result) where.result = result;

    const { rows: bets, count } = await Bet.findAndCountAll({
      where, order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset
    });

    const partMap = Object.fromEntries(participations.map(p => [p.betId, p]));
    const enriched = bets.map(b => ({ ...b.toJSON(), participation: partMap[b.id] }));

    res.json({
      success: true,
      data: {
        bets: enriched,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
      }
    });
  } catch (err) { next(err); }
});

// ── POST /bets/:id/dispute — dispute a bet result ─────────────────────────
router.post('/:id/dispute',
  authenticate,
  [body('reason').isLength({ min: 20, max: 1000 }).withMessage('Please provide a detailed reason (20-1000 chars)')],
  validate,
  async (req, res, next) => {
    try {
      const bet = await Bet.findByPk(req.params.id);
      if (!bet) return res.status(404).json({ success: false, message: 'Bet not found' });
      if (bet.status !== 'settled') return res.status(400).json({ success: false, message: 'Only settled bets can be disputed' });

      // Check 24-hour window
      const settledAt = new Date(bet.settledAt);
      const hoursAgo  = (Date.now() - settledAt) / (60 * 60 * 1000);
      if (hoursAgo > 24) {
        return res.status(400).json({ success: false, message: 'Dispute window is 24 hours after settlement' });
      }

      await bet.update({
        isDisputed:   true,
        disputeReason: req.body.reason,
        disputedAt:   new Date(),
        disputedBy:   req.user.id
      });

      res.json({
        success: true,
        message: 'Dispute raised. Our team will review within 48 hours. Funds are on hold.'
      });
    } catch (err) { next(err); }
  }
);

// ── GET /bets/live/odds — live odds for sports ────────────────────────────
router.get('/live/odds', authenticate, async (req, res, next) => {
  try {
    const sportsData = require('../services/sportsData');
    const { sport = 'soccer_epl' } = req.query;
    const odds = await sportsData.getLiveOdds(sport);
    res.json({ success: true, data: { odds } });
  } catch (err) { next(err); }
});

module.exports = router;
