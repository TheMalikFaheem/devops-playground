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

router.post('/:projectId/notes', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { content } = req.body;
  if (!Number.isFinite(projectId)) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Invalid project id.' });
  }
  if (!content) {
    return res.status(400).render('index', { title: 'Bad Request', error: 'Note content is required.' });
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
      INSERT INTO notes (project_id, author_id, content)
      VALUES ($1, $2, $3);
      `,
      [projectId, req.user.id, content]
    );
    return res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Create note failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to add note.'
    });
  }
});

router.post('/:projectId/notes/:noteId/delete', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const noteId = parseInt(req.params.noteId, 10);
  if (!Number.isFinite(projectId) || !Number.isFinite(noteId)) {
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

    await db.query('DELETE FROM notes WHERE id = $1 AND project_id = $2', [noteId, projectId]);
    return res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('❌ Delete note failed:', err.message);
    return res.status(500).render('index', {
      title: 'Error',
      error: config.nodeEnv === 'development' ? err.message : 'Failed to delete note.'
    });
  }
});

module.exports = router;

