const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';

function authenticate(req, res, next) {
  let token = null;

  // 1) Lire le header Authorization (comme avant)
  const auth = req.headers['authorization'] || '';
  const [scheme, headerToken] = auth.split(' ');
  if (scheme === 'Bearer' && headerToken) {
    token = headerToken;
  }

  // 2) Lire le cookie HTTP-only (nouveau)
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  // 3) Vérifier le token si trouvé
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: payload.id,
        role: payload.role,
        name: payload.name,
        email: payload.email
      };
    } catch (e) {
      // token invalide → req.user reste undefined
    }
  }

  next();
}

function requireAuth(req, res, next) {
  authenticate(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'authentication required' });
    next();
  });
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin required' });
    next();
  });
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return function (req, res, next) {
    requireAuth(req, res, () => {
      if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: 'insufficient role' });
      }
      next();
    });
  };
}

function requireSelfOrAdmin(param = 'id') {
  return function (req, res, next) {
    requireAuth(req, res, () => {
      const requestedId = String(req.params?.[param]);
      if (req.user.role === 'admin' || String(req.user.id) === requestedId) {
        return next();
      }
      return res.status(403).json({ error: 'forbidden' });
    });
  };
}

module.exports = { authenticate, requireAuth, requireAdmin, requireRole, requireSelfOrAdmin };
