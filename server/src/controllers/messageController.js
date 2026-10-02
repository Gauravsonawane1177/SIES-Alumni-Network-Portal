const { query } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { areConnected } = require('./connectionController');
const { createNotification } = require('../services/notificationService');

async function conversations(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT other_id,
              p.full_name, p.profile_photo, u.role,
              last_message.content AS last_content,
              last_message.created_at AS last_at,
              last_message.sender_id AS last_sender_id,
              unread.unread_count
       FROM (
         SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id,
                MAX(created_at) AS last_at
         FROM messages
         WHERE sender_id = $1 OR receiver_id = $1
         GROUP BY 1
       ) conv
       JOIN LATERAL (
         SELECT content, created_at, sender_id FROM messages
         WHERE (sender_id = $1 AND receiver_id = conv.other_id)
            OR (sender_id = conv.other_id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1
       ) last_message ON TRUE
       JOIN LATERAL (
         SELECT COUNT(*)::int AS unread_count FROM messages
         WHERE sender_id = conv.other_id AND receiver_id = $1 AND read_at IS NULL
       ) unread ON TRUE
       JOIN users u ON u.id = conv.other_id
       JOIN profiles p ON p.user_id = conv.other_id
       ORDER BY last_message.created_at DESC`,
      [req.user.id]
    );
    const unreadTotal = rows.reduce((sum, r) => sum + r.unread_count, 0);
    return success(res, { conversations: rows, unread_total: unreadTotal });
  } catch (error) {
    next(error);
  }
}

async function thread(req, res, next) {
  try {
    if (!(await areConnected(req.user.id, req.params.id))) {
      throw new AppError(403, 'You can only message accepted connections');
    }
    await query(
      `UPDATE messages SET read_at = NOW()
       WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [req.params.id, req.user.id]
    );
    const { rows } = await query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [req.user.id, req.params.id]
    );
    return success(res, { messages: rows });
  } catch (error) {
    next(error);
  }
}

async function persistMessage(senderId, receiverId, content) {
  if (!(await areConnected(senderId, receiverId))) {
    throw new AppError(403, 'You can only message accepted connections');
  }
  const text = String(content || '').trim();
  if (!text) throw new AppError(400, 'Message cannot be empty');
  const { rows } = await query(
    `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [senderId, receiverId, text]
  );
  await createNotification({
    userId: receiverId,
    type: 'NEW_MESSAGE',
    title: 'New message',
    body: 'You received a new message.',
    link: '/messages'
  });
  return rows[0];
}

module.exports = { conversations, thread, persistMessage };
