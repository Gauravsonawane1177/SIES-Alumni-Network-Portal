const express = require('express');
const { authenticate, requireActive, requireRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { eventSchema, idParam } = require('../validators/schemas');
const events = require('../controllers/eventController');

const router = express.Router();

router.get('/', authenticate, requireActive, events.list);
router.get('/:id', authenticate, requireActive, validate(idParam), events.getOne);
router.post('/', authenticate, requireActive, requireRoles('ALUMNI', 'ADMIN'), validate(eventSchema), events.create);
router.put('/:id', authenticate, requireActive, requireRoles('ALUMNI', 'ADMIN'), validate(idParam), validate(eventSchema), events.update);
router.post('/:id/rsvp', authenticate, requireActive, validate(idParam), events.rsvp);
router.delete('/:id/rsvp', authenticate, requireActive, validate(idParam), events.cancelRsvp);

module.exports = router;
