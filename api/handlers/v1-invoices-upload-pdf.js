const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_FINANCE } = require('../lib/db');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return v1Error('METHOD_NOT_ALLOWED', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_FINANCE);
  if (roleErr) return roleErr;

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return v1Error('VALIDATION_ERROR', 'Invalid JSON', 400); }

  const { invoice_id, file_name, file_data } = body;
  if (!invoice_id || !file_name || !file_data) return v1Error('VALIDATION_ERROR', 'invoice_id, file_name, and file_data (base64) are required', 400);

  try {
    // Verify invoice exists and get customer info
    const invoice = await sql`SELECT id, customer_id, invoice_number FROM invoices WHERE id = ${invoice_id}::uuid LIMIT 1`;
    if (!invoice.length) return v1Error('NOT_FOUND', 'Invoice not found', 404);

    const customerId = invoice[0].customer_id;
    const pdfBuffer = Buffer.from(file_data, 'base64');

    if (pdfBuffer.length > 50 * 1024 * 1024) return v1Error('VALIDATION_ERROR', 'File too large (max 50MB)', 400);

    // Upload to R2
    let r2Key = null;
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      const r2 = getR2Client();
      r2Key = `invoices/${customerId}/${Date.now()}-${file_name}`;
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }));
    }

    // Find one of the customer's shipments to link the document to
    // (since documents table requires shipment_id)
    const shipments = await sql`SELECT id FROM shipments WHERE customer_id = ${customerId} ORDER BY created_at DESC LIMIT 1`;
    
    if (shipments.length && r2Key) {
      // Store as a document linked to the customer's latest shipment
      await sql`
        INSERT INTO documents (shipment_id, doc_type, file_name, file_url, file_size, uploaded_by)
        VALUES (${shipments[0].id}, ${'invoice'}, ${file_name}, ${r2Key}, ${pdfBuffer.length}, ${decoded.id})
      `;
    }

    // Audit log
    await sql`
      INSERT INTO invoice_audit_log (action, entity_type, entity_id, performed_by, metadata)
      VALUES ('INVOICE_PDF_UPLOADED', 'invoice', ${invoice_id}, ${decoded.id},
        ${JSON.stringify({ file_name, r2_key: r2Key, file_size: pdfBuffer.length })}::jsonb)
    `;

    return v1Response({ uploaded: true, r2_key: r2Key });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};


