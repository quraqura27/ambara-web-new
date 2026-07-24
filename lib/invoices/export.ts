import {
  dateInputFromDate,
  invoiceCurrencies,
  invoiceEffectiveStatuses,
  type InvoiceCurrency,
} from "./core.ts";
import { canManageInvoices } from "../portal-roles.ts";
import type { PortalRoleUser } from "../portal-roles.ts";

export const invoiceExportScopes = ["summary", "lines"] as const;
export type InvoiceExportScope = (typeof invoiceExportScopes)[number];

export const invoiceExportFormats = ["csv"] as const;
export type InvoiceExportFormat = (typeof invoiceExportFormats)[number];

export const invoiceExportStatuses = ["all", ...invoiceEffectiveStatuses] as const;
export type InvoiceExportStatus = (typeof invoiceExportStatuses)[number];

export const invoiceExportCurrencies = ["all", ...invoiceCurrencies] as const;
export type InvoiceExportCurrency = "all" | InvoiceCurrency;

export const invoiceExportPphFilters = ["all", "with_pph", "without_pph"] as const;
export type InvoiceExportPphFilter = (typeof invoiceExportPphFilters)[number];

export const invoiceExportVatFilters = ["all", "with_vat", "without_vat"] as const;
export type InvoiceExportVatFilter = (typeof invoiceExportVatFilters)[number];

export const invoiceExportPaymentFilters = ["all", "paid", "unpaid", "partial"] as const;
export type InvoiceExportPaymentFilter = (typeof invoiceExportPaymentFilters)[number];

export const invoiceExportMaxRows = 5_000;

export function canExportInvoices(user: PortalRoleUser | null | undefined) {
  return canManageInvoices(user);
}

export type InvoiceExportFilters = {
  currency: InvoiceExportCurrency;
  customer: string;
  format: InvoiceExportFormat;
  fromDate: string;
  fromDateTime: Date;
  payment: InvoiceExportPaymentFilter;
  pph: InvoiceExportPphFilter;
  scope: InvoiceExportScope;
  status: InvoiceExportStatus;
  toDate: string;
  toDateTime: Date;
  vat: InvoiceExportVatFilter;
};

export type InvoiceExportParseResult = {
  errors: string[];
  filters: InvoiceExportFilters;
};

export type InvoiceExportPreview = {
  isTooLarge: boolean;
  maxRows: number;
  rowCount: number;
};

export type InvoiceExportColumn = {
  header: string;
  key: string;
};

export class InvoiceExportTooLargeError extends Error {
  constructor(maxRows: number) {
    super(`Invoice export is above ${maxRows.toLocaleString()} rows. Narrow the filters before downloading.`);
    this.name = "InvoiceExportTooLargeError";
  }
}

const defaultDateRangeDays = 90;

function isOneOf<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return (values as readonly string[]).includes(value);
}

function stringParam(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? "";
}

function parseDateInput(value: string, boundary: "start" | "end") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  const day = Number.parseInt(match[3] ?? "", 10);
  const date =
    boundary === "start"
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function defaultDateRange(now: Date) {
  const toDate = new Date(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - defaultDateRangeDays);
  return {
    fromDate: dateInputFromDate(fromDate),
    toDate: dateInputFromDate(toDate),
  };
}

export function parseInvoiceExportFilters(
  params: URLSearchParams,
  now = new Date(),
): InvoiceExportParseResult {
  const defaults = defaultDateRange(now);
  const errors: string[] = [];
  const scopeInput = stringParam(params, "scope") || "summary";
  const formatInput = stringParam(params, "format") || "csv";
  const statusInput = stringParam(params, "status") || "all";
  const currencyInput = stringParam(params, "currency") || "all";
  const pphInput = stringParam(params, "pph") || "all";
  const vatInput = stringParam(params, "vat") || "all";
  const paymentInput = stringParam(params, "payment") || "all";
  const fromDate = stringParam(params, "from_date") || defaults.fromDate;
  const toDate = stringParam(params, "to_date") || defaults.toDate;
  const fromDateTime = parseDateInput(fromDate, "start");
  const toDateTime = parseDateInput(toDate, "end");

  const scope = isOneOf(invoiceExportScopes, scopeInput) ? scopeInput : "summary";
  const format = isOneOf(invoiceExportFormats, formatInput) ? formatInput : "csv";
  const status = isOneOf(invoiceExportStatuses, statusInput) ? statusInput : "all";
  const currency = isOneOf(invoiceExportCurrencies, currencyInput) ? currencyInput : "all";
  const pph = isOneOf(invoiceExportPphFilters, pphInput) ? pphInput : "all";
  const vat = isOneOf(invoiceExportVatFilters, vatInput) ? vatInput : "all";
  const payment = isOneOf(invoiceExportPaymentFilters, paymentInput) ? paymentInput : "all";

  if (!isOneOf(invoiceExportScopes, scopeInput)) errors.push("Invalid export scope.");
  if (!isOneOf(invoiceExportFormats, formatInput)) errors.push("Invalid export format.");
  if (!isOneOf(invoiceExportStatuses, statusInput)) errors.push("Invalid invoice status.");
  if (!isOneOf(invoiceExportCurrencies, currencyInput)) errors.push("Invalid currency.");
  if (!isOneOf(invoiceExportPphFilters, pphInput)) errors.push("Invalid PPh filter.");
  if (!isOneOf(invoiceExportVatFilters, vatInput)) errors.push("Invalid VAT filter.");
  if (!isOneOf(invoiceExportPaymentFilters, paymentInput)) errors.push("Invalid payment filter.");
  if (!fromDateTime) errors.push("From date must use YYYY-MM-DD.");
  if (!toDateTime) errors.push("To date must use YYYY-MM-DD.");
  if (fromDateTime && toDateTime && fromDateTime.getTime() > toDateTime.getTime()) {
    errors.push("From date must be before or equal to to date.");
  }

  return {
    errors,
    filters: {
      currency,
      customer: stringParam(params, "customer"),
      format,
      fromDate,
      fromDateTime: fromDateTime ?? parseDateInput(defaults.fromDate, "start") ?? now,
      payment,
      pph,
      scope,
      status,
      toDate,
      toDateTime: toDateTime ?? parseDateInput(defaults.toDate, "end") ?? now,
      vat,
    },
  };
}

