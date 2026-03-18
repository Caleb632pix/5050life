/**
 * 50/50 Life — Main Server Entry Point
 * ─────────────────────────────────────
 * Social P2P Betting Platform
 */

require('dotenv').config();
const express      = require('express');
const http         = require('http');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp          = require('hpp');

const { connectPostgres } = require('./config/database');
const { connectMongo }    = require('./config/mongo');
const { connectRedis }    = require('./config/redis');
const { initSocket }      = require('./sockets/socketHandler');
const { startCronJobs }   = require('./services/cronService');
const logger              = require('./config/logger');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const betRoutes       = require('./routes/bets');
const walletRoutes    = require('./routes/wallet');
const socialRoutes    = require('./routes/social');
const roomRoutes      = require('./routes/rooms');
const sportsRoutes    = require('./routes/sports');
const adminRoutes     = require('./routes/admin');
const notifRoutes     = require('./routes/notifications');
const webhookRoutes   = require('./routes/webhooks');
const gameRoutes      = require('./routes/games');

// ── Middleware imports ─────────────────────────────────────────────────────
const { errorHandler }   = require('./middleware/errorHandler');
const { rateLimiter }    = require('./middleware/rateLimiter');

const app    = express();
const server = http.createServer(app);

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
    }
  }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://app.5050life.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token']
}));

// ── General middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Raw body for Stripe webhooks (must be before express.json())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(rateLimiter);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: '50/50 Life',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ── API routes ─────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/bets`,          betRoutes);
app.use(`${API}/wallet`,        walletRoutes);
app.use(`${API}/social`,        socialRoutes);
app.use(`${API}/rooms`,         roomRoutes);
app.use(`${API}/sports`,        sportsRoutes);
app.use(`${API}/admin`,         adminRoutes);
app.use(`${API}/notifications`, notifRoutes);
app.use('/api/webhooks',        webhookRoutes);
app.use(`${API}/games`,          gameRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on 50/50 Life API`
  });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await connectPostgres();
    await connectMongo();
    await connectRedis();

    initSocket(server);
    startCronJobs();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`🎯 50/50 Life API running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`💰 Commission rate: ${(process.env.PLATFORM_COMMISSION_RATE * 100)}% on all bets`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server };
  
