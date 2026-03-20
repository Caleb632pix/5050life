var winston = require('winston');

var logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(function(info) {
      return info.timestamp + ' [' + info.level + ']: ' + info.message;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
