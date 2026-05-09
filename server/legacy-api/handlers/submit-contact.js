const { getDB, response, errorResponse, optionsResponse, sendEmail } = require('../lib/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 32 * 1024;
const HONEYPOT_FIELD = 'website_url';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitBuckets = new Map();

const LIMITS = {
  name: 120,
  email: 254,
  phone: 60,
  company: 160,
  topic: 160,
  message: 5000,
  notes: 5000,
  cargoDesc: 2000,
  origin: 200,
  destination: 200,
  defaultShort: 300,
};

const CONTACT_REQUIRED = ['name', 'email', 'topic', 'message'];
const QUOTE_REQUIRED = [
  'origin',
  'destination',
  'readyDate',
  'cargoType',
  'cargoDesc',
  'weight',
  'name',
  'email',
  'phone',
];

function isDryRun() {
  return String(process.env.FORM_DRY_RUN || '').toLowerCase() === 'true';
}

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function validateLength(fields, errors) {
  Object.entries(fields).forEach(([key, value]) => {
    const limit = LIMITS[key] || LIMITS.defaultShort;
    if (cleanText(value).length > limit) {
      errors.push(`${key} must be ${limit} characters or less`);
    }
  });
}

function validateRequired(fields, required, errors) {
  required.forEach((key) => {
    if (!cleanText(fields[key])) errors.push(`${key} is required`);
  });
}

function validateEmail(email, errors) {
  const value = cleanText(email);
  if (value && !EMAIL_RE.test(value)) errors.push('email must be a valid email address');
}

function validateNumberLike(fields, keys, errors) {
  keys.forEach((key) => {
    const value = cleanText(fields[key]);
    if (!value) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      errors.push(`${key} must be a valid non-negative number`);
    }
  });
}

function normalizeContact(body) {
  return {
    name: cleanText(body.name),
    company: cleanText(body.company),
    email: cleanText(body.email).toLowerCase(),
    phone: cleanText(body.phone),
    topic: cleanText(body.topic),
    message: cleanText(body.message),
  };
}

function normalizeQuote(body) {
  return {
    freightType: cleanText(body.freightType) || 'air',
    origin: cleanText(body.origin),
    destination: cleanText(body.destination),
    readyDate: cleanText(body.readyDate),
    incoterms: cleanText(body.incoterms),
    cargoType: cleanText(body.cargoType),
    commodity: cleanText(body.commodity),
    cargoDesc: cleanText(body.cargoDesc),
    weight: cleanText(body.weight),
    volume: cleanText(body.volume),
    packages: cleanText(body.packages),
    cargoValue: cleanText(body.cargoValue),
    insurance: cleanText(body.insurance),
    special: cleanText(body.special),
    name: cleanText(body.name),
    company: cleanText(body.company),
    email: cleanText(body.email).toLowerCase(),
    phone: cleanText(body.phone),
    notes: cleanText(body.notes),
  };
}

function validateContact(fields) {
  const errors = [];
  validateRequired(fields, CONTACT_REQUIRED, errors);
  validateEmail(fields.email, errors);
  validateLength(fields, errors);
  return errors;
}

function validateQuote(fields) {
  const errors = [];
  validateRequired(fields, QUOTE_REQUIRED, errors);
  validateEmail(fields.email, errors);
  validateLength(fields, errors);
  validateNumberLike(fields, ['weight', 'volume', 'packages', 'cargoValue'], errors);
  return errors;
}

function escapeHtml(value) {
  return cleanText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeSubject(value) {
  return cleanText(value).replace(/[\r\n<>]/g, ' ').replace(/\s+/g, ' ').slice(0, 180);
}

function preview(value) {
  return escapeHtml(value).slice(0, 200);
}

function badRequest(errors) {
  return errorResponse(Array.isArray(errors) ? errors.join('; ') : errors, 400);
}

function parseBody(event) {
  const raw = event.body || '{}';
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return { error: 'Payload too large', status: 413 };
  }
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: 'Invalid JSON payload', status: 400 };
  }
}

function getHeader(event, name) {
  const headers = event.headers || {};
  const lowerName = name.toLowerCase();
  return headers[name] || headers[lowerName] || '';
}

function getClientId(event) {
  const forwardedFor = getHeader(event, 'x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim() || 'unknown';
  return getHeader(event, 'x-real-ip') || getHeader(event, 'cf-connecting-ip') || 'unknown';
}

function checkRateLimit(event, endpoint) {
  const now = Date.now();
  const clientId = getClientId(event);
  const key = `${endpoint}:${clientId}`;
  const existing = rateLimitBuckets.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return { limited: true };
  }

  existing.count += 1;
  return { limited: false };
}

