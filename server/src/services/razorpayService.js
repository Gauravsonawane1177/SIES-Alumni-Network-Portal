const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

function isConfigured() {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

function getClient() {
  if (!isConfigured()) {
    throw new AppError(503, 'Razorpay sandbox is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret
  });
}

async function createOrder({ amountRupees, receipt, notes }) {
  const client = getClient();
  const amountPaise = Math.round(Number(amountRupees) * 100);
  return client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes
  });
}

function verifySignature({ orderId, paymentId, signature }) {
  if (!isConfigured()) {
    throw new AppError(503, 'Razorpay sandbox is not configured');
  }
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

module.exports = { isConfigured, createOrder, verifySignature, getKeyId: () => env.razorpayKeyId };
