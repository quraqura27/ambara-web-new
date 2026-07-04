import assert from "node:assert/strict";
import test from "node:test";

import { PDFDocument } from "pdf-lib";

import { generateInvoicePdf } from "./pdf.ts";

test("generates a PDF for manual service invoice lines", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 1_000_000,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY",
      customerNpwpSnapshot: null,
      dueDate: "2026-07-03",
      invoiceDate: "2026-07-03",
      invoiceNumber: "AAG/001/TST/26",
      netPayable: 1_000_000,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 0,
      status: "finalized",
      subtotal: 1_000_000,
      total: 1_000_000,
      vatAmount: 0,
    },
    lines: [
      {
        awbNumber: null,
        chargeableWeight: null,
        description: "TEST ONLY SERVICE",
        destination: null,
        flightNumber: null,
        id: "service-1",
        lineTotal: 1_000_000,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: null,
        shipmentDate: null,
      },
    ],
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });

  assert.equal(Buffer.from(pdf).subarray(0, 4).toString(), "%PDF");
});

test("keeps short VAT and PPh invoices on one page", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 14_356_200,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY ADDRESS LINE 1\nTEST ONLY ADDRESS LINE 2\nTEST ONLY ADDRESS LINE 3",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      dueDate: "2026-07-04",
      invoiceDate: "2026-07-04",
      invoiceNumber: "AAG/004/TST/26",
      netPayable: 14_072_200,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 284_000,
      status: "finalized",
      subtotal: 14_200_000,
      total: 14_200_000,
      vatAmount: 156_200,
    },
    lines: [
      {
        awbNumber: "618-00000000",
        chargeableWeight: 2000,
        description: null,
        destination: "Taiwan",
        flightNumber: "SQ0951|SQ0878",
        id: "awb-1",
        lineTotal: 14_000_000,
        lineType: "awb",
        origin: "Jakarta",
        pieces: 50,
        pricePerKg: 7000,
        shipmentDate: "2026-07-03",
      },
      {
        awbNumber: null,
        chargeableWeight: null,
        description: "Airport Handling",
        destination: null,
        flightNumber: null,
        id: "service-1",
        lineTotal: 200_000,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: null,
        shipmentDate: null,
      },
    ],
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);

  assert.equal(document.getPageCount(), 1);
});

test("keeps short full-payment invoices with terms on one page", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 6_350_000,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY ADDRESS LINE 1\nTEST ONLY ADDRESS LINE 2\nTEST ONLY ADDRESS LINE 3",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      dueDate: "2026-05-26",
      invoiceDate: "2026-05-26",
      invoiceNumber: "AAG/008/TST/26",
      netPayable: 6_350_000,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 0,
      showPaymentTerms: true,
      status: "finalized",
      subtotal: 6_350_000,
      total: 6_350_000,
      vatAmount: 0,
    },
    lines: [
      {
        awbNumber: "126-92180340",
        chargeableWeight: 1000,
        description: null,
        destination: "SIN",
        flightNumber: "GA824",
        id: "awb-1",
        lineTotal: 6_350_000,
        lineType: "awb",
        origin: "CGK",
        pieces: 49,
        pricePerKg: 6350,
        shipmentDate: "2026-05-26",
      },
    ],
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);

  assert.equal(document.getPageCount(), 1);
});
