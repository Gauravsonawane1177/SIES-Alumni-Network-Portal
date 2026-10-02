const express = require('express');
const { authenticate, requireActive } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { connectionSchema, idParam } = require('../validators/schemas');
const connections = require('../controllers/connectionController');

const router = express.Router();

router.post('/', authenticate, requireActive, validate(connectionSchema), connections.create);
router.get('/', authenticate, requireActive, connections.list);
router.put('/:id/accept', authenticate, requireActive, validate(idParam), connections.accept);
router.put('/:id/reject', authenticate, requireActive, validate(idParam), connections.reject);

module.exports = router;
