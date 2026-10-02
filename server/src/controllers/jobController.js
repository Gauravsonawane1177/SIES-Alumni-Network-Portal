const { query } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { parseSkills, pagination } = require('../utils/helpers');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = pagination(req.query);
    const params = [];
    const filters = [];
    if (req.user.role === 'STUDENT') {
      filters.push(`j.status = 'APPROVED'`);
    } else if (req.user.role === 'ALUMNI') {
      params.push(req.user.id);
      filters.push(`(j.status = 'APPROVED' OR j.posted_by = $${params.length})`);
    }
    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      filters.push(`(j.title ILIKE $${params.length} OR j.company ILIKE $${params.length} OR j.description ILIKE $${params.length})`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const count = await query(`SELECT COUNT(*)::int AS total FROM jobs j ${where}`, params);
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT j.*, p.full_name AS poster_name
       FROM jobs j JOIN profiles p ON p.user_id = j.posted_by
       ${where} ORDER BY j.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return success(res, {
      jobs: rows,
      pagination: { page, limit, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT j.*, p.full_name AS poster_name FROM jobs j JOIN profiles p ON p.user_id = j.posted_by WHERE j.id = $1`,
      [req.params.id]
    );
    const job = rows[0];
    if (!job) throw new AppError(404, 'Job not found');
    const visible =
      job.status === 'APPROVED' ||
      req.user.role === 'ADMIN' ||
      job.posted_by === req.user.id;
    if (!visible) throw new AppError(404, 'Job not found');
    const applied = await query(`SELECT id FROM job_applications WHERE job_id = $1 AND applicant_id = $2`, [
      job.id,
      req.user.id
    ]);
    return success(res, { job, already_applied: Boolean(applied.rows[0]) });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const body = req.body;
    const skills = parseSkills(body.skills);
    const { rows } = await query(
      `INSERT INTO jobs (posted_by, title, company, description, location, job_type, experience_required, skills, application_url, deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING') RETURNING *`,
      [
        req.user.id,
        body.title,
        body.company,
        body.description,
        body.location || null,
        body.job_type,
        body.experience_required || null,
        skills,
        body.application_url || null,
        body.deadline || null
      ]
    );
    return success(res, { job: rows[0] }, 'Job submitted for administrator approval', 201);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Job not found');
    if (rows[0].posted_by !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError(403, 'You cannot edit this job');
    }
    const body = req.body;
    const skills = body.skills ? parseSkills(body.skills) : rows[0].skills;
    const { rows: updated } = await query(
      `UPDATE jobs SET title=$1, company=$2, description=$3, location=$4, job_type=$5,
       experience_required=$6, skills=$7, application_url=$8, deadline=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [
        body.title,
        body.company,
        body.description,
        body.location || null,
        body.job_type,
        body.experience_required || null,
        skills,
        body.application_url || null,
        body.deadline || null,
        req.params.id
      ]
    );
    return success(res, { job: updated[0] }, 'Job updated');
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Job not found');
    if (rows[0].posted_by !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError(403, 'You cannot delete this job');
    }
    await query(`DELETE FROM jobs WHERE id = $1`, [req.params.id]);
    return success(res, {}, 'Job removed');
  } catch (error) {
    next(error);
  }
}

async function apply(req, res, next) {
  try {
    if (req.user.role !== 'STUDENT') throw new AppError(403, 'Only students can apply for jobs');
    const { rows } = await query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);
    const job = rows[0];
    if (!job || job.status !== 'APPROVED') throw new AppError(404, 'Job is not available');
    if (job.deadline && new Date(job.deadline) < new Date()) throw new AppError(400, 'The application deadline has passed');
    const existing = await query(`SELECT id FROM job_applications WHERE job_id = $1 AND applicant_id = $2`, [
      job.id,
      req.user.id
    ]);
    if (existing.rows[0]) throw new AppError(409, 'You have already applied for this job');
    const { rows: apps } = await query(
      `INSERT INTO job_applications (job_id, applicant_id, resume_url, cover_letter)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [job.id, req.user.id, req.body.resume_url, req.body.cover_letter]
    );
    await createNotification({
      userId: job.posted_by,
      type: 'JOB_APPLICATION',
      title: 'New job application',
      body: `${req.user.full_name || 'A student'} applied for ${job.title}.`,
      link: `/jobs/${job.id}`
    });
    const poster = await userModel.findById(job.posted_by);
    await emailService.jobApplicationNotice(poster.email, poster.full_name, job.title, req.user.full_name);
    return success(res, { application: apps[0] }, 'Application submitted', 201);
  } catch (error) {
    next(error);
  }
}

async function listApplicationsForJob(req, res, next) {
  try {
    const { rows: jobs } = await query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);
    const job = jobs[0];
    if (!job) throw new AppError(404, 'Job not found');
    if (job.posted_by !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError(403, 'You cannot view these applications');
    }
    const { rows } = await query(
      `SELECT a.*, p.full_name, p.profile_photo, u.email, p.branch, p.batch_year
       FROM job_applications a
       JOIN users u ON u.id = a.applicant_id
       JOIN profiles p ON p.user_id = a.applicant_id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [job.id]
    );
    return success(res, { applications: rows });
  } catch (error) {
    next(error);
  }
}

async function myApplications(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT a.*, j.title, j.company, j.location, j.job_type, j.status AS job_status
       FROM job_applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.applicant_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    return success(res, { applications: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, getOne, create, update, remove, apply, listApplicationsForJob, myApplications };
