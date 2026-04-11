const { getDB, CORS, response, errorResponse, optionsResponse, verifyToken, getAuthToken } = require('./_db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const JWT_SECRET = process.env.JWT_SECRET;\nif (!JWT_SECRET) {\n  console.error('FATAL: JWT_SECRET environment variable is not set. Client auth will fail.');\n}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
}

async function signDocUrl(doc) {
  if (!process.env.R2_ACCESS_KEY_ID) return doc;
  try {
    const r2 = getR2Client();
    let key = doc.file_url;
    if (key.includes('.dev/')) key = key.split('.dev/')[1];
    const signedUrl = await getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }), { expiresIn: 3600 });
    return { ...doc, file_url: signedUrl };
  } catch { return doc; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const action = event.queryStringParameters?.action || '';
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch {} }

  // CLIENT LOGIN — uses customer email + password
  if (action === 'login' && event.httpMethod === 'POST') {
    try {
      const { email, password } = body;
      if (!email || !password) return errorResponse('Email and password required');

      const customer = await sql`SELECT * FROM customers WHERE email = ${email} AND password_hash IS NOT NULL LIMIT 1`;
      if (!customer.length) return errorResponse('Invalid credentials', 401);

      const valid = await bcrypt.compare(password, customer[0].password_hash);
      if (!valid) return errorResponse('Invalid credentials', 401);

      const token = jwt.sign(
        { id: customer[0].id, customer_id: customer[0].customer_id, email: customer[0].email, role: 'client', name: customer[0].full_name || customer[0].company_name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return response({
        token,
        customer: {
          id: customer[0].id,
          customer_id: customer[0].customer_id,
          name: customer[0].full_name || customer[0].company_name,
          email: customer[0].email,
          type: customer[0].type,
          company: customer[0].company_name,
          country: customer[0].country
        }
      });
    } catch (err) { return errorResponse(err.message, 500); }
  }

  // VERIFY CLIENT TOKEN
  if (action === 'verify' && event.httpMethod === 'GET') {
    const token = getAuthToken(event);
    if (!token) return errorResponse('No token', 401);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'client') return errorResponse('Invalid token', 401);
    return response({ valid: true, customer: decoded });
  }

  // GET MY SHIPMENTS — client can only see their own
  if (action === 'my-shipments' && event.httpMethod === 'GET') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'client') return errorResponse('Unauthorized', 401);

    const shipments = await sql`
      SELECT s.id, s.tracking_number, s.origin, s.destination, s.origin_iata, s.destination_iata,
             s.cargo_type, s.commodity, s.weight_kg, s.total_pcs, s.status, s.airline,
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
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'client') return errorResponse('Unauthorized', 401);

    const id = event.queryStringParameters?.id;
    if (!id) return errorResponse('Missing shipment id');

    const shipment = await sql`SELECT * FROM shipments WHERE id = ${id} AND customer_id = ${decoded.id} LIMIT 1`;
    if (!shipment.length) return errorResponse('Shipment not found', 404);

    const events = await sql`SELECT id, label, location, event_time FROM tracking_events WHERE shipment_id = ${id} ORDER BY event_time DESC`;

    // Get documents with presigned download URLs
    let documents = [];
    try {
      const rawDocs = await sql`SELECT id, file_name, doc_type, file_url, uploaded_at FROM documents WHERE shipment_id = ${id} ORDER BY uploaded_at DESC`;
      documents = await Promise.all(rawDocs.map(signDocUrl));
    } catch {} // Table may not exist yet

    return response({ shipment: shipment[0], events, documents });
  }

  // SET CLIENT PASSWORD — staff-only endpoint
  if (action === 'set-password' && event.httpMethod === 'POST') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    // Only staff (non-client) can set customer passwords
    if (!decoded || decoded.role === 'client') return errorResponse('Unauthorized', 401);

    const { customer_id, password } = body;
    if (!customer_id || !password) return errorResponse('Customer ID and password required');
    if (password.length < 8) return errorResponse('Password must be at least 8 characters');

    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE customers SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${customer_id}`;

    await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${'Set client portal password for customer #' + customer_id}, ${'customer'}, ${customer_id.toString()})`;

    return response({ success: true });
  }

  // GET ALL MY DOCUMENTS — aggregates docs across all shipments
  if (action === 'my-documents' && event.httpMethod === 'GET') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'client') return errorResponse('Unauthorized', 401);

    try {
      const rawDocs = await sql`
        SELECT d.id, d.file_name, d.doc_type, d.file_url, d.file_size, d.uploaded_at,
               s.tracking_number, s.origin_iata, s.destination_iata
        FROM documents d
        JOIN shipments s ON d.shipment_id = s.id
        WHERE s.customer_id = ${decoded.id}
        ORDER BY d.uploaded_at DESC
        LIMIT 100
      `;
      const signedDocs = await Promise.all(rawDocs.map(signDocUrl));
      return response(signedDocs);
    } catch (err) { return errorResponse(err.message, 500); }
  }

  return errorResponse('Not found', 404);
};
