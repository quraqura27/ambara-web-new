import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInvoiceCollectionsDashboard,
  parseInvoiceCollectionFilters,
  type InvoiceCollectionSourceRow,
} from "./collections.ts";

const rows: InvoiceCollectionSourceRow[] = [
  {
    collectedThisMonth: 0,
    currency: "IDR",
    customerCode: "ABC",
    customerName: "PT Alpha",
    dueDate: "2026-07-01",
    id: "inv-overdue",
    invoiceDate: "2026-06-20",
    invoiceNumber: "AAG/001/ABC/26",
    lastPaymentDate: null,
    netPayable: "1000000",
    paidAmount: "0",
    paidAt: null,
    paymentCount: 0,
    paymentTerms: "CASH",
    sentAt: "2026-06-20T00:00:00.000Z",
    status: "sent",
  },
  {
    collectedThisMonth: "500000",
    currency: "IDR",
    customerCode: "ABC",
    customerName: "PT Alpha",
    dueDate: "2026-07-15",
    id: "inv-due-soon",
    invoiceDate: "2026-07-01",
    invoiceNumber: "AAG/002/ABC/26",
    lastPaymentDate: "2026-07-05",
    netPayable: "2500000",
    paidAmount: "500000",
    paidAt: null,
    paymentCount: 1,
    paymentTerms: "NET 14",
    sentAt: "2026-07-01T00:00:00.000Z",
    status: "sent",
  },
  {
    collectedThisMonth: 0,
    currency: "USD",
    customerCode: "ZED",
    customerName: "Zed Logistics",
    dueDate: "2026-07-20",
    id: "inv-usd",
    invoiceDate: "2026-07-03",
    invoiceNumber: "AAG/003/ZED/26",
    lastPaymentDate: null,
    netPayable: "500",
    paidAmount: "0",
    paidAt: null,
    paymentCount: 0,
    paymentTerms: "NET 30",
    sentAt: "2026-07-03T00:00:00.000Z",
    status: "sent",
  },
  {
    collectedThisMonth: "700000",
    currency: "IDR",
    customerCode: "ABC",
    customerName: "PT Alpha",
    dueDate: "2026-06-15",
    id: "inv-paid",
    invoiceDate: "2026-06-01",
    invoiceNumber: "AAG/004/ABC/26",
    lastPaymentDate: "2026-07-05",
    netPayable: "700000",
    paidAmount: "700000",
    paidAt: "2026-07-05T00:00:00.000Z",
    paymentCount: 1,
    paymentTerms: "CASH",
    sentAt: "2026-06-01T00:00:00.000Z",
    status: "paid",
  },
  {
    collectedThisMonth: 0,
    currency: "IDR",
    customerCode: "ABC",
    customerName: "PT Alpha",
    dueDate: "2026-07-01",
    id: "inv-draft",
    invoiceDate: "2026-07-01",
    invoiceNumber: null,
    lastPaymentDate: null,
    netPayable: "900000",
    paidAmount: "0",
    paidAt: null,
    paymentCount: 0,
    paymentTerms: "CASH",
    sentAt: null,
    status: "draft",
  },
];

test("builds collections summaries without mixing currencies", () => {
  const dashboard = buildInvoiceCollectionsDashboard(
    rows,
    { currency: "all", customer: "", dueWindow: "all" },
    new Date(2026, 6, 6, 12),
  );

  assert.deepEqual(
    dashboard.summaries.map((summary) => summary.currency),
    ["IDR", "USD"],
  );

  const idr = dashboard.summaries.find((summary) => summary.currency === "IDR");
  assert.ok(idr);
  assert.equal(idr.outstanding, 3_000_000);
  assert.equal(idr.overdue, 1_000_000);
  assert.equal(idr.dueSoon14, 2_000_000);
  assert.equal(idr.collectedThisMonth, 1_200_000);
  assert.equal(idr.unpaidCount, 2);

  const usd = dashboard.summaries.find((summary) => summary.currency === "USD");
  assert.ok(usd);
  assert.equal(usd.outstanding, 500);
});

test("orders follow-up rows by overdue first then nearest due date", () => {
  const dashboard = buildInvoiceCollectionsDashboard(
    rows,
    { currency: "all", customer: "", dueWindow: "all" },
    new Date(2026, 6, 6, 12),
  );

  assert.deepEqual(
    dashboard.followUpRows.map((row) => row.id),
    ["inv-overdue", "inv-due-soon", "inv-usd"],
  );
  assert.equal(dashboard.followUpRows[0]?.effectiveStatus, "overdue");
  assert.equal(dashboard.followUpRows[0]?.daysDelta, -5);
  assert.equal(dashboard.followUpRows[1]?.effectiveStatus, "partially_paid");
  assert.equal(dashboard.followUpRows[1]?.amountPaid, 500_000);
  assert.equal(dashboard.followUpRows[1]?.outstanding, 2_000_000);
});

test("filters collections by due window, customer, and currency", () => {
  const dashboard = buildInvoiceCollectionsDashboard(
    rows,
    { currency: "IDR", customer: "alpha", dueWindow: "overdue" },
    new Date(2026, 6, 6, 12),
  );

  assert.deepEqual(
    dashboard.followUpRows.map((row) => row.id),
    ["inv-overdue"],
  );
  assert.equal(dashboard.balances.length, 1);
  assert.equal(dashboard.balances[0]?.outstanding, 1_000_000);
  assert.equal(dashboard.balances[0]?.overdueCount, 1);
});

test("parses collection filters with safe defaults", () => {
  const filters = parseInvoiceCollectionFilters(
    new URLSearchParams({ currency: "EUR", customer: " PT Alpha ", due_window: "due_14" }),
  );

  assert.deepEqual(filters, {
    currency: "all",
    customer: "PT Alpha",
    dueWindow: "due_14",
  });
});
