/**
 * PostgreSQL — Sequelize Connection
 */
const { Sequelize } = require('sequelize');
const logger        = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => logger.debug(sql)
      : false,
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000
    },
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: { require: true, rejectUnauthorized: false }
    } : {}
  }
);

async function connectPostgres() {
  await sequelize.authenticate();
  // Sync models (use migrations in production)
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
  }
  logger.info('✅ PostgreSQL connected');
}

module.exports = { sequelize, connectPostgres };
