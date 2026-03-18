/**
 * MongoDB — Mongoose Connection
 */
const mongoose = require('mongoose');
const logger   = require('./logger');

async function connectMongo() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true
  });
  logger.info('✅ MongoDB connected');
}

mongoose.connection.on('error', err => logger.error('MongoDB error:', err));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

module.exports = { connectMongo };
