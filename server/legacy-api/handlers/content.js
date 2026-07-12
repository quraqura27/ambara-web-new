const { getDB, response, errorResponse, optionsResponse } = require('../lib/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return errorResponse('Legacy content management is retired.', 410);

  const action = String(event.queryStringParameters?.action || '').trim().toLowerCase();
  const type = String(event.queryStringParameters?.type || '').trim().toLowerCase();
  const sql = getDB();

  try {
    if (type === 'stats' || action === 'stats' || (!type && !action)) {
      const rows = await sql`SELECT status, weight_kg, is_damaged FROM shipments WHERE voided_at IS NULL`;
      const totalKg = rows.reduce((sum, row) => sum + Number.parseFloat(row.weight_kg || 0), 0);
      const delivered = rows.filter((row) => row.status === 'delivered').length;
      const damaged = rows.filter((row) => row.is_damaged).length;
      const onTimeRate = delivered > 0 ? Math.round(((delivered - damaged) / delivered) * 100) : 99;
      const customerCount = await sql`SELECT COUNT(*)::int as count FROM customers WHERE archived_at IS NULL`;
      return response({
        countries: 52,
        customers: customerCount[0]?.count || 0,
        on_time_rate: onTimeRate,
        tonnage: totalKg.toFixed(1),
      });
    }
    if (type === 'testimonials') {
      return response(await sql`SELECT id, client_name, company, country, quote_en, quote_id FROM testimonials WHERE is_active = true ORDER BY sort_order ASC LIMIT 6`);
    }
    if (type === 'partners') {
      const partners = await sql`SELECT id, name, category, country, logo_url, website_url FROM partners WHERE is_active = true AND partner_type = 'partner' ORDER BY sort_order ASC`;
      const clients = await sql`SELECT id, name, category, country, logo_url, website_url FROM partners WHERE is_active = true AND partner_type = 'client' ORDER BY sort_order ASC`;
      return response({ clients, partners });
    }
    if (type === 'faq') {
      const categories = await sql`SELECT id, name_en, name_id FROM faq_categories WHERE is_active = true ORDER BY sort_order ASC`;
      const items = await sql`SELECT id, category_id, question_en, question_id, answer_en, answer_id FROM faq_items WHERE is_active = true ORDER BY category_id, sort_order ASC`;
      return response({ categories, items });
    }
    return errorResponse('Not found', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Content request failed', 500);
  }
};
