import {
  dateInputFromDate,
  invoiceCurrencies,
  invoiceEffectiveStatus,
  normalizeInvoiceStatus,
  numberValue,
  type InvoiceCurrency,
} from "./core.ts";

export const invoiceCollectionDueWindows = ["all", "overdue", "due_7", "due_14", "due_30"] as const;

export type InvoiceCollectionDueWindow = (typeof invoiceCollectionDueWindows)[number];

export type InvoiceCollectionCurrency = "all" | InvoiceCurrency;

export type InvoiceCollectionFilters = {
  currency: InvoiceCollectionCurrency;
  customer: string;
  dueWindow: InvoiceCollectionDueWindow;
};

export type InvoiceCollectionSourceRow = {
  currency: string | null;
  customerCode: string | null;
  customerName: string | null;
  dueDate: string | null;
  id: string;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  netPayable: number | string | null;
  paidAt: Date | string | null;
  paymentTerms: string | null;
  sentAt: Date | string | null;
  status: string | null;
};

export type InvoiceCollectionCurrencySummary = {
  currency: string;
  dueSoon14: number;
  overdue: number;
  paidThisMonth: number;
  unpaidCount: number;
  outstanding: number;
};

export type InvoiceCollectionFollowUpRow = {
  currency: string;
  customerCode: string;
  customerName: string;
  daysDelta: number | null;
  dueDate: string | null;
  effectiveStatus: "sent" | "overdue";
  id: string;
  invoiceDate: string | null;
  invoiceNumber: string;
  netPayable: number;
  paymentTerms: string;
};

export type InvoiceCollectionCustomerBalance = {
  currency: string;
  customerCode: string;
  customerName: string;
  invoiceCount: number;
  oldestDueDate: string | null;
  outstanding: number;
  overdueCount: number;
};

export type InvoiceCollectionsDashboard = {
  balances: InvoiceCollectionCustomerBalance[];
  filters: InvoiceCollectionFilters;
  followUpRows: InvoiceCollectionFollowUpRow[];
  summaries: InvoiceCollectionCurrencySummary[];
  today: string;
};

function isOneOf<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return (values as readonly string[]).includes(value);
}

function stringParam(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? "";
}

export function parseInvoiceCollectionFilters(params: URLSearchParams): InvoiceCollectionFilters {
  const currencyInput = stringParam(params, "currency") || "all";
  const dueWindowInput = stringParam(params, "due_window") || "all";

  return {
    currency: isOneOf(["all", ...invoiceCurrencies] as const, currencyInput) ? currencyInput : "all",
    customer: stringParam(params, "customer"),
    dueWindow: isOneOf(invoiceCollectionDueWindows, dueWindowInput) ? dueWindowInput : "all",
  };
}

function addDays(dateInput: string, days: number) {
  const [year, month, day] = dateInput.split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return dateInputFromDate(date);
}

function dateDaysDelta(dateInput: string | null, today: string) {
  if (!dateInput) return null;
  const [dueYear, dueMonth, dueDay] = dateInput.split("-").map((part) => Number.parseInt(part, 10));
  const [todayYear, todayMonth, todayDay] = today.split("-").map((part) => Number.parseInt(part, 10));
  const dueUtc = Date.UTC(dueYear, dueMonth - 1, dueDay);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((dueUtc - todayUtc) / 86_400_000);
}

