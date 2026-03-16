const jwt = require('jsonwebtoken');
const config = require('../config');

const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  return null;
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).render('index', {
      title: 'Unauthorized',
      error: 'Please log in to continue.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    res.locals.user = decoded;
    return next();
  } catch {
    return res.status(401).render('index', {
      title: 'Unauthorized',
      error: 'Your session is invalid or expired. Please log in again.'
    });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).render('index', {
      title: 'Unauthorized',
      error: 'Please log in to continue.'
    });
  }
  if (req.user.role !== role) {
    return res.status(403).render('index', {
      title: 'Forbidden',
      error: 'You do not have permission to access this page.'
    });
  }
  return next();
};

module.exports = {
  requireAuth,
  requireRole
};

