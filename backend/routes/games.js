/**
 * Game Bet Routes — /api/v1/games
 * Handles game-specific bets, challenges, and leaderboards
 */
const router   = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireVerified } = require('../middleware/auth');
const { betLimiter } = require('../middleware/rateLimiter');
const bettingEngine  = require('../services/bettingEngine');
const { Bet, BetParticipant } = require('../models/Bet');
const User   = require('../models/User');
const { setCache, getCache } = require('../config/redis');
const { Op }  = require('sequelize');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

// ── GET /games — list all supported games with live stats ────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Get open bet counts per game from DB
    const gameBetCounts = await Bet.findAll({
      where: { status: ['open', 'matched'], sport: { [Op.like]: 'game:%' } },
      attributes: ['sport', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['sport'],
      raw: true
    });
    const countMap = Object.fromEntries(
      gameBetCounts.map(r => [r.sport.replace('game:', ''), parseInt(r.count)])
    );
    res.json({ success: true, data: { betCounts: countMap } });
  } catch (err) { next(err); }
});

// ── GET /games/:gameId/bets — get open bets for a specific game ──────────
router.get('/:gameId/bets', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, betType } = req.query;
    const offset = (page - 1) * limit;
    const where  = { sport: `game:${req.params.gameId}`, visibility: 'public' };
    if (betType) where.market = betType;

    const { rows: bets, count } = await Bet.findAndCountAll({
      where, order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset
    });

    const userIds  = [...new Set(bets.map(b => b.creatorId))];
    const users    = await User.findAll({ where: { id: userIds }, attributes: ['id','username','avatarUrl'] });
    const userMap  = Object.fromEntries(users.map(u => [u.id, u]));

    res.json({
      success: true,
      data: {
        bets: bets.map(b => ({ ...b.toJSON(), creator: userMap[b.creatorId] })),
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
      }
    });
  } catch (err) { next(err); }
});

// ── POST /games/:gameId/bets — create a game bet ─────────────────────────
router.post('/:gameId/bets',
  authenticate,
  requireVerified,
  betLimiter,
  [
    body('betType').notEmpty().withMessage('Bet type required'),
    body('description').notEmpty().withMessage('Challenge description required'),
    body('stake').isFloat({ min: 1, max: 10000 }).withMessage('Stake must be $1–$10,000'),
    body('odds').isFloat({ min: 1.01 }).withMessage('Odds must be > 1.01'),
    body('challengePlayer').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { betType, description, stake, odds, challengePlayer, visibility = 'public', expiresIn = 24 } = req.body;
      const { gameId } = req.params;

      const expiresAt = new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000);

      const bet = await bettingEngine.createBet(req.user.id, {
        type:       challengePlayer ? 'p2p' : 'sportsbook',
        sport:      `game:${gameId}`,
        eventName:  description,
        selection:  req.body.selection || req.user.username,
        market:     betType,
        odds:       parseFloat(odds),
        stake:      parseFloat(stake),
        visibility,
        description,
        expiresAt,
        shareToFeed: true,
      });

      // If challenging a specific player, notify them
      if (challengePlayer) {
        const target = await User.findOne({ where: { username: challengePlayer } });
        if (target) {
          const notifService = require('../services/notificationService');
          await notifService.send(target.id, {
            type:   'bet_challenge_received',
            title:  `⚔️ @${req.user.username} challenged you!`,
            body:   `Game: ${gameId} — ${description}`,
            data:   { betId: bet.id, gameId, challengerId: req.user.id }
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Game bet created! Challenge is live on 50/50 Life 🎮`,
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

// ── GET /games/:gameId/leaderboard — top bettors for a game ─────────────
router.get('/:gameId/leaderboard', authenticate, async (req, res, next) => {
  try {
    const cacheKey = `leaderboard:game:${req.params.gameId}`;
    const cached   = await getCache(cacheKey).catch(() => null);
    if (cached) return res.json({ success: true, data: cached });

    const topWinners = await BetParticipant.findAll({
      where: { result: 'win' },
      include: [{ model: Bet, where: { sport: `game:${req.params.gameId}` }, attributes: [] }],
      attributes: ['userId', [require('sequelize').fn('SUM', require('sequelize').col('payoutReceived')), 'totalWon'], [require('sequelize').fn('COUNT', '*'), 'wins']],
      group: ['userId'],
      order: [[require('sequelize').fn('SUM', require('sequelize').col('payoutReceived')), 'DESC']],
      limit: 20,
      raw: true
    });

    const userIds  = topWinners.map(w => w.userId);
    const users    = await User.findAll({ where: { id: userIds }, attributes: ['id','username','avatarUrl','totalBets','totalWins'] });
    const userMap  = Object.fromEntries(users.map(u => [u.id, u]));

    const leaderboard = topWinners.map(w => ({
      user:     userMap[w.userId],
      totalWon: parseFloat(w.totalWon),
      wins:     parseInt(w.wins)
    }));

    await setCache(cacheKey, { leaderboard }, 300);
    res.json({ success: true, data: { leaderboard } });
  } catch (err) { next(err); }
});

// ── POST /games/:gameId/challenge — direct player challenge ───────────────
router.post('/:gameId/challenge',
  authenticate,
  requireVerified,
  [
    body('targetUsername').notEmpty(),
    body('stake').isFloat({ min: 1 }),
    body('description').notEmpty(),
    body('odds').isFloat({ min: 1.01 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { targetUsername, stake, description, odds } = req.body;
      const target = await User.findOne({ where: { username: targetUsername } });
      if (!target) return res.status(404).json({ success: false, message: `@${targetUsername} not found` });
      if (target.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot challenge yourself' });

      const bet = await bettingEngine.createBet(req.user.id, {
        type:      'p2p',
        sport:     `game:${req.params.gameId}`,
        eventName: description,
        selection: req.user.username,
        market:    'head_to_head',
        odds:      parseFloat(odds),
        stake:     parseFloat(stake),
        visibility:'private',
        description,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      const notifService = require('../services/notificationService');
      await notifService.send(target.id, {
        type:  'bet_challenge_received',
        title: `⚔️ @${req.user.username} challenged you to a game bet!`,
        body:  description,
        data:  { betId: bet.id, gameId: req.params.gameId }
      });

      res.status(201).json({
        success: true,
        message: `Challenge sent to @${targetUsername}!`,
        data: { bet, targetUser: { username: target.username, avatarUrl: target.avatarUrl } }
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
