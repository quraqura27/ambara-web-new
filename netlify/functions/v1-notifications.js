const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_OPS, ROLE_FINANCE } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  if (!decoded) return v1Error('UNAUTHORIZED', 'No valid session', 401);

  const action = event.queryStringParameters?.action;

  try {
    // GET notifications
    if (event.httpMethod === 'GET' && !action) {
      const notifications = await sql`
        SELECT id, title, message, link, is_read, created_at
        FROM notifications
        WHERE user_id = ${decoded.id}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      const unreadCount = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${decoded.id} AND is_read = FALSE`;
      return v1Response({ data: notifications, unread_count: parseInt(unreadCount[0].count) });
    }

    // Mark single as read
    if ((event.httpMethod === 'PATCH' || event.httpMethod === 'POST') && action === 'read') {
      const id = event.queryStringParameters?.id;
      if (!id) return v1Error('VALIDATION_ERROR', 'Notification id required', 400);
      await sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id} AND user_id = ${decoded.id}`;
      return v1Response({ success: true });
    }

    // Mark all as read
    if ((event.httpMethod === 'PATCH' || event.httpMethod === 'POST') && action === 'read-all') {
      await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${decoded.id} AND is_read = FALSE`;
      return v1Response({ success: true });
    }

    return v1Error('NOT_FOUND', 'Endpoint not found', 404);
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};
