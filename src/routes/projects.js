const express = require('express');

const db = require('../db');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const canEditProject = (user, project) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Number(project.owner_id) === Number(user.id);
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT p.id, p.name, p.description, p.owner_id, p.created_at, u.username AS owner_username
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC;
      `
    );
    res.render('projects/list', { title: 'Projects', projects: result.rows });
  } catch (err) {
    console.error('❌ List projects failed:', err.message);
    res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to load projects.'
    });
  }
});

router.get('/new', requireAuth, (req, res) => {
  res.render('projects/new', { title: 'New Project' });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).render('projects/new', {
      title: 'New Project',
      error: 'Project name is required.'
    });
  }

  try {
    const created = await db.query(
      `
      INSERT INTO projects (name, description, owner_id)
      VALUES ($1, $2, $3)
      RETURNING id;
      `,
      [name, description || null, req.user.id]
    );
    return res.redirect(`/projects/${created.rows[0].id}`);
  } catch (err) {
    console.error('❌ Create project failed:', err.message);
    return res.status(500).render('projects/new', {
      title: 'New Project',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to create project.'
    });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (!Number.isFinite(projectId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid project id.' });
  }

  try {
    const projectResult = await db.query(
      `
      SELECT p.*, u.username AS owner_username
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1;
      `,
      [projectId]
    );
    if (projectResult.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = projectResult.rows[0];

    const tasksResult = await db.query(
      `
      SELECT t.*, u.username AS assigned_username
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC;
      `,
      [projectId]
    );

    const notesResult = await db.query(
      `
      SELECT n.*, u.username AS author_username
      FROM notes n
      LEFT JOIN users u ON u.id = n.author_id
      WHERE n.project_id = $1
      ORDER BY n.created_at DESC;
      `,
      [projectId]
    );

    const usersResult = await db.query('SELECT id, username FROM users ORDER BY username ASC;');

    return res.render('projects/detail', {
      title: project.name,
      project,
      tasks: tasksResult.rows,
      notes: notesResult.rows,
      users: usersResult.rows,
      canEdit: canEditProject(req.user, project)
    });
  } catch (err) {
    console.error('❌ Project detail failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to load project.'
    });
  }
});

router.get('/:id/edit', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (!Number.isFinite(projectId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid project id.' });
  }

  try {
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = projectResult.rows[0];
    if (!canEditProject(req.user, project)) {
      return res.status(403).render('index', { title: 'Forbidden', error: 'You cannot edit this project.' });
    }
    return res.render('projects/edit', { title: `Edit: ${project.name}`, project });
  } catch (err) {
    console.error('❌ Edit project page failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to load project.'
    });
  }
});

router.post('/:id', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { name, description } = req.body;
  if (!Number.isFinite(projectId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid project id.' });
  }
  if (!name) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Project name is required.' });
  }

  try {
    const existing = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (existing.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = existing.rows[0];
    if (!canEditProject(req.user, project)) {
      return res.status(403).render('index', { title: 'Forbidden', error: 'You cannot edit this project.' });
    }

    await db.query(
      `
      UPDATE projects
      SET name = $1, description = $2
      WHERE id = $3;
      `,
      [name, description || null, projectId]
    );
    return res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Update project failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to update project.'
    });
  }
});

router.post('/:id/delete', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (!Number.isFinite(projectId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid project id.' });
  }

  try {
    const existing = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (existing.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = existing.rows[0];
    if (!canEditProject(req.user, project)) {
      return res.status(403).render('index', { title: 'Forbidden', error: 'You cannot delete this project.' });
    }
    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    return res.redirect('/projects');
  } catch (err) {
    console.error('❌ Delete project failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to delete project.'
    });
  }
});

module.exports = router;