function rateLimitResponse() {
  return errorResponse('Too many submissions. Please try again later.', 429);
}

function hasHoneypot(body) {
  return Boolean(cleanText(body?.[HONEYPOT_FIELD]));
}

function spamFilteredResponse(endpoint) {
  if (isDryRun()) {
    return response({
      success: true,
      dryRun: true,
      valid: false,
      spamFiltered: true,
      stored: false,
      emailSent: false,
      endpoint,
      honeypotField: HONEYPOT_FIELD,
    });
  }

  return response({ success: true });
}

function contactEmailPayloads(fields, escaped) {
  return [
    {
      category: 'customer_acknowledgement',
      to: fields.email,
      subject: 'Message Received - PT Ambara Artha Globaltrans',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);padding:32px;border-radius:16px 16px 0 0;text-align:center">
            <div style="color:white;font-size:22px;font-weight:900">PT Ambara Artha Globaltrans</div>
          </div>
          <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef">
            <h2>Thank you, ${escaped.name}!</h2>
            <p>We've received your message and will reply within <strong>2 business hours</strong>.</p>
            <div style="background:#f4f6fb;padding:16px;border-radius:8px;margin:20px 0">
              <strong>Topic:</strong> ${escaped.topic}<br><strong>Message:</strong><br>${escaped.message}
            </div>
            <p>Urgent? Call us: <strong>+62 821-2545-2800</strong><br>WhatsApp: <a href="https://wa.me/6282125452800">wa.me/6282125452800</a></p>
          </div>
        </div>`,
    },
    {
      category: 'internal_notification',
      to: process.env.EMAIL_TO || 'cs@ambaraartha.com',
      subject: `New Message: ${safeSubject(fields.topic)} - ${safeSubject(fields.name)}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h3>New Contact Message</h3>
          <p><strong>Name:</strong> ${escaped.name}<br><strong>Company:</strong> ${escaped.company || '-'}<br><strong>Email:</strong> ${escaped.email}<br><strong>Phone:</strong> ${escaped.phone || '-'}<br><strong>Topic:</strong> ${escaped.topic}</p>
          <div style="background:#f4f6fb;padding:16px;border-radius:8px">${escaped.message}</div>
          <p><a href="mailto:${escaped.email}" style="background:#1122EE;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:700">Reply</a></p>
        </div>`,
    },
  ];
}

function quoteEmailPayloads(fields, escaped, ref) {
  return [
    {
      category: 'customer_acknowledgement',
      to: fields.email,
      subject: `Quote Request Received - ${ref}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);padding:32px;border-radius:16px 16px 0 0;text-align:center">
            <div style="color:white;font-size:22px;font-weight:900">PT Ambara Artha Globaltrans</div>
          </div>
          <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef">
            <h2>Quote Received</h2>
            <p>Dear <strong>${escaped.name}</strong>, we'll get back to you within <strong>2 business hours</strong>.</p>
            <div style="background:#f4f6fb;padding:20px;border-radius:12px;margin:20px 0">
              <div style="font-size:24px;font-weight:900;color:#1122EE;font-family:monospace">${ref}</div>
              <p><strong>Route:</strong> ${escaped.origin} to ${escaped.destination}<br><strong>Cargo:</strong> ${escaped.cargoDesc || escaped.commodity}<br><strong>Weight:</strong> ${escaped.weight} kg</p>
            </div>
          </div>
        </div>`,
    },
    {
      category: 'internal_notification',
      to: process.env.EMAIL_TO || 'cs@ambaraartha.com',
      subject: `New Quote: ${ref} - ${safeSubject(fields.company || fields.name)}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h3>New Quote Request: ${ref}</h3>
          <p><strong>Company:</strong> ${escaped.company || '-'}<br><strong>Contact:</strong> ${escaped.name} / ${escaped.email} / ${escaped.phone || '-'}<br><strong>Route:</strong> ${escaped.origin} to ${escaped.destination}<br><strong>Cargo:</strong> ${escaped.cargoDesc || escaped.commodity} / ${escaped.weight}kg<br><strong>Ready:</strong> ${escaped.readyDate}</p>
          <p><strong>Notes:</strong> ${escaped.notes || '-'}</p>
        </div>`,
    },
  ];
}

function dryRunResponse(endpoint, table, emails, extra = {}) {
  return response({
    success: true,
    dryRun: true,
    valid: true,
    stored: false,
    emailSent: false,
    endpoint,
    wouldInsert: table,
    wouldSendEmails: emails.map((email) => ({
      category: email.category,
      recipientCategory: email.category === 'internal_notification' ? 'internal' : 'submitter',
      subject: email.subject,
    })),
    ...extra,
  });
}

async function sendAllEmails(emails) {
  const results = [];
  for (const email of emails) {
    const sent = await sendEmail(process.env, email.to, email.subject, email.html);
    results.push(Boolean(sent));
  }
  return results.every(Boolean);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  const parsed = parseBody(event);
  if (parsed.error) return errorResponse(parsed.error, parsed.status || 400);

  const path = event.path;

  try {
    if (path.includes('submit-contact')) {
      if (hasHoneypot(parsed.body)) return spamFilteredResponse('submit-contact');
      if (checkRateLimit(event, 'submit-contact').limited) return rateLimitResponse();

      const fields = normalizeContact(parsed.body);
      const errors = validateContact(fields);
      if (errors.length) return badRequest(errors);

      const escaped = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, escapeHtml(value)]));
      const insert = {
        table: 'contact_messages',
        values: { ...fields, status: 'unread' },
      };
      const emails = contactEmailPayloads(fields, escaped);

      if (isDryRun()) {
        return dryRunResponse('submit-contact', insert.table, emails, {
          sanitizedPreview: {
            name: preview(fields.name),
            topic: preview(fields.topic),
            message: preview(fields.message),
          },
        });
      }

      const sql = getDB();
      await sql`INSERT INTO contact_messages (name, company, email, phone, topic, message, status, created_at) VALUES (${fields.name}, ${fields.company}, ${fields.email}, ${fields.phone}, ${fields.topic}, ${fields.message}, ${'unread'}, NOW())`;

      const emailSent = await sendAllEmails(emails);
      return response({
        success: true,
        stored: true,
        emailSent,
        message: emailSent ? 'Message received' : 'Message received, but email notification may have failed',
      }, emailSent ? 200 : 202);
    }

    if (path.includes('submit-quote')) {
      if (hasHoneypot(parsed.body)) return spamFilteredResponse('submit-quote');
      if (checkRateLimit(event, 'submit-quote').limited) return rateLimitResponse();

      const fields = normalizeQuote(parsed.body);
      const errors = validateQuote(fields);
      if (errors.length) return badRequest(errors);

      const ref = 'AAG-Q-' + Date.now().toString().slice(-5);
      const escaped = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, escapeHtml(value)]));
      const insert = {
        table: 'quote_requests',
        values: { ...fields, reference_number: ref, status: 'new' },
      };
      const emails = quoteEmailPayloads(fields, escaped, ref);

      if (isDryRun()) {
        return dryRunResponse('submit-quote', insert.table, emails, {
          referencePreview: ref,
          sanitizedPreview: {
            origin: preview(fields.origin),
            destination: preview(fields.destination),
            cargoDesc: preview(fields.cargoDesc),
            notes: preview(fields.notes),
          },
        });
      }

      const sql = getDB();
      await sql`INSERT INTO quote_requests (reference_number, freight_type, origin, destination, ready_date, incoterms, cargo_description, weight_kg, volume_cbm, num_packages, cargo_value_usd, needs_insurance, special_requirements, contact_name, company_name, email, phone, notes, status, created_at) VALUES (${ref}, ${fields.freightType}, ${fields.origin}, ${fields.destination}, ${fields.readyDate}, ${fields.incoterms}, ${fields.cargoDesc || fields.commodity}, ${fields.weight || 0}, ${fields.volume || 0}, ${fields.packages || 1}, ${fields.cargoValue || 0}, ${fields.insurance}, ${fields.special}, ${fields.name}, ${fields.company}, ${fields.email}, ${fields.phone}, ${fields.notes}, ${'new'}, NOW())`;

      const emailSent = await sendAllEmails(emails);
      return response({
        success: true,
        reference: ref,
        stored: true,
        emailSent,
        message: emailSent ? 'Quote request received' : 'Quote request received, but email notification may have failed',
      }, emailSent ? 200 : 202);
    }

    return errorResponse('Not found', 404);
  } catch (err) {
    console.error('Form submission error:', err instanceof Error ? err.message : err);
    return errorResponse('Unable to process form submission', 500);
  }
};

// TODO: Add Turnstile in a follow-up phase if spam continues beyond lightweight controls.
