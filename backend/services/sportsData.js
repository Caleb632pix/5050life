/**
 * Sports Data Service
 * ───────────────────
 * Fetches live scores, odds, and results from external APIs.
 * Primary: Sportradar  |  Odds: OddsAPI  |  Esports: PandaScore
 */
const axios  = require('axios');
const { setCache, getCache } = require('../config/redis');
const logger = require('../config/logger');

const SPORTRADAR_BASE = 'https://api.sportradar.com';
const ODDS_API_BASE   = 'https://api.the-odds-api.com/v4';
const PANDA_BASE      = 'https://api.pandascore.co';

class SportsDataService {

  // ── Get live odds for a sport ────────────────────────────────────────
  async getLiveOdds(sport = 'soccer_epl', regions = 'us,uk,eu') {
    const cacheKey = `odds:${sport}`;
    const cached   = await getCache(cacheKey).catch(() => null);
    if (cached) return cached;

    try {
      const res = await axios.get(`${ODDS_API_BASE}/sports/${sport}/odds`, {
        params: {
          apiKey:   process.env.ODDS_API_KEY,
          regions,
          markets:  'h2h,spreads,totals',
          oddsFormat: 'decimal'
        },
        timeout: 5000
      });

      const odds = res.data;
      await setCache(cacheKey, odds, 60); // cache 60 seconds
      return odds;
    } catch (err) {
      logger.warn(`Odds API error for ${sport}:`, err.message);
      return [];
    }
  }

  // ── Get live score for a specific event ──────────────────────────────
  async getLiveScore(eventId) {
    const cacheKey = `score:${eventId}`;
    const cached   = await getCache(cacheKey).catch(() => null);
    if (cached) return cached;

    try {
      // This would call the appropriate Sportradar endpoint based on sport
      const res = await axios.get(`${SPORTRADAR_BASE}/soccer/v4/en/matches/${eventId}/summary.json`, {
        params: { api_key: process.env.SPORTRADAR_API_KEY },
        timeout: 5000
      });

      const score = this._normaliseScore(res.data);
      await setCache(cacheKey, score, 30); // cache 30 seconds for live
      return score;
    } catch (err) {
      logger.warn(`Score fetch error for event ${eventId}:`, err.message);
      return null;
    }
  }

  // ── Get final result of an event ─────────────────────────────────────
  async getEventResult(eventId, sport) {
    const cacheKey = `result:${eventId}`;
    const cached   = await getCache(cacheKey).catch(() => null);
    if (cached) return cached;

    try {
      let result;
      if (sport === 'esports') {
        result = await this._getEsportsResult(eventId);
      } else {
        result = await this._getSportsResult(eventId, sport);
      }

      if (result?.isFinished) {
        await setCache(cacheKey, result, 3600); // cache 1 hour for final results
      }

      return result;
    } catch (err) {
      logger.warn(`Result fetch error for event ${eventId}:`, err.message);
      return null;
    }
  }

  // ── Get upcoming fixtures ────────────────────────────────────────────
  async getUpcomingFixtures(sport, days = 7) {
    const cacheKey = `fixtures:${sport}:${days}`;
    const cached   = await getCache(cacheKey).catch(() => null);
    if (cached) return cached;

    try {
      const res = await axios.get(`${ODDS_API_BASE}/sports/${sport}/events`, {
        params: { apiKey: process.env.ODDS_API_KEY },
        timeout: 8000
      });

      const fixtures = res.data.slice(0, 50); // limit to 50
      await setCache(cacheKey, fixtures, 300);
      return fixtures;
    } catch (err) {
      logger.warn(`Fixtures fetch error for ${sport}:`, err.message);
      return [];
    }
  }

  // ── Get supported sports list ────────────────────────────────────────
  async getSupportedSports() {
    return [
      { key: 'soccer_epl',       name: 'Football - Premier League',    icon: '⚽' },
      { key: 'soccer_champions', name: 'Football - Champions League',   icon: '⚽' },
      { key: 'soccer_world_cup', name: 'Football - World Cup',          icon: '⚽' },
      { key: 'cricket_ipl',      name: 'Cricket - IPL',                 icon: '🏏' },
      { key: 'cricket_test',     name: 'Cricket - Test Matches',        icon: '🏏' },
      { key: 'basketball_nba',   name: 'Basketball - NBA',              icon: '🏀' },
      { key: 'basketball_euroleague', name: 'Basketball - EuroLeague',  icon: '🏀' },
      { key: 'americanfootball_nfl', name: 'American Football - NFL',   icon: '🏈' },
      { key: 'baseball_mlb',     name: 'Baseball - MLB',                icon: '⚾' },
      { key: 'tennis_atp',       name: 'Tennis - ATP',                  icon: '🎾' },
      { key: 'tennis_wta',       name: 'Tennis - WTA',                  icon: '🎾' },
      { key: 'mma_ufc',          name: 'MMA - UFC',                     icon: '🥊' },
      { key: 'boxing',           name: 'Boxing',                        icon: '🥊' },
      { key: 'golf_pga',         name: 'Golf - PGA Tour',               icon: '⛳' },
      { key: 'esports_cs2',      name: 'Esports - CS2',                 icon: '🎮' },
      { key: 'esports_lol',      name: 'Esports - League of Legends',   icon: '🎮' },
      { key: 'esports_dota2',    name: 'Esports - Dota 2',              icon: '🎮' },
      { key: 'esports_valorant', name: 'Esports - Valorant',            icon: '🎮' },
      { key: 'rugby_union',      name: 'Rugby Union',                   icon: '🏉' },
      { key: 'custom',           name: 'Custom Bet',                    icon: '🎯' }
    ];
  }

  // ── Private helpers ──────────────────────────────────────────────────
  async _getSportsResult(eventId, sport) {
    const res = await axios.get(`${SPORTRADAR_BASE}/soccer/v4/en/matches/${eventId}/summary.json`, {
      params:  { api_key: process.env.SPORTRADAR_API_KEY },
      timeout: 8000
    });

    const data = res.data;
    const status = data.sport_event_status?.status;

    return {
      eventId,
      isFinished: status === 'closed' || status === 'ended',
      status,
      homeTeam:  data.sport_event?.competitors?.[0]?.name,
      awayTeam:  data.sport_event?.competitors?.[1]?.name,
      homeScore: data.sport_event_status?.home_score,
      awayScore: data.sport_event_status?.away_score,
      winner:    data.sport_event_status?.winner_id
        ? data.sport_event?.competitors?.find(c => c.id === data.sport_event_status.winner_id)?.name
        : data.sport_event_status?.home_score === data.sport_event_status?.away_score ? 'draw' : null,
      result:    `${data.sport_event_status?.home_score}-${data.sport_event_status?.away_score}`,
      voided:    false
    };
  }

  async _getEsportsResult(eventId) {
    const res = await axios.get(`${PANDA_BASE}/matches/${eventId}`, {
      headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` },
      timeout: 8000
    });

    const match = res.data;
    return {
      eventId,
      isFinished: match.status === 'finished',
      status:     match.status,
      winner:     match.winner?.name,
      result:     match.results?.map(r => `${r.team.name}: ${r.score}`).join(' vs '),
      voided:     false
    };
  }

  _normaliseScore(raw) {
    return {
      home:      raw.sport_event_status?.home_score ?? 0,
      away:      raw.sport_event_status?.away_score ?? 0,
      status:    raw.sport_event_status?.status,
      minute:    raw.sport_event_status?.clock?.played,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SportsDataService();
