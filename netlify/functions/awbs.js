const { getDB, optionsResponse, verifyToken, getAuthToken, errorResponse, response } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return errorResponse('Method not allowed', 405);

  const sql = getDB();
  const token = getAuthToken(event);
  const decoded = verifyToken(token);
  if (!decoded) return errorResponse('Unauthorized', 401);

  const search = event.queryStringParameters?.search || '';
  const status = event.queryStringParameters?.status || '';
  
  try {
    let awbs;
    if (search && status) {
      awbs = await sql`SELECT a.*, c.full_name as customer_name FROM awbs a LEFT JOIN customers c ON a.customer_id = c.id WHERE (c.full_name ILIKE ${'%'+search+'%'} OR c.company_name ILIKE ${'%'+search+'%'} OR a.awb_number ILIKE ${'%'+search+'%'}) AND a.parse_status = ${status} ORDER BY a.created_at DESC LIMIT 100`;
    } else if (search) {
      awbs = await sql`SELECT a.*, c.full_name as customer_name FROM awbs a LEFT JOIN customers c ON a.customer_id = c.id WHERE (c.full_name ILIKE ${'%'+search+'%'} OR c.company_name ILIKE ${'%'+search+'%'} OR a.awb_number ILIKE ${'%'+search+'%'}) ORDER BY a.created_at DESC LIMIT 100`;
    } else if (status) {
      awbs = await sql`SELECT a.*, c.full_name as customer_name FROM awbs a LEFT JOIN customers c ON a.customer_id = c.id WHERE a.parse_status = ${status} ORDER BY a.created_at DESC LIMIT 100`;
    } else {
      awbs = await sql`SELECT a.*, c.full_name as customer_name FROM awbs a LEFT JOIN customers c ON a.customer_id = c.id ORDER BY a.created_at DESC LIMIT 100`;
    }
    
    return response({ data: awbs });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
};
