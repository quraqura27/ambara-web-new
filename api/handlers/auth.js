const { getDB, CORS, response, errorResponse, optionsResponse, verifyToken, getAuthToken } = require('../lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Authentication will fail.');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const headers = getCorsHeaders(event);
  const path = event.path.replace('/.netlify/functions/auth', '');
  const action = event.queryStringParameters?.action || path.replace('/', '');

  // LOGIN
  if (action === 'login' && event.httpMethod === 'POST') {
    try {
      const { email, password } = JSON.parse(event.body || '{}');
      if (!email || !password) return errorResponse('Email and password required');

      const staff = await sql`SELECT * FROM staff_accounts WHERE email = ${email} AND is_active = true LIMIT 1`;
      if (!staff.length) return errorResponse('Invalid credentials', 401);

      const valid = await bcrypt.compare(password, staff[0].password_hash);
      if (!valid) return errorResponse('Invalid credentials', 401);

      await sql`UPDATE staff_accounts SET last_login = NOW() WHERE id = ${staff[0].id}`;

      const token = jwt.sign(
        { id: staff[0].id, email: staff[0].email, role: staff[0].role, name: staff[0].full_name },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Log activity
      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type) VALUES (${staff[0].id}, ${staff[0].full_name}, ${'Logged in'}, ${'auth'})`;

      return { statusCode: 200, headers, body: JSON.stringify({ token, staff: { id: staff[0].id, name: staff[0].full_name, email: staff[0].email, role: staff[0].role } }) };
    } catch (err) { 
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined }) };
    }
  }

  // VERIFY TOKEN
  if (action === 'verify' && event.httpMethod === 'GET') {
    const token = getAuthToken(event);
    if (!token) return errorResponse('No token', 401);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded) return errorResponse('Invalid token', 401);
    return response({ valid: true, staff: decoded });
  }

  // GET ALL STAFF (superadmin only)
  if (action === 'staff' && event.httpMethod === 'GET') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'superadmin') return errorResponse('Unauthorized', 401);

    const staff = await sql`SELECT id, full_name, email, role, is_active, last_login, created_at FROM staff_accounts ORDER BY created_at DESC`;
    return response(staff);
  }

  // CREATE STAFF (superadmin only)
  if (action === 'staff' && event.httpMethod === 'POST') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'superadmin') return errorResponse('Unauthorized', 401);

    const { full_name, email, password, role } = JSON.parse(event.body || '{}');
    if (!full_name || !email || !password || !role) return errorResponse('All fields required');
    if (!['superadmin', 'operations', 'finance'].includes(role)) return errorResponse('Invalid role. Must be superadmin, operations, or finance');

    const hash = await bcrypt.hash(password, 10);
    const existing = await sql`SELECT id FROM staff_accounts WHERE email = ${email}`;
    if (existing.length) return errorResponse('Email already exists');

    await sql`INSERT INTO staff_accounts (full_name, email, password_hash, role, created_by) VALUES (${full_name}, ${email}, ${hash}, ${role}, ${decoded.id})`;
    await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type) VALUES (${decoded.id}, ${decoded.name}, ${`Created staff account: ${email}`}, ${'staff'})`;
    return response({ success: true });
  }

  // UPDATE STAFF (superadmin only)
  if (action === 'staff-update' && event.httpMethod === 'POST') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'superadmin') return errorResponse('Unauthorized', 401);

    const { id, full_name, role, is_active, password } = JSON.parse(event.body || '{}');
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await sql`UPDATE staff_accounts SET full_name=${full_name}, role=${role}, is_active=${is_active}, password_hash=${hash}, updated_at=NOW() WHERE id=${id}`;
    } else {
      await sql`UPDATE staff_accounts SET full_name=${full_name}, role=${role}, is_active=${is_active}, updated_at=NOW() WHERE id=${id}`;
    }
    await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type) VALUES (${decoded.id}, ${decoded.name}, ${`Updated staff: ${full_name}`}, ${'staff'})`;
    return response({ success: true });
  }

  // DELETE STAFF (superadmin only)
  if (action === 'staff-delete' && event.httpMethod === 'POST') {
    const token = getAuthToken(event);
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'superadmin') return errorResponse('Unauthorized', 401);
    const { id } = JSON.parse(event.body || '{}');
    await sql`UPDATE staff_accounts SET is_active=false WHERE id=${id}`;
    return response({ success: true });
  }

  return errorResponse('Not found', 404);
};


