const express = require('express');
const { authenticate, requireActive, requireRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { jobSchema, applySchema, idParam } = require('../validators/schemas');
const jobs = require('../controllers/jobController');

const router = express.Router();

router.get('/', authenticate, requireActive, jobs.list);
router.get('/mine/applications', authenticate, requireActive, jobs.myApplications);
router.get('/:id', authenticate, requireActive, validate(idParam), jobs.getOne);
router.post('/', authenticate, requireActive, requireRoles('ALUMNI'), validate(jobSchema), jobs.create);
router.put('/:id', authenticate, requireActive, requireRoles('ALUMNI', 'ADMIN'), validate(idParam), validate(jobSchema), jobs.update);
router.delete('/:id', authenticate, requireActive, requireRoles('ALUMNI', 'ADMIN'), validate(idParam), jobs.remove);
router.post('/:id/apply', authenticate, requireActive, validate(idParam), validate(applySchema), jobs.apply);
router.get('/:id/applications', authenticate, requireActive, validate(idParam), jobs.listApplicationsForJob);

module.exports = router;
