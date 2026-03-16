/**
 * PostgreSQL connection pool.
 * All database queries go through this pool.
 * The pool is created once and shared across the application.
 */

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password
});

// Log pool errors so they don't crash the app silently
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err.message);
});

module.exports = {
  /**
   * Run a SQL query against the pool.
   * @param {string} text - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<import('pg').QueryResult>}
   */
  query: (text, params) => pool.query(text, params),

  /** Access the raw pool (useful for transactions) */
  pool
};

