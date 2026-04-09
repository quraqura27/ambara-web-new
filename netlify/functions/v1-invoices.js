const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, parsePathParam, ROLE_ADMIN, ROLE_FINANCE } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return v1Error('METHOD_NOT_ALLOWED', 'Method not allowed', 405);

  const sql = getDB();
  const token = getAuthToken(event);
  const decoded = verifyToken(token);
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_FINANCE);
  if (roleErr) return roleErr;

  const invoiceId = parsePathParam(event, 'v1-invoices');
  const search = event.queryStringParameters?.search || '';
  const customerId = event.queryStringParameters?.customer_id;
  const isAudit = event.queryStringParameters?.audit === 'true';

  try {
    // FINANCE AUDIT LOG — restricted to superadmin + finance
    if (isAudit) {
      const logs = await sql`
        SELECT a.*, s.name as staff_name, s.role as staff_role
        FROM invoice_audit_log a
        LEFT JOIN staff_accounts s ON a.performed_by = s.id
        ORDER BY a.performed_at DESC
        LIMIT 200
      `;
      return v1Response({ data: logs });
    }
    if (invoiceId && invoiceId.length > 30) { // Likely a UUID
      // Get single invoice detail
      const invoices = await sql`
        SELECT i.*, c.full_name as customer_name, c.company_name, c.customer_id as customer_number
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ${invoiceId}::uuid
      `;
      
      if (!invoices.length) return v1Error('NOT_FOUND', 'Invoice not found', 404);
      
      const invoice = invoices[0];
      const lineItems = await sql`SELECT * FROM invoice_line_items WHERE invoice_id = ${invoiceId}::uuid ORDER BY sort_order ASC`;
      const deductions = await sql`SELECT * FROM invoice_deductions WHERE invoice_id = ${invoiceId}::uuid ORDER BY sort_order ASC`;
      
      return v1Response({ data: { ...invoice, line_items: lineItems, deductions: deductions } });
    } else {
      // List invoices
      let query;
      if (customerId) {
        query = sql`
          SELECT i.*, c.full_name as customer_name, c.company_name
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          WHERE i.customer_id = ${customerId}
          ORDER BY i.created_at DESC
        `;
      } else if (search) {
        query = sql`
          SELECT i.*, c.full_name as customer_name, c.company_name
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          WHERE (i.invoice_number ILIKE ${'%'+search+'%'} OR c.full_name ILIKE ${'%'+search+'%'} OR c.company_name ILIKE ${'%'+search+'%'})
          ORDER BY i.created_at DESC
          LIMIT 100
        `;
      } else {
        query = sql`
          SELECT i.*, c.full_name as customer_name, c.company_name
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          ORDER BY i.created_at DESC
          LIMIT 100
        `;
      }
      
      const results = await query;
      return v1Response({ data: results });
    }
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};
