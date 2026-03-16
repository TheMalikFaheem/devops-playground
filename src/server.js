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
    console.error('⚠️  Database connection failed:', err.message);
    console.error('   The app will start, but database features will not work.');
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