function timestampTime(value: Date | string | null | undefined) {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function isPaidThisMonth(row: InvoiceCollectionSourceRow, monthStart: Date, nextMonthStart: Date) {
  const paidTime = timestampTime(row.paidAt);
  return paidTime !== null && paidTime >= monthStart.getTime() && paidTime < nextMonthStart.getTime();
}

function activeUnpaid(row: InvoiceCollectionSourceRow) {
  return normalizeInvoiceStatus(row.status) === "sent" && !row.paidAt;
}

function rowCurrency(row: InvoiceCollectionSourceRow) {
  return row.currency || "IDR";
}

function rowCustomerName(row: InvoiceCollectionSourceRow) {
  return row.customerName || "Customer snapshot unavailable";
}

function rowCustomerCode(row: InvoiceCollectionSourceRow) {
  return row.customerCode || "";
}

function customerMatches(row: InvoiceCollectionSourceRow, search: string) {
  if (!search) return true;
  const haystack = [
    row.invoiceNumber,
    row.customerCode,
    row.customerName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function matchesDueWindow(row: InvoiceCollectionSourceRow, dueWindow: InvoiceCollectionDueWindow, today: string) {
  if (dueWindow === "all") return true;
  if (!row.dueDate) return false;
  if (dueWindow === "overdue") return row.dueDate < today;
  const days = Number.parseInt(dueWindow.replace("due_", ""), 10);
  return row.dueDate >= today && row.dueDate <= addDays(today, days);
}

function sortSummaries(a: InvoiceCollectionCurrencySummary, b: InvoiceCollectionCurrencySummary) {
  const preferredA = invoiceCurrencies.indexOf(a.currency as InvoiceCurrency);
  const preferredB = invoiceCurrencies.indexOf(b.currency as InvoiceCurrency);
  if (preferredA !== -1 || preferredB !== -1) {
    return (preferredA === -1 ? 99 : preferredA) - (preferredB === -1 ? 99 : preferredB);
  }
  return a.currency.localeCompare(b.currency);
}

export function buildInvoiceCollectionsDashboard(
  rows: InvoiceCollectionSourceRow[],
  filters: InvoiceCollectionFilters,
  now = new Date(),
): InvoiceCollectionsDashboard {
  const today = dateInputFromDate(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const scopedRows = rows.filter(
    (row) =>
      (filters.currency === "all" || rowCurrency(row) === filters.currency) &&
      customerMatches(row, filters.customer),
  );
  const unpaidRows = scopedRows.filter(activeUnpaid);
  const visibleUnpaidRows = unpaidRows.filter((row) => matchesDueWindow(row, filters.dueWindow, today));
  const summariesByCurrency = new Map<string, InvoiceCollectionCurrencySummary>();

  for (const row of unpaidRows) {
    const currency = rowCurrency(row);
    const summary = summariesByCurrency.get(currency) ?? {
      currency,
      dueSoon14: 0,
      overdue: 0,
      paidThisMonth: 0,
      unpaidCount: 0,
      outstanding: 0,
    };
    const amount = numberValue(row.netPayable);
    summary.outstanding += amount;
    summary.unpaidCount += 1;
    if (row.dueDate && row.dueDate < today) summary.overdue += amount;
    if (row.dueDate && row.dueDate >= today && row.dueDate <= addDays(today, 14)) {
      summary.dueSoon14 += amount;
    }
    summariesByCurrency.set(currency, summary);
  }

  for (const row of scopedRows.filter((candidate) => isPaidThisMonth(candidate, monthStart, nextMonthStart))) {
    const currency = rowCurrency(row);
    const summary = summariesByCurrency.get(currency) ?? {
      currency,
      dueSoon14: 0,
      overdue: 0,
      paidThisMonth: 0,
      unpaidCount: 0,
      outstanding: 0,
    };
    summary.paidThisMonth += numberValue(row.netPayable);
    summariesByCurrency.set(currency, summary);
  }

  const followUpRows = visibleUnpaidRows
    .map<InvoiceCollectionFollowUpRow>((row) => {
      const effectiveStatus = invoiceEffectiveStatus({
        dueDate: row.dueDate,
        paidAt: row.paidAt,
        status: row.status,
      }) === "overdue" ? "overdue" : "sent";
      return {
        currency: rowCurrency(row),
        customerCode: rowCustomerCode(row),
        customerName: rowCustomerName(row),
        daysDelta: dateDaysDelta(row.dueDate, today),
        dueDate: row.dueDate,
        effectiveStatus,
        id: row.id,
        invoiceDate: row.invoiceDate,
        invoiceNumber: row.invoiceNumber || "DRAFT",
        netPayable: numberValue(row.netPayable),
        paymentTerms: row.paymentTerms || "CASH",
      };
    })
    .sort((a, b) => {
      if (a.effectiveStatus !== b.effectiveStatus) return a.effectiveStatus === "overdue" ? -1 : 1;
      if (a.dueDate !== b.dueDate) return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      return b.netPayable - a.netPayable;
    });

  const balancesByCustomer = new Map<string, InvoiceCollectionCustomerBalance>();
  for (const row of visibleUnpaidRows) {
    const currency = rowCurrency(row);
    const customerCode = rowCustomerCode(row);
    const customerName = rowCustomerName(row);
    const key = `${currency}|${customerCode}|${customerName}`;
    const balance = balancesByCustomer.get(key) ?? {
      currency,
      customerCode,
      customerName,
      invoiceCount: 0,
      oldestDueDate: null,
      outstanding: 0,
      overdueCount: 0,
    };
    balance.invoiceCount += 1;
    balance.outstanding += numberValue(row.netPayable);
    if (row.dueDate && row.dueDate < today) balance.overdueCount += 1;
    if (row.dueDate && (!balance.oldestDueDate || row.dueDate < balance.oldestDueDate)) {
      balance.oldestDueDate = row.dueDate;
    }
    balancesByCustomer.set(key, balance);
  }

  return {
    balances: Array.from(balancesByCustomer.values()).sort((a, b) => {
      if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
      if (a.outstanding !== b.outstanding) return b.outstanding - a.outstanding;
      return a.customerName.localeCompare(b.customerName);
    }),
    filters,
    followUpRows,
    summaries: Array.from(summariesByCurrency.values()).sort(sortSummaries),
    today,
  };
}
