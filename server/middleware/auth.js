const { verifyIdToken } = require('../config/firebase');
const { httpError } = require('../utils/httpError');
const { upsertUserFromAuth } = require('../services/userService');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw httpError(401, 'Token autentikasi diperlukan', 'UNAUTHENTICATED');
    }

    const decoded = await verifyIdToken(token);
    req.auth = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };

    next();
  } catch (error) {
    if (error.status) return next(error);
    return next(httpError(401, 'Token tidak valid atau kedaluwarsa', 'INVALID_TOKEN'));
  }
}

async function loadUser(req, res, next) {
  try {
    if (!req.auth) {
      throw httpError(401, 'Token autentikasi diperlukan', 'UNAUTHENTICATED');
    }

    req.user = await upsertUserFromAuth(req.auth);
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(httpError(401, 'User belum terautentikasi', 'UNAUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(httpError(403, 'Akses ditolak untuk role ini', 'FORBIDDEN'));
    }

    next();
  };
}

module.exports = { requireAuth, loadUser, requireRole };
