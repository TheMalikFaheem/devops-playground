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

router.post('/:projectId/tasks', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { title, description, status, assigned_to } = req.body;
  if (!Number.isFinite(projectId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid project id.' });
  }
  if (!title) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Task title is required.' });
  }
  const normalizedStatus = status || 'todo';

  try {
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = projectResult.rows[0];
    if (!canEditProject(req.user, project)) {
      return res.status(403).render('index', { title: 'Forbidden', error: 'You cannot modify this project.' });
    }

    await db.query(
      `
      INSERT INTO tasks (project_id, title, description, status, assigned_to)
      VALUES ($1, $2, $3, $4, $5);
      `,
      [
        projectId,
        title,
        description || null,
        normalizedStatus,
        assigned_to ? parseInt(assigned_to, 10) : null
      ]
    );
    return res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Create task failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to create task.'
    });
  }
});

router.post('/:projectId/tasks/:taskId', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const taskId = parseInt(req.params.taskId, 10);
  const { title, description, status, assigned_to } = req.body;
  if (!Number.isFinite(projectId) || !Number.isFinite(taskId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid id.' });
  }
  if (!title) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Task title is required.' });
  }

  try {
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = projectResult.rows[0];
    if (!canEditProject(req.user, project)) {
      return res.status(403).render('index', { title: 'Forbidden', error: 'You cannot modify this project.' });
    }

    await db.query(
      `
      UPDATE tasks
      SET title = $1,
          description = $2,
          status = $3,
          assigned_to = $4
      WHERE id = $5 AND project_id = $6;
      `,
      [
        title,
        description || null,
        status || 'todo',
        assigned_to ? parseInt(assigned_to, 10) : null,
        taskId,
        projectId
      ]
    );
    return res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Update task failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to update task.'
    });
  }
});

router.post('/:projectId/tasks/:taskId/delete', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const taskId = parseInt(req.params.taskId, 10);
  if (!Number.isFinite(projectId) || !Number.isFinite(taskId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid id.' });
  }

  try {
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rowCount === 0) {
      return res.status(404).render('index', { title: 'Not Found', error: 'Project not found.' });
    }
    const project = projectResult.rows[0];
    if (!canEditProject(req.user, project)) {
      return res.status(403).render('index', { title: 'Forbidden', error: 'You cannot modify this project.' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [taskId, projectId]);
    return res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Delete task failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to delete task.'
    });
  }
});

module.exports = router;

