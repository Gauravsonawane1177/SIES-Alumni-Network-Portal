const { query } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const { pagination, sanitizeUser } = require('../utils/helpers');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');

async function dashboard(req, res, next) {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'STUDENT') AS total_students,
        (SELECT COUNT(*)::int FROM users WHERE role = 'ALUMNI') AS total_alumni,
        (SELECT COUNT(*)::int FROM users WHERE role = 'ALUMNI' AND status = 'PENDING') AS pending_alumni,
        (SELECT COUNT(*)::int FROM jobs) AS total_jobs,
        (SELECT COUNT(*)::int FROM events) AS total_events,
        (SELECT COALESCE(SUM(amount),0)::numeric FROM donations WHERE status = 'PAID') AS total_donations,
        (SELECT COUNT(*)::int FROM connections WHERE status = 'ACCEPTED') AS total_connections
    `);
    return success(res, { stats: stats.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function analytics(req, res, next) {
  try {
    const [byRole, byBranch, byBatch, monthly, jobs, events, donations] = await Promise.all([
      query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`),
      query(`SELECT COALESCE(branch, 'Unknown') AS branch, COUNT(*)::int AS count FROM profiles GROUP BY branch ORDER BY count DESC`),
      query(`SELECT COALESCE(batch_year, 0) AS batch_year, COUNT(*)::int AS count FROM profiles GROUP BY batch_year ORDER BY batch_year`),
      query(`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
             FROM users GROUP BY 1 ORDER BY 1`),
      query(`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
             FROM jobs GROUP BY 1 ORDER BY 1`),
      query(`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
             FROM events GROUP BY 1 ORDER BY 1`),
      query(`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(amount),0)::numeric AS amount
             FROM donations WHERE status = 'PAID' GROUP BY 1 ORDER BY 1`)
    ]);
    return success(res, {
      users_by_role: byRole.rows,
      users_by_branch: byBranch.rows,
      users_by_batch: byBatch.rows,
      monthly_registrations: monthly.rows,
      jobs_posted: jobs.rows,
      events: events.rows,
      donations: donations.rows
    });
  } catch (error) {
    next(error);
  }
}

async function users(req, res, next) {
  try {
    const { page, limit, offset } = pagination(req.query);
    const params = [];
    const filters = [];
    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      filters.push(`(p.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (req.query.role) {
      params.push(req.query.role);
      filters.push(`u.role = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`u.status = $${params.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const count = await query(
      `SELECT COUNT(*)::int AS total FROM users u LEFT JOIN profiles p ON p.user_id = u.id ${where}`,
      params
    );
    params.push(limit, offset);
    const { rows } = await query(
      `${userModel.PROFILE_SELECT} ${where} ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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

async function setStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'REJECTED', 'PENDING'].includes(status)) {
      throw new AppError(400, 'Invalid status');
    }
    if (req.params.id === req.user.id) throw new AppError(400, 'You cannot change your own status');
    const user = await userModel.findById(req.params.id);
    if (!user) throw new AppError(404, 'User not found');
    await query(`UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`, [status, req.params.id]);
    return success(res, {}, 'User status updated');
  } catch (error) {
    next(error);
  }
}

async function pendingAlumni(req, res, next) {
  try {
    const { rows } = await query(
      `${userModel.PROFILE_SELECT} WHERE u.role = 'ALUMNI' AND u.status = 'PENDING' ORDER BY u.created_at ASC`
    );
    return success(res, { users: rows.map(sanitizeUser) });
  } catch (error) {
    next(error);
  }
}

async function approveAlumni(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user || user.role !== 'ALUMNI') throw new AppError(404, 'Alumni account not found');
    await query(`UPDATE users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`, [user.id]);
    await createNotification({
      userId: user.id,
      type: 'ALUMNI_APPROVED',
      title: 'Alumni account approved',
      body: 'You now have full access to the SIES Alumni Network Portal.',
      link: '/dashboard'
    });
    await emailService.alumniApproved(user.email, user.full_name);
    return success(res, {}, 'Alumni approved');
  } catch (error) {
    next(error);
  }
}

async function rejectAlumni(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user || user.role !== 'ALUMNI') throw new AppError(404, 'Alumni account not found');
    await query(`UPDATE users SET status = 'REJECTED', updated_at = NOW() WHERE id = $1`, [user.id]);
    await createNotification({
      userId: user.id,
      type: 'ALUMNI_REJECTED',
      title: 'Alumni registration rejected',
      body: 'Your alumni registration was not approved.',
      link: '/'
    });
    await emailService.alumniRejected(user.email, user.full_name);
    return success(res, {}, 'Alumni rejected');
  } catch (error) {
    next(error);
  }
}

