const { query } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');

async function create(req, res, next) {
  try {
    const addressee_id = req.body.addressee_id;
    if (addressee_id === req.user.id) throw new AppError(400, 'You cannot connect with yourself');
    const other = await userModel.findById(addressee_id);
    if (!other || other.status !== 'ACTIVE') throw new AppError(404, 'User not found');

    const { rows: existing } = await query(
      `SELECT * FROM connections
       WHERE LEAST(requester_id, addressee_id) = LEAST($1::uuid, $2::uuid)
         AND GREATEST(requester_id, addressee_id) = GREATEST($1::uuid, $2::uuid)`,
      [req.user.id, addressee_id]
    );
    if (existing[0]) {
      if (existing[0].status === 'ACCEPTED') throw new AppError(409, 'You are already connected');
      if (existing[0].status === 'PENDING') throw new AppError(409, 'A connection request already exists');
      await query(`UPDATE connections SET status = 'PENDING', requester_id = $1, addressee_id = $2, updated_at = NOW() WHERE id = $3`, [
        req.user.id,
        addressee_id,
        existing[0].id
      ]);
    } else {
      await query(
        `INSERT INTO connections (requester_id, addressee_id, status) VALUES ($1, $2, 'PENDING')`,
        [req.user.id, addressee_id]
      );
    }

    await createNotification({
      userId: addressee_id,
      type: 'CONNECTION_REQUEST',
      title: 'New connection request',
      body: `${req.user.full_name || 'A member'} sent you a connection request.`,
      link: '/connections'
    });
    await emailService.connectionNotice(other.email, other.full_name, req.user.full_name || 'A member');
    return success(res, {}, 'Connection request sent', 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const status = req.query.status;
    const params = [req.user.id];
    let extra = '';
    if (status) {
      params.push(status);
      extra = `AND c.status = $2`;
    }
    const { rows } = await query(
      `SELECT c.*,
              requester.full_name AS requester_name, requester.profile_photo AS requester_photo, ru.role AS requester_role,
              addressee.full_name AS addressee_name, addressee.profile_photo AS addressee_photo, au.role AS addressee_role
       FROM connections c
       JOIN users ru ON ru.id = c.requester_id
       JOIN users au ON au.id = c.addressee_id
       JOIN profiles requester ON requester.user_id = c.requester_id
       JOIN profiles addressee ON addressee.user_id = c.addressee_id
       WHERE (c.requester_id = $1 OR c.addressee_id = $1) ${extra}
       ORDER BY c.updated_at DESC`,
      params
    );
    return success(res, { connections: rows });
  } catch (error) {
    next(error);
  }
}

async function respond(req, res, next, nextStatus) {
  try {
    const { rows } = await query(`SELECT * FROM connections WHERE id = $1`, [req.params.id]);
    const conn = rows[0];
    if (!conn) throw new AppError(404, 'Connection not found');
    if (conn.addressee_id !== req.user.id) throw new AppError(403, 'Only the recipient can respond');
    if (conn.status !== 'PENDING') throw new AppError(400, 'This request is no longer pending');
    await query(`UPDATE connections SET status = $1, updated_at = NOW() WHERE id = $2`, [nextStatus, conn.id]);
    if (nextStatus === 'ACCEPTED') {
      await createNotification({
        userId: conn.requester_id,
        type: 'CONNECTION_ACCEPTED',
        title: 'Connection accepted',
        body: `${req.user.full_name || 'A member'} accepted your connection request.`,
        link: '/connections'
      });
    }
    return success(res, {}, `Connection ${nextStatus.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
}

async function areConnected(userA, userB) {
  const { rows } = await query(
    `SELECT 1 FROM connections
     WHERE status = 'ACCEPTED'
       AND LEAST(requester_id, addressee_id) = LEAST($1::uuid, $2::uuid)
       AND GREATEST(requester_id, addressee_id) = GREATEST($1::uuid, $2::uuid)`,
    [userA, userB]
  );
  return Boolean(rows[0]);
}

module.exports = {
  create,
  list,
  accept: (req, res, next) => respond(req, res, next, 'ACCEPTED'),
  reject: (req, res, next) => respond(req, res, next, 'REJECTED'),
  areConnected
};
