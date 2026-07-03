import assert from "node:assert/strict";
import test from "node:test";

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
