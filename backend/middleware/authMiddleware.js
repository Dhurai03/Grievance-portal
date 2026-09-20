const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'grievance-portal-jwt-secret-key-2026';

// Middleware to authenticate JWT token
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Expected format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token format is invalid.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Session expired or token is invalid. Please login again.' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authentication is required to access this resource.' });
  }
}

// Middleware to authorize specific roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication is required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied: You do not have permission. Required role: ${allowedRoles.join(' or ')}.` 
      });
    }

    next();
  };
}

// Middleware for optional authentication (populates req.user if token exists, but does not block)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) req.user = user;
        next();
      });
      return;
    }
  }
  next();
}

module.exports = {
  authenticateJWT,
  optionalAuth,
  authorizeRoles,
  JWT_SECRET
};
