const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_OPS } = require('./_db');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Carrier prefix lookup
const CARRIER_MAP = {
  '126': 'Garuda Indonesia', '888': 'Citilink', '975': 'AirAsia',
  '618': 'Singapore Airlines', '176': 'Emirates', '615': 'Sriwijaya Air',
  '797': 'Batik Air', '807': 'AirAsia', '832': 'TransNusa',
  '990': 'Lion Air', '995': 'Super Air Jet'
};

function extractAWBData(text) {
  const data = { awb_number: null, carrier: null, origin: null, destination: null, flight_number: null, shipment_date: null, pieces: null, chargeable_weight: null, commodity: null };

  // AWB Number: XXX-XXXXXXXX pattern
  const awbMatch = text.match(/(\d{3})[\s\-]*(\d{7,8})/);
  if (awbMatch) {
    data.awb_number = `${awbMatch[1]}-${awbMatch[2]}`;
    data.carrier = CARRIER_MAP[awbMatch[1]] || null;
  }

  // Origin airport (Airport of Departure line)
  const depMatch = text.match(/(?:Airport of Departure|SOEKARNO|CGK)[^\n]*\n?\s*([A-Z]{3})/i);
  if (!depMatch) {
    // Try to find "CGK" directly as origin
    const cgkMatch = text.match(/\b(CGK)\b/);
    if (cgkMatch) data.origin = 'CGK';
  } else {
    data.origin = depMatch[1];
  }
  // Fallback: look for explicit origin from departure line
  if (!data.origin) {
    const oriMatch = text.match(/(?:CGK|JKT|SUB|DPS|UPG|MES|BPN|PLM|PDG|PKU|SOC|SRG|JOG)/);
    if (oriMatch) data.origin = oriMatch[0];
  }

  // Destination airport
  const destMatch = text.match(/(?:Airport of Destination|Routing and Destination)\s*\n?\s*([A-Z]{3})/i);
  if (destMatch) data.destination = destMatch[1];
  if (!data.destination) {
    // Try "To" field followed by 3-letter code
    const toMatch = text.match(/\bTo\b[^\n]*?\b([A-Z]{3})\b/);
    if (toMatch && toMatch[1] !== data.origin) data.destination = toMatch[1];
  }
  if (!data.destination) {
    // Look for destination airport with full name e.g. "GTO-DJALALUDDIN"
    const airportMatch = text.match(/([A-Z]{3})-[A-Z]/);
    if (airportMatch && airportMatch[1] !== data.origin && airportMatch[1] !== 'CGK') data.destination = airportMatch[1];
  }

  // Flight number
  const flightMatch = text.match(/(?:Flight\s*[\/.]?\s*Date|Requested Flight)\s*\n?\s*([A-Z]{2}[\-\s]?\d{3,4})/i);
  if (flightMatch) data.flight_number = flightMatch[1].replace(/\s/g, '');
  if (!data.flight_number) {
    const fMatch = text.match(/\b([A-Z]{2}[\-]?\d{3,4})[\s\/]*\d{2}\s*[A-Z]/);
    if (fMatch) data.flight_number = fMatch[1];
  }

  // Shipment date
  const datePatterns = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,  // DD/MM/YYYY
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,  // YYYY-MM-DD  
    /(\d{2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})/i,
  ];
  for (const pat of datePatterns) {
    const m = text.match(pat);
    if (m) {
      try {
        if (m[2] && isNaN(m[2])) {
          // DD Mon YYYY
          const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
          const mon = months[m[2].toLowerCase().slice(0, 3)];
          data.shipment_date = `${m[3]}-${mon}-${m[1].padStart(2, '0')}`;
        } else if (m[1].length === 4) {
          data.shipment_date = `${m[1]}-${m[2]}-${m[3]}`;
        } else {
          // Assume DD/MM/YYYY
          data.shipment_date = `${m[3]}-${m[2]}-${m[1]}`;
        }
      } catch {}
      break;
    }
  }
  // Also try "Executed on" date
  if (!data.shipment_date) {
    const execMatch = text.match(/(?:Executed on|EXECUTED ON)\s*(?:\(date\))?\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i);
    if (execMatch) data.shipment_date = `${execMatch[3]}-${execMatch[2]}-${execMatch[1]}`;
  }

  // Pieces
  const pcsMatch = text.match(/(?:No\.?\s*of\s*Pieces|RCP)\s*\n?\s*(\d+)/i);
  if (pcsMatch) data.pieces = parseInt(pcsMatch[1]);
  if (!data.pieces) {
    // Look for number at start of cargo detail line
    const pcsMatch2 = text.match(/\n\s*(\d+)\s+[\d.]+\s+K/);
    if (pcsMatch2) data.pieces = parseInt(pcsMatch2[1]);
  }

  // Chargeable weight
  const cwMatch = text.match(/Chargeable\s*(?:Weight)?\s*\n?\s*([\d,.]+)/i);
  if (cwMatch) data.chargeable_weight = parseFloat(cwMatch[1].replace(',', '.'));
  if (!data.chargeable_weight) {
    // Pattern: number space K space N space number (from AWB table)
    const cwMatch2 = text.match(/\d+\s+[\d.]+\s+K\s+N?\s+([\d.]+)/);
    if (cwMatch2) data.chargeable_weight = parseFloat(cwMatch2[1]);
  }

  // Commodity
  const commMatch = text.match(/(?:Nature and Quantity|Nature \& Quantity|Goods)\s*(?:\(.*?\))?\s*\n?\s*([A-Z][A-Z\s,]+)/i);
  if (commMatch) {
    const comm = commMatch[1].trim().split('\n')[0].trim();
    if (comm.length > 2 && comm.length < 100) data.commodity = comm;
  }
  if (!data.commodity) {
    // Look for common commodities
    const commPatterns = ['YOGHURT', 'FRUITS', 'VEGETABLES', 'ELECTRONICS', 'TEXTILES', 'SPARE PARTS', 'DOCUMENTS', 'GARMENTS', 'HERBAL', 'CAPSULE'];
    for (const cp of commPatterns) {
      if (text.toUpperCase().includes(cp)) { data.commodity = cp; break; }
    }
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

  const awbId = event.queryStringParameters?.id;
  if (!awbId) return v1Error('VALIDATION_ERROR', 'AWB id is required', 400);

  try {
    const awb = await sql`SELECT id, invoiced, raw_pdf_url, customer_id FROM awbs WHERE id = ${awbId}::uuid LIMIT 1`;
    if (!awb.length) return v1Error('NOT_FOUND', 'AWB not found', 404);
    if (awb[0].invoiced) return v1Error('ALREADY_INVOICED', 'Cannot re-parse an invoiced AWB', 409);

    // Reset status
    await sql`UPDATE awbs SET parse_status = 'pending', updated_at = NOW() WHERE id = ${awbId}::uuid`;

    // Attempt to fetch and parse the PDF
    try {
      const r2 = getR2Client();
      let key = awb[0].raw_pdf_url;
      if (key.includes('.dev/')) key = key.split('.dev/')[1];

      const obj = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
      const chunks = [];
      for await (const chunk of obj.Body) chunks.push(chunk);
      const pdfBuffer = Buffer.concat(chunks);

      // Use pdf-parse to extract text
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;

      const extracted = extractAWBData(text);
      const nonNullCount = Object.values(extracted).filter(v => v !== null).length;
      let parseStatus = 'failed';
      if (nonNullCount === 9) parseStatus = 'success';
      else if (nonNullCount >= 1) parseStatus = 'partial';

      // Check for duplicate AWB number
      if (extracted.awb_number) {
        const dup = await sql`SELECT id FROM awbs WHERE customer_id = ${awb[0].customer_id} AND awb_number = ${extracted.awb_number} AND id != ${awbId}::uuid LIMIT 1`;
        if (dup.length) {
          parseStatus = 'failed';
          // Create notification for duplicate
          await sql`INSERT INTO notifications (user_id, title, message, link) VALUES (${decoded.id}, ${'Duplicate AWB Detected'}, ${'AWB number ' + extracted.awb_number + ' already exists for this customer.'}, ${'/admin.html#awb-edit-' + awbId})`;
        }
      }

      await sql`
        UPDATE awbs SET
          awb_number = COALESCE(${extracted.awb_number}, awb_number),
          carrier = COALESCE(${extracted.carrier}, carrier),
          origin = COALESCE(${extracted.origin}, origin),
          destination = COALESCE(${extracted.destination}, destination),
          flight_number = COALESCE(${extracted.flight_number}, flight_number),
          shipment_date = COALESCE(${extracted.shipment_date}, shipment_date),
          pieces = COALESCE(${extracted.pieces}, pieces),
          chargeable_weight = COALESCE(${extracted.chargeable_weight}, chargeable_weight),
          commodity = COALESCE(${extracted.commodity}, commodity),
          parse_status = ${parseStatus},
          parse_raw_text = ${text.substring(0, 5000)},
          updated_at = NOW()
        WHERE id = ${awbId}::uuid
      `;

      if (parseStatus === 'failed') {
        await sql`INSERT INTO notifications (user_id, title, message, link) VALUES (${decoded.id}, ${'AWB Parse Failed'}, ${'Automatic data extraction failed. Please enter the details manually.'}, ${'/admin.html#awb-edit-' + awbId})`;
      }

      return v1Response({ awb_id: awbId, parse_status: parseStatus, extracted }, 202);
    } catch (parseErr) {
      await sql`UPDATE awbs SET parse_status = 'failed', updated_at = NOW() WHERE id = ${awbId}::uuid`;
      await sql`INSERT INTO notifications (user_id, title, message, link) VALUES (${decoded.id}, ${'AWB Parse Failed'}, ${'Error during extraction: ' + parseErr.message}, ${'/admin.html#awb-edit-' + awbId})`;
      return v1Response({ awb_id: awbId, parse_status: 'failed', message: 'Parse job queued but extraction failed: ' + parseErr.message }, 202);
    }
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};

// Export for reuse in upload
module.exports.extractAWBData = extractAWBData;
module.exports.handler = exports.handler;
