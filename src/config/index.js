/**
 * Centralized configuration – reads from environment variables.
 * Every module imports config from here instead of reading process.env directly.
 */

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'devops_playground',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',

  // App
  appVersion: process.env.APP_VERSION || '1.0.0'
};

module.exports = config;

