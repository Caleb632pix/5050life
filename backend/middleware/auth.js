/**
 * Authentication Middleware
 */
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { getCache } = require('../config/redis');

// ── Verify JWT access token ───────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (logout)
    const blacklisted = await getCache(`blacklist:${token}`).catch(() => null);
    if (blacklisted) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['passwordHash', 'refreshTokenHash', 'mfaSecret'] }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!user.isActive || user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account is suspended or banned' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid access token' });
    }
    next(err);
  }
};

// ── Optional auth (attach user if token present, but don't fail) ─────────
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findByPk(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch (e) { /* ignore */ }
  next();
};

// ── Role-based access control ────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `This action requires one of: ${roles.join(', ')}`
    });
  }
  next();
};

const requireAdmin   = requireRole('admin', 'superadmin');
const requireMod     = requireRole('moderator', 'admin', 'superadmin');
const requireVerified = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (req.user.kycStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Identity verification (KYC) required before betting. Please verify your identity in Settings.',
      code:    'KYC_REQUIRED'
    });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, requireMod, requireVerified };
        
