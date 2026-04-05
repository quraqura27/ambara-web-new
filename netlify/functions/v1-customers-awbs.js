const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_FINANCE } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return v1Error('VALIDATION_ERROR', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_FINANCE);
  if (roleErr) return roleErr;

  const customerId = event.queryStringParameters?.customer_id;
  if (!customerId) return v1Error('VALIDATION_ERROR', 'customer_id is required', 400);

  const invoiced = event.queryStringParameters?.invoiced === 'true';
  const page = Math.max(1, parseInt(event.queryStringParameters?.page || '1'));
  const perPage = Math.min(Math.max(1, parseInt(event.queryStringParameters?.per_page || '50')), 100);
  const offset = (page - 1) * perPage;

  try {
    // Verify customer exists
    const customer = await sql`SELECT id FROM customers WHERE id = ${customerId} LIMIT 1`;
    if (!customer.length) return v1Error('NOT_FOUND', 'Customer not found', 404);

    const awbs = await sql`
      SELECT id, awb_number, carrier, origin, destination,
             flight_number, shipment_date, pieces, chargeable_weight,
             commodity, parse_status, invoiced, created_at
      FROM awbs
      WHERE customer_id = ${customerId}
        AND invoiced = ${invoiced}
        AND parse_status IN ('success', 'partial', 'manual')
      ORDER BY shipment_date DESC NULLS LAST, created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM awbs
      WHERE customer_id = ${customerId}
        AND invoiced = ${invoiced}
        AND parse_status IN ('success', 'partial', 'manual')
    `;
    const total = parseInt(countResult[0].total);

    return v1Response({
      data: awbs,
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage)
    });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};
