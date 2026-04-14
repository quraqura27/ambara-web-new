const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN } = require('../lib/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') return v1Error('VALIDATION_ERROR', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  // Admin ONLY
  const roleErr = requireRole(decoded, ROLE_ADMIN);
  if (roleErr) return roleErr;

  const awbId = event.queryStringParameters?.id;
  if (!awbId) return v1Error('VALIDATION_ERROR', 'AWB id is required', 400);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return v1Error('VALIDATION_ERROR', 'Invalid JSON', 400); }

  const { reason } = body;
  if (!reason || !reason.trim()) return v1Error('VALIDATION_ERROR', 'Reason is required', 400);

  try {
    const awb = await sql`SELECT id, invoiced, invoice_id FROM awbs WHERE id = ${awbId}::uuid LIMIT 1`;
    if (!awb.length) return v1Error('NOT_FOUND', 'AWB not found', 404);
    if (!awb[0].invoiced) return v1Error('VALIDATION_ERROR', 'AWB is not currently invoiced', 400);

    const previousInvoiceId = awb[0].invoice_id;

    await sql`UPDATE awbs SET invoiced = FALSE, invoice_id = NULL, updated_at = NOW() WHERE id = ${awbId}::uuid`;

    const auditResult = await sql`
      INSERT INTO invoice_audit_log (action, entity_type, entity_id, performed_by, metadata)
      VALUES ('AWB_UNMARKED', 'awb', ${awbId}, ${decoded.id},
        ${JSON.stringify({ reason, previous_invoice_id: previousInvoiceId })}::jsonb)
      RETURNING id
    `;

    return v1Response({ awb_id: awbId, audit_log_id: auditResult[0].id });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};


