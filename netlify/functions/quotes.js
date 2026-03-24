const { getDB, response, errorResponse, optionsResponse, verifyToken, getAuthToken } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  const sql = getDB();
  const token = getAuthToken(event);
  const decoded = verifyToken(token);
  if (!decoded) return errorResponse('Unauthorized', 401);

  const action = event.queryStringParameters?.action;
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch {} }

  try {
    if (event.httpMethod === 'GET') {
      const quotes = await sql`SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 100`;
      return response(quotes);
    }
    if (action === 'update-status') {
      await sql`UPDATE quote_requests SET status = ${body.status} WHERE id = ${body.id}`;
      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type) VALUES (${decoded.id}, ${decoded.name}, ${`Updated quote status: ${body.status}`}, ${'quote'})`;
      return response({ success: true });
    }
    if (action === 'messages') {
      const messages = await sql`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100`;
      return response(messages);
    }
    if (action === 'read-message') {
      await sql`UPDATE contact_messages SET status = 'read' WHERE id = ${body.id}`;
      return response({ success: true });
    }
    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};
