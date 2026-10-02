const { query, withTransaction } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');

function canSee(event, user) {
  return event.status === 'APPROVED' || user.role === 'ADMIN' || event.created_by === user.id;
}

async function list(req, res, next) {
  try {
    let where = `WHERE e.status = 'APPROVED'`;
    const params = [];
    if (req.user.role === 'ADMIN') where = '';
    else if (req.user.role === 'ALUMNI') {
      params.push(req.user.id);
      where = `WHERE (e.status = 'APPROVED' OR e.created_by = $1)`;
    }
    const { rows } = await query(
      `SELECT e.*, p.full_name AS organizer_name,
              (SELECT COUNT(*)::int FROM event_rsvps r WHERE r.event_id = e.id) AS rsvp_count
       FROM events e JOIN profiles p ON p.user_id = e.created_by
       ${where}
       ORDER BY e.event_date ASC`,
      params
    );
    return success(res, { events: rows });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT e.*, p.full_name AS organizer_name,
              (SELECT COUNT(*)::int FROM event_rsvps r WHERE r.event_id = e.id) AS rsvp_count
       FROM events e JOIN profiles p ON p.user_id = e.created_by WHERE e.id = $1`,
      [req.params.id]
    );
    const event = rows[0];
    if (!event || !canSee(event, req.user)) throw new AppError(404, 'Event not found');
    const mine = await query(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND user_id = $2`, [
      event.id,
      req.user.id
    ]);
    const remaining = Math.max(0, event.capacity - event.rsvp_count);
    return success(res, { event, has_rsvp: Boolean(mine.rows[0]), remaining_seats: remaining });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const status = req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';
    const { rows } = await query(
      `INSERT INTO events (created_by, title, description, location, event_date, capacity, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.user.id,
        req.body.title,
        req.body.description,
        req.body.location,
        req.body.event_date,
        req.body.capacity,
        status
      ]
    );
    return success(
      res,
      { event: rows[0] },
      status === 'APPROVED' ? 'Event published' : 'Event submitted for administrator approval',
      201
    );
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM events WHERE id = $1`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Event not found');
    if (rows[0].created_by !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError(403, 'You cannot edit this event');
    }
    const { rows: updated } = await query(
      `UPDATE events SET title=$1, description=$2, location=$3, event_date=$4, capacity=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [req.body.title, req.body.description, req.body.location, req.body.event_date, req.body.capacity, req.params.id]
    );
    return success(res, { event: updated[0] }, 'Event updated');
  } catch (error) {
    next(error);
  }
}

async function rsvp(req, res, next) {
  try {
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query(`SELECT * FROM events WHERE id = $1 FOR UPDATE`, [req.params.id]);
      const event = rows[0];
      if (!event || event.status !== 'APPROVED') throw new AppError(404, 'Event is not available');
      const count = await client.query(`SELECT COUNT(*)::int AS c FROM event_rsvps WHERE event_id = $1`, [event.id]);
      if (count.rows[0].c >= event.capacity) throw new AppError(409, 'This event is full');
      const dup = await client.query(`SELECT 1 FROM event_rsvps WHERE event_id = $1 AND user_id = $2`, [
        event.id,
        req.user.id
      ]);
      if (dup.rows[0]) throw new AppError(409, 'You have already RSVPed');
      const inserted = await client.query(
        `INSERT INTO event_rsvps (event_id, user_id) VALUES ($1,$2) RETURNING *`,
        [event.id, req.user.id]
      );
      return { event, rsvp: inserted.rows[0] };
    });
    await createNotification({
      userId: req.user.id,
      type: 'RSVP_CONFIRMATION',
      title: 'RSVP confirmed',
      body: `You are registered for ${result.event.title}.`,
      link: `/events/${result.event.id}`
    });
    const me = await userModel.findById(req.user.id);
    await emailService.rsvpConfirmation(me.email, me.full_name, result.event.title);
    return success(res, { rsvp: result.rsvp }, 'RSVP confirmed', 201);
  } catch (error) {
    next(error);
  }
}

async function cancelRsvp(req, res, next) {
  try {
    const { rowCount } = await query(`DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2`, [
      req.params.id,
      req.user.id
    ]);
    if (!rowCount) throw new AppError(404, 'RSVP not found');
    return success(res, {}, 'RSVP cancelled');
  } catch (error) {
    next(error);
  }
}

module.exports = { list, getOne, create, update, rsvp, cancelRsvp };
