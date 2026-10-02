const express = require('express');
const { authenticate, requireActive } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { profileSchema, idParam } = require('../validators/schemas');
const profiles = require('../controllers/profileController');

const router = express.Router();

router.get('/', authenticate, requireActive, profiles.directory);
router.get('/me/profile', authenticate, profiles.getMyProfile);
router.put('/me/profile', authenticate, requireActive, validate(profileSchema), profiles.updateMyProfile);
router.get('/:id', authenticate, requireActive, validate(idParam), profiles.getProfileByUserId);

module.exports = router;
