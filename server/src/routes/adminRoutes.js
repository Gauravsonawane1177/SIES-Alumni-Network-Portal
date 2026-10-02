const express = require('express');
const { authenticate, requireActive, requireRoles } = require('../middleware/auth');
const admin = require('../controllers/adminController');

const router = express.Router();
const guard = [authenticate, requireActive, requireRoles('ADMIN')];

router.get('/dashboard', ...guard, admin.dashboard);
router.get('/analytics', ...guard, admin.analytics);
router.get('/users', ...guard, admin.users);
router.put('/users/:id/status', ...guard, admin.setStatus);
router.get('/verification', ...guard, admin.pendingAlumni);
router.put('/verification/:id/approve', ...guard, admin.approveAlumni);
router.put('/verification/:id/reject', ...guard, admin.rejectAlumni);
router.get('/jobs', ...guard, admin.pendingJobs);
router.put('/jobs/:id/moderate', ...guard, admin.moderateJob);
router.delete('/jobs/:id', ...guard, admin.deleteJob);
router.get('/events', ...guard, admin.pendingEvents);
router.put('/events/:id/moderate', ...guard, admin.moderateEvent);
router.delete('/events/:id', ...guard, admin.deleteEvent);
router.get('/donations', ...guard, admin.donationsAdmin);
router.post('/campaigns', ...guard, admin.createCampaign);

module.exports = router;
