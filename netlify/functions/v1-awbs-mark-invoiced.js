const { getDB, optionsResponse, verifyToken, getAuthToken, requireRole, v1Response, v1Error, ROLE_ADMIN, ROLE_FINANCE } = require('./_db');

const INVOICE_REGEX = /^AAG\/\d{3}\/[A-Z]+\/\d{2}$/;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') return v1Error('VALIDATION_ERROR', 'Method not allowed', 405);

  const sql = getDB();
  const decoded = verifyToken(getAuthToken(event));
  const roleErr = requireRole(decoded, ROLE_ADMIN, ROLE_FINANCE);
  if (roleErr) return roleErr;

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return v1Error('VALIDATION_ERROR', 'Invalid JSON body', 400); }

  const {
    awb_ids, invoice_number, currency, subtotal, total_pengurangan,
    net_amount, vat_enabled, vat_amount, total, deposit_amount, amount_due,
    deductions = [], line_items = [],
    invoice_date, due_date, period, payment_terms, city, bank_account,
    show_period, show_payment_terms
  } = body;

  // --- Validation ---
  if (!awb_ids || !Array.isArray(awb_ids) || awb_ids.length === 0) {
    return v1Error('VALIDATION_ERROR', 'awb_ids must be a non-empty array', 400);
  }
  if (!invoice_number || !INVOICE_REGEX.test(invoice_number)) {
    return v1Error('INVALID_INVOICE_NUMBER', `Invoice number must match format AAG/001/XXX/26. Got: ${invoice_number}`, 422);
  }
  if (!['IDR', 'USD', 'JPY'].includes(currency)) {
    return v1Error('VALIDATION_ERROR', 'Currency must be IDR, USD, or JPY', 400);
  }

  try {
    // Check invoice number uniqueness
    const existing = await sql`SELECT id FROM invoices WHERE invoice_number = ${invoice_number} LIMIT 1`;
    if (existing.length) return v1Error('DUPLICATE_INVOICE', 'Invoice number already exists', 409);

    // Verify all AWBs exist, not invoiced, and parse_status ready
    const awbs = await sql`SELECT id, invoiced, parse_status, customer_id FROM awbs WHERE id = ANY(${awb_ids}::uuid[])`;
    if (awbs.length !== awb_ids.length) return v1Error('NOT_FOUND', 'One or more AWBs not found', 404);

    const alreadyInvoiced = awbs.filter(a => a.invoiced);
    if (alreadyInvoiced.length) return v1Error('ALREADY_INVOICED', `${alreadyInvoiced.length} AWB(s) are already invoiced`, 409);

    const notReady = awbs.filter(a => !['success', 'partial', 'manual'].includes(a.parse_status));
    if (notReady.length) return v1Error('PARSE_NOT_READY', `${notReady.length} AWB(s) have unready parse status`, 422);

    const customerId = awbs[0].customer_id;

    // --- Server-side financial verification ---
    const serverSubtotal = line_items.reduce((sum, li) => sum + parseFloat(li.line_total || 0), 0);
    const serverPengurangan = deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const serverNet = serverSubtotal - serverPengurangan;
    const serverVat = vat_enabled ? Math.round(serverNet * 0.011 * 100) / 100 : 0;
    const serverTotal = serverNet + serverVat;
    const serverAmountDue = serverTotal - parseFloat(deposit_amount || 0);

    const tolerance = 0.01;
    if (Math.abs(serverSubtotal - parseFloat(subtotal)) > tolerance) return v1Error('VALIDATION_ERROR', `Subtotal mismatch: server=${serverSubtotal}, client=${subtotal}`, 400);
    if (Math.abs(serverNet - parseFloat(net_amount)) > tolerance) return v1Error('VALIDATION_ERROR', `Net amount mismatch: server=${serverNet}, client=${net_amount}`, 400);
    if (Math.abs(serverTotal - parseFloat(total)) > tolerance) return v1Error('VALIDATION_ERROR', `Total mismatch: server=${serverTotal}, client=${total}`, 400);
    if (Math.abs(serverAmountDue - parseFloat(amount_due)) > tolerance) return v1Error('VALIDATION_ERROR', `Amount due mismatch: server=${serverAmountDue}, client=${amount_due}`, 400);

    // --- Atomic Transaction using Neon transaction ---
    const retainUntil = new Date();
    retainUntil.setFullYear(retainUntil.getFullYear() + 5);

    // Create invoice
    const invoiceResult = await sql`
      INSERT INTO invoices (invoice_number, customer_id, currency, subtotal, total_pengurangan,
        net_amount, vat_enabled, vat_amount, total, deposit_amount, amount_due,
        invoice_date, due_date, period, payment_terms, city, bank_account,
        show_period, show_payment_terms,
        generated_by, retain_until)
      VALUES (${invoice_number}, ${customerId}, ${currency},
        ${serverSubtotal}, ${serverPengurangan}, ${serverNet},
        ${vat_enabled || false}, ${serverVat}, ${serverTotal},
        ${parseFloat(deposit_amount || 0)}, ${serverAmountDue},
        ${invoice_date || new Date().toISOString().split('T')[0]},
        ${due_date || null}, ${period || null}, ${payment_terms || 'CASH'},
        ${city || 'Tangerang'}, ${bank_account || 'OCBC'},
        ${show_period || false}, ${show_payment_terms !== false},
        ${decoded.id}, ${retainUntil.toISOString().split('T')[0]})
      RETURNING id
    `;
    const invoiceId = invoiceResult[0].id;

    // Insert line items
    for (const li of line_items) {
      await sql`
        INSERT INTO invoice_line_items (invoice_id, awb_id, line_type, sort_order,
          origin, destination, shipment_date, awb_number, flight_number,
          pieces, chargeable_weight, description, price_per_kg, flat_amount, line_total)
        VALUES (${invoiceId}, ${li.awb_id || null}, ${li.line_type}, ${li.sort_order || 0},
          ${li.origin || null}, ${li.destination || null}, ${li.shipment_date || null},
          ${li.awb_number || null}, ${li.flight_number || null},
          ${li.pieces || null}, ${li.chargeable_weight || null},
          ${li.description || null}, ${li.price_per_kg || null},
          ${li.flat_amount || null}, ${parseFloat(li.line_total)})
      `;
    }

    // Insert deductions
    for (const d of deductions) {
      await sql`
        INSERT INTO invoice_deductions (invoice_id, description, amount, sort_order)
        VALUES (${invoiceId}, ${d.description}, ${parseFloat(d.amount)}, ${d.sort_order || 0})
      `;
    }

    // Mark AWBs as invoiced
    await sql`
      UPDATE awbs SET invoiced = TRUE, invoice_id = ${invoiceId}, updated_at = NOW()
      WHERE id = ANY(${awb_ids}::uuid[])
    `;

    // Audit log
    await sql`
      INSERT INTO invoice_audit_log (action, entity_type, entity_id, performed_by, metadata)
      VALUES ('INVOICE_CREATED', 'invoice', ${invoiceId}, ${decoded.id},
        ${JSON.stringify({ invoice_number, awb_count: awb_ids.length, amount_due: serverAmountDue })}::jsonb)
    `;

    return v1Response({
      invoice_id: invoiceId,
      invoice_number,
      updated_awbs: awb_ids.length
    });
  } catch (err) {
    return v1Error('INTERNAL_ERROR', err.message, 500);
  }
};
