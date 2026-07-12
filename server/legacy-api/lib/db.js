// Shared DB helper using Neon serverless
const { neon } = require('@neondatabase/serverless');

let _sql = null;
function getRuntimeDatabaseUrl(env = process.env) {
  const url = env.NETLIFY_DATABASE_URL;
  if (!url) {
    throw new Error('NETLIFY_DATABASE_URL is required for database access.');
  }
  return url;
}

function getDB() {
  const url = getRuntimeDatabaseUrl();
  if (!_sql) _sql = neon(url);
  return _sql;
}

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

async function validateClientSession(decoded) {
  if (!decoded?.id || !Number.isInteger(decoded.sessionVersion)) return null;
  const sql = getDB();
  const rows = await sql`
    SELECT id, customer_id, email, full_name, company_name, session_version
    FROM customers
    WHERE id = ${decoded.id} AND password_hash IS NOT NULL AND archived_at IS NULL
    LIMIT 1
  `;
  const customer = rows[0];
  if (!customer || customer.session_version !== decoded.sessionVersion) return null;
  return {
    ...decoded,
    customer_id: customer.customer_id,
    email: customer.email,
    name: customer.full_name || customer.company_name,
    sessionVersion: customer.session_version,
  };
}

function getAuthToken(event, cookieName) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  if (!cookieName) return null;

  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
  const portalCookie = String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  if (!portalCookie) return null;
  try {
    return decodeURIComponent(portalCookie.slice(cookieName.length + 1));
  } catch {
    return null;
  }
}

module.exports = {
  CORS,
  errorResponse,
  getAuthToken,
  getDB,
  getRuntimeDatabaseUrl,
  optionsResponse,
  response,
  sendEmail,
  validateClientSession,
};
