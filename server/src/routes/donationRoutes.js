const express = require('express');
const { authenticate, requireActive } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { donationOrderSchema, donationVerifySchema, idParam } = require('../validators/schemas');
const donations = require('../controllers/donationController');

const router = express.Router();

router.get('/campaigns', authenticate, requireActive, donations.listCampaigns);
router.get('/campaigns/:id', authenticate, requireActive, donations.getCampaign);
router.post('/orders', authenticate, requireActive, validate(donationOrderSchema), donations.createOrder);
router.post('/verify', authenticate, requireActive, validate(donationVerifySchema), donations.verifyPayment);
router.post('/fail', authenticate, requireActive, donations.markFailed);
router.get('/mine', authenticate, requireActive, donations.myDonations);
router.get('/:id/receipt', authenticate, requireActive, validate(idParam), donations.downloadReceipt);

module.exports = router;
