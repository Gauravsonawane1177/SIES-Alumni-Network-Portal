const { query } = require('../config/db');

async function createNotification({ userId, type, title, body, link = null }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, title, body, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, body, link]
  );
  return rows[0];
}

module.exports = { createNotification };
