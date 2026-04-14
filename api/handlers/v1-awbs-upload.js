const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_OPS } = require('../lib/db');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Carrier prefix lookup
const CARRIER_MAP = {
  '126': 'Garuda Indonesia', '888': 'Citilink', '975': 'AirAsia',
  '618': 'Singapore Airlines', '176': 'Emirates', '615': 'Sriwijaya Air',
  '797': 'Batik Air', '807': 'AirAsia', '832': 'TransNusa',
  '990': 'Lion Air', '995': 'Super Air Jet'
};

function extractAWBData(text) {
  const data = { awb_number: null, carrier: null, origin: null, destination: null, flight_number: null, shipment_date: null, pieces: null, chargeable_weight: null, commodity: null };

  const awbMatch = text.match(/(\d{3})[\s\-]*(\d{7,8})/);
  if (awbMatch) {
    data.awb_number = `${awbMatch[1]}-${awbMatch[2]}`;
    data.carrier = CARRIER_MAP[awbMatch[1]] || null;
  }

  // Origin
  const cgkMatch = text.match(/\b(CGK|JKT|SUB|DPS|UPG|MES|BPN|PLM|PDG|PKU|SOC|SRG|JOG)\b/);
  if (cgkMatch) data.origin = cgkMatch[1] === 'JKT' ? 'CGK' : cgkMatch[1];

  // Destination
  const destMatch = text.match(/(?:Airport of Destination|Routing and Destination)\s*\n?\s*([A-Z]{3})/i);
  if (destMatch) data.destination = destMatch[1];
  if (!data.destination) {
    const airportMatch = text.match(/([A-Z]{3})-[A-Z]{3,}/);
    if (airportMatch && airportMatch[1] !== data.origin) data.destination = airportMatch[1];
  }

  // Flight
  const flightMatch = text.match(/\b([A-Z]{2}[\-]?\d{3,4})\b/);
  if (flightMatch) data.flight_number = flightMatch[1];

  // Date  
  const dateMatch = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (dateMatch) {
    if (parseInt(dateMatch[1]) > 12) data.shipment_date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    else data.shipment_date = `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;
  }

  // Pieces
  const pcsMatch = text.match(/\n\s*(\d+)\s+[\d.]+\s+K/);
  if (pcsMatch) data.pieces = parseInt(pcsMatch[1]);

  // Chargeable weight
  const cwMatch = text.match(/Chargeable\s*(?:Weight)?\s*\n?\s*([\d,.]+)/i);
  if (cwMatch) data.chargeable_weight = parseFloat(cwMatch[1].replace(',', '.'));
  if (!data.chargeable_weight) {
    const cwMatch2 = text.match(/\d+\s+[\d.]+\s+K\s+N?\s+([\d.]+)/);
    if (cwMatch2) data.chargeable_weight = parseFloat(cwMatch2[1]);
  }

  // Commodity
  const commPatterns = ['YOGHURT', 'FRUITS', 'VEGETABLES', 'FRUITS,VEGETABLES', 'FRUITS, VEGETABLES', 'ELECTRONICS', 'TEXTILES', 'SPARE PARTS', 'DOCUMENTS', 'GARMENTS', 'HERBAL', 'CAPSULE', 'HERBAL EXTRACT'];
  for (const cp of commPatterns) {
    if (text.toUpperCase().includes(cp)) { data.commodity = cp; break; }
  }

  return data;
}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return v1Error('VALIDATION_ERROR', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_OPS);
  if (roleErr) return roleErr;

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return v1Error('VALIDATION_ERROR', 'Invalid JSON', 400); }

  const { customer_id, file_name, file_data } = body;
  if (!customer_id || !file_name || !file_data) return v1Error('VALIDATION_ERROR', 'customer_id, file_name, and file_data (base64) are required', 400);

  try {
    // Verify customer exists
    const customer = await sql`SELECT id FROM customers WHERE id = ${customer_id} LIMIT 1`;
    if (!customer.length) return v1Error('NOT_FOUND', 'Customer not found', 404);

    // Decode base64 PDF
    const pdfBuffer = Buffer.from(file_data, 'base64');
    if (pdfBuffer.length > 50 * 1024 * 1024) return v1Error('VALIDATION_ERROR', 'File too large (max 50MB)', 400);

    // Upload to R2 if configured
    let key = null;
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      try {
        const r2 = getR2Client();
        key = `awbs/${customer_id}/${Date.now()}-${file_name}`;
        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        }));
      } catch (err) {
        console.error("R2 Upload Error: ", err);
        // Continue parsing even if upload fails
      }
    } else {
      console.warn("R2 credentials missing. Skipping PDF upload, proceeding with parsing...");
    }

    // Attempt text extraction
    let extracted = { awb_number: null, carrier: null, origin: null, destination: null, flight_number: null, shipment_date: null, pieces: null, chargeable_weight: null, commodity: null };
    let parseStatus = 'failed';
    let rawText = '';

    try {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(pdfBuffer);
      rawText = pdfData.text;
      extracted = extractAWBData(rawText);
      const nonNullCount = Object.values(extracted).filter(v => v !== null).length;
      if (nonNullCount === 9) parseStatus = 'success';
      else if (nonNullCount >= 1) parseStatus = 'partial';
    } catch (parseErr) {
      console.error('PDF parse error:', parseErr.message);
    }

    // Check duplicate AWB number
    if (extracted.awb_number) {
      const dup = await sql`SELECT id FROM awbs WHERE customer_id = ${customer_id} AND awb_number = ${extracted.awb_number} LIMIT 1`;
      if (dup.length) {
        return v1Error('DUPLICATE_AWB', `AWB number ${extracted.awb_number} already exists for this customer`, 409);
      }
    }

    // Create AWB record
    const result = await sql`
      INSERT INTO awbs (customer_id, awb_number, carrier, origin, destination,
        flight_number, shipment_date, pieces, chargeable_weight, commodity,
        raw_pdf_url, parse_status, parse_raw_text, uploaded_by)
      VALUES (${customer_id}, ${extracted.awb_number}, ${extracted.carrier},
        ${extracted.origin}, ${extracted.destination},
        ${extracted.flight_number}, ${extracted.shipment_date},
        ${extracted.pieces}, ${extracted.chargeable_weight}, ${extracted.commodity},
        ${key}, ${parseStatus}, ${rawText.substring(0, 5000)}, ${decoded.id})
      RETURNING *
    `;

    // Create notification if parse failed
    if (parseStatus === 'failed') {
      await sql`INSERT INTO notifications (user_id, title, message, link)
        VALUES (${decoded.id}, ${'AWB Parse Failed'}, ${'AWB upload requires manual review — automatic data extraction failed. Please enter the details manually.'}, ${'/admin.html#awb-edit-' + result[0].id})`;
    }

    // Log activity
    await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id)
      VALUES (${decoded.id}, ${decoded.name}, ${'Uploaded AWB: ' + (extracted.awb_number || file_name)}, ${'awb'}, ${result[0].id.toString()})`;

    return v1Response({
      data: result[0],
      parse_status: parseStatus,
      extracted
    });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};


