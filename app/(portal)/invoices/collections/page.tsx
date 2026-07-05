import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, Clock, Download, Search } from "lucide-react";

import { getInvoiceCollectionsDashboard } from "@/actions/invoices";
import { Button, Card, Input } from "@/components/ui/core";
import {
  formatCurrencyAmount,
  invoiceCurrencies,
  invoiceStatusLabel,
  type InvoiceCurrency,
} from "@/lib/invoices/core";
import {
  invoiceCollectionDueWindows,
  parseInvoiceCollectionFilters,
  type InvoiceCollectionCurrency,
  type InvoiceCollectionDueWindow,
} from "@/lib/invoices/collections";

type InvoiceCollectionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50";

const dueWindowLabels: Record<InvoiceCollectionDueWindow, string> = {
  all: "All unpaid",
  overdue: "Overdue",
  due_7: "Due in 7 days",
  due_14: "Due in 14 days",
  due_30: "Due in 30 days",
};

function toSearchParams(params?: Record<string, string | string[] | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) searchParams.append(key, item);
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

function currencyLabel(currency: InvoiceCollectionCurrency) {
  return currency === "all" ? "All currencies" : currency;
}

function money(currency: string, value: number) {
  return `${currency} ${formatCurrencyAmount(value, currency)}`;
}

function dueText(daysDelta: number | null) {
  if (daysDelta === null) return "No due date";
  if (daysDelta < 0) return `${Math.abs(daysDelta)}d overdue`;
  if (daysDelta === 0) return "Due today";
  return `Due in ${daysDelta}d`;
}

function exportSearch(filters: {
  currency: InvoiceCollectionCurrency;
  customer: string;
  dueWindow: InvoiceCollectionDueWindow;
}, today: string) {
  const params = new URLSearchParams({
    format: "csv",
    from_date: "2000-01-01",
    payment: "unpaid",
    pph: "all",
    scope: "summary",
    status: filters.dueWindow === "overdue" ? "overdue" : "sent",
    to_date: today,
    vat: "all",
  });

  if (filters.currency !== "all") params.set("currency", filters.currency);
  if (filters.customer) params.set("customer", filters.customer);
  return params;
}

function KpiValue({ currency, value }: { currency: string; value: number }) {
  return <span className="font-mono text-xl font-semibold text-white">{money(currency, value)}</span>;
}

