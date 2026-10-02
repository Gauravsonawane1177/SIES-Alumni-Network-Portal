const express = require('express');
const { authenticate } = require('../middleware/auth');
const notifications = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authenticate, notifications.list);
router.put('/read-all', authenticate, notifications.markAllRead);
router.put('/:id/read', authenticate, notifications.markRead);

module.exports = router;
