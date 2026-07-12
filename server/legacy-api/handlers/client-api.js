const { createHash } = require('node:crypto');
const { getDB, response, errorResponse, optionsResponse, getAuthToken, validateClientSession } = require('../lib/db');
const { signClientToken, verifyClientToken } = require('../lib/tokens');
const bcrypt = require('bcryptjs');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const CLIENT_COOKIE = 'ambara_client_token';
const LOGIN_LIMIT = 5;

function clientSessionCookie(token, maxAge = 60 * 60 * 24) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${CLIENT_COOKIE}=${encodeURIComponent(token)}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function responseWithCookie(data, cookie) {
  const result = response(data);
  return { ...result, headers: { ...result.headers, 'Set-Cookie': cookie } };
}

function throttleKey(event, email) {
  const salt = String(process.env.AUTH_THROTTLE_SALT || process.env.CLIENT_JWT_SECRET || '').trim();
  if (!salt) throw new Error('AUTH_THROTTLE_SALT or CLIENT_JWT_SECRET is required');
  const forwardedFor = String(event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'] || '')
    .split(',')[0]
    .trim();
  return createHash('sha256')
    .update(`${salt}:client-login:${String(email || '').trim().toLowerCase()}:${forwardedFor || 'unknown'}`)
    .digest('hex');
}

async function isLoginBlocked(sql, key) {
  const rows = await sql`SELECT blocked_until FROM portal_login_attempts WHERE throttle_key = ${key} LIMIT 1`;
  return Boolean(rows[0]?.blocked_until && new Date(rows[0].blocked_until).getTime() > Date.now());
}

async function recordLoginFailure(sql, key) {
  await sql`
    INSERT INTO portal_login_attempts (
      throttle_key, attempt_count, window_started_at, blocked_until, updated_at
    ) VALUES (${key}, 1, NOW(), NULL, NOW())
    ON CONFLICT (throttle_key) DO UPDATE SET
      attempt_count = CASE
        WHEN portal_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 1
        ELSE portal_login_attempts.attempt_count + 1
      END,
      window_started_at = CASE
        WHEN portal_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NOW()
        ELSE portal_login_attempts.window_started_at
      END,
      blocked_until = CASE
        WHEN portal_login_attempts.window_started_at >= NOW() - INTERVAL '15 minutes'
          AND portal_login_attempts.attempt_count + 1 >= ${LOGIN_LIMIT}
          THEN NOW() + INTERVAL '15 minutes'
        WHEN portal_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes'
          THEN NULL
        ELSE portal_login_attempts.blocked_until
      END,
      updated_at = NOW()
  `;
}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
}

async function requireClientSession(event) {
  const decoded = verifyClientToken(getAuthToken(event, CLIENT_COOKIE));
  return decoded ? validateClientSession(decoded) : null;
}

