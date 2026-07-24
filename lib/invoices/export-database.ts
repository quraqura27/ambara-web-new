import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "../db/index.ts";
import { invoiceLineItems, invoices, staffAccounts } from "../db/schema.ts";
import {
  invoiceEffectiveStatus,
  invoiceOutstandingIsOverdue,
  isInvoiceEffectiveStatus,
  summarizeInvoicePayments,
} from "./core.ts";
import {
  invoiceExportMaxRows,
  InvoiceExportTooLargeError,
  type InvoiceExportFilters,
  type InvoiceExportPreview,
  type InvoiceExportStatus,
} from "./export.ts";

function timestampValue(value: Date | string | null | undefined) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : value;
}

const activePaymentAmountSql = sql<string>`
  coalesce((
    select sum(payment.amount)
    from invoice_payments payment
    where payment.invoice_id = ${invoices.id}
      and payment.voided_at is null
  ), 0)
`;

const activePaymentCountSql = sql<number>`
  (
    select count(*)::int
    from invoice_payments payment
    where payment.invoice_id = ${invoices.id}
      and payment.voided_at is null
  )
`;

const lastPaymentDateSql = sql<string | null>`
  (
    select payment.payment_date
    from invoice_payments payment
    where payment.invoice_id = ${invoices.id}
      and payment.voided_at is null
    order by payment.created_at desc, payment.id desc
    limit 1
  )
`;

const paymentReferencesSql = sql<string>`
  coalesce((
    select string_agg(payment.reference, ' | ' order by payment.created_at, payment.id)
    from invoice_payments payment
    where payment.invoice_id = ${invoices.id}
      and payment.voided_at is null
  ), '')
`;

const outstandingBalanceSql = sql`
  greatest(coalesce(${invoices.netPayable}, 0) - ${activePaymentAmountSql}, 0)
`;

function statusCondition(status: InvoiceExportStatus) {
  if (status === "all") return undefined;
  if (status === "overdue") {
    return sql`${invoices.status} = 'sent' and ${outstandingBalanceSql} > 0 and ${invoices.dueDate} < current_date`;
  }
  if (status === "partially_paid") {
    return sql`${invoices.status} = 'sent' and ${activePaymentAmountSql} > 0 and ${outstandingBalanceSql} > 0`;
  }
  if (isInvoiceEffectiveStatus(status)) {
    return eq(invoices.status, status);
  }
  return undefined;
}

function exportWhere(filters: InvoiceExportFilters) {
  const conditions: SQL[] = [
    sql`${invoices.invoiceDate} >= ${filters.fromDate}`,
    sql`${invoices.invoiceDate} <= ${filters.toDate}`,
  ];
  const status = statusCondition(filters.status);
  if (status) conditions.push(status);
  if (filters.customer) {
    conditions.push(
      or(
        ilike(invoices.invoiceNumber, `%${filters.customer}%`),
        ilike(invoices.customerCode, `%${filters.customer}%`),
        ilike(invoices.customerNameSnapshot, `%${filters.customer}%`),
      )!,
    );
  }
  if (filters.currency !== "all") conditions.push(eq(invoices.currency, filters.currency));
  if (filters.pph === "with_pph") conditions.push(sql`coalesce(${invoices.pphAmount}, 0) > 0`);
  if (filters.pph === "without_pph") conditions.push(sql`coalesce(${invoices.pphAmount}, 0) <= 0`);
  if (filters.vat === "with_vat") conditions.push(sql`coalesce(${invoices.vatAmount}, 0) > 0`);
  if (filters.vat === "without_vat") conditions.push(sql`coalesce(${invoices.vatAmount}, 0) <= 0`);
  if (filters.payment === "paid") {
    conditions.push(sql`${invoices.status} = 'paid' or (coalesce(${invoices.netPayable}, 0) > 0 and ${outstandingBalanceSql} = 0)`);
  }
  if (filters.payment === "unpaid") {
    conditions.push(sql`${invoices.status} = 'sent' and ${outstandingBalanceSql} > 0`);
  }
  if (filters.payment === "partial") {
    conditions.push(sql`${invoices.status} = 'sent' and ${activePaymentAmountSql} > 0 and ${outstandingBalanceSql} > 0`);
  }
  return and(...conditions);
}

function invoiceNumber(value: string | null) {
  return value || "DRAFT";
}