function normalizeExportCellValue(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

export function sanitizeInvoiceCsvCell(value: unknown) {
  const text = normalizeExportCellValue(value);

  if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

export function escapeInvoiceCsvCell(value: unknown) {
  const sanitized = sanitizeInvoiceCsvCell(value);
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

function buildCsv(columns: InvoiceExportColumn[], rows: Array<Record<string, unknown>>) {
  return [
    columns.map((column) => escapeInvoiceCsvCell(column.header)).join(","),
    ...rows.map((row) => columns.map((column) => escapeInvoiceCsvCell(row[column.key])).join(",")),
  ].join("\n");
}

export const invoiceSummaryColumns: InvoiceExportColumn[] = [
  { header: "Invoice Number", key: "invoice_number" },
  { header: "Stored Status", key: "stored_status" },
  { header: "Effective Status", key: "effective_status" },
  { header: "Customer Code", key: "customer_code" },
  { header: "Customer Name", key: "customer_name" },
  { header: "Invoice Date", key: "invoice_date" },
  { header: "Due Date", key: "due_date" },
  { header: "Sent At", key: "sent_at" },
  { header: "Paid At", key: "paid_at" },
  { header: "Payment State", key: "payment_state" },
  { header: "Amount Paid", key: "amount_paid" },
  { header: "Outstanding Balance", key: "outstanding_balance" },
  { header: "Payment Count", key: "payment_count" },
  { header: "Last Payment Date", key: "last_payment_date" },
  { header: "Payment References", key: "payment_references" },
  { header: "Is Overdue", key: "is_overdue" },
  { header: "Currency", key: "currency" },
  { header: "Subtotal", key: "subtotal" },
  { header: "Deductions", key: "deductions" },
  { header: "Net Amount", key: "net_amount" },
  { header: "VAT Amount", key: "vat_amount" },
  { header: "Total Due", key: "total_due" },
  { header: "PPh Amount", key: "pph_amount" },
  { header: "Net Payable", key: "net_payable" },
  { header: "Payment Terms", key: "payment_terms" },
  { header: "Bank Account", key: "bank_account" },
  { header: "Payment Reference", key: "payment_reference" },
  { header: "Generated By", key: "generated_by" },
  { header: "Generated At", key: "generated_at" },
];

export const invoiceLineColumns: InvoiceExportColumn[] = [
  { header: "Invoice Number", key: "invoice_number" },
  { header: "Stored Status", key: "stored_status" },
  { header: "Effective Status", key: "effective_status" },
  { header: "Customer Code", key: "customer_code" },
  { header: "Customer Name", key: "customer_name" },
  { header: "Invoice Date", key: "invoice_date" },
  { header: "Due Date", key: "due_date" },
  { header: "Sent At", key: "sent_at" },
  { header: "Paid At", key: "paid_at" },
  { header: "Payment State", key: "payment_state" },
  { header: "Amount Paid", key: "amount_paid" },
  { header: "Outstanding Balance", key: "outstanding_balance" },
  { header: "Payment Count", key: "payment_count" },
  { header: "Last Payment Date", key: "last_payment_date" },
  { header: "Payment References", key: "payment_references" },
  { header: "Is Overdue", key: "is_overdue" },
  { header: "Line Type", key: "line_type" },
  { header: "AWB Number", key: "awb_number" },
  { header: "Shipment Date", key: "shipment_date" },
  { header: "Origin", key: "origin" },
  { header: "Destination", key: "destination" },
  { header: "Flight Number", key: "flight_number" },
  { header: "Pieces", key: "pieces" },
  { header: "Chargeable Weight", key: "chargeable_weight" },
  { header: "Price Per Kg", key: "price_per_kg" },
  { header: "Service Description", key: "service_description" },
  { header: "Line Total", key: "line_total" },
  { header: "Currency", key: "currency" },
];

function columnsForScope(scope: InvoiceExportScope) {
  return scope === "lines" ? invoiceLineColumns : invoiceSummaryColumns;
}

export function buildInvoiceExportCsv(filters: Pick<InvoiceExportFilters, "scope">, rows: Array<Record<string, unknown>>) {
  return buildCsv(columnsForScope(filters.scope), rows);
}

export function buildInvoiceExportFilename(filters: Pick<InvoiceExportFilters, "format" | "fromDate" | "scope" | "toDate">) {
  return `ambara_invoices_${filters.scope}_${filters.fromDate}_to_${filters.toDate}.${filters.format}`;
}