async function signDocUrl(doc) {
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    return { ...doc, file_url: null };
  }
  try {
    const r2 = getR2Client();
    let key = doc.file_url;
    if (key.includes('.dev/')) key = key.split('.dev/')[1];
    const signedUrl = await getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }), { expiresIn: 3600 });
    return { ...doc, file_url: signedUrl };
  } catch { return { ...doc, file_url: null }; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const action = event.queryStringParameters?.action || '';
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch {} }

  // CLIENT LOGIN — uses customer email + password
  if (action === 'login' && event.httpMethod === 'POST') {
    try {
      const sql = getDB();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) return errorResponse('Email and password required');
      const key = throttleKey(event, email);
      if (await isLoginBlocked(sql, key)) return errorResponse('Too many sign-in attempts. Try again later.', 429);

      const customer = await sql`SELECT * FROM customers WHERE lower(email) = ${email} AND password_hash IS NOT NULL AND archived_at IS NULL LIMIT 1`;
      if (!customer.length) {
        await recordLoginFailure(sql, key);
        return errorResponse('Invalid credentials', 401);
      }

      const valid = await bcrypt.compare(password, customer[0].password_hash);
      if (!valid) {
        await recordLoginFailure(sql, key);
        return errorResponse('Invalid credentials', 401);
      }
      await sql`DELETE FROM portal_login_attempts WHERE throttle_key = ${key}`;

      const token = signClientToken({
        id: customer[0].id,
        customer_id: customer[0].customer_id,
        email: customer[0].email,
        name: customer[0].full_name || customer[0].company_name,
        role: 'client',
        sessionVersion: customer[0].session_version || 1,
      });

      return responseWithCookie({
        customer: {
          id: customer[0].id,
          customer_id: customer[0].customer_id,
          name: customer[0].full_name || customer[0].company_name,
          email: customer[0].email,
          type: customer[0].type,
          company: customer[0].company_name,
          country: customer[0].country
        },
      }, clientSessionCookie(token));
    } catch (err) {
      console.error('Client sign-in failed:', err);
      return errorResponse('Client sign-in is temporarily unavailable.', 500);
    }
  }

  // VERIFY CLIENT TOKEN
  if (action === 'verify' && event.httpMethod === 'GET') {
    const token = getAuthToken(event, CLIENT_COOKIE);
    if (!token) return errorResponse('No token', 401);
    const decoded = await requireClientSession(event);
    if (!decoded) return errorResponse('Invalid token', 401);
    return response({
      valid: true,
      customer: {
        customer_id: decoded.customer_id,
        email: decoded.email,
        id: decoded.id,
        name: decoded.name,
        role: 'client',
      },
    });
  }

  // GET MY SHIPMENTS — client can only see their own
  if (action === 'my-shipments' && event.httpMethod === 'GET') {
    const decoded = await requireClientSession(event);
    if (!decoded) return errorResponse('Unauthorized', 401);

    const sql = getDB();

    const shipments = await sql`
      SELECT s.id, s.tracking_number, s.origin, s.destination, s.origin_iata, s.destination_iata,
             s.cargo_type, s.commodity, s.weight_kg, s.total_pcs,
             CASE WHEN s.voided_at IS NOT NULL THEN 'cancelled' ELSE s.status END AS status,
             s.airline,
             s.flight_number, s.created_at, s.updated_at
      FROM shipments s
      WHERE s.customer_id = ${decoded.id}
      ORDER BY s.created_at DESC
      LIMIT 50
    `;
    return response(shipments);
  }

  // GET SHIPMENT DETAIL + EVENTS — client can only see their own
  if (action === 'my-shipment' && event.httpMethod === 'GET') {
    const decoded = await requireClientSession(event);
    if (!decoded) return errorResponse('Unauthorized', 401);

    const id = event.queryStringParameters?.id;
    if (!id) return errorResponse('Missing shipment id');

    const sql = getDB();
    const shipment = await sql`
      SELECT id, tracking_number, internal_tracking_no,
             CASE WHEN voided_at IS NOT NULL THEN 'cancelled' ELSE status END AS status,
             origin, destination,
             origin_iata, destination_iata, service_type, goods_description,
             total_pcs, weight_kg, chargeable_weight, cargo_type, commodity,
             created_at, updated_at
      FROM shipments
      WHERE id = ${id} AND customer_id = ${decoded.id}
      LIMIT 1
    `;
    if (!shipment.length) return errorResponse('Shipment not found', 404);

    const events = await sql`
      SELECT id, label, public_description AS description, location, event_time
      FROM tracking_events
      WHERE shipment_id = ${id}
        AND visible_to_customer = TRUE
      ORDER BY event_time DESC
    `;

    // Get documents with presigned download URLs
    let documents = [];
    try {
      const rawDocs = await sql`SELECT id, file_name, doc_type, file_url, uploaded_at FROM documents WHERE shipment_id = ${id} AND coalesce(status, 'current') = 'current' ORDER BY uploaded_at DESC`;
      documents = await Promise.all(rawDocs.map(signDocUrl));
    } catch {} // Table may not exist yet

    return response({ shipment: shipment[0], events, documents });
  }

  // GET ALL MY DOCUMENTS — aggregates docs across all shipments
  if (action === 'my-documents' && event.httpMethod === 'GET') {
    const decoded = await requireClientSession(event);
    if (!decoded) return errorResponse('Unauthorized', 401);

    try {
      const sql = getDB();
      const rawDocs = await sql`
        SELECT d.id, d.file_name, d.doc_type, d.file_url, d.file_size, d.uploaded_at,
               s.tracking_number, s.origin_iata, s.destination_iata
        FROM documents d
        JOIN shipments s ON d.shipment_id = s.id
        WHERE s.customer_id = ${decoded.id}
          AND coalesce(d.status, 'current') = 'current'
        ORDER BY d.uploaded_at DESC
        LIMIT 100
      `;
      const signedDocs = await Promise.all(rawDocs.map(signDocUrl));
      return response(signedDocs);
    } catch (err) {
      console.error('Client document lookup failed:', err);
      return errorResponse('Documents are temporarily unavailable.', 500);
    }
  }

  if (action === 'logout' && event.httpMethod === 'POST') {
    return responseWithCookie({ success: true }, clientSessionCookie('', 0));
  }

  return errorResponse('Not found', 404);
};


