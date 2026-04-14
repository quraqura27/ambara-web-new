const { getDB, response, errorResponse, optionsResponse, verifyToken, getAuthToken } = require('../lib/db');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PDFDocument } = require('pdf-lib');

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function compressPDF(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false });
    const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
    // Return compressed if smaller
    return compressed.length < buffer.length ? Buffer.from(compressed) : buffer;
  } catch { return buffer; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const token = getAuthToken(event);
  const decoded = verifyToken(token);
  if (!decoded) return errorResponse('Unauthorized', 401);

  const action = event.queryStringParameters?.action;

  try {
    // UPLOAD document
    if (event.httpMethod === 'POST' && (!action || action === 'upload')) {
      const body = JSON.parse(event.body || '{}');
      const { shipment_id, doc_type, file_name, file_data } = body;

      if (!shipment_id || !doc_type || !file_name || !file_data) return errorResponse('Missing required fields');

      // Decode base64 PDF
      const buffer = Buffer.from(file_data, 'base64');
      if (buffer.length > 50 * 1024 * 1024) return errorResponse('File too large (max 50MB)');

      // Compress PDF
      const compressed = await compressPDF(buffer);
      const savings = Math.round((1 - compressed.length / buffer.length) * 100);

      // Upload to R2
      const r2 = getR2Client();
      const key = `documents/${shipment_id}/${Date.now()}-${file_name}`;

      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: compressed,
        ContentType: 'application/pdf',
        Metadata: { 'original-size': buffer.length.toString(), 'compressed-size': compressed.length.toString(), 'doc-type': doc_type }
      }));

      // Save internal R2 key to DB instead of public URL
      const result = await sql`INSERT INTO documents (shipment_id, doc_type, file_name, file_url, file_size, uploaded_by) VALUES (${shipment_id}, ${doc_type}, ${file_name}, ${key}, ${compressed.length}, ${decoded.id}) RETURNING *`;

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Uploaded document: ${file_name} (${savings}% compressed)`}, ${'document'}, ${shipment_id.toString()})`;

      // Generate immediate 1-hour presigned URL for the response
      const signedUrl = await getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }), { expiresIn: 3600 });
      const returnDoc = { ...result[0], file_url: signedUrl };

      return response({ ...returnDoc, compressed_savings: savings });
    }

    // LIST documents for shipment
    if (event.httpMethod === 'GET') {
      const shipment_id = event.queryStringParameters?.shipment_id;
      if (!shipment_id) return errorResponse('shipment_id required');
      const docs = await sql`SELECT * FROM documents WHERE shipment_id = ${shipment_id} ORDER BY uploaded_at DESC`;
      
      const r2 = getR2Client();
      const signedDocs = await Promise.all(docs.map(async (doc) => {
        let key = doc.file_url;
        // Legacy support: extract key if it's an old public URL
        if (key.includes('.dev/')) key = key.split('.dev/')[1];
        
        try {
          const signedUrl = await getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }), { expiresIn: 3600 });
          return { ...doc, file_url: signedUrl };
        } catch (e) { return doc; }
      }));

      return response(signedDocs);
    }

    // DELETE document
    if (action === 'delete' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const doc = await sql`SELECT * FROM documents WHERE id = ${body.id} LIMIT 1`;
      if (!doc.length) return errorResponse('Document not found', 404);

      // Delete from R2
      try {
        const r2 = getR2Client();
        let key = doc[0].file_url;
        if (key.includes('.dev/')) key = key.split('.dev/')[1];
        await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
      } catch (e) { console.error('R2 delete error:', e.message); }

      await sql`DELETE FROM documents WHERE id = ${body.id}`;
      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type) VALUES (${decoded.id}, ${decoded.name}, ${`Deleted document: ${doc[0].file_name}`}, ${'document'})`;
      return response({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};


