/**
 * Bet & BetParticipant Models — PostgreSQL / Sequelize
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || 0.10);

const Bet = sequelize.define('Bet', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },
  creatorId:   { type: DataTypes.UUID, allowNull: false },
  type: {
    type:      DataTypes.ENUM('sportsbook', 'p2p', 'group'),
    allowNull: false
  },
  sport: {
    type:      DataTypes.STRING(50),
    allowNull: false
    // football, cricket, basketball, tennis, esports, mma, golf, baseball, rugby, custom
  },
  eventId:       { type: DataTypes.STRING(100) },  // external sports API ID
  eventName:     { type: DataTypes.TEXT, allowNull: false },
  eventStartTime: { type: DataTypes.DATE },
  market: {
    type:    DataTypes.STRING(100),
    comment: 'e.g. match_winner, over_under_2.5, first_scorer'
  },
  selection: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    comment:   'What the creator bet on (e.g. "Manchester United", "Over 2.5")'
  },
  odds: {
    type:    DataTypes.DECIMAL(8, 3),
    comment: 'Decimal odds at time of creation'
  },
  stake: {
    type:      DataTypes.DECIMAL(18, 2),
    allowNull: false,
    validate:  {
      min: parseFloat(process.env.MIN_BET_AMOUNT || 1),
      max: parseFloat(process.env.MAX_BET_AMOUNT || 10000)
    }
  },
  potentialPayout:   { type: DataTypes.DECIMAL(18, 2) },
  commissionRate:    { type: DataTypes.DECIMAL(5, 4), defaultValue: COMMISSION_RATE },
  commissionAmount:  { type: DataTypes.DECIMAL(18, 2) },
  netPayout:         { type: DataTypes.DECIMAL(18, 2) }, // payout minus commission
  status: {
    type:         DataTypes.ENUM('open', 'matched', 'settled', 'cancelled', 'disputed', 'void'),
    defaultValue: 'open'
  },
  result: {
    type:    DataTypes.ENUM('win', 'loss', 'void', 'push'),
    comment: 'NULL until settled'
  },
  winnerId:      { type: DataTypes.UUID },
  settledAt:     { type: DataTypes.DATE },
  settledBy:     { type: DataTypes.ENUM('auto', 'admin'), defaultValue: 'auto' },
  expiresAt:     { type: DataTypes.DATE },
  visibility: {
    type:         DataTypes.ENUM('public', 'followers', 'private'),
    defaultValue: 'public'
  },
  description:   { type: DataTypes.TEXT },  // custom bet description
  isDisputed:    { type: DataTypes.BOOLEAN, defaultValue: false },
  disputeReason: { type: DataTypes.TEXT },
  disputedAt:    { type: DataTypes.DATE },
  disputedBy:    { type: DataTypes.UUID },
  disputeResolvedAt: { type: DataTypes.DATE },
  disputeResolvedBy: { type: DataTypes.UUID },
  disputeNote:       { type: DataTypes.TEXT },
  // External result data
  officialResult:    { type: DataTypes.JSONB },
  resultSource:      { type: DataTypes.STRING(100) },
  // Room association
  roomId:            { type: DataTypes.UUID },
  // Social
  sharedToFeed:      { type: DataTypes.BOOLEAN, defaultValue: true },
  sharePostId:       { type: DataTypes.STRING }  // MongoDB post ID
}, {
  tableName:  'bets',
  timestamps: true,
  indexes: [
    { fields: ['creatorId'] },
    { fields: ['status'] },
    { fields: ['sport'] },
    { fields: ['eventId'] },
    { fields: ['type'] },
    { fields: ['roomId'] },
    { fields: ['createdAt'] }
  ]
});

// Calculate payout and commission before saving
Bet.beforeCreate((bet) => {
  if (bet.odds && bet.stake) {
    bet.potentialPayout  = parseFloat(bet.stake) * parseFloat(bet.odds);
    bet.commissionAmount = bet.potentialPayout * COMMISSION_RATE;
    bet.netPayout        = bet.potentialPayout - bet.commissionAmount;
  }
});

// ── BET PARTICIPANT ──────────────────────────────────────────────────────────
// For P2P and group bets where multiple users participate
const BetParticipant = sequelize.define('BetParticipant', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },
  betId:     { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: false },
  role: {
    type:      DataTypes.ENUM('creator', 'acceptor'),
    allowNull: false
  },
  selection: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    comment:   'The specific outcome this participant picked'
  },
  stake:           { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  potentialPayout: { type: DataTypes.DECIMAL(18, 2) },
  commissionPaid:  { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  netPayout:       { type: DataTypes.DECIMAL(18, 2) },
  result:          { type: DataTypes.ENUM('win', 'loss', 'void', 'push') },
  payoutReceived:  { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  paidAt:          { type: DataTypes.DATE }
}, {
  tableName:  'bet_participants',
  timestamps: true,
  indexes: [
    { fields: ['betId'] },
    { fields: ['userId'] },
    { fields: ['betId', 'userId'], unique: true }
  ]
});

module.exports = { Bet, BetParticipant };
