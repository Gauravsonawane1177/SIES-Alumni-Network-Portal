const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const { AppError } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, status: user.status }, env.jwtSecret, {
    expiresIn: '7d'
  });
}

function readToken(req) {
  if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw new AppError(401, 'Authentication required');
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError(401, 'Session expired or invalid. Please log in again.');
    }
    const { rows } = await query(
      `SELECT u.*, p.full_name, p.profile_photo, p.is_mentor, p.branch, p.batch_year
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [payload.sub]
    );
    if (!rows[0]) throw new AppError(401, 'User not found');
    req.user = sanitizeUser(rows[0]);
    next();
  } catch (error) {
    next(error);
  }
}

function requireActive(req, res, next) {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (req.user.status === 'PENDING') {
    return next(new AppError(403, 'Your alumni account is pending administrator approval'));
  }
  if (req.user.status === 'REJECTED') {
    return next(new AppError(403, 'Your registration was rejected. Contact the alumni office.'));
  }
  if (req.user.status === 'SUSPENDED') {
    return next(new AppError(403, 'Your account has been suspended'));
  }
  if (req.user.status !== 'ACTIVE') {
    return next(new AppError(403, 'Account is not active'));
  }
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { authenticate, requireActive, requireRoles, signToken, cookieOptions, readToken };
