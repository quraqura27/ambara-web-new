import {
  dateInputFromDate,
  invoiceCurrencies,
  invoiceEffectiveStatus,
  invoiceOutstandingIsOverdue,
  normalizeInvoiceStatus,
  numberValue,
  summarizeInvoicePayments,
  type InvoiceCurrency,
  type InvoicePaymentState,
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
  collectedThisMonth: number | string | null;
  currency: string | null;
  customerCode: string | null;
  customerName: string | null;
  dueDate: string | null;
  id: string;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  lastPaymentDate: string | null;
  netPayable: number | string | null;
  paidAmount: number | string | null;
  paidAt: Date | string | null;
  paymentCount: number | string | null;
  paymentTerms: string | null;
  sentAt: Date | string | null;
  status: string | null;
};

export type InvoiceCollectionCurrencySummary = {
  collectedThisMonth: number;
  currency: string;
  dueSoon14: number;
  overdue: number;
  unpaidCount: number;
  outstanding: number;
};

export type InvoiceCollectionFollowUpRow = {
  amountPaid: number;
  currency: string;
  customerCode: string;
  customerName: string;
  daysDelta: number | null;
  dueDate: string | null;
  effectiveStatus: "sent" | "partially_paid" | "overdue";
  id: string;
  invoiceDate: string | null;
  invoiceNumber: string;
  outstanding: number;
  paymentState: InvoicePaymentState;
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

function rowPaymentSummary(row: InvoiceCollectionSourceRow) {
  return summarizeInvoicePayments({
    lastPaymentDate: row.lastPaymentDate,
    netPayable: row.netPayable,
    paidAmount: row.paidAmount,
    paymentCount: row.paymentCount,
    status: row.status,
  });
}

function activeUnpaid(row: InvoiceCollectionSourceRow) {
  return normalizeInvoiceStatus(row.status) === "sent" && rowPaymentSummary(row).outstanding > 0;
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
      collectedThisMonth: 0,
      currency,
      dueSoon14: 0,
      overdue: 0,
      unpaidCount: 0,
      outstanding: 0,
    };
    const amount = rowPaymentSummary(row).outstanding;
    summary.outstanding += amount;
    summary.unpaidCount += 1;
    if (row.dueDate && row.dueDate < today) summary.overdue += amount;
    if (row.dueDate && row.dueDate >= today && row.dueDate <= addDays(today, 14)) {
      summary.dueSoon14 += amount;
    }
    summariesByCurrency.set(currency, summary);
  }

  for (const row of scopedRows.filter((candidate) => numberValue(candidate.collectedThisMonth) > 0)) {
    const currency = rowCurrency(row);
    const summary = summariesByCurrency.get(currency) ?? {
      collectedThisMonth: 0,
      currency,
      dueSoon14: 0,
      overdue: 0,
      unpaidCount: 0,
      outstanding: 0,
    };
    summary.collectedThisMonth += numberValue(row.collectedThisMonth);
    summariesByCurrency.set(currency, summary);
  }

  const followUpRows = visibleUnpaidRows
    .map<InvoiceCollectionFollowUpRow>((row) => {
      const paymentSummary = rowPaymentSummary(row);
      const effectiveStatus = invoiceOutstandingIsOverdue({
        dueDate: row.dueDate,
        outstanding: paymentSummary.outstanding,
        status: row.status,
      }, today)
        ? "overdue"
        : invoiceEffectiveStatus({
          dueDate: row.dueDate,
          paidAt: row.paidAt,
          paymentState: paymentSummary.paymentState,
          status: row.status,
        }, today) as "sent" | "partially_paid";
      return {
        amountPaid: paymentSummary.amountPaid,
        currency: rowCurrency(row),
        customerCode: rowCustomerCode(row),
        customerName: rowCustomerName(row),
        daysDelta: dateDaysDelta(row.dueDate, today),
        dueDate: row.dueDate,
        effectiveStatus,
        id: row.id,
        invoiceDate: row.invoiceDate,
        invoiceNumber: row.invoiceNumber || "DRAFT",
        outstanding: paymentSummary.outstanding,
        paymentState: paymentSummary.paymentState,
        paymentTerms: row.paymentTerms || "CASH",
      };
    })
    .sort((a, b) => {
      if (a.effectiveStatus !== b.effectiveStatus) {
        if (a.effectiveStatus === "overdue") return -1;
        if (b.effectiveStatus === "overdue") return 1;
      }
      if (a.dueDate !== b.dueDate) return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      return b.outstanding - a.outstanding;
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
    balance.outstanding += rowPaymentSummary(row).outstanding;
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
