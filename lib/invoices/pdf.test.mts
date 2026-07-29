import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { generateInvoicePdf } from "./pdf.ts";

async function getPdfPageTextItems(pdf: Uint8Array, pageNumber = 1) {
  const parsedPdf = await getDocument({
    data: new Uint8Array(pdf),
    disableFontFace: true,
    useSystemFonts: true,
  }).promise;
  const parsedPage = await parsedPdf.getPage(pageNumber);
  const textContent = await parsedPage.getTextContent();
  const textItems = textContent.items.filter(
    (item): item is Extract<(typeof textContent.items)[number], { str: string }> => "str" in item,
  );
  await parsedPdf.destroy();
  return textItems;
}

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
      depositAmount: 0,
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

  const textItems = await getPdfPageTextItems(pdf);
  assert.equal(Buffer.from(pdf).subarray(0, 4).toString(), "%PDF");
  assert.equal(textItems.some((item) => item.str === "Deposit"), false);
});

test("keeps short VAT, deposit, and PPh invoices on one page", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 13_356_200,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY ADDRESS LINE 1\nTEST ONLY ADDRESS LINE 2\nTEST ONLY ADDRESS LINE 3",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      depositAmount: 1_000_000,
      dueDate: "2026-07-04",
      invoiceDate: "2026-07-04",
      invoiceNumber: "AAG/004/TST/26",
      netPayable: 13_072_200,
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
      depositAmount: 0,
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

test("renders an upfront deposit before total due on a flexible invoice", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 18_655_814,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      depositAmount: 25_000_000,
      dueDate: "2026-07-30",
      formatVersion: 2,
      invoiceDate: "2026-07-30",
      invoiceNumber: "AAG/076/TST/26",
      netPayable: 18_655_814,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 0,
      status: "sent",
      subtotal: 43_655_814,
      total: 43_655_814,
      vatAmount: 0,
    },
    lines: [
      {
        awbNumber: "999-00000000",
        billingBasis: "per_kg",
        chargeableWeight: 153,
        description: "TEST ONLY AIR FREIGHT",
        destination: "Jakarta",
        flightNumber: "TEST",
        flatAmount: null,
        id: "charge-1",
        lineTotal: 27_693_000,
        lineType: "service",
        origin: "Beijing",
        pieces: 18,
        pricePerKg: 181_000,
        reference: "999-00000000",
        shipmentDate: "2026-07-22",
      },
      {
        awbNumber: "999-00000000",
        billingBasis: "flat",
        chargeableWeight: null,
        description: "TEST ONLY DUTY AND TAX",
        destination: null,
        flightNumber: null,
        flatAmount: 13_162_814,
        id: "charge-2",
        lineTotal: 13_162_814,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: null,
        reference: "999-00000000",
        shipmentDate: null,
      },
      {
        awbNumber: "999-00000000",
        billingBasis: "flat",
        chargeableWeight: null,
        description: "TEST ONLY CUSTOMS INSPECTION",
        destination: null,
        flightNumber: null,
        flatAmount: 2_800_000,
        id: "charge-3",
        lineTotal: 2_800_000,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: null,
        reference: "999-00000000",
        shipmentDate: null,
      },
    ],
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);
  const textItems = await getPdfPageTextItems(pdf);
  const subtotal = textItems.find((item) => item.str === "Subtotal");
  const deposit = textItems.find((item) => item.str === "Deposit");
  const depositAmount = textItems.find((item) => item.str === "-Rp 25.000.000");
  const totalDue = textItems.find((item) => item.str === "Total Due");
  const totalDueAmount = textItems.find((item) => item.str === "Rp 18.655.814");

  assert.ok(subtotal && deposit && depositAmount && totalDue && totalDueAmount);
  assert.ok(subtotal.transform[5]! > deposit.transform[5]!);
  assert.ok(deposit.transform[5]! > totalDue.transform[5]!);
  assert.equal(document.getPageCount(), 1);

  if (process.env.INVOICE_PDF_FIXTURE_DIR) {
    await mkdir(process.env.INVOICE_PDF_FIXTURE_DIR, { recursive: true });
    await writeFile(
      path.join(process.env.INVOICE_PDF_FIXTURE_DIR, "deposit-invoice.pdf"),
      pdf,
    );
  }
});

