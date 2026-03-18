/**
 * Wallet & Transaction Models — PostgreSQL / Sequelize
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ── WALLET ──────────────────────────────────────────────────────────────────
const Wallet = sequelize.define('Wallet', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },
  userId: {
    type:       DataTypes.UUID,
    allowNull:  false,
    unique:     true,
    references: { model: 'users', key: 'id' }
  },
  balance: {
    type:         DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    validate:     { min: 0 }
  },
  escrowBalance: {
    type:         DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    validate:     { min: 0 },
    comment:      'Funds locked in active bets'
  },
  currency:       { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  totalDeposited: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalWithdrawn: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalWagered:   { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalWon:       { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalCommissionPaid: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  withdrawalCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
  withdrawalCountMonth: { type: DataTypes.INTEGER, defaultValue: 0 },
  withdrawalMonthReset: { type: DataTypes.DATE },
  isLocked: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
    comment:      'Locked during fraud investigation'
  },
  lockReason: { type: DataTypes.TEXT }
}, {
  tableName:  'wallets',
  timestamps: true,
  indexes: [{ fields: ['userId'], unique: true }]
});

Wallet.prototype.getAvailableBalance = function() {
  return parseFloat(this.balance);
};
Wallet.prototype.getTotalBalance = function() {
  return parseFloat(this.balance) + parseFloat(this.escrowBalance);
};
Wallet.prototype.canWithdraw = function(amount) {
  if (this.isLocked)  return { allowed: false, reason: 'Wallet is locked' };
  if (parseFloat(this.balance) < amount) return { allowed: false, reason: 'Insufficient balance' };
  if (amount > parseFloat(process.env.MAX_WITHDRAWAL_DAILY || 5000)) {
    return { allowed: false, reason: `Maximum daily withdrawal is $${process.env.MAX_WITHDRAWAL_DAILY}` };
  }
  return { allowed: true };
};

// ── TRANSACTION ──────────────────────────────────────────────────────────────
const Transaction = sequelize.define('Transaction', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true
  },
  walletId:  { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'deposit', 'withdrawal',
      'bet_stake', 'bet_win', 'bet_refund', 'bet_commission',
      'p2p_transfer_in', 'p2p_transfer_out',
      'bonus', 'adjustment'
    ),
    allowNull: false
  },
  amount: {
    type:      DataTypes.DECIMAL(18, 2),
    allowNull: false
  },
  balanceBefore: { type: DataTypes.DECIMAL(18, 2) },
  balanceAfter:  { type: DataTypes.DECIMAL(18, 2) },
  status: {
    type:         DataTypes.ENUM('pending', 'completed', 'failed', 'reversed'),
    defaultValue: 'pending'
  },
  currency:          { type: DataTypes.CHAR(3), defaultValue: 'USD' },
  referenceId:       { type: DataTypes.UUID },     // bet_id, room_id, etc.
  referenceType:     { type: DataTypes.STRING(50) },
  paymentProvider:   { type: DataTypes.STRING(50) }, // stripe, paypal, etc.
  providerTxId:      { type: DataTypes.STRING(255) },
  providerStatus:    { type: DataTypes.STRING(50) },
  description:       { type: DataTypes.TEXT },
  metadata:          { type: DataTypes.JSONB },
  ipAddress:         { type: DataTypes.STRING(45) },
  failureReason:     { type: DataTypes.TEXT },
  reviewedBy:        { type: DataTypes.UUID },
  reviewedAt:        { type: DataTypes.DATE },
  reviewNote:        { type: DataTypes.TEXT }
}, {
  tableName:  'transactions',
  timestamps: true,
  indexes: [
    { fields: ['walletId'] },
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['referenceId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = { Wallet, Transaction };
