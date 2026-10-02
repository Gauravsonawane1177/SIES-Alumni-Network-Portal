const { query, withTransaction } = require('../config/db');
const { AppError, success } = require('../utils/errors');
const razorpayService = require('../services/razorpayService');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const userModel = require('../models/userModel');

async function listCampaigns(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT * FROM donation_campaigns
       WHERE status = 'ACTIVE' OR $1 = 'ADMIN'
       ORDER BY created_at DESC`,
      [req.user.role]
    );
    return success(res, { campaigns: rows });
  } catch (error) {
    next(error);
  }
}

async function getCampaign(req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM donation_campaigns WHERE id = $1`, [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Campaign not found');
    if (rows[0].status !== 'ACTIVE' && req.user.role !== 'ADMIN') throw new AppError(404, 'Campaign not found');
    const donations =
      req.user.role === 'ADMIN'
        ? (await query(`SELECT d.*, p.full_name FROM donations d JOIN profiles p ON p.user_id = d.donor_id WHERE campaign_id = $1 ORDER BY created_at DESC`, [req.params.id])).rows
        : [];
    return success(res, { campaign: rows[0], donations });
  } catch (error) {
    next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const { campaign_id, amount } = req.body;
    const { rows } = await query(`SELECT * FROM donation_campaigns WHERE id = $1 AND status = 'ACTIVE'`, [campaign_id]);
    const campaign = rows[0];
    if (!campaign) throw new AppError(404, 'Campaign not found or closed');
    if (Number(amount) < 1) throw new AppError(400, 'Donation amount must be at least 1');
    const { rows: donationRows } = await query(
      `INSERT INTO donations (campaign_id, donor_id, amount, status) VALUES ($1,$2,$3,'CREATED') RETURNING *`,
      [campaign.id, req.user.id, amount]
    );
    const donation = donationRows[0];
    try {
      const order = await razorpayService.createOrder({
        amountRupees: amount,
        receipt: donation.id.replace(/-/g, '').slice(0, 40),
        notes: { donation_id: donation.id, campaign_id: campaign.id }
      });
      await query(`UPDATE donations SET razorpay_order_id = $1 WHERE id = $2`, [order.id, donation.id]);
      return success(res, {
        donation_id: donation.id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: razorpayService.getKeyId()
      });
    } catch (error) {
      await query(`UPDATE donations SET status = 'FAILED' WHERE id = $1`, [donation.id]);
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const { donation_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { rows } = await query(`SELECT * FROM donations WHERE id = $1`, [donation_id]);
    const donation = rows[0];
    if (!donation) throw new AppError(404, 'Donation not found');
    if (donation.donor_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError(403, 'You cannot verify this donation');
    }
    if (donation.status === 'PAID') {
      return success(res, { donation }, 'Payment already verified');
    }
    if (donation.razorpay_order_id !== razorpay_order_id) {
      throw new AppError(400, 'Order mismatch');
    }
    const valid = razorpayService.verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
    if (!valid) {
      await query(`UPDATE donations SET status = 'FAILED', razorpay_payment_id = $1, razorpay_signature = $2 WHERE id = $3`, [
        razorpay_payment_id,
        razorpay_signature,
        donation.id
      ]);
      throw new AppError(400, 'Payment signature verification failed');
    }

    const receiptNumber = `SIES-${Date.now()}-${donation.id.slice(0, 8).toUpperCase()}`;
    const updated = await withTransaction(async (client) => {
      const locked = await client.query(`SELECT * FROM donations WHERE id = $1 FOR UPDATE`, [donation.id]);
      if (locked.rows[0].status === 'PAID') return locked.rows[0];
      const { rows: paid } = await client.query(
        `UPDATE donations SET status = 'PAID', razorpay_payment_id = $1, razorpay_signature = $2,
         receipt_number = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
        [razorpay_payment_id, razorpay_signature, receiptNumber, donation.id]
      );
      await client.query(
        `UPDATE donation_campaigns SET collected_amount = collected_amount + $1, updated_at = NOW() WHERE id = $2`,
        [donation.amount, donation.campaign_id]
      );
      return paid[0];
    });

    const campaign = (await query(`SELECT * FROM donation_campaigns WHERE id = $1`, [donation.campaign_id])).rows[0];
    const donor = await userModel.findById(donation.donor_id);
    const filePath = await pdfService.generateReceipt({
      receiptNumber,
      donorName: donor.full_name,
      donorEmail: donor.email,
      campaignName: campaign.title,
      amount: donation.amount,
      paymentId: razorpay_payment_id,
      date: new Date().toLocaleString('en-IN')
    });
    await createNotification({
      userId: donation.donor_id,
      type: 'DONATION_SUCCESS',
      title: 'Donation successful',
      body: `Thank you for donating ₹${donation.amount} to ${campaign.title}.`,
      link: `/giving/${campaign.id}`
    });
    await emailService.donationReceipt(donor.email, donor.full_name, donation.amount, campaign.title, filePath);
    return success(res, { donation: updated }, 'Payment verified');
  } catch (error) {
    next(error);
  }
}

async function markFailed(req, res, next) {
  try {
    await query(
      `UPDATE donations SET status = $1, updated_at = NOW()
       WHERE id = $2 AND donor_id = $3 AND status = 'CREATED'`,
      [req.body.status === 'CANCELLED' ? 'CANCELLED' : 'FAILED', req.body.donation_id, req.user.id]
    );
    return success(res, {}, 'Donation marked as unsuccessful');
  } catch (error) {
    next(error);
  }
}

async function myDonations(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT d.*, c.title AS campaign_title
       FROM donations d JOIN donation_campaigns c ON c.id = d.campaign_id
       WHERE d.donor_id = $1 ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    return success(res, { donations: rows });
  } catch (error) {
    next(error);
  }
}

async function downloadReceipt(req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM donations WHERE id = $1`, [req.params.id]);
    const donation = rows[0];
    if (!donation) throw new AppError(404, 'Donation not found');
    if (donation.donor_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError(403, 'You cannot download this receipt');
    }
    if (donation.status !== 'PAID' || !donation.receipt_number) {
      throw new AppError(400, 'Receipt is not available until payment is verified');
    }
    const filePath = pdfService.receiptPath(donation.receipt_number);
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      const campaign = (await query(`SELECT * FROM donation_campaigns WHERE id = $1`, [donation.campaign_id])).rows[0];
      const donor = await userModel.findById(donation.donor_id);
      await pdfService.generateReceipt({
        receiptNumber: donation.receipt_number,
        donorName: donor.full_name,
        donorEmail: donor.email,
        campaignName: campaign.title,
        amount: donation.amount,
        paymentId: donation.razorpay_payment_id,
        date: new Date(donation.updated_at || donation.created_at).toLocaleString('en-IN')
      });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${donation.receipt_number}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCampaigns,
  getCampaign,
  createOrder,
  verifyPayment,
  markFailed,
  myDonations,
  downloadReceipt
};
