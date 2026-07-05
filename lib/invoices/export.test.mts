import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInvoiceExportCsv,
  buildInvoiceExportFilename,
  canExportInvoices,
  parseInvoiceExportFilters,
  sanitizeInvoiceCsvCell,
} from "./export.ts";

test("validates default invoice export filters with last 90 day date range", () => {
  const result = parseInvoiceExportFilters(new URLSearchParams(), new Date(2026, 5, 15, 12));

  assert.deepEqual(result.errors, []);
  assert.equal(result.filters.scope, "summary");
  assert.equal(result.filters.format, "csv");
  assert.equal(result.filters.status, "all");
  assert.equal(result.filters.fromDate, "2026-03-17");
  assert.equal(result.filters.toDate, "2026-06-15");
});

test("rejects invalid invoice export filters", () => {
  const result = parseInvoiceExportFilters(
    new URLSearchParams({
      currency: "EUR",
      from_date: "2026-06-30",
      payment: "unknown",
      status: "missing",
      to_date: "2026-06-01",
    }),
  );

  assert.ok(result.errors.includes("Invalid invoice status."));
  assert.ok(result.errors.includes("Invalid currency."));
  assert.ok(result.errors.includes("Invalid payment filter."));
  assert.ok(result.errors.includes("From date must be before or equal to to date."));
});

test("builds invoice summary CSV with safe escaping", () => {
  const csv = buildInvoiceExportCsv(
    { scope: "summary" },
    [
      {
        bank_account: "OCBC",
        currency: "IDR",
        customer_code: "MEX",
        customer_name: "ACME, Indonesia",
        deductions: "0",
        due_date: "2026-07-05",
        effective_status: "sent",
        generated_at: "2026-07-04T00:00:00.000Z",
        generated_by: "Finance",
        invoice_date: "2026-07-04",
        invoice_number: "AAG/004/MEX/26",
        net_amount: "14200000",
        net_payable: "14072200",
        paid_at: "",
        payment_reference: "=IMPORTDATA(\"https://example.com\")",
        payment_terms: "CASH",
        pph_amount: "284000",
        sent_at: "2026-07-04T00:00:00.000Z",
        stored_status: "sent",
        subtotal: "14200000",
        total_due: "14356200",
        vat_amount: "156200",
      },
    ],
  );

  assert.match(csv, /^Invoice Number,Stored Status,Effective Status,/);
  assert.match(csv, /"ACME, Indonesia"/);
  assert.match(csv, /'=IMPORTDATA\(""https:\/\/example\.com""\)/);
});

test("builds invoice line CSV with flight and service fields", () => {
  const csv = buildInvoiceExportCsv(
    { scope: "lines" },
    [
      {
        awb_number: "618-55511153",
        chargeable_weight: "2000",
        currency: "IDR",
        customer_code: "MEX",
        customer_name: "PT Example",
        destination: "Taiwan",
        due_date: "2026-07-05",
        effective_status: "sent",
        flight_number: "SQ951/SQ878",
        invoice_date: "2026-07-04",
        invoice_number: "AAG/004/MEX/26",
        line_total: "14000000",
        line_type: "awb",
        origin: "Jakarta",
        paid_at: "",
        pieces: 50,
        price_per_kg: "7000",
        sent_at: "2026-07-04T00:00:00.000Z",
        service_description: "",
        shipment_date: "2026-07-03",
        stored_status: "sent",
      },
    ],
  );

  assert.match(csv, /^Invoice Number,Stored Status,Effective Status,/);
  assert.match(csv, /SQ951\/SQ878/);
  assert.match(csv, /618-55511153/);
});

test("protects invoice CSV cells from formula injection", () => {
  assert.equal(sanitizeInvoiceCsvCell("=HYPERLINK(\"https://example.com\")"), "'=HYPERLINK(\"https://example.com\")");
  assert.equal(sanitizeInvoiceCsvCell(" -SUM(1,2)"), "' -SUM(1,2)");
});

test("invoice export access is limited to finance and superadmin roles", () => {
  assert.equal(canExportInvoices({ role: "superadmin" }), true);
  assert.equal(canExportInvoices({ role: "finance" }), true);
  assert.equal(canExportInvoices({ role: "admin" }), false);
  assert.equal(canExportInvoices({ role: "operations" }), false);
  assert.equal(canExportInvoices({ role: "viewer" }), false);
});

test("builds invoice export filenames with scope and date range", () => {
  const filename = buildInvoiceExportFilename({
    format: "csv",
    fromDate: "2026-07-01",
    scope: "lines",
    toDate: "2026-07-31",
  });

  assert.equal(filename, "ambara_invoices_lines_2026-07-01_to_2026-07-31.csv");
});
