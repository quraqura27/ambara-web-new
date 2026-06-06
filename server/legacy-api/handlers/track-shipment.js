const { getDB, response, errorResponse, optionsResponse } = require('../lib/db');
const { toPublicTrackingResponse } = require('../lib/public-tracking');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const id = event.queryStringParameters?.id;
  if (!id) return errorResponse('Tracking number required');

  try {
    const normalizedTrackingNumber = id.toUpperCase();
    const shipment = await sql`SELECT s.*, c.full_name, c.company_name, c.type as customer_type FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.tracking_number = ${normalizedTrackingNumber} OR s.internal_tracking_no = ${normalizedTrackingNumber} LIMIT 1`;
    if (!shipment.length) return errorResponse('Shipment not found', 404);

    const events = await sql`SELECT * FROM tracking_events WHERE shipment_id = ${shipment[0].id} ORDER BY event_time ASC`;
    return response(toPublicTrackingResponse(shipment[0], events));
  } catch (err) { return errorResponse(err.message, 500); }
};


