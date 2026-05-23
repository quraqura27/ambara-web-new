// Shared DB helper using Neon serverless
const { neon } = require('@neondatabase/serverless');

let _sql = null;
function getDB() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    throw new Error('CRITICAL: DATABASE_URL is not configured in the environment variables.');
  }
  if (!_sql) _sql = neon(url);
  return _sql;
}

const ALLOWED_ORIGINS = [
  'https://ambaraartha.com',
  'https://www.ambaraartha.com'
];

function getCorsOrigin(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || '';
  // Check if origin matches allowed domains (with or without www)
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  
  // Allow any sub-domain of ambaraartha.com for flexibility
  if (origin.endsWith('.ambaraartha.com')) return origin;

  // In development, allow localhost
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
  
  return ALLOWED_ORIGINS[0]; // Default to primary domain
}

function getCorsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
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

function extractEmail(value) {
  const match = String(value || '').match(/<([^>]+)>$/);
  return (match ? match[1] : String(value || '')).trim();
}

function maskEmail(value) {
  const email = extractEmail(value);
  return email.replace(/^(.)([^@]*)(@.*)$/, (_, first, _middle, domain) => `${first}***${domain}`);
}

function emailDomain(value) {
  const email = extractEmail(value);
  const match = email.match(/@(.+)$/);
  return match ? match[1].toLowerCase() : '(unknown)';
}

function normalizeRecipients(to) {
  const values = Array.isArray(to) ? to : [to];
  return values
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeSender(env) {
  const sender = String(env.EMAIL_FROM || 'noreply@ambaraartha.com').trim();
  if (sender.includes('<') && sender.includes('>')) return sender;
  return `PT Ambara Artha Globaltrans <${sender}>`;
}

function emailTextFromHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableEmailStatus(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const dateMs = Date.parse(headerValue);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());

  return null;
}

function emailRequestSummary({ from, recipients, subject, html, text, env }) {
  return {
    from: maskEmail(from),
    fromDomain: emailDomain(from),
    recipientCount: recipients.length,
    recipientDomains: recipients.map(emailDomain),
    recipients: recipients.map(maskEmail),
    subjectLength: String(subject || '').length,
    htmlLength: String(html || '').length,
    textLength: String(text || '').length,
    hasApiKey: Boolean(env.RESEND_API_KEY),
  };
}

async function sendEmail(env, to, subject, html, options = {}) {
  if (!env.RESEND_API_KEY) return false;
  const from = normalizeSender(env);
  const recipients = normalizeRecipients(to);
  const payload = {
    from,
    to: recipients,
    subject,
    html,
    text: emailTextFromHtml(html),
  };
  if (options.replyTo) payload.reply_to = normalizeRecipients(options.replyTo);

  const maxRetries = 2;
  const fallbackDelays = [700, 1500];

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return true;

      let errorBody = {};
      try { errorBody = await res.json(); } catch {}
      const summary = {
        resendErrorName: errorBody.name || errorBody.error || '(none)',
        resendErrorMessage: errorBody.message || '(none)',
        attempt: attempt + 1,
        maxAttempts: maxRetries + 1,
        ...emailRequestSummary({ from, recipients, subject, html, text: payload.text, env }),
      };

      if (isRetryableEmailStatus(res.status) && attempt < maxRetries) {
        const retryAfter = parseRetryAfter(res.headers?.get?.('retry-after'));
        const delayMs = retryAfter ?? fallbackDelays[attempt] ?? fallbackDelays[fallbackDelays.length - 1];
        console.warn('Email retry:', res.status, res.statusText, { ...summary, retryDelayMs: delayMs });
        await wait(delayMs);
        continue;
      }

      console.error('Email error:', res.status, res.statusText, summary);
      return false;
    } catch (e) {
      if (attempt < maxRetries) {
        const delayMs = fallbackDelays[attempt] ?? fallbackDelays[fallbackDelays.length - 1];
        console.warn('Email retry:', {
          attempt: attempt + 1,
          maxAttempts: maxRetries + 1,
          retryDelayMs: delayMs,
          errorMessage: e.message,
          ...emailRequestSummary({ from, recipients, subject, html, text: payload.text, env }),
        });
        await wait(delayMs);
        continue;
      }
      console.error('Email error:', e.message);
      return false;
    }
  }

  return false;
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
