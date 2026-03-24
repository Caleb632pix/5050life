require('dotenv').config();

var express    = require('express');
var router     = express.Router();
var jwt        = require('jsonwebtoken');
var crypto     = require('crypto');
var bcrypt     = require('bcryptjs');
var body       = require('express-validator').body;
var validationResult = require('express-validator').validationResult;
var User       = require('../models/User');
var Wallet     = require('../models/Wallet').Wallet;
var authenticate = require('../middleware/auth').authenticate;
var authLimiter  = require('../middleware/rateLimiter').authLimiter;
var setCache     = require('../config/redis').setCache;
var emailService = require('../services/emailService');
var logger       = require('../config/logger');

function generateAccessToken(userId, role) {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

function validate(req, res, next) {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

router.post('/register',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters numbers and underscores'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('country').notEmpty().withMessage('Country is required')
  ],
  validate,
  async function(req, res, next) {
    try {
      var username    = req.body.username;
      var email       = req.body.email;
      var password    = req.body.password;
      var firstName   = req.body.firstName || '';
      var lastName    = req.body.lastName || '';
      var dateOfBirth = req.body.dateOfBirth;
      var country     = req.body.country;
      var timezone    = req.body.timezone || 'UTC';

      var birthDate = new Date(dateOfBirth);
      var age = (Date.now() - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: 'You must be 18 years or older to use 50/50 Life.'
        });
      }

      var existingEmail = await User.findOne({ where: { email: email } });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      var existingUsername = await User.findOne({ where: { username: username } });
      if (existingUsername) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }

      var emailVerifyToken   = crypto.randomBytes(32).toString('hex');
      var emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      var requireVerify      = process.env.REQUIRE_EMAIL_VERIFY === 'true';

      var user = await User.create({
        username:           username,
        email:              email,
        passwordHash:       password,
        firstName:          firstName,
        lastName:           lastName,
        dateOfBirth:        dateOfBirth,
        country:            country,
        timezone:           timezone,
        emailVerifyToken:   emailVerifyToken,
        emailVerifyExpires: emailVerifyExpires,
        isEmailVerified:    !requireVerify
      });

      await Wallet.create({ userId: user.id });

      if (requireVerify && process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'skip') {
        try {
          await emailService.sendVerificationEmail(user.email, user.username, emailVerifyToken);
        } catch (emailErr) {
          logger.warn('Email send failed: ' + emailErr.message);
        }
      }

      logger.info('New user registered: ' + user.username);

      return res.status(201).json({
        success: true,
        message: requireVerify
          ? 'Account created! Please check your email to verify your account.'
          : 'Account created! You can now log in to 50/50 Life.',
        data: { userId: user.id, username: user.username }
      });

    } catch (err) {
      next(err);
    }
  }
);

router.post('/login',
  authLimiter,
  [
    body('identifier').notEmpty().withMessage('Email or username required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  async function(req, res, next) {
    try {
      var identifier = req.body.identifier;
      var password   = req.body.password;
      var mfaCode    = req.body.mfaCode;

      var whereClause = identifier.includes('@')
        ? { email: identifier.toLowerCase() }
        : { username: identifier };

      var user = await User.findOne({ where: whereClause });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      var passwordMatch = await user.comparePassword(password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'Account banned: ' + (user.banReason || 'Terms of Service violation')
        });
      }

      if (process.env.REQUIRE_EMAIL_VERIFY === 'true' && !user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      if (user.mfaEnabled && !mfaCode) {
        return res.status(200).json({
          success: true,
          mfaRequired: true,
          message: 'MFA code required'
        });
      }

      await user.update({
        lastLoginAt: new Date(),
        lastLoginIp: req.ip
      });

      var accessToken  = generateAccessToken(user.id, user.role);
      var refreshToken = generateRefreshToken(user.id);

      await user.update({
        refreshTokenHash: await bcrypt.hash(refreshToken, 10)
      });

      logger.info('User logged in: ' + user.username);

      return res.json({
        success: true,
        message: 'Welcome back to 50/50 Life!',
        data: {
          accessToken:  accessToken,
          refreshToken: refreshToken,
          user: user.toPublicJSON()
        }
      });

    } catch (err) {
      next(err);
    }
  }
);

router.post('/refresh', async function(req, res, next) {
  try {
    var refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    var decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    var user    = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    var valid = user.refreshTokenHash && await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });
    }

    var newAccessToken  = generateAccessToken(user.id, user.role);
    var newRefreshToken = generateRefreshToken(user.id);

    await user.update({ refreshTokenHash: await bcrypt.hash(newRefreshToken, 10) });

    return res.json({
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

router.post('/logout', authenticate, async function(req, res, next) {
  try {
    var token   = req.headers.authorization.split(' ')[1];
    var decoded = jwt.decode(token);
    var ttl     = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await setCache('blacklist:' + token, true, ttl);
    }
    await req.user.update({ refreshTokenHash: null });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/verify-email/:token', async function(req, res, next) {
  try {
    var user = await User.findOne({ where: { emailVerifyToken: req.params.token } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    if (user.emailVerifyExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification link expired.' });
    }
    await user.update({ isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null });
    return res.json({ success: true, message: 'Email verified! You can now log in to 50/50 Life.' });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  async function(req, res, next) {
    try {
      var user = await User.findOne({ where: { email: req.body.email.toLowerCase() } });
      if (user && process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'skip') {
        var resetToken   = crypto.randomBytes(32).toString('hex');
        var resetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.update({ passwordResetToken: resetToken, passwordResetExpires: resetExpires });
        try {
          await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);
        } catch (e) {
          logger.warn('Reset email failed: ' + e.message);
        }
      }
      return res.json({ success: true, message: 'If that email is registered, a password reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  validate,
  async function(req, res, next) {
    try {
      var token = req.body.token;
      var password = req.body.password;
      var user = await User.findOne({ where: { passwordResetToken: token } });
      if (!user || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      }
      await user.update({ passwordHash: password, passwordResetToken: null, passwordResetExpires: null, refreshTokenHash: null });
      return res.json({ success: true, message: 'Password reset successfully. Please log in.' });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, function(req, res) {
  return res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});

module.exports = router;
