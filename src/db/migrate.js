/**
 * Database migration script.
 * Creates all tables needed by the application.
 * Run with: npm run db:migrate
 */

require('dotenv').config();
const db = require('./index');

const migrate = async () => {
  console.log('🔄 Running database migrations...\n');

  try {
    // ─── Users table ────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(50)  UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(10)  NOT NULL DEFAULT 'user'
                      CHECK (role IN ('user', 'admin')),
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ users table ready');

    // ─── Projects table ─────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ projects table ready');

    // ─── Tasks table ────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        status      VARCHAR(20) NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo', 'in-progress', 'done')),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ tasks table ready');

    // ─── Notes / Incident Log table ─────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content     TEXT NOT NULL,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ notes table ready');

    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

migrate();

