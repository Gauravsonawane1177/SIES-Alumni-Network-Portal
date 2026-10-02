const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query, withTransaction } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');
const { signToken, cookieOptions, authenticate } = require('../middleware/auth');
const userModel = require('../models/userModel');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');

async function register(req, res, next) {
  try {
    const { email, password, full_name, role, phone, branch, batch_year, graduation_year, city } = req.body;
    const existing = await userModel.findAuthByEmail(email);
    if (existing) throw new AppError(409, 'An account with this email already exists');

    const password_hash = await bcrypt.hash(password, 12);
    const status = role === 'STUDENT' ? 'ACTIVE' : 'PENDING';

    const user = await withTransaction(async (client) => {
      const { rows: users } = await client.query(
        `INSERT INTO users (email, password_hash, role, status, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, status, email_verified, created_at`,
        [email, password_hash, role, status, false]
      );
      const created = users[0];
      await client.query(
        `INSERT INTO profiles (user_id, full_name, phone, branch, batch_year, graduation_year, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [created.id, full_name, phone || null, branch || null, batch_year || null, graduation_year || null, city || null]
      );
      return created;
    });

    if (role === 'ALUMNI') {
      const { rows: admins } = await query(`SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`);
      await Promise.all(
        admins.map((admin) =>
          createNotification({
            userId: admin.id,
            type: 'ALUMNI_PENDING',
            title: 'Alumni registration pending',
            body: `${full_name} (${email}) requested alumni access.`,
            link: '/admin/verification'
          })
        )
      );
    }

    if (status === 'ACTIVE') {
      const token = signToken(user);
      res.cookie('access_token', token, cookieOptions());
    }

    return success(
      res,
      { user: sanitizeUser(await userModel.findById(user.id)) },
      role === 'ALUMNI'
        ? 'Registration submitted. An administrator must approve your alumni account before you can sign in fully.'
        : 'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findAuthByEmail(email);
    if (!user) throw new AppError(401, 'Invalid email or password');
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError(401, 'Invalid email or password');
    if (user.status === 'PENDING') {
      throw new AppError(403, 'Your alumni account is awaiting administrator approval');
    }
    if (user.status === 'REJECTED') {
      throw new AppError(403, 'Your registration was rejected');
    }
    if (user.status === 'SUSPENDED') {
      throw new AppError(403, 'Your account is suspended');
    }
    const token = signToken(user);
    res.cookie('access_token', token, cookieOptions());
    const profile = await userModel.findById(user.id);
    return success(res, { user: sanitizeUser(profile) }, 'Logged in');
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  res.clearCookie('access_token', { ...cookieOptions(), maxAge: 0 });
  return success(res, {}, 'Logged out');
}

async function me(req, res, next) {
  try {
    const profile = await userModel.findById(req.user.id);
    return success(res, { user: sanitizeUser(profile) });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const user = await userModel.findAuthByEmail(req.body.email);
    const generic = 'If an account exists for that email, a reset link has been prepared.';
    if (!user) return success(res, {}, generic);

    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token_hash, expires_at]
    );
    const resetUrl = `${require('../config/env').clientUrl}/reset-password?token=${token}`;
    await emailService.sendMail({
      to: user.email,
      subject: 'Reset your SIES Alumni Portal password',
      html: `<p>Use this link within one hour:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
    const payload = process.env.NODE_ENV === 'production' ? {} : { reset_token: token, reset_url: resetUrl };
    return success(res, payload, generic);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const token_hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const { rows } = await query(
      `SELECT * FROM password_resets
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [token_hash]
    );
    if (!rows[0]) throw new AppError(400, 'Reset token is invalid or expired');
    const password_hash = await bcrypt.hash(req.body.password, 12);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      password_hash,
      rows[0].user_id
    ]);
    await query(`UPDATE password_resets SET used_at = NOW() WHERE id = $1`, [rows[0].id]);
    return success(res, {}, 'Password updated. You can now log in.');
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, logout, me, forgotPassword, resetPassword, authenticate };
