const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_OPS, ROLE_FINANCE } = require('../lib/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') return v1Error('VALIDATION_ERROR', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_OPS, ROLE_FINANCE);
  if (roleErr) return roleErr;

  const awbId = event.queryStringParameters?.id;
  if (!awbId) return v1Error('VALIDATION_ERROR', 'AWB id is required', 400);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return v1Error('VALIDATION_ERROR', 'Invalid JSON', 400); }

  const { awb_number, carrier, origin, destination, flight_number, shipment_date, pieces, chargeable_weight, commodity } = body;

  try {
    const awb = await sql`SELECT id, invoiced, customer_id FROM awbs WHERE id = ${awbId}::uuid LIMIT 1`;
    if (!awb.length) return v1Error('NOT_FOUND', 'AWB not found', 404);
    if (awb[0].invoiced) return v1Error('ALREADY_INVOICED', 'Cannot edit an invoiced AWB', 409);

    // Check unique awb_number per customer if awb_number provided
    if (awb_number) {
      const dup = await sql`SELECT id FROM awbs WHERE customer_id = ${awb[0].customer_id} AND awb_number = ${awb_number} AND id != ${awbId}::uuid LIMIT 1`;
      if (dup.length) return v1Error('DUPLICATE_AWB', 'AWB number already exists for this customer', 409);
    }

    await sql`
      UPDATE awbs SET
        awb_number = COALESCE(${awb_number || null}, awb_number),
        carrier = COALESCE(${carrier || null}, carrier),
        origin = COALESCE(${origin || null}, origin),
        destination = COALESCE(${destination || null}, destination),
        flight_number = COALESCE(${flight_number || null}, flight_number),
        shipment_date = COALESCE(${shipment_date || null}, shipment_date),
        pieces = COALESCE(${pieces ? parseInt(pieces) : null}, pieces),
        chargeable_weight = COALESCE(${chargeable_weight ? parseFloat(chargeable_weight) : null}, chargeable_weight),
        commodity = COALESCE(${commodity || null}, commodity),
        parse_status = 'manual',
        edited_by = ${decoded.id},
        edited_at = NOW(),
        updated_at = NOW()
      WHERE id = ${awbId}::uuid AND invoiced = FALSE
    `;

    return v1Response({ awb_id: awbId });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};


