const rateLimit = require('express-rate-limit');

// General API limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      200,
  message:  { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development'
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Bet placement limiter (prevent spam bets)
const betLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      20,
  message:  { success: false, message: 'Too many bets placed. Please slow down.' }
});

// Deposit limiter
const depositLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      10,
  message:  { success: false, message: 'Too many deposit attempts. Please try again in an hour.' }
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      30,
  message:  { success: false, message: 'Upload limit reached. Please try again later.' }
});

module.exports = { rateLimiter, authLimiter, betLimiter, depositLimiter, uploadLimiter };
