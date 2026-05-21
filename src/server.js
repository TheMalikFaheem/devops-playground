/**
 * Server entry point.
 * Loads environment variables, imports the Express app, and starts listening.
 */

require('dotenv').config();

const app = require('./app');
const config = require('./config');
const db = require('./db');

const PORT = config.port;

// Verify database connection on startup
db.query('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('⚠️  Database connection failed:', err.message || err);
    if (err.code) console.error('   Error code:', err.code);
    console.error('   Fix .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) and ensure PostgreSQL is running.');
    console.error('   Then run: npm run db:migrate');
  });

// Start the HTTP server
app.listen(PORT, () => {
  console.log('──────────────────────────────────────────');
  console.log('DevOps Playground is running!');
  console.log(`URL:         http://localhost:${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Version:     ${config.appVersion}`);
  console.log('──────────────────────────────────────────');
});

