const { getDB, response, errorResponse, optionsResponse, verifyToken, getAuthToken } = require('../lib/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const path = event.path.replace('/.netlify/functions/content', '');
  const action = event.queryStringParameters?.action;
  const type = event.queryStringParameters?.type;
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch {} }

  try {
    // PUBLIC STATS (for homepage)
    if (type === 'stats' || action === 'stats') {
      const rows = await sql`SELECT status, weight_kg, is_damaged FROM shipments`;
      const totalKg = rows.reduce((s, r) => s + parseFloat(r.weight_kg || 0), 0);
      const delivered = rows.filter(s => s.status === 'delivered').length;
      const damaged = rows.filter(s => s.is_damaged).length;
      const onTimeRate = delivered > 0 ? Math.round((delivered - damaged) / delivered * 100) : 99;
      const customerCount = await sql`SELECT COUNT(*) as count FROM customers`;
      return response({ tonnage: totalKg.toFixed(1), on_time_rate: onTimeRate, countries: 52, customers: customerCount[0].count });
    }

    // TESTIMONIALS
    if (type === 'testimonials') {
      const testimonials = await sql`SELECT * FROM testimonials WHERE is_active = true ORDER BY sort_order ASC LIMIT 6`;
      return response(testimonials);
    }

    // PARTNERS
    if (type === 'partners') {
      const partners = await sql`SELECT * FROM partners WHERE is_active = true AND partner_type = 'partner' ORDER BY sort_order ASC`;
      const clients = await sql`SELECT * FROM partners WHERE is_active = true AND partner_type = 'client' ORDER BY sort_order ASC`;
      return response({ partners, clients });
    }

    // FAQ - PUBLIC
    if (type === 'faq') {
      const categories = await sql`SELECT * FROM faq_categories WHERE is_active = true ORDER BY sort_order ASC`;
      const items = await sql`SELECT * FROM faq_items WHERE is_active = true ORDER BY category_id, sort_order ASC`;
      return response({ categories, items });
    }

    // ANALYTICS (admin only)
    if (type === 'analytics') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      const range = event.queryStringParameters?.range || 'month'; // week, month, year, all
      let dateFilter = '';
      if (range === 'week') dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
      else if (range === 'month') dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
      else if (range === 'year') dateFilter = "AND created_at >= NOW() - INTERVAL '365 days'";

      const totalShipments = await sql`SELECT COUNT(*) as count FROM shipments`;
      const shipmentsByStatus = await sql`SELECT status, COUNT(*) as count FROM shipments GROUP BY status`;
      const popularRoutes = await sql`SELECT origin_iata, destination_iata, COUNT(*) as count FROM shipments WHERE origin_iata != '' AND destination_iata != '' GROUP BY origin_iata, destination_iata ORDER BY count DESC LIMIT 10`;
      const onTimeData = await sql`SELECT COUNT(*) as delivered, SUM(CASE WHEN is_damaged THEN 1 ELSE 0 END) as damaged FROM shipments WHERE status = 'delivered'`;
      const totalCustomers = await sql`SELECT COUNT(*) as count FROM customers`;
      const customersByType = await sql`SELECT type, COUNT(*) as count FROM customers GROUP BY type`;
      const customersByCountry = await sql`SELECT country, country_code, COUNT(*) as count FROM customers GROUP BY country, country_code ORDER BY count DESC LIMIT 10`;
      const totalWeight = await sql`SELECT SUM(weight_kg) as total FROM shipments`;
      const recentActivity = await sql`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20`;

      const onTime = onTimeData[0];
      const onTimeRate = onTime.delivered > 0 ? Math.round((onTime.delivered - onTime.damaged) / onTime.delivered * 100) : 100;

      return response({
        totalShipments: totalShipments[0].count,
        shipmentsByStatus,
        popularRoutes,
        onTimeRate,
        totalCustomers: totalCustomers[0].count,
        customersByType,
        customersByCountry,
        totalWeight: parseFloat(totalWeight[0].total || 0).toFixed(1),
        recentActivity
      });
    }

    // ADMIN: manage testimonials
    if (type === 'testimonial-manage') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      if (event.httpMethod === 'GET') {
        const items = await sql`SELECT * FROM testimonials ORDER BY sort_order ASC`;
        return response(items);
      }
      if (action === 'create') {
        const { client_name, company, country, quote_en, quote_id, sort_order } = body;
        await sql`INSERT INTO testimonials (client_name, company, country, quote_en, quote_id, sort_order) VALUES (${client_name}, ${company||''}, ${country||''}, ${quote_en}, ${quote_id}, ${sort_order||0})`;
        return response({ success: true });
      }
      if (action === 'update') {
        const { id, client_name, company, country, quote_en, quote_id, is_active, sort_order } = body;
        await sql`UPDATE testimonials SET client_name=${client_name}, company=${company||''}, country=${country||''}, quote_en=${quote_en}, quote_id=${quote_id}, is_active=${is_active}, sort_order=${sort_order||0}, updated_at=NOW() WHERE id=${id}`;
        return response({ success: true });
      }
      if (action === 'delete') {
        await sql`DELETE FROM testimonials WHERE id = ${body.id}`;
        return response({ success: true });
      }
    }

    // ADMIN: manage partners
    if (type === 'partner-manage') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      if (event.httpMethod === 'GET') {
        const items = await sql`SELECT * FROM partners ORDER BY partner_type, sort_order ASC`;
        return response(items);
      }
      if (action === 'create') {
        const { name, category, partner_type, country, logo_url, website_url, sort_order } = body;
        await sql`INSERT INTO partners (name, category, partner_type, country, logo_url, website_url, sort_order) VALUES (${name}, ${category}, ${partner_type}, ${country||''}, ${logo_url||null}, ${website_url||null}, ${sort_order||0})`;
        return response({ success: true });
      }
      if (action === 'update') {
        const { id, name, category, partner_type, country, logo_url, website_url, is_active, sort_order } = body;
        await sql`UPDATE partners SET name=${name}, category=${category}, partner_type=${partner_type}, country=${country||''}, logo_url=${logo_url||null}, website_url=${website_url||null}, is_active=${is_active}, sort_order=${sort_order||0} WHERE id=${id}`;
        return response({ success: true });
      }
      if (action === 'delete') {
        await sql`DELETE FROM partners WHERE id = ${body.id}`;
        return response({ success: true });
      }
    }

    // ADMIN: manage FAQ
    if (type === 'faq-manage') {
      const token = getAuthToken(event);
      const decoded = verifyToken(token);
      if (!decoded) return errorResponse('Unauthorized', 401);

      if (event.httpMethod === 'GET') {
        const categories = await sql`SELECT * FROM faq_categories ORDER BY sort_order ASC`;
        const items = await sql`SELECT * FROM faq_items ORDER BY category_id, sort_order ASC`;
        return response({ categories, items });
      }
      if (action === 'create-faq') {
        const { category_id, question_en, question_id, answer_en, answer_id, sort_order } = body;
        await sql`INSERT INTO faq_items (category_id, question_en, question_id, answer_en, answer_id, sort_order) VALUES (${category_id}, ${question_en}, ${question_id}, ${answer_en}, ${answer_id}, ${sort_order||0})`;
        return response({ success: true });
      }
      if (action === 'update-faq') {
        const { id, category_id, question_en, question_id, answer_en, answer_id, is_active, sort_order } = body;
        await sql`UPDATE faq_items SET category_id=${category_id}, question_en=${question_en}, question_id=${question_id}, answer_en=${answer_en}, answer_id=${answer_id}, is_active=${is_active}, sort_order=${sort_order||0}, updated_at=NOW() WHERE id=${id}`;
        return response({ success: true });
      }
      if (action === 'delete-faq') {
        await sql`DELETE FROM faq_items WHERE id = ${body.id}`;
        return response({ success: true });
      }
    }

    // PUBLIC STATS shortcut
    if (!type && !action) {
      const rows = await sql`SELECT status, weight_kg, is_damaged FROM shipments`;
      const totalKg = rows.reduce((s, r) => s + parseFloat(r.weight_kg || 0), 0);
      const delivered = rows.filter(s => s.status === 'delivered').length;
      const damaged = rows.filter(s => s.is_damaged).length;
      const onTimeRate = delivered > 0 ? Math.round((delivered - damaged) / delivered * 100) : 99;
      return response({ tonnage: totalKg.toFixed(1), on_time_rate: onTimeRate, countries: 52 });
    }

    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};


