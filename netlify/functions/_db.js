// Shared DB helper using Neon serverless
const { neon } = require('@neondatabase/serverless');

let _sql = null;
function getDB() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);
  return _sql;
}

const ALLOWED_ORIGINS = [
  'https://ambaraartha.com',
  'https://www.ambaraartha.com'
];

function getCorsOrigin(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // In development, allow localhost
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
  return ALLOWED_ORIGINS[0]; // Default to primary domain
}

function getCorsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}

// Legacy static CORS object for backward compatibility in simple responses
const CORS = {
  'Access-Control-Allow-Origin': 'https://ambaraartha.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function response(data, status = 200) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(data) };
}

function errorResponse(message, status = 400) {
  return response({ error: message }, status);
}

function optionsResponse() {
  return { statusCode: 200, headers: CORS, body: '' };
}

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `PT Ambara Artha Globaltrans <${env.EMAIL_FROM || 'noreply@ambaraartha.com'}>`, to: Array.isArray(to) ? to : [to], subject, html })
    });
  } catch (e) { console.error('Email error:', e.message); }
}

// Generate customer ID: CC-XXXXX
function generateCustomerId(countryCode) {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${countryCode.toUpperCase()}-${rand}`;
}

// Generate tracking number: AMBR + YY + CCCCC + XXXXXXX = 16 chars
function generateTrackingNumber(customerNumericId) {
  const year = new Date().getFullYear().toString().slice(-2);
  const custPart = customerNumericId.toString().padStart(5, '0');
  const rand = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `AMBR${year}${custPart}${rand}`.slice(0, 16);
}

// Verify staff JWT token
function verifyToken(token, secret) {
  try {
    const jwt = require('jsonwebtoken');
    const jwtSecret = secret || process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET environment variable is not configured');
    return jwt.verify(token, jwtSecret);
  } catch { return null; }
}

function getAuthToken(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

// === V1 API Helpers ===

// Role mapping: superadmin=Admin, operations=Ops, finance=Finance
const ROLE_ADMIN = 'superadmin';
const ROLE_OPS = 'operations';
const ROLE_FINANCE = 'finance';

function requireRole(decoded, ...allowedRoles) {
  if (!decoded) return v1Error('UNAUTHORIZED', 'No valid session', 401);
  if (!allowedRoles.includes(decoded.role)) return v1Error('FORBIDDEN', 'Insufficient role', 403);
  return null; // null means authorized
}

function v1Response(data, status = 200) {
  return {
    statusCode: status,
    headers: CORS,
    body: JSON.stringify({ success: true, ...data })
  };
}

function v1Error(code, message, status = 400) {
  return {
    statusCode: status,
    headers: CORS,
    body: JSON.stringify({ success: false, error: { code, message } })
  };
}

// Extract path params like /api/v1/awbs/{id}/something
function parsePathParam(event, prefix) {
  const path = event.path || '';
  // Support both Netlify (/.netlify/functions/) and Vercel (/api/) path formats
  const clean = path.replace('/.netlify/functions/', '').replace('/api/', '').replace(prefix, '');
  const parts = clean.split('/').filter(Boolean);
  return parts[0] || event.queryStringParameters?.id || null;
}

module.exports = { getDB, CORS, getCorsHeaders, getCorsOrigin, ALLOWED_ORIGINS, response, errorResponse, optionsResponse, sendEmail, generateCustomerId, generateTrackingNumber, verifyToken, getAuthToken, requireRole, v1Response, v1Error, parsePathParam, ROLE_ADMIN, ROLE_OPS, ROLE_FINANCE };