export default async function InvoiceCollectionsPage({ searchParams }: InvoiceCollectionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const parsedSearchParams = toSearchParams(resolvedSearchParams);
  const filters = parseInvoiceCollectionFilters(parsedSearchParams);
  const dashboard = await getInvoiceCollectionsDashboard(filters);
  const exportParams = exportSearch(filters, dashboard.today);
  const exportDownloadHref = `/invoices/export/download?${exportParams.toString()}`;
  const exportReviewHref = `/invoices/export?${exportParams.toString()}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Finance AR</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Invoice Collections</h1>
          <p className="mt-1 text-slate-500">Outstanding, overdue, and recently paid invoice balances.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={exportReviewHref}>
            <Button className="gap-2" variant="secondary">
              <Search className="h-4 w-4" /> Review Export
            </Button>
          </Link>
          <Link href={exportDownloadHref}>
            <Button className="gap-2">
              <Download className="h-4 w-4" /> Export Unpaid CSV
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto]" method="get">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Customer</span>
            <Input defaultValue={filters.customer} name="customer" placeholder="Code, name, invoice no" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Currency</span>
            <select className={fieldClassName} defaultValue={filters.currency} name="currency">
              <option value="all">{currencyLabel("all")}</option>
              {invoiceCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Due window</span>
            <select className={fieldClassName} defaultValue={filters.dueWindow} name="due_window">
              {invoiceCollectionDueWindows.map((window) => (
                <option key={window} value={window}>
                  {dueWindowLabels[window]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button className="w-full" type="submit" variant="secondary">Apply</Button>
          </div>
          <div className="flex items-end">
            <Link className="w-full" href="/invoices/collections">
              <Button className="w-full" type="button" variant="ghost">Reset</Button>
            </Link>
          </div>
        </form>
      </Card>

      {dashboard.summaries.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {dashboard.summaries.map((summary) => (
            <Card className="p-5" key={summary.currency}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Currency</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">{summary.currency}</h2>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300">
                  <Banknote className="h-5 w-5" />
                </div>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Outstanding</dt>
                  <dd className="mt-1"><KpiValue currency={summary.currency} value={summary.outstanding} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Overdue</dt>
                  <dd className="mt-1"><KpiValue currency={summary.currency} value={summary.overdue} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Due 14 days</dt>
                  <dd className="mt-1"><KpiValue currency={summary.currency} value={summary.dueSoon14} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Paid this month</dt>
                  <dd className="mt-1"><KpiValue currency={summary.currency} value={summary.paidThisMonth} /></dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-slate-400">{summary.unpaidCount.toLocaleString()} active unpaid invoices</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Clock className="mx-auto h-10 w-10 text-slate-600" />
          <h2 className="mt-3 text-lg font-semibold text-white">No active AR found</h2>
          <p className="mt-1 text-sm text-slate-500">There are no sent unpaid invoices for the selected filters.</p>
        </Card>
      )}

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Needs follow-up</h2>
            <p className="mt-1 text-sm text-slate-500">{dashboard.followUpRows.length.toLocaleString()} invoices</p>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead className="bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">Invoice</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Due</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Terms</th>
                <th className="px-5 py-4 text-right">Net payable</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dashboard.followUpRows.map((invoice) => (
                <tr className="transition hover:bg-white/[0.02]" key={invoice.id}>
                  <td className="px-5 py-4">
                    <p className="font-mono text-sm text-blue-200">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">{invoice.invoiceDate || "No invoice date"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{invoice.customerName}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{invoice.customerCode || "-"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-200">{invoice.dueDate || "-"}</p>
                    <p className={invoice.daysDelta !== null && invoice.daysDelta < 0 ? "mt-1 text-xs font-semibold text-rose-300" : "mt-1 text-xs text-slate-500"}>
                      {dueText(invoice.daysDelta)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={invoice.effectiveStatus === "overdue" ? "text-xs font-semibold uppercase text-rose-300" : "text-xs font-semibold uppercase text-emerald-300"}>
                      {invoiceStatusLabel(invoice.effectiveStatus)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{invoice.paymentTerms}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold">
                    {money(invoice.currency, invoice.netPayable)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button className="gap-2" variant="secondary">Open <ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {dashboard.followUpRows.length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-sm text-slate-500" colSpan={7}>No unpaid invoices match the selected window.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-semibold text-white">Customer balances</h2>
          <p className="mt-1 text-sm text-slate-500">{dashboard.balances.length.toLocaleString()} customer currency groups</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Currency</th>
                <th className="px-5 py-4">Oldest due</th>
                <th className="px-5 py-4 text-right">Invoices</th>
                <th className="px-5 py-4 text-right">Overdue</th>
                <th className="px-5 py-4 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dashboard.balances.map((balance) => (
                <tr className="transition hover:bg-white/[0.02]" key={`${balance.currency}-${balance.customerCode}-${balance.customerName}`}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{balance.customerName}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{balance.customerCode || "-"}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-300">{balance.currency}</td>
                  <td className="px-5 py-4 text-sm text-slate-300">{balance.oldestDueDate || "-"}</td>
                  <td className="px-5 py-4 text-right text-sm">{balance.invoiceCount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-rose-300">{balance.overdueCount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold">{money(balance.currency, balance.outstanding)}</td>
                </tr>
              ))}
              {dashboard.balances.length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-sm text-slate-500" colSpan={6}>No customer balances match the selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
