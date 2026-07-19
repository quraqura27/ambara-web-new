import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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

test("generates a one-page flexible invoice with repeated shipment services", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 750_000,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      dueDate: "2026-07-20",
      formatVersion: 2,
      invoiceDate: "2026-07-06",
      invoiceNumber: "AAG/010/TST/26",
      netPayable: 750_000,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 0,
      status: "sent",
      subtotal: 750_000,
      total: 750_000,
      vatAmount: 0,
    },
    lines: [
      {
        awbNumber: null,
        billingBasis: "per_kg",
        chargeableWeight: 100,
        description: "Regulated Agent Service",
        destination: "CGK",
        flightNumber: null,
        flatAmount: null,
        id: "charge-1",
        lineTotal: 250_000,
        lineType: "service",
        origin: "HKG",
        pieces: 5,
        pricePerKg: 2500,
        reference: "AA26-TST-00000001-PTP",
        shipmentDate: "2026-07-05",
      },
      {
        awbNumber: null,
        billingBasis: "per_kg",
        chargeableWeight: 100,
        description: "Handling Service",
        destination: "CGK",
        flightNumber: null,
        flatAmount: null,
        id: "charge-2",
        lineTotal: 300_000,
        lineType: "service",
        origin: "HKG",
        pieces: 5,
        pricePerKg: 3000,
        reference: "AA26-TST-00000001-PTP",
        shipmentDate: "2026-07-05",
      },
      {
        awbNumber: null,
        billingBasis: "flat",
        chargeableWeight: null,
        description: "Documentation Service",
        destination: null,
        flightNumber: null,
        flatAmount: 200_000,
        id: "charge-3",
        lineTotal: 200_000,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: null,
        reference: "MANUAL-REF-001",
        shipmentDate: null,
      },
    ],
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);

  if (process.env.INVOICE_PDF_FIXTURE_DIR) {
    await mkdir(process.env.INVOICE_PDF_FIXTURE_DIR, { recursive: true });
    await writeFile(
      path.join(process.env.INVOICE_PDF_FIXTURE_DIR, "flexible-service-invoice.pdf"),
      pdf,
    );
  }

  assert.equal(Buffer.from(pdf).subarray(0, 4).toString(), "%PDF");
  assert.equal(document.getPageCount(), 1);
});

test("paginates flexible invoice rows with long service descriptions", async () => {
  const lines = Array.from({ length: 24 }, (_, index) => ({
    awbNumber: null,
    billingBasis: "per_kg",
    chargeableWeight: 100,
    description: `Regulated Agent and Special Handling Service ${index + 1} with additional documentation review`,
    destination: "CGK",
    flightNumber: "GA-TEST",
    flatAmount: null,
    id: `charge-${index + 1}`,
    lineTotal: 250_000,
    lineType: "service",
    origin: "HKG",
    pieces: 5,
    pricePerKg: 2500,
    reference: `AA26-TST-${String(index + 1).padStart(8, "0")}-PTP`,
    shipmentDate: "2026-07-05",
  }));
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 6_000_000,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      dueDate: "2026-07-20",
      formatVersion: 2,
      invoiceDate: "2026-07-06",
      invoiceNumber: "AAG/011/TST/26",
      netPayable: 6_000_000,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 0,
      status: "sent",
      subtotal: 6_000_000,
      total: 6_000_000,
      vatAmount: 0,
    },
    lines,
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);

  assert.ok(document.getPageCount() > 1);
});
