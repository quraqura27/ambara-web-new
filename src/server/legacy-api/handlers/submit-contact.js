const { getDB, response, errorResponse, optionsResponse, sendEmail } = require('../lib/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  const sql = getDB();
  const path = event.path;
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  try {
    // CONTACT FORM
    if (path.includes('submit-contact')) {
      const { name, company, email, phone, topic, message } = body;
      if (!name || !email || !topic || !message) return errorResponse('Missing required fields');

      await sql`INSERT INTO contact_messages (name, company, email, phone, topic, message, status, created_at) VALUES (${name}, ${company||''}, ${email}, ${phone||''}, ${topic}, ${message}, ${'unread'}, NOW())`;

      await sendEmail(process.env, email, '✅ Message Received — PT Ambara Artha Globaltrans',
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);padding:32px;border-radius:16px 16px 0 0;text-align:center">
            <div style="color:white;font-size:22px;font-weight:900">PT Ambara Artha Globaltrans</div>
          </div>
          <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef">
            <h2>Thank you, ${name}!</h2>
            <p>We've received your message and will reply within <strong>2 business hours</strong>.</p>
            <div style="background:#f4f6fb;padding:16px;border-radius:8px;margin:20px 0">
              <strong>Topic:</strong> ${topic}<br><strong>Message:</strong><br>${message}
            </div>
            <p>📞 Urgent? Call us: <strong>+62 821-2545-2800</strong><br>💬 WhatsApp: <a href="https://wa.me/6282125452800">wa.me/6282125452800</a></p>
          </div>
        </div>`);

      await sendEmail(process.env, process.env.EMAIL_TO || 'cs@ambaraartha.com', `📩 New Message: ${topic} — ${name}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h3>New Contact Message</h3>
          <p><strong>Name:</strong> ${name}<br><strong>Company:</strong> ${company||'—'}<br><strong>Email:</strong> ${email}<br><strong>Phone:</strong> ${phone||'—'}<br><strong>Topic:</strong> ${topic}</p>
          <div style="background:#f4f6fb;padding:16px;border-radius:8px">${message}</div>
          <p><a href="mailto:${email}" style="background:#1122EE;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:700">Reply →</a></p>
        </div>`);

      return response({ success: true });
    }

    // QUOTE FORM
    if (path.includes('submit-quote')) {
      const { freightType, origin, destination, readyDate, incoterms, cargoType, commodity, cargoDesc, weight, volume, packages, cargoValue, insurance, special, name, company, email, phone, notes } = body;
      if (!name || !email) return errorResponse('Missing required fields');

      const ref = 'AAG-Q-' + Date.now().toString().slice(-5);

      await sql`INSERT INTO quote_requests (reference_number, freight_type, origin, destination, ready_date, incoterms, cargo_description, weight_kg, volume_cbm, num_packages, cargo_value_usd, needs_insurance, special_requirements, contact_name, company_name, email, phone, notes, status, created_at) VALUES (${ref}, ${freightType||'air'}, ${origin||''}, ${destination||''}, ${readyDate||''}, ${incoterms||''}, ${cargoDesc||commodity||''}, ${weight||0}, ${volume||0}, ${packages||1}, ${cargoValue||0}, ${insurance||''}, ${special||''}, ${name}, ${company||''}, ${email}, ${phone||''}, ${notes||''}, ${'new'}, NOW())`;

      await sendEmail(process.env, email, `Quote Request Received — ${ref}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);padding:32px;border-radius:16px 16px 0 0;text-align:center">
            <div style="color:white;font-size:22px;font-weight:900">PT Ambara Artha Globaltrans</div>
          </div>
          <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef">
            <h2>✅ Quote Received!</h2>
            <p>Dear <strong>${name}</strong>, we'll get back to you within <strong>2 business hours</strong>.</p>
            <div style="background:#f4f6fb;padding:20px;border-radius:12px;margin:20px 0">
              <div style="font-size:24px;font-weight:900;color:#1122EE;font-family:monospace">${ref}</div>
              <p><strong>Route:</strong> ${origin} → ${destination}<br><strong>Cargo:</strong> ${cargoDesc||commodity}<br><strong>Weight:</strong> ${weight} kg</p>
            </div>
          </div>
        </div>`);

      await sendEmail(process.env, process.env.EMAIL_TO || 'cs@ambaraartha.com', `🆕 New Quote: ${ref} — ${company||name}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h3>New Quote Request: ${ref}</h3>
          <p><strong>Company:</strong> ${company||'—'}<br><strong>Contact:</strong> ${name} · ${email} · ${phone||'—'}<br><strong>Route:</strong> ${origin} → ${destination}<br><strong>Cargo:</strong> ${cargoDesc||commodity} · ${weight}kg<br><strong>Ready:</strong> ${readyDate}</p>
        </div>`);

      return response({ success: true, reference: ref });
    }

    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};


