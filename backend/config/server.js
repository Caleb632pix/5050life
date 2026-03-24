require('dotenv').config();

var express = require('express');
var http = require('http');
var cors = require('cors');
var helmet = require('helmet');
var morgan = require('morgan');

var connectPostgres = require('./config/database').connectPostgres;
var connectMongo = require('./config/mongo').connectMongo;
var connectRedis = require('./config/redis').connectRedis;
var logger = require('./config/logger');

var authRoutes    = require('./routes/auth');
var userRoutes    = require('./routes/users');
var betRoutes     = require('./routes/bets');
var walletRoutes  = require('./routes/wallet');
var socialRoutes  = require('./routes/social');
var roomRoutes    = require('./routes/rooms');
var sportsRoutes  = require('./routes/sports');
var adminRoutes   = require('./routes/admin');
var notifRoutes   = require('./routes/notifications');
var webhookRoutes = require('./routes/webhooks');
var gameRoutes    = require('./routes/games');

var app    = express();
var server = http.createServer(app);

var allowedOrigins = [
  'https://5050life.vercel.app',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(morgan('combined'));

app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', function(req, res) {
  res.json({
    status: 'ok',
    platform: '50/50 Life',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

var API = '/api/v1';
app.use(API + '/auth',          authRoutes);
app.use(API + '/users',         userRoutes);
app.use(API + '/bets',          betRoutes);
app.use(API + '/wallet',        walletRoutes);
app.use(API + '/social',        socialRoutes);
app.use(API + '/rooms',         roomRoutes);
app.use(API + '/sports',        sportsRoutes);
app.use(API + '/admin',         adminRoutes);
app.use(API + '/notifications', notifRoutes);
app.use(API + '/games',         gameRoutes);
app.use('/api/webhooks',        webhookRoutes);

app.use('*', function(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(function(err, req, res, next) {
  logger.error(err.message || 'Unknown error');
  var status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

async function bootstrap() {
  try {
    await connectPostgres();
    await connectMongo();
    await connectRedis();

    var PORT = process.env.PORT || 5000;
    server.listen(PORT, function() {
      logger.info('50/50 Life API running on port ' + PORT);
      logger.info('Environment: ' + (process.env.NODE_ENV || 'development'));
      logger.info('Frontend URL: ' + (process.env.FRONTEND_URL || 'not set'));
    });
  } catch (err) {
    logger.error('Failed to start: ' + err.message);
    process.exit(1);
  }
}

bootstrap();

module.exports = { app: app, server: server };
