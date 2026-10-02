const express = require('express');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { registerSchema, loginSchema, forgotSchema, resetSchema } = require('../validators/schemas');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate(registerSchema), auth.register);
router.post('/login', validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);
router.post('/forgot-password', validate(forgotSchema), auth.forgotPassword);
router.post('/reset-password', validate(resetSchema), auth.resetPassword);

module.exports = router;
