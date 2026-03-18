/**
 * Auth Routes — /api/v1/auth
 */
const router    = require('express').Router();
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const { body, validationResult } = require('express-validator');
const User      = require('../models/User');
const { Wallet } = require('../models/Wallet');
const { authenticate } = require('../middleware/auth');
const { authLimiter }  = require('../middleware/rateLimiter');
const { setCache, getRedis } = require('../config/redis');
const emailService = require('../services/emailService');
const smsService   = require('../services/smsService');
const logger       = require('../config/logger');

// ── Helpers ────────────────────────────────────────────────────────────────
function generateAccessToken(userId, role) {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
}
function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
}
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
}

// ── POST /register ─────────────────────────────────────────────────────────
router.post('/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username: 3-30 chars, letters/numbers/underscores only'),
    body('email').normalizeEmail().isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain letters and numbers'),
    body('dateOfBirth').isDate().withMessage('Valid date of birth required'),
    body('country').isISO31661Alpha2().withMessage('Valid country code required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, dateOfBirth, country, timezone } = req.body;

      // Check age (must be 18+)
      const age = (Date.now() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: 'You must be 18 years or older to use 50/50 Life.'
        });
      }

      // Check duplicates
      const [existingEmail, existingUsername] = await Promise.all([
        User.findOne({ where: { email } }),
        User.findOne({ where: { username } })
      ]);
      if (existingEmail)    return res.status(409).json({ success: false, message: 'Email already registered' });
      if (existingUsername) return res.status(409).json({ success: false, message: 'Username already taken' });

      // Generate email verification token
      const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
      const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await User.create({
        username, email,
        passwordHash: password,  // hashed in model hook
        firstName, lastName, dateOfBirth, country, timezone,
        emailVerifyToken, emailVerifyExpires
      });

      // Create wallet
      await Wallet.create({ userId: user.id });

      // Send verification email
      await emailService.sendVerificationEmail(user.email, user.username, emailVerifyToken);

      logger.info(`New user registered: ${user.username} (${user.id})`);

      res.status(201).json({
        success: true,
        message: 'Account created! Please check your email to verify your account.',
        data: { userId: user.id, username: user.username }
      });
    } catch (err) { next(err); }
  }
);

// ── POST /login ────────────────────────────────────────────────────────────
router.post('/login',
  authLimiter,
  [
    body('identifier').notEmpty().withMessage('Email or username required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { identifier, password, mfaCode } = req.body;

      // Find by email or username
      const user = await User.findOne({
        where: identifier.includes('@')
          ? { email: identifier.toLowerCase() }
          : { username: identifier }
      });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: `Account banned: ${user.banReason || 'Terms of Service violation'}`
        });
      }
      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in.',
          code:    'EMAIL_NOT_VERIFIED'
        });
      }

      // MFA check
      if (user.mfaEnabled) {
        if (!mfaCode) {
          return res.status(200).json({ success: true, mfaRequired: true, message: 'MFA code required' });
        }
        // Validate TOTP (using speakeasy in production)
        // const valid = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: mfaCode });
        // if (!valid) return res.status(401).json({ success: false, message: 'Invalid MFA code' });
      }

      // Update last login
      await user.update({ lastLoginAt: new Date(), lastLoginIp: req.ip });

      const accessToken  = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token hash in DB
      const bcrypt = require('bcryptjs');
      await user.update({ refreshTokenHash: await bcrypt.hash(refreshToken, 10) });

      logger.info(`User logged in: ${user.username}`);

      res.json({
        success: true,
        message: 'Welcome back to 50/50 Life!',
        data: {
          accessToken, refreshToken,
          user: user.toPublicJSON()
        }
      });
    } catch (err) { next(err); }
  }
);

// ── POST /refresh ──────────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Verify token matches stored hash
    const bcrypt = require('bcryptjs');
    const valid  = user.refreshTokenHash && await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });

    const newAccessToken  = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    await user.update({ refreshTokenHash: await bcrypt.hash(newRefreshToken, 10) });

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
    next(err);
  }
});

// ── POST /logout ───────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Blacklist current access token
    const token   = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token);
    const ttl     = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await setCache(`blacklist:${token}`, true, ttl);
    }
    // Clear refresh token
    await req.user.update({ refreshTokenHash: null });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// ── GET /verify-email/:token ───────────────────────────────────────────────
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { emailVerifyToken: req.params.token }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    if (user.emailVerifyExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification link expired. Please request a new one.' });
    }

    await user.update({
      isEmailVerified:  true,
      emailVerifyToken: null,
      emailVerifyExpires: null
    });

    res.json({ success: true, message: 'Email verified! You can now log in to 50/50 Life.' });
  } catch (err) { next(err); }
});

// ── POST /forgot-password ──────────────────────────────────────────────────
router.post('/forgot-password',
  authLimiter,
  body('email').isEmail().withMessage('Valid email required'),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ where: { email: req.body.email.toLowerCase() } });

      // Always return success (don't reveal if email exists)
      if (user) {
        const resetToken   = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.update({ passwordResetToken: resetToken, passwordResetExpires: resetExpires });
        await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);
      }

      res.json({
        success: true,
        message: 'If that email is registered, a password reset link has been sent.'
      });
    } catch (err) { next(err); }
  }
);

// ── POST /reset-password ───────────────────────────────────────────────────
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Za-z])(?=.*\d)/)
  ],
  validate,
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const user = await User.findOne({ where: { passwordResetToken: token } });

      if (!user || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      }

      await user.update({
        passwordHash: password,  // hashed in model hook
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshTokenHash: null   // invalidate all sessions
      });

      res.json({ success: true, message: 'Password reset successfully. Please log in.' });
    } catch (err) { next(err); }
  }
);

// ── GET /me ────────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});

module.exports = router;
