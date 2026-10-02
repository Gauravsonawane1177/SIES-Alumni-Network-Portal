const express = require('express');
const { authenticate, requireActive } = require('../middleware/auth');
const messages = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', authenticate, requireActive, messages.conversations);
router.get('/:id', authenticate, requireActive, messages.thread);

module.exports = router;
