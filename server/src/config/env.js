const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Copy server/.env.example to server/.env and fill in the values.`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is missing. Example: postgresql://postgres:postgres@localhost:5432/alumni_portal'
  );
}

const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: process.env.JWT_SECRET || (nodeEnv === 'production' ? required('JWT_SECRET') : 'dev-only-change-me'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecure: String(process.env.COOKIE_SECURE || (nodeEnv === 'production')).toLowerCase() === 'true',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'SIES Alumni Portal <noreply@siesgst.ac.in>'
  }
};

if (nodeEnv === 'production' && env.jwtSecret === 'dev-only-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
