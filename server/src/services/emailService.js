const nodemailer = require('nodemailer');
const env = require('../config/env');

function isConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.password);
}

function getTransporter() {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.password }
  });
}

async function sendMail({ to, subject, html, attachments }) {
  if (!isConfigured()) {
    console.info('Email skipped: SMTP is not configured');
    return { skipped: true };
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
      attachments
    });
    return { skipped: false };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { skipped: true, error: true };
  }
}

async function alumniApproved(to, name) {
  return sendMail({
    to,
    subject: 'Your SIES alumni account has been approved',
    html: `<p>Hello ${name},</p><p>Your alumni account on the SIES Alumni Network Portal is now active. You can sign in and access the full portal.</p>`
  });
}

async function alumniRejected(to, name) {
  return sendMail({
    to,
    subject: 'Update on your SIES alumni registration',
    html: `<p>Hello ${name},</p><p>Your alumni registration was not approved. Please contact the alumni office if you believe this is a mistake.</p>`
  });
}

async function connectionNotice(to, name, fromName) {
  return sendMail({
    to,
    subject: 'New connection request',
    html: `<p>Hello ${name},</p><p>${fromName} sent you a connection request on the SIES Alumni Network Portal.</p>`
  });
}

async function jobApplicationNotice(to, name, jobTitle, applicantName) {
  return sendMail({
    to,
    subject: `New application for ${jobTitle}`,
    html: `<p>Hello ${name},</p><p>${applicantName} applied for ${jobTitle}.</p>`
  });
}

async function rsvpConfirmation(to, name, eventTitle) {
  return sendMail({
    to,
    subject: `RSVP confirmed: ${eventTitle}`,
    html: `<p>Hello ${name},</p><p>Your RSVP for ${eventTitle} is confirmed.</p>`
  });
}

async function donationReceipt(to, name, amount, campaign, receiptPath) {
  return sendMail({
    to,
    subject: 'SIES donation receipt',
    html: `<p>Hello ${name},</p><p>Thank you for donating ₹${amount} to ${campaign}. Your receipt is attached.</p>`,
    attachments: receiptPath ? [{ filename: 'donation-receipt.pdf', path: receiptPath }] : undefined
  });
}

module.exports = {
  isConfigured,
  sendMail,
  alumniApproved,
  alumniRejected,
  connectionNotice,
  jobApplicationNotice,
  rsvpConfirmation,
  donationReceipt
};
