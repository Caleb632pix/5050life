var mongoose = require('mongoose');
var logger = require('./logger');

async function connectMongo() {
  if (!process.env.MONGO_URI) {
    logger.info('MongoDB skipped — no MONGO_URI set');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.warn('MongoDB connection failed: ' + err.message);
  }
}

mongoose.connection.on('error', function(err) {
  logger.warn('MongoDB error: ' + err.message);
});

module.exports = { connectMongo: connectMongo };
