/**
 * Database seed script.
 * Populates demo users, projects, tasks, and notes.
 *
 * Run with:
 * - npm run db:migrate
 * - npm run db:seed
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./index');

const upsertUser = async ({ username, email, password, role }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email)
    DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
    RETURNING id, username, email, role;
    `,
    [username, email, passwordHash, role]
  );
  return result.rows[0];
};

const seed = async () => {
  console.log('🌱 Seeding demo data...\n');

  try {
    const admin = await upsertUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin'
    });
    console.log(`  ✅ admin user ready (${admin.email})`);

    const user = await upsertUser({
      username: 'demo',
      email: 'demo@example.com',
      password: 'Demo123!',
      role: 'user'
    });
    console.log(`  ✅ demo user ready (${user.email})`);

    const p1 = (
      await db.query(
        `
        INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id, name;
        `,
        [
          'Docker + Networking Basics',
          'Practice containers, ports, service discovery, and health checks.',
          user.id
        ]
      )
    ).rows[0];

    const p2 = (
      await db.query(
        `
        INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id, name;
        `,
        [
          'CI/CD with Jenkins',
          'Practice pipelines, building images, tagging, and pushing to Docker Hub.',
          admin.id
        ]
      )
    ).rows[0];

    console.log(`  ✅ projects created (${p1.name}, ${p2.name})`);

    const tasks = [
      {
        projectId: p1.id,
        title: 'Run app + db with docker-compose',
        description: 'Start services, verify /health and /ready',
        status: 'todo',
        assignedTo: user.id
      },
      {
        projectId: p1.id,
        title: 'Confirm DB host uses service name',
        description: 'Ensure DB_HOST=db works inside the app container',
        status: 'in-progress',
        assignedTo: user.id
      },
      {
        projectId: p1.id,
        title: 'Inspect container logs',
        description: 'Check startup logs and error handling',
        status: 'done',
        assignedTo: user.id
      },
      {
        projectId: p2.id,
        title: 'Run Jenkins pipeline',
        description: 'Checkout, install, test, build, tag, and push image',
        status: 'todo',
        assignedTo: admin.id
      }
    ];

    for (const t of tasks) {
      await db.query(
        `
        INSERT INTO tasks (project_id, title, description, status, assigned_to)
        VALUES ($1, $2, $3, $4, $5);
        `,
        [t.projectId, t.title, t.description, t.status, t.assignedTo]
      );
    }
    console.log('  ✅ tasks created');

    const notes = [
      {
        projectId: p1.id,
        authorId: user.id,
        content:
          'Incident: /ready returned 503 because DB container was still starting. Resolution: wait for Postgres to accept connections.'
      },
      {
        projectId: p2.id,
        authorId: admin.id,
        content:
          'Note: Configure Docker Hub credentials in Jenkins before running the push stage.'
      }
    ];

    for (const n of notes) {
      await db.query(
        `
        INSERT INTO notes (project_id, author_id, content)
        VALUES ($1, $2, $3);
        `,
        [n.projectId, n.authorId, n.content]
      );
    }
    console.log('  ✅ notes created');

    console.log('\n✅ Seeding completed!');
    console.log('\nDemo credentials (change these for real use):');
    console.log('  - admin@example.com / Admin123!');
    console.log('  - demo@example.com  / Demo123!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

seed();

