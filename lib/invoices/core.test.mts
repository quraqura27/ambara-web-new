import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateInvoiceTotals,
  deriveCustomerCode,
  formatInvoiceNumber,
  normalizeCustomerCode,
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

test("formats yearly global invoice numbers", () => {
  assert.equal(formatInvoiceNumber({ customerCode: "snb", sequence: 5, year: 2026 }), "AAG/005/SNB/26");
});

test("derives and normalizes customer codes", () => {
  assert.equal(deriveCustomerCode("PT Nur Infinit Indoalea Global"), "NIIG");
  assert.equal(normalizeCustomerCode(" snb-01 "), "SNB01");
});

test("formats terbilang rupiah", () => {
  assert.equal(terbilangRupiah(744600), "tujuh ratus empat puluh empat ribu enam ratus rupiah");
});