async function pendingJobs(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT j.*, p.full_name AS poster_name FROM jobs j JOIN profiles p ON p.user_id = j.posted_by
       WHERE j.status = 'PENDING' ORDER BY j.created_at ASC`
    );
    return success(res, { jobs: rows });
  } catch (error) {
    next(error);
  }
}

async function moderateJob(req, res, next) {
  try {
    const status = req.body.status;
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new AppError(400, 'Invalid job status');
    const { rows } = await query(`UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [
      status,
      req.params.id
    ]);
    if (!rows[0]) throw new AppError(404, 'Job not found');
    if (status === 'APPROVED') {
      const { rows: students } = await query(`SELECT id FROM users WHERE role = 'STUDENT' AND status = 'ACTIVE'`);
      await Promise.all(
        students.slice(0, 50).map((s) =>
          createNotification({
            userId: s.id,
            type: 'NEW_JOB',
            title: 'New job posted',
            body: `${rows[0].title} at ${rows[0].company} is now open.`,
            link: `/jobs/${rows[0].id}`
          })
        )
      );
    }
    return success(res, { job: rows[0] }, `Job ${status.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
}

async function deleteJob(req, res, next) {
  try {
    const { rowCount } = await query(`DELETE FROM jobs WHERE id = $1`, [req.params.id]);
    if (!rowCount) throw new AppError(404, 'Job not found');
    return success(res, {}, 'Job deleted');
  } catch (error) {
    next(error);
  }
}

async function pendingEvents(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT e.*, p.full_name AS organizer_name FROM events e JOIN profiles p ON p.user_id = e.created_by
       WHERE e.status = 'PENDING' ORDER BY e.created_at ASC`
    );
    return success(res, { events: rows });
  } catch (error) {
    next(error);
  }
}

async function moderateEvent(req, res, next) {
  try {
    const status = req.body.status;
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new AppError(400, 'Invalid event status');
    const { rows } = await query(`UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [
      status,
      req.params.id
    ]);
    if (!rows[0]) throw new AppError(404, 'Event not found');
    if (status === 'APPROVED') {
      const { rows: users } = await query(`SELECT id FROM users WHERE status = 'ACTIVE' AND role <> 'ADMIN'`);
      await Promise.all(
        users.slice(0, 80).map((u) =>
          createNotification({
            userId: u.id,
            type: 'NEW_EVENT',
            title: 'New event',
            body: `${rows[0].title} is now open for RSVP.`,
            link: `/events/${rows[0].id}`
          })
        )
      );
    }
    return success(res, { event: rows[0] }, `Event ${status.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const { rowCount } = await query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
    if (!rowCount) throw new AppError(404, 'Event not found');
    return success(res, {}, 'Event deleted');
  } catch (error) {
    next(error);
  }
}

async function donationsAdmin(req, res, next) {
  try {
    const campaigns = (await query(`SELECT * FROM donation_campaigns ORDER BY created_at DESC`)).rows;
    const donations = (
      await query(
        `SELECT d.*, p.full_name, u.email, c.title AS campaign_title
         FROM donations d
         JOIN profiles p ON p.user_id = d.donor_id
         JOIN users u ON u.id = d.donor_id
         JOIN donation_campaigns c ON c.id = d.campaign_id
         ORDER BY d.created_at DESC`
      )
    ).rows;
    return success(res, { campaigns, donations });
  } catch (error) {
    next(error);
  }
}

async function createCampaign(req, res, next) {
  try {
    const { title, description, target_amount, start_date, end_date } = req.body;
    const { rows } = await query(
      `INSERT INTO donation_campaigns (title, description, target_amount, start_date, end_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6) RETURNING *`,
      [title, description, target_amount, start_date, end_date, req.user.id]
    );
    return success(res, { campaign: rows[0] }, 'Campaign created', 201);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  dashboard,
  analytics,
  users,
  setStatus,
  pendingAlumni,
  approveAlumni,
  rejectAlumni,
  pendingJobs,
  moderateJob,
  deleteJob,
  pendingEvents,
  moderateEvent,
  deleteEvent,
  donationsAdmin,
  createCampaign
};
