const { query } = require('../config/db');
const { AppError, success } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    const unread = rows.filter((n) => !n.is_read).length;
    return success(res, { notifications: rows, unread });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const { rowCount } = await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) throw new AppError(404, 'Notification not found');
    return success(res, {}, 'Marked as read');
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`, [req.user.id]);
    return success(res, {}, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
}

module.exports = { list, markRead, markAllRead };