function summaryRow(row: {
  amountDue: string | null;
  bankAccount: string | null;
  currency: string | null;
  customerCode: string | null;
  customerNameSnapshot: string | null;
  dueDate: string | null;
  generatedAt: Date | null;
  generatedByName: string | null;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  lastPaymentDate: string | null;
  netAmount: string | null;
  netPayable: string | null;
  paidAmount: string;
  paidAt: Date | null;
  paymentCount: number;
  paymentReference: string | null;
  paymentReferences: string;
  paymentTerms: string | null;
  pphAmount: string | null;
  sentAt: Date | null;
  status: string;
  subtotal: string | null;
  totalPengurangan: string | null;
  vatAmount: string | null;
}) {
  const paymentSummary = summarizeInvoicePayments(row);
  const effective = invoiceEffectiveStatus({
    dueDate: row.dueDate,
    paidAt: row.paidAt,
    paymentState: paymentSummary.paymentState,
    status: row.status,
  });
  const isOverdue = invoiceOutstandingIsOverdue({
    dueDate: row.dueDate,
    outstanding: paymentSummary.outstanding,
    status: row.status,
  });
  return {
    amount_paid: paymentSummary.amountPaid,
    bank_account: row.bankAccount ?? "",
    currency: row.currency || "IDR",
    customer_code: row.customerCode ?? "",
    customer_name: row.customerNameSnapshot ?? "",
    deductions: row.totalPengurangan ?? "0",
    due_date: row.dueDate ?? "",
    effective_status: effective,
    generated_at: timestampValue(row.generatedAt),
    generated_by: row.generatedByName ?? "",
    invoice_date: row.invoiceDate ?? "",
    invoice_number: invoiceNumber(row.invoiceNumber),
    is_overdue: isOverdue ? "yes" : "no",
    last_payment_date: paymentSummary.lastPaymentDate ?? "",
    net_amount: row.netAmount ?? "0",
    net_payable: row.netPayable ?? "0",
    outstanding_balance: paymentSummary.outstanding,
    paid_at: timestampValue(row.paidAt),
    payment_count: paymentSummary.paymentCount,
    payment_reference: row.paymentReference ?? "",
    payment_references: row.paymentReferences,
    payment_state: paymentSummary.paymentState,
    payment_terms: row.paymentTerms ?? "",
    pph_amount: row.pphAmount ?? "0",
    sent_at: timestampValue(row.sentAt),
    stored_status: row.status,
    subtotal: row.subtotal ?? "0",
    total_due: row.amountDue ?? "0",
    vat_amount: row.vatAmount ?? "0",
  };
}

async function queryInvoiceExportRows(
  filters: InvoiceExportFilters,
  maxRows: number,
  enforceLimit: boolean,
) {
  const limit = maxRows + 1;
  const where = exportWhere(filters);

  const baseSelect = {
    amountDue: invoices.amountDue,
    bankAccount: invoices.bankAccount,
    currency: invoices.currency,
    customerCode: invoices.customerCode,
    customerNameSnapshot: invoices.customerNameSnapshot,
    dueDate: invoices.dueDate,
    generatedAt: invoices.generatedAt,
    generatedByName: staffAccounts.fullName,
    invoiceDate: invoices.invoiceDate,
    invoiceNumber: invoices.invoiceNumber,
    lastPaymentDate: lastPaymentDateSql,
    netAmount: invoices.netAmount,
    netPayable: invoices.netPayable,
    paidAmount: activePaymentAmountSql,
    paidAt: invoices.paidAt,
    paymentCount: activePaymentCountSql,
    paymentReference: invoices.paymentReference,
    paymentReferences: paymentReferencesSql,
    paymentTerms: invoices.paymentTerms,
    pphAmount: invoices.pphAmount,
    sentAt: invoices.sentAt,
    status: invoices.status,
    subtotal: invoices.subtotal,
    totalPengurangan: invoices.totalPengurangan,
    vatAmount: invoices.vatAmount,
  };

  if (filters.scope === "summary") {
    const rows = await db
      .select(baseSelect)
      .from(invoices)
      .leftJoin(staffAccounts, eq(invoices.generatedBy, staffAccounts.id))
      .where(where)
      .orderBy(desc(invoices.invoiceDate), desc(invoices.generatedAt))
      .limit(limit);
    const mappedRows = rows.map(summaryRow);
    if (enforceLimit && mappedRows.length > maxRows) throw new InvoiceExportTooLargeError(maxRows);
    return mappedRows;
  }

  const rows = await db
    .select({
      ...baseSelect,
      awbNumber: invoiceLineItems.awbNumber,
      chargeableWeight: invoiceLineItems.chargeableWeight,
      description: invoiceLineItems.description,
      destination: invoiceLineItems.destination,
      flightNumber: invoiceLineItems.flightNumber,
      lineTotal: invoiceLineItems.lineTotal,
      lineType: invoiceLineItems.lineType,
      origin: invoiceLineItems.origin,
      pieces: invoiceLineItems.pieces,
      pricePerKg: invoiceLineItems.pricePerKg,
      shipmentDate: invoiceLineItems.shipmentDate,
    })
    .from(invoices)
    .innerJoin(invoiceLineItems, eq(invoiceLineItems.invoiceId, invoices.id))
    .leftJoin(staffAccounts, eq(invoices.generatedBy, staffAccounts.id))
    .where(where)
    .orderBy(desc(invoices.invoiceDate), desc(invoices.generatedAt), invoiceLineItems.sortOrder)
    .limit(limit);

  const mappedRows = rows.map((row) => {
    const summary = summaryRow(row);
    return {
      ...summary,
      awb_number: row.awbNumber ?? "",
      chargeable_weight: row.chargeableWeight ?? "",
      destination: row.destination ?? "",
      flight_number: row.flightNumber ?? "",
      line_total: row.lineTotal ?? "0",
      line_type: row.lineType,
      origin: row.origin ?? "",
      pieces: row.pieces ?? "",
      price_per_kg: row.pricePerKg ?? "",
      service_description: row.description ?? "",
      shipment_date: row.shipmentDate ?? "",
    };
  });
  if (enforceLimit && mappedRows.length > maxRows) throw new InvoiceExportTooLargeError(maxRows);
  return mappedRows;
}

export async function getInvoiceExportRows(
  filters: InvoiceExportFilters,
  maxRows = invoiceExportMaxRows,
) {
  return queryInvoiceExportRows(filters, maxRows, true);
}

export async function getInvoiceExportPreview(
  filters: InvoiceExportFilters,
  maxRows = invoiceExportMaxRows,
): Promise<InvoiceExportPreview> {
  const rows = await queryInvoiceExportRows(filters, maxRows, false);
  return {
    isTooLarge: rows.length > maxRows,
    maxRows,
    rowCount: Math.min(rows.length, maxRows),
  };
}
