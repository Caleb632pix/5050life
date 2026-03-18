/**
 * User Model — PostgreSQL / Sequelize
 */
const { DataTypes } = require('sequelize');
const bcrypt        = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },
  username: {
    type:   DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    validate: {
      len:     [3, 30],
      is:      /^[a-zA-Z0-9_]+$/
    }
  },
  email: {
    type:   DataTypes.STRING(255),
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type:   DataTypes.STRING(20),
    unique: true
  },
  passwordHash: {
    type:      DataTypes.TEXT,
    allowNull: true   // null for OAuth-only users
  },
  firstName:  { type: DataTypes.STRING(50) },
  lastName:   { type: DataTypes.STRING(50) },
  avatarUrl:  { type: DataTypes.TEXT },
  bio:        { type: DataTypes.STRING(300) },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    validate: {
      isDate: true,
      isBefore: new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  country:    { type: DataTypes.CHAR(2) },    // ISO 3166-1 alpha-2
  timezone:   { type: DataTypes.STRING(50) },
  currency:   { type: DataTypes.CHAR(3), defaultValue: 'USD' },

  // Auth
  role: {
    type:         DataTypes.ENUM('user', 'moderator', 'admin', 'superadmin'),
    defaultValue: 'user'
  },
  isEmailVerified:  { type: DataTypes.BOOLEAN, defaultValue: false },
  isPhoneVerified:  { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerifyToken: { type: DataTypes.STRING },
  emailVerifyExpires: { type: DataTypes.DATE },
  passwordResetToken:   { type: DataTypes.STRING },
  passwordResetExpires: { type: DataTypes.DATE },
  mfaEnabled:  { type: DataTypes.BOOLEAN, defaultValue: false },
  mfaSecret:   { type: DataTypes.STRING },   // TOTP secret (encrypted)
  refreshTokenHash: { type: DataTypes.TEXT },

  // KYC
  kycStatus: {
    type:         DataTypes.ENUM('not_started', 'pending', 'verified', 'rejected'),
    defaultValue: 'not_started'
  },
  kycVerifiedAt:    { type: DataTypes.DATE },
  kycRejectedReason: { type: DataTypes.TEXT },
  onfidoApplicantId: { type: DataTypes.STRING },

  // Account status
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
  isBanned:   { type: DataTypes.BOOLEAN, defaultValue: false },
  banReason:  { type: DataTypes.TEXT },
  bannedAt:   { type: DataTypes.DATE },
  bannedBy:   { type: DataTypes.UUID },
  isSuspended: { type: DataTypes.BOOLEAN, defaultValue: false },
  suspendedUntil: { type: DataTypes.DATE },

  // OAuth
  googleId:   { type: DataTypes.STRING, unique: true },
  facebookId: { type: DataTypes.STRING, unique: true },
  appleId:    { type: DataTypes.STRING, unique: true },

  // Responsible gambling
  depositLimit:    { type: DataTypes.DECIMAL(18, 2) },
  dailyLossLimit:  { type: DataTypes.DECIMAL(18, 2) },
  selfExcludedUntil: { type: DataTypes.DATE },
  lastLoginAt:  { type: DataTypes.DATE },
  lastLoginIp:  { type: DataTypes.STRING(45) },

  // Stats (denormalised for performance)
  totalBets:      { type: DataTypes.INTEGER, defaultValue: 0 },
  totalWins:      { type: DataTypes.INTEGER, defaultValue: 0 },
  totalWagered:   { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalWon:       { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  followersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  followingCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  postsCount:     { type: DataTypes.INTEGER, defaultValue: 0 },

  // Notifications preferences
  notifyBetResult:     { type: DataTypes.BOOLEAN, defaultValue: true },
  notifyFollowers:     { type: DataTypes.BOOLEAN, defaultValue: true },
  notifyMessages:      { type: DataTypes.BOOLEAN, defaultValue: true },
  notifyPromotions:    { type: DataTypes.BOOLEAN, defaultValue: false },
  fcmToken:            { type: DataTypes.TEXT }   // Firebase push token
}, {
  tableName:  'users',
  timestamps: true,
  paranoid:   true,   // soft delete
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['kycStatus'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.passwordHash) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('passwordHash') && user.passwordHash) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
      }
    }
  }
});

// ── Instance methods ─────────────────────────────────────────────────────
User.prototype.comparePassword = async function(plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

User.prototype.toPublicJSON = function() {
  const { passwordHash, refreshTokenHash, mfaSecret, emailVerifyToken,
          passwordResetToken, onfidoApplicantId, fcmToken, ...pub } = this.toJSON();
  return pub;
};

User.prototype.canBet = function() {
  if (!this.isActive || this.isBanned) return { allowed: false, reason: 'Account is not active' };
  if (this.isSuspended && this.suspendedUntil > new Date()) return { allowed: false, reason: 'Account is suspended' };
  if (this.kycStatus !== 'verified') return { allowed: false, reason: 'KYC verification required before betting' };
  if (this.selfExcludedUntil && this.selfExcludedUntil > new Date()) return { allowed: false, reason: 'Self-exclusion is active' };
  return { allowed: true };
};

module.exports = User;
      
