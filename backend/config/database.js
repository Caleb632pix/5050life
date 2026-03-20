var Sequelize = require('sequelize').Sequelize;
var logger = require('./logger');

var sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'fiftyfiftylife',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected');
    await sequelize.sync();
    logger.info('Database tables ready');
  } catch (err) {
    logger.error('PostgreSQL connection failed: ' + err.message);
    throw err;
  }
}

module.exports = { sequelize: sequelize, connectPostgres: connectPostgres };
