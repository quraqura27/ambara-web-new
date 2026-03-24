const { getDB, response, errorResponse, optionsResponse, verifyToken, getAuthToken, generateCustomerId } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const sql = getDB();
  const token = getAuthToken(event);
  const decoded = verifyToken(token);
  if (!decoded) return errorResponse('Unauthorized', 401);

  const action = event.queryStringParameters?.action;
  const id = event.queryStringParameters?.id;
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch {} }

  try {
    // LIST customers
    if (event.httpMethod === 'GET' && !action) {
      const search = event.queryStringParameters?.search || '';
      const type = event.queryStringParameters?.type || '';
      const country = event.queryStringParameters?.country || '';

      let customers;
      if (search) {
        customers = await sql`SELECT c.*, COUNT(s.id) as shipment_count, MAX(s.created_at) as last_shipment FROM customers c LEFT JOIN shipments s ON s.customer_id = c.id WHERE (c.full_name ILIKE ${'%'+search+'%'} OR c.company_name ILIKE ${'%'+search+'%'} OR c.customer_id ILIKE ${'%'+search+'%'}) GROUP BY c.id ORDER BY c.created_at DESC LIMIT 50`;
      } else if (type && country) {
        customers = await sql`SELECT c.*, COUNT(s.id) as shipment_count FROM customers c LEFT JOIN shipments s ON s.customer_id = c.id WHERE c.type = ${type} AND c.country_code = ${country.toUpperCase()} GROUP BY c.id ORDER BY c.created_at DESC`;
      } else if (type) {
        customers = await sql`SELECT c.*, COUNT(s.id) as shipment_count FROM customers c LEFT JOIN shipments s ON s.customer_id = c.id WHERE c.type = ${type} GROUP BY c.id ORDER BY c.created_at DESC`;
      } else {
        customers = await sql`SELECT c.*, COUNT(s.id) as shipment_count, MAX(s.created_at) as last_shipment FROM customers c LEFT JOIN shipments s ON s.customer_id = c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`;
      }
      return response(customers);
    }

    // GET single customer
    if (event.httpMethod === 'GET' && id) {
      const customer = await sql`SELECT * FROM customers WHERE id = ${id} LIMIT 1`;
      if (!customer.length) return errorResponse('Customer not found', 404);
      const shipments = await sql`SELECT id, tracking_number, origin, destination, status, created_at FROM shipments WHERE customer_id = ${id} ORDER BY created_at DESC LIMIT 20`;
      return response({ ...customer[0], shipments });
    }

    // FUZZY MATCH check
    if (action === 'fuzzy-check' && event.httpMethod === 'GET') {
      const name = event.queryStringParameters?.name || '';
      const company = event.queryStringParameters?.company || '';
      const searchTerm = company || name;
      if (!searchTerm) return response([]);
      const matches = await sql`SELECT id, customer_id, type, full_name, company_name, country FROM customers WHERE full_name ILIKE ${'%'+searchTerm+'%'} OR company_name ILIKE ${'%'+searchTerm+'%'} LIMIT 5`;
      return response(matches);
    }

    // CREATE customer
    if (event.httpMethod === 'POST' && (!action || action === 'create')) {
      const { type, full_name, company_name, email, phone, address, country, country_code } = body;
      if (!type || !phone || !address || !country || !country_code) return errorResponse('Missing required fields');
      if (type === 'retail' && !full_name) return errorResponse('Full name required for retail customer');
      if (type === 'b2b' && !company_name) return errorResponse('Company name required for B2B customer');

      // Generate unique customer ID
      let customer_id, attempts = 0;
      do {
        customer_id = generateCustomerId(country_code);
        const existing = await sql`SELECT id FROM customers WHERE customer_id = ${customer_id}`;
        if (!existing.length) break;
        attempts++;
      } while (attempts < 10);

      const result = await sql`INSERT INTO customers (customer_id, type, full_name, company_name, email, phone, address, country, country_code) VALUES (${customer_id}, ${type}, ${full_name||null}, ${company_name||null}, ${email||null}, ${phone}, ${address}, ${country}, ${country_code.toUpperCase()}) RETURNING *`;

      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Created customer: ${customer_id}`}, ${'customer'}, ${customer_id})`;
      return response(result[0]);
    }

    // UPDATE customer
    if (event.httpMethod === 'POST' && action === 'update') {
      const { id: cid, type, full_name, company_name, email, phone, address, country, country_code } = body;
      await sql`UPDATE customers SET type=${type}, full_name=${full_name||null}, company_name=${company_name||null}, email=${email||null}, phone=${phone}, address=${address}, country=${country}, country_code=${country_code.toUpperCase()}, updated_at=NOW() WHERE id=${cid}`;
      await sql`INSERT INTO activity_log (staff_id, staff_name, action, entity_type, entity_id) VALUES (${decoded.id}, ${decoded.name}, ${`Updated customer: ${cid}`}, ${'customer'}, ${cid.toString()})`;
      return response({ success: true });
    }

    // DELETE customer
    if (event.httpMethod === 'POST' && action === 'delete') {
      const count = await sql`SELECT COUNT(*) as c FROM shipments WHERE customer_id = ${body.id}`;
      if (parseInt(count[0].c) > 0) return errorResponse('Cannot delete customer with existing shipments');
      await sql`DELETE FROM customers WHERE id = ${body.id}`;
      return response({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (err) { return errorResponse(err.message, 500); }
};
