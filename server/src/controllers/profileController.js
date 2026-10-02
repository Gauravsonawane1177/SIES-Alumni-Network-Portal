const { query } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { parseSkills, pagination, sanitizeUser } = require('../utils/helpers');
const userModel = require('../models/userModel');

async function updateMyProfile(req, res, next) {
  try {
    const body = { ...req.body };
    if (body.skills) body.skills = parseSkills(body.skills);
    if (req.user.role !== 'ALUMNI') body.is_mentor = undefined;

    const { rows } = await query(
      `UPDATE profiles SET
         full_name = COALESCE($1, full_name),
         profile_photo = COALESCE($2, profile_photo),
         phone = COALESCE($3, phone),
         branch = COALESCE($4, branch),
         batch_year = COALESCE($5, batch_year),
         graduation_year = COALESCE($6, graduation_year),
         company = COALESCE($7, company),
         job_title = COALESCE($8, job_title),
         city = COALESCE($9, city),
         bio = COALESCE($10, bio),
         skills = COALESCE($11, skills),
         linkedin_url = COALESCE($12, linkedin_url),
         github_url = COALESCE($13, github_url),
         is_mentor = COALESCE($14, is_mentor),
         updated_at = NOW()
       WHERE user_id = $15
       RETURNING *`,
      [
        body.full_name ?? null,
        body.profile_photo ?? null,
        body.phone ?? null,
        body.branch ?? null,
        body.batch_year ?? null,
        body.graduation_year ?? null,
        body.company ?? null,
        body.job_title ?? null,
        body.city ?? null,
        body.bio ?? null,
        body.skills ?? null,
        body.linkedin_url ?? null,
        body.github_url ?? null,
        body.is_mentor ?? null,
        req.user.id
      ]
    );
    if (!rows[0]) throw new AppError(404, 'Profile not found');
    const user = await userModel.findById(req.user.id);
    return success(res, { user: sanitizeUser(user) }, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    return success(res, { user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

async function getProfileByUserId(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user || user.status !== 'ACTIVE') throw new AppError(404, 'Profile not found');
    return success(res, { user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

async function directory(req, res, next) {
  try {
    const { page, limit, offset } = pagination(req.query);
    const { q, company, job_title, skills, city, role, branch, batch_year, mentor } = req.query;
    const filters = [`u.status = 'ACTIVE'`, `u.role <> 'ADMIN'`];
    const params = [];
    const add = (sql, value) => {
      params.push(value);
      filters.push(sql.replace('?', `$${params.length}`));
    };

    if (q) {
      params.push(`%${q}%`);
      filters.push(`(p.full_name ILIKE $${params.length} OR p.company ILIKE $${params.length} OR p.job_title ILIKE $${params.length})`);
    }
    if (company) add(`p.company ILIKE ?`, `%${company}%`);
    if (job_title) add(`p.job_title ILIKE ?`, `%${job_title}%`);
    if (city) add(`p.city ILIKE ?`, `%${city}%`);
    if (role) add(`u.role = ?`, role);
    if (branch) add(`p.branch ILIKE ?`, `%${branch}%`);
    if (batch_year) add(`p.batch_year = ?`, Number(batch_year));
    if (mentor === 'true') filters.push(`p.is_mentor = TRUE`);
    if (skills) {
      const skillList = parseSkills(skills);
      if (skillList.length) {
        params.push(skillList);
        filters.push(`p.skills && $${params.length}::text[]`);
      }
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const count = await query(
      `SELECT COUNT(*)::int AS total FROM users u LEFT JOIN profiles p ON p.user_id = u.id ${where}`,
      params
    );
    params.push(limit, offset);
    const { rows } = await query(
      `${userModel.PROFILE_SELECT} ${where} ORDER BY p.full_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return success(res, {
      users: rows.map(sanitizeUser),
      pagination: { page, limit, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { updateMyProfile, getMyProfile, getProfileByUserId, directory };