test("generates a one-page flexible invoice with repeated shipment services", async () => {
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 5_300_000,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      depositAmount: 0,
      dueDate: "2026-07-20",
      formatVersion: 2,
      invoiceDate: "2026-07-06",
      invoiceNumber: "AAG/010/TST/26",
      netPayable: 5_300_000,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 0,
      status: "sent",
      subtotal: 5_300_000,
      total: 5_300_000,
      vatAmount: 0,
    },
    lines: [
      {
        awbNumber: "975-12345675",
        billingBasis: "per_kg",
        chargeableWeight: 100,
        description: "Air Freight",
        destination: "Denpasar",
        flightNumber: "QZ0123",
        flatAmount: null,
        id: "charge-1",
        lineTotal: 5_000_000,
        lineType: "awb",
        origin: "Jakarta",
        pieces: 10,
        pricePerKg: 50_000,
        reference: "975-12345675",
        shipmentDate: "2026-07-19",
      },
      {
        awbNumber: null,
        billingBasis: "per_kg",
        chargeableWeight: 100,
        description: "Regulated Agent Service",
        destination: null,
        flightNumber: null,
        flatAmount: null,
        id: "charge-2",
        lineTotal: 150_000,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: 1500,
        reference: "975-12345675",
        shipmentDate: null,
      },
      {
        awbNumber: null,
        billingBasis: "flat",
        chargeableWeight: null,
        description: "PEB",
        destination: null,
        flightNumber: null,
        flatAmount: 150_000,
        id: "charge-3",
        lineTotal: 150_000,
        lineType: "service",
        origin: null,
        pieces: null,
        pricePerKg: null,
        reference: "975-12345675",
        shipmentDate: null,
      },
    ],
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);
  const textItems = await getPdfPageTextItems(pdf);
  const headerReference = textItems.find((item) => item.str === "Reference");
  const firstLineReference = textItems.find((item) => item.str === "975-12345675");

  assert.ok(headerReference && firstLineReference);
  assert.ok(
    headerReference.transform[5]! - firstLineReference.transform[5]! >= 18,
    "the first flexible invoice row must render fully below the table header",
  );

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

test("moves a VAT, deposit, and PPh summary together when the first page is full", async () => {
  const lines = Array.from({ length: 13 }, (_, index) => ({
    awbNumber: `999-${String(index + 1).padStart(8, "0")}`,
    chargeableWeight: 100,
    description: null,
    destination: "CGK",
    flightNumber: "TEST",
    id: `awb-${index + 1}`,
    lineTotal: 1_000_000,
    lineType: "awb",
    origin: "HKG",
    pieces: 1,
    pricePerKg: 10_000,
    shipmentDate: "2026-07-30",
  }));
  const pdf = await generateInvoicePdf({
    deductions: [],
    invoice: {
      amountDue: 11_143_000,
      bankAccount: "ocbc",
      currency: "IDR",
      customerAddressSnapshot: "TEST ONLY",
      customerCode: "TST",
      customerNameSnapshot: "TEST ONLY CUSTOMER",
      customerNpwpSnapshot: null,
      depositAmount: 2_000_000,
      dueDate: "2026-07-30",
      invoiceDate: "2026-07-30",
      invoiceNumber: "AAG/077/TST/26",
      netPayable: 10_883_000,
      paymentTerms: "CASH",
      period: null,
      pphAmount: 260_000,
      status: "sent",
      subtotal: 13_000_000,
      total: 13_143_000,
      vatAmount: 143_000,
    },
    lines,
    verificationUrl: "https://www.ambaraartha.com/invoice/verify/test-token",
  });
  const document = await PDFDocument.load(pdf);
  const firstPageItems = await getPdfPageTextItems(pdf, 1);
  const secondPageItems = await getPdfPageTextItems(pdf, 2);
  const secondPageText = secondPageItems.map((item) => item.str);

  assert.equal(document.getPageCount(), 2);
  assert.equal(firstPageItems.some((item) => item.str === "Deposit"), false);
  assert.ok(secondPageText.includes("Subtotal"));
  assert.ok(secondPageText.includes("VAT 1.1%"));
  assert.ok(secondPageText.includes("Deposit"));
  assert.ok(secondPageText.includes("Total Due"));
  assert.ok(secondPageText.includes("PPh 23 (2%)"));
  assert.ok(secondPageText.includes("Net Payable"));

  if (process.env.INVOICE_PDF_FIXTURE_DIR) {
    await mkdir(process.env.INVOICE_PDF_FIXTURE_DIR, { recursive: true });
    await writeFile(
      path.join(process.env.INVOICE_PDF_FIXTURE_DIR, "deposit-vat-pph-boundary.pdf"),
      pdf,
    );
  }
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
      depositAmount: 0,
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

  if (process.env.INVOICE_PDF_FIXTURE_DIR) {
    await mkdir(process.env.INVOICE_PDF_FIXTURE_DIR, { recursive: true });
    await writeFile(
      path.join(process.env.INVOICE_PDF_FIXTURE_DIR, "long-flexible-service-invoice.pdf"),
      pdf,
    );
  }

  assert.ok(document.getPageCount() > 1);
});
