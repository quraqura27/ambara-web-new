const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_FINANCE } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return v1Error('VALIDATION_ERROR', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_FINANCE);
  if (roleErr) return roleErr;

  const q = event.queryStringParameters?.q || '';
  const limit = Math.min(parseInt(event.queryStringParameters?.limit || '10'), 50);

  if (q.length < 2) return v1Error('VALIDATION_ERROR', 'Search query must be at least 2 characters', 400);

  try {
    const customers = await sql`
      SELECT id, COALESCE(company_name, full_name) as name,
             address_line1, address_line2, province_postal, npwp
      FROM customers
      WHERE LOWER(COALESCE(company_name, full_name, '')) LIKE LOWER(${'%' + q + '%'})
      ORDER BY COALESCE(company_name, full_name) ASC
      LIMIT ${limit}
    `;

    return v1Response({ data: customers, total: customers.length });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};
