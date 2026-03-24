const { getDB, response, errorResponse, optionsResponse, verifyToken, getAuthToken, generateTrackingNumber, sendEmail } = require('./_db');

const CARGO_TYPES = ['general', 'perishable', 'dangerous_goods', 'consolidated'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const action = event.queryStringParameters?.action;
  const id = event.queryStringParameters?.id;
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch {} }

  // PUBLIC: track shipment by tracking number
  if (event.httpMethod === 'GET' && action === 'track') {
    const trackingNumber = event.queryStringParameters?.id;
    if (!trackingNumber) return errorResponse('Tracking number required');
    try {
      const shipment = await sql`SELECT s.*, c.full_name, c.company_name, c.type as customer_type FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.tracking_number = ${trackingNumber.toUpperCase()} LIMIT 1`;
      if (!shipment.length) return errorResponse('Shipment not found', 404);
      const events = await sql`SELECT * FROM tracking_events WHERE shipment_id = ${shipment[0].id} ORDER BY event_time ASC`;
      const documents = await sql`SELECT id, doc_type, file_name, file_url, uploaded_at FROM documents WHERE shipment_id = ${shipment[0].id} ORDER BY uploaded_at DESC`;
      return response({ shipment: shipment[0], events, documents });
    } catch (err) { return errorResponse(err.message, 500); }
  }

  // All other actions require auth
  const token = getAuthToken(event);
  const decoded = verifyToken(token);
  if (!decoded) return errorResponse('Unauthorized', 401);

  try {
    // LIST shipments
    if (event.httpMethod === 'GET' && !action) {
      const status = event.queryStringParameters?.status;
      const search = event.queryStringParameters?.search || '';
      let shipments;
      if (search) {
        shipments = await sql`SELECT s.*, c.full_name, c.company_name FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.tracking_number ILIKE ${'%'+search+'%'} OR c.full_name ILIKE ${'%'+search+'%'} OR c.company_name ILIKE ${'%'+search+'%'} ORDER BY s.created_at DESC LIMIT 50`;
      } else if (status) {
        shipments = await sql`SELECT s.*, c.full_name, c.company_name FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.status = ${status} ORDER BY s.created_at DESC LIMIT 100`;
      } else {
        shipments = await sql`SELECT s.*, c.full_name, c.company_name FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id ORDER BY s.created_at DESC LIMIT 100`;
      }
      return response(shipments);
    }

    // GET single shipment
    if (event.httpMethod === 'GET' && id) {
      const shipment = await sql`SELECT s.*, c.full_name, c.company_name, c.email as customer_email, c.phone as customer_phone, c.type as customer_type, c.country as customer_country FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ${id} LIMIT 1`;
      if (!shipment.length) return errorResponse('Shipment not found', 404);
      const events = await sql`SELECT * FROM tracking_events WHERE shipment_id = ${id} ORDER BY event_time ASC`;
      const documents = await sql`SELECT * FROM documents WHERE shipment_id = ${id} ORDER BY uploaded_at DESC`;
      return response({ shipment: shipment[0], events, documents });
    }

    // CREATE shipment
    if (event.httpMethod === 'POST' && (!action || action === 'create')) {
      const { customer_id, origin, destination, origin_iata, destination_iata, cargo_type, commodity, weight_kg, chargeable_weight, total_pcs, title, airline, flight_number, notes } = body;
      if (!customer_id || !origin || !destination || !cargo_type) return errorResponse('Missing required fields');
      if (!CARGO_TYPES.includes(cargo_type)) return errorResponse('Invalid cargo type');

      // Get customer for tracking number generation
      const customer = await sql`SELECT * FROM customers WHERE id = ${customer_id} LIMIT 1`;
      if (!customer.length) return errorResponse('Customer not found');

      // Get numeric part of customer ID (e.g. ID-48291 → 48291)
      const numericPart = customer[0].customer_id.split('-')[1] || '00000';
      const trackingNumber = generateTrackingNumber(numericPart);

      const result = await sql`INSERT INTO shipments (tracking_number, customer_id, title, origin, destination, origin_iata, destination_iata, cargo_type, commodity, weight_kg, chargeable_weight, total_pcs, airline, flight_number, notes, status, created_by_staff) VALUES (${trackingNumber}, ${customer_id}, ${title||''}, ${origin}, ${destination}, ${origin_iata||''}, ${destination_iata||''}, ${cargo_type}, ${commodity||null}, ${weight_kg||0}, ${chargeable_weight||weight_kg||0}, ${total_pcs||1}, ${airline||null}, ${flight_number||null}, ${notes||null}, ${'pending'}, ${decoded.id}) RETURNING *`;

      // Add first tracking event
      await sql`INSERT INTO tracking_events (shipment_id, label, location, event_time, state) VALUES (${result[0].id}, ${'Shipment Created'}, ${origin}, NOW(), ${'done'})`;

      // Email customer if they have email
      const custEmail = customer[0].email;
      if (custEmail) {
        const name = customer[0].full_name || customer[0].company_name;
        await sendEmail(process.env, custEmail, `Shipment Created: ${trackingNumber}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);padding:32px;border-radius:16px 16px 0 0;text-align:center">
              <div style="color:white;font-size:22px;font-weight:900">PT Ambara Artha Globaltrans</div>
            </div>
            <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef">
              <h2>✅ Shipment Created!</h2>
              <p>Dear <strong>${name}</strong>,</p>
              <div style="background:#f4f6fb;padding:20px;border-radius:12px;margin:20px 0">
                <div style="font-size:28px;font-weight:900;color:#1122EE;font-family:monospace">${trackingNumber}</div>
                <p><strong>Route:</strong> ${origin} → ${destination}<br>
                <strong>Cargo:</strong> ${cargo_type.replace('_',' ')}${commodity?` · ${commodity}`:''}<br>
                <strong>Weight:</strong> ${weight_kg} kg · ${total_pcs} pcs</p>
              </div>
              <p>Track your shipment at <a href="https://ambaraartha.com/en/">ambaraartha.com</a></p>
            </div>
          </div>`);
      }

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Created shipment: ${trackingNumber}`}, ${'shipment'}, ${trackingNumber})`;
      return response(result[0]);
    }

    // UPDATE STATUS
    if (action === 'update-status' && event.httpMethod === 'POST') {
      const { id: sid, status } = body;
      await sql`UPDATE shipments SET status=${status}, updated_at=NOW(), updated_by_staff=${decoded.id} WHERE id=${sid}`;

      const shipment = await sql`SELECT s.*, c.email, c.full_name, c.company_name FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ${sid} LIMIT 1`;
      const s = shipment[0];

      // Email notification on key milestones
      const milestones = ['departed_origin', 'arrived_destination', 'delivered'];
      if (milestones.includes(status) && s.email) {
        const name = s.full_name || s.company_name;
        const statusLabels = { departed_origin: 'Departed Origin', arrived_destination: 'Arrived at Destination', delivered: 'Delivered ✅' };
        await sendEmail(process.env, [s.email, process.env.EMAIL_TO],
          `Shipment Update: ${s.tracking_number} — ${statusLabels[status]}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1122EE;padding:24px;border-radius:12px 12px 0 0;text-align:center;color:white;font-weight:900;font-size:18px">PT Ambara Artha Globaltrans</div>
            <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #dde2ef">
              <h2>${statusLabels[status]}</h2>
              <p>Dear <strong>${name}</strong>, your shipment <strong>${s.tracking_number}</strong> status has been updated.</p>
              <div style="background:#f4f6fb;padding:16px;border-radius:8px;margin:20px 0">
                <strong>Status:</strong> ${statusLabels[status]}<br>
                <strong>Route:</strong> ${s.origin} → ${s.destination}
              </div>
              <a href="https://ambaraartha.com/en/" style="background:#1122EE;color:white;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:700">Track Shipment →</a>
            </div>
          </div>`);
      }

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Updated status to: ${status}`}, ${'shipment'}, ${s.tracking_number})`;
      return response({ success: true });
    }

    // ADD TRACKING EVENT
    if (action === 'add-event' && event.httpMethod === 'POST') {
      const { shipment_id, label, location, event_time, state } = body;
      await sql`INSERT INTO tracking_events (shipment_id, label, location, event_time, state) VALUES (${shipment_id}, ${label}, ${location||''}, ${event_time||new Date().toISOString()}, ${state||'done'})`;
      await sql`UPDATE shipments SET updated_at=NOW() WHERE id=${shipment_id}`;

      const shipment = await sql`SELECT s.*, c.email, c.full_name, c.company_name FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ${shipment_id} LIMIT 1`;
      const s = shipment[0];
      const milestoneLabels = ['Departed', 'Arrived', 'Delivered', 'Cleared Customs'];
      const isMilestone = milestoneLabels.some(m => label.includes(m));
      if (isMilestone && s?.email) {
        const name = s.full_name || s.company_name;
        await sendEmail(process.env, [s.email, process.env.EMAIL_TO],
          `Update: ${s.tracking_number} — ${label}`,
          `<p>Dear <strong>${name}</strong>, new update for <strong>${s.tracking_number}</strong>:</p><p><strong>${label}</strong>${location ? ` at ${location}` : ''}</p><p><a href="https://ambaraartha.com/en/">Track at ambaraartha.com</a></p>`);
      }

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Added event: ${label}`}, ${'shipment'}, ${shipment_id.toString()})`;
      return response({ success: true });
    }

    // DELETE EVENT
    if (action === 'delete-event' && event.httpMethod === 'POST') {
      await sql`DELETE FROM tracking_events WHERE id = ${body.id}`;
      return response({ success: true });
    }

    // DELETE SHIPMENT
    if (action === 'delete' && event.httpMethod === 'POST') {
      if (decoded.role !== 'superadmin') return errorResponse('SuperAdmin only', 403);
      await sql`DELETE FROM tracking_events WHERE shipment_id = ${body.id}`;
      await sql`DELETE FROM documents WHERE shipment_id = ${body.id}`;
      await sql`DELETE FROM shipments WHERE id = ${body.id}`;
      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type) VALUES (${decoded.id}, ${decoded.name}, ${`Deleted shipment ID: ${body.id}`}, ${'shipment'})`;
      return response({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};
