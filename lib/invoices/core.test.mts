import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateInvoiceTotals,
  buildInvoicePdfFilename,
  deriveCustomerCode,
  formatInvoiceNumber,
  invoiceBlocksLineReuse,
  invoiceEffectiveStatus,
  invoiceSequenceFromNumber,
  invoiceStatusLabel,
  normalizeCustomerCode,
  normalizeInvoiceStatus,
  shouldPrintTermsOfPayment,
  terbilangRupiah,
} from "./core.ts";

test("calculates a full-payment invoice without PPh withholding", () => {
  const totals = calculateInvoiceTotals({
    lines: [{ type: "awb", chargeableWeight: 1000, pricePerKg: 6350 }],
  });

  assert.equal(totals.subtotal, 6_350_000);
  assert.equal(totals.amountDue, 6_350_000);
  assert.equal(totals.pphAmount, 0);
  assert.equal(totals.netPayable, 6_350_000);
});

test("calculates PPh 23 withholding from net amount excluding VAT by default", () => {
  const totals = calculateInvoiceTotals({
    lines: [{ type: "awb", chargeableWeight: 146, pricePerKg: 5100 }],
    pphEnabled: true,
    vatEnabled: true,
  });

  assert.equal(totals.subtotal, 744_600);
  assert.equal(totals.vatAmount, 8190.6);
  assert.equal(totals.pphBaseAmount, 744_600);
  assert.equal(totals.pphAmount, 14_892);
  assert.equal(totals.netPayable, 737_898.6);
});

test("prints terms of payment only for full-payment invoices when enabled", () => {
  assert.equal(shouldPrintTermsOfPayment({ pphAmount: 0, showPaymentTerms: true }), true);
  assert.equal(shouldPrintTermsOfPayment({ pphAmount: 14_892, showPaymentTerms: true }), false);
  assert.equal(shouldPrintTermsOfPayment({ pphAmount: 0, showPaymentTerms: false }), false);
});

test("formats yearly global invoice numbers", () => {
  assert.equal(formatInvoiceNumber({ customerCode: "snb", sequence: 5, year: 2026 }), "AAG/005/SNB/26");
});

test("normalizes stored invoice statuses and computes overdue display status", () => {
  assert.equal(normalizeInvoiceStatus("finalized"), "sent");
  assert.equal(normalizeInvoiceStatus("paid"), "paid");
  assert.equal(normalizeInvoiceStatus("unexpected"), "sent");
  assert.equal(
    invoiceEffectiveStatus({ dueDate: "2026-07-03", paidAt: null, status: "sent" }, "2026-07-04"),
    "overdue",
  );
  assert.equal(
    invoiceEffectiveStatus({ dueDate: "2026-07-03", paidAt: new Date("2026-07-04T00:00:00Z"), status: "paid" }, "2026-07-05"),
    "paid",
  );
  assert.equal(
    invoiceEffectiveStatus({ dueDate: "2026-07-03", paidAt: null, status: "draft" }, "2026-07-04"),
    "draft",
  );
  assert.equal(invoiceStatusLabel("overdue"), "Overdue");
});

test("only voided invoices release line reuse", () => {
  assert.equal(invoiceBlocksLineReuse("draft"), true);
  assert.equal(invoiceBlocksLineReuse("sent"), true);
  assert.equal(invoiceBlocksLineReuse("archived"), true);
  assert.equal(invoiceBlocksLineReuse("voided"), false);
});

test("derives and normalizes customer codes", () => {
  assert.equal(deriveCustomerCode("PT Nur Infinit Indoalea Global"), "NII");
  assert.equal(normalizeCustomerCode(" snb-01 "), "SNB");
  assert.equal(normalizeCustomerCode("AB"), "");
});

test("builds invoice PDF filenames from date, customer code, and sequence", () => {
  assert.equal(invoiceSequenceFromNumber("AAG/002/NII/26"), "002");
  assert.equal(
    buildInvoicePdfFilename({
      customerCode: "NII",
      customerName: "PT Nur Infinit Indoalea Global",
      invoiceDate: "2026-07-03",
      invoiceNumber: "AAG/002/NII/26",
    }),
    "20260703_NII_002.pdf",
  );
});

test("formats terbilang rupiah", () => {
  assert.equal(terbilangRupiah(744600), "tujuh ratus empat puluh empat ribu enam ratus rupiah");
});
