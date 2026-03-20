const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const sportsData = require('../services/sportsData');

// GET /sports/list — get supported sports
router.get('/list', authenticate, async (req, res, next) => {
  try {
    const sports = await sportsData.getSupportedSports();
    res.json({ success: true, data: { sports } });
  } catch (err) { next(err); }
});

// GET /sports/odds — get live odds
router.get('/odds', authenticate, async (req, res, next) => {
  try {
    const { sport = 'soccer_epl' } = req.query;
    const odds = await sportsData.getLiveOdds(sport);
    res.json({ success: true, data: { odds } });
  } catch (err) { next(err); }
});

// GET /sports/fixtures — get upcoming fixtures
router.get('/fixtures', authenticate, async (req, res, next) => {
  try {
    const { sport = 'soccer_epl' } = req.query;
    const fixtures = await sportsData.getUpcomingFixtures(sport);
    res.json({ success: true, data: { fixtures } });
  } catch (err) { next(err); }
});

module.exports = router;
