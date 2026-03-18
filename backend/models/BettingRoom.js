/**
 * BettingRoom Model — PostgreSQL / Sequelize
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const BettingRoom = sequelize.define('BettingRoom', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  createdBy:   { type: DataTypes.UUID, allowNull: false },
  sport:       { type: DataTypes.STRING(50) },
  eventId:     { type: DataTypes.STRING(100) },
  eventName:   { type: DataTypes.TEXT },
  entryFee: {
    type:         DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    validate:     { min: 0 }
  },
  payoutType: {
    type:         DataTypes.ENUM('winner_takes_all', 'proportional', 'last_man_standing', 'top3'),
    defaultValue: 'winner_takes_all'
  },
  maxParticipants: {
    type:         DataTypes.INTEGER,
    defaultValue: 50,
    validate:     { min: 2, max: 500 }
  },
  currentParticipants: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalPrizePool:      { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  commissionAmount:    { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  netPrizePool:        { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  status: {
    type:         DataTypes.ENUM('draft', 'open', 'active', 'settled', 'cancelled'),
    defaultValue: 'open'
  },
  isPrivate:   { type: DataTypes.BOOLEAN, defaultValue: false },
  inviteCode: {
    type:    DataTypes.STRING(12),
    unique:  true,
    defaultValue: () => uuidv4().replace(/-/g,'').substring(0,10).toUpperCase()
  },
  bannerUrl:   { type: DataTypes.TEXT },
  startsAt:    { type: DataTypes.DATE },
  endsAt:      { type: DataTypes.DATE },
  settledAt:   { type: DataTypes.DATE },
  // Chat room
  chatEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  mongoRoomId: { type: DataTypes.STRING }  // MongoDB conversation ID for room chat
}, {
  tableName:  'betting_rooms',
  timestamps: true,
  indexes: [
    { fields: ['createdBy'] },
    { fields: ['status'] },
    { fields: ['sport'] },
    { fields: ['inviteCode'], unique: true }
  ]
});

// ── ROOM PARTICIPANT ─────────────────────────────────────────────────────────
const RoomParticipant = sequelize.define('RoomParticipant', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  roomId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  role:   { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
  selection:    { type: DataTypes.STRING(255) },
  entryFeePaid: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  points:       { type: DataTypes.INTEGER, defaultValue: 0 },
  rank:         { type: DataTypes.INTEGER },
  payout:       { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  paidAt:       { type: DataTypes.DATE },
  joinedAt:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName:  'room_participants',
  timestamps: true,
  indexes: [
    { fields: ['roomId'] },
    { fields: ['userId'] },
    { fields: ['roomId', 'userId'], unique: true }
  ]
});

module.exports = { BettingRoom, RoomParticipant };
