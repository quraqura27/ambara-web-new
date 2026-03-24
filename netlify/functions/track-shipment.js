const { getDB, response, errorResponse, optionsResponse } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const id = event.queryStringParameters?.id;
  if (!id) return errorResponse('Tracking number required');

  try {
    const shipment = await sql`SELECT s.*, c.full_name, c.company_name, c.type as customer_type FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.tracking_number = ${id.toUpperCase()} LIMIT 1`;
    if (!shipment.length) return errorResponse('Shipment not found', 404);

    const events = await sql`SELECT * FROM tracking_events WHERE shipment_id = ${shipment[0].id} ORDER BY event_time ASC`;
    const documents = await sql`SELECT id, doc_type, file_name, file_url, uploaded_at FROM documents WHERE shipment_id = ${shipment[0].id} ORDER BY uploaded_at DESC`;

    // Remove sensitive fields
    const { customer_email, consignee_phone, ...safeShipment } = shipment[0];

    return response({ shipment: safeShipment, events, documents });
  } catch (err) { return errorResponse(err.message, 500); }
};
