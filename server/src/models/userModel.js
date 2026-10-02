const { query } = require('../config/db');

const PROFILE_SELECT = `
  SELECT u.id, u.email, u.role, u.status, u.email_verified, u.created_at, u.updated_at,
         p.id AS profile_id, p.full_name, p.profile_photo, p.phone, p.branch, p.batch_year,
         p.graduation_year, p.company, p.job_title, p.city, p.bio, p.skills, p.linkedin_url,
         p.github_url, p.is_mentor
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
`;

async function findByEmail(email) {
  const { rows } = await query(`${PROFILE_SELECT} WHERE u.email = $1`, [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`${PROFILE_SELECT} WHERE u.id = $1`, [id]);
  return rows[0] || null;
}

async function findAuthByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

module.exports = { findByEmail, findById, findAuthByEmail, PROFILE_SELECT };
