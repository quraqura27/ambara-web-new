import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateInvoiceTotals,
  buildInvoicePdfFilename,
  deriveCustomerCode,
  formatInvoiceNumber,
  invoiceBlocksLineReuse,
  invoiceEffectiveStatus,
  invoiceLineBillingBasis,
  invoiceLineReference,
  invoiceLineService,
  INVOICE_QR_STAMP_ISSUER_TEXT,
  INVOICE_QR_STAMP_TITLE,
  INVOICE_QR_STAMP_VALIDITY_TEXT,
  INVOICE_QR_STAMP_VERIFY_TEXT,
  invoiceSequenceFromNumber,
  invoiceStatusLabel,
  normalizeCustomerCode,
  normalizeInvoiceStatus,
  parseInvoiceSourceKey,
  resolveInvoiceReference,
  shouldPrintTermsOfPayment,
  terbilangRupiah,
  uniqueInvoiceSources,
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

test("calculates mixed per-kg and flat service charges", () => {
  const totals = calculateInvoiceTotals({
    lines: [
      {
        billingBasis: "per_kg",
        chargeableWeight: 100,
        type: "charge",
        unitRate: 2500,
      },
      {
        billingBasis: "flat",
        type: "charge",
        unitRate: 150000,
      },
    ],
  });

  assert.equal(totals.subtotal, 400_000);
  assert.equal(totals.amountDue, 400_000);
});

test("infers legacy invoice line display values", () => {
  assert.equal(invoiceLineBillingBasis({ lineType: "awb" }), "per_kg");
  assert.equal(invoiceLineBillingBasis({ lineType: "service" }), "flat");
  assert.equal(invoiceLineReference({ awbNumber: "126-12345678" }), "126-12345678");
  assert.equal(invoiceLineService({ lineType: "awb" }), "Air Freight");
});

test("groups repeated service charges by their underlying shipment source", () => {
  assert.deepEqual(
    uniqueInvoiceSources(["shipment:42", "shipment:42", "awb:test-awb", null]),
    [
      { sourceId: "42", sourceType: "shipment" },
      { sourceId: "test-awb", sourceType: "awb" },
    ],
  );
  assert.deepEqual(parseInvoiceSourceKey("shipment:42"), {
    sourceId: "42",
    sourceType: "shipment",
  });
});

test("uses the first available shipment reference without requiring an AWB", () => {
  assert.equal(resolveInvoiceReference({ awbNumber: "126-12345678", internalTrackingNumber: "AA26-TEST" }), "126-12345678");
  assert.equal(resolveInvoiceReference({ internalTrackingNumber: "AA26-TEST" }), "AA26-TEST");
  assert.equal(resolveInvoiceReference({ customerReference: "PO-100", trackingNumber: "TRACK-100" }), "PO-100");
  assert.equal(resolveInvoiceReference({ trackingNumber: "TRACK-100" }), "TRACK-100");
});

test("prints terms of payment only for full-payment invoices when enabled", () => {
  assert.equal(shouldPrintTermsOfPayment({ pphAmount: 0, showPaymentTerms: true }), true);
  assert.equal(shouldPrintTermsOfPayment({ pphAmount: 14_892, showPaymentTerms: true }), false);
  assert.equal(shouldPrintTermsOfPayment({ pphAmount: 0, showPaymentTerms: false }), false);
});

test("uses formal QR stamp wording", () => {
  assert.equal(INVOICE_QR_STAMP_TITLE, "System-Generated Commercial Invoice");
  assert.equal(INVOICE_QR_STAMP_VERIFY_TEXT, "Scan QR code to verify invoice authenticity");
  assert.equal(
    INVOICE_QR_STAMP_VALIDITY_TEXT,
    "This commercial invoice is system-generated and valid without wet signature.",
  );
  assert.equal(INVOICE_QR_STAMP_ISSUER_TEXT, "Issued by Finance Department");
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
