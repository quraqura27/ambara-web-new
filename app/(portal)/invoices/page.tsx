import Link from "next/link";
import { CircleDollarSign, FileSpreadsheet, Plus, ReceiptText, Search } from "lucide-react";

import { getInvoicesPage } from "@/actions/invoices";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button, Card, Input } from "@/components/ui/core";
import { formatCurrencyAmount, invoiceStatusLabel } from "@/lib/invoices/core";

type InvoicesPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const result = await getInvoicesPage({
    page: Number.parseInt(params.page ?? "1", 10) || 1,
    search: params.search,
  });
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    query.set("page", String(page));
    return `/invoices?${query}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-1 text-slate-500">Finance invoices generated from portal shipment and AWB data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/invoices/collections">
            <Button className="gap-2" variant="secondary"><CircleDollarSign className="h-4 w-4" /> Collections</Button>
          </Link>
          <Link href="/invoices/export">
            <Button className="gap-2" variant="secondary"><FileSpreadsheet className="h-4 w-4" /> Export</Button>
          </Link>
          <Link href="/invoices/new"><Button className="gap-2"><Plus className="h-4 w-4" /> New Invoice</Button></Link>
        </div>
      </div>

      <Card className="p-0">
        <form className="flex gap-3 border-b border-white/5 p-5" method="get">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="pl-10" defaultValue={params.search} name="search" placeholder="Invoice number or customer..." />
          </label>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-xs text-slate-500">
          <span>{result.total.toLocaleString()} invoices</span>
          <span>Page {result.page} of {result.totalPages}</span>
        </div>
        <div className="divide-y divide-white/5 md:hidden">
          {result.rows.map((invoice) => (
            <Link className="block space-y-4 p-5 transition hover:bg-white/[0.02]" href={`/invoices/${invoice.id}`} key={invoice.id}>
              <div className="flex items-start justify-between gap-3"><p className="font-mono text-sm text-blue-200">{invoice.invoiceNumber || "DRAFT"}</p><div className="flex flex-wrap justify-end gap-2"><StatusBadge status={invoice.effectiveStatus} />{invoice.isOverdue && invoice.effectiveStatus === "partially_paid" ? <StatusBadge status="overdue" /> : null}</div></div>
              <div><p className="truncate text-sm font-medium text-white">{invoice.customerName || "Customer snapshot unavailable"}</p><p className="mt-1 text-xs text-slate-500">{invoice.invoiceDate || "N/A"}</p></div>
              <div className="grid grid-cols-3 gap-3 text-xs"><div><p className="text-slate-600">Net payable</p><p className="mt-1 font-semibold text-white">{invoice.currency || "IDR"} {formatCurrencyAmount(invoice.netPayable, invoice.currency || "IDR")}</p></div><div className="text-right"><p className="text-slate-600">Paid</p><p className="mt-1 font-semibold text-emerald-200">{formatCurrencyAmount(invoice.amountPaid, invoice.currency || "IDR")}</p></div><div className="text-right"><p className="text-slate-600">Outstanding</p><p className="mt-1 font-semibold text-amber-100">{formatCurrencyAmount(invoice.outstanding, invoice.currency || "IDR")}</p></div></div>
            </Link>
          ))}
          {result.rows.length === 0 ? <div className="p-10 text-center text-sm text-slate-500"><ReceiptText className="mx-auto mb-3 h-10 w-10 text-slate-700" />No invoices found.</div> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1080px] text-left">
            <thead className="bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">Invoice</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Net payable</th>
                <th className="px-5 py-4 text-right">Paid</th>
                <th className="px-5 py-4 text-right">Outstanding</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.rows.map((invoice) => (
                <tr className="transition hover:bg-white/[0.02]" key={invoice.id}>
                  <td className="px-5 py-4 font-mono text-sm text-blue-200">{invoice.invoiceNumber || "DRAFT"}</td>
                  <td className="px-5 py-4 text-sm">{invoice.customerName || "Customer snapshot unavailable"}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{invoice.invoiceDate || "N/A"}</td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><StatusBadge label={invoiceStatusLabel(invoice.effectiveStatus)} status={invoice.effectiveStatus} />{invoice.isOverdue && invoice.effectiveStatus === "partially_paid" ? <StatusBadge status="overdue" /> : null}</div></td>
                  <td className="px-5 py-4 text-right text-sm font-semibold">
                    {invoice.currency || "IDR"} {formatCurrencyAmount(invoice.netPayable, invoice.currency || "IDR")}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-200">
                    {invoice.currency || "IDR"} {formatCurrencyAmount(invoice.amountPaid, invoice.currency || "IDR")}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-amber-100">
                    {invoice.currency || "IDR"} {formatCurrencyAmount(invoice.outstanding, invoice.currency || "IDR")}
                  </td>
                  <td className="px-5 py-4 text-right"><Link href={`/invoices/${invoice.id}`}><Button variant="secondary">Open</Button></Link></td>
                </tr>
              ))}
              {result.rows.length === 0 ? (
                <tr><td className="py-14 text-center text-slate-500" colSpan={8}><ReceiptText className="mx-auto mb-3 h-10 w-10 text-slate-700" />No invoices found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-white/5 p-5">
          {result.page > 1 ? <Link href={pageHref(result.page - 1)}><Button variant="secondary">Previous</Button></Link> : <span />}
          {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)}><Button variant="secondary">Next</Button></Link> : <span />}
        </div>
      </Card>
    </div>
  );
}
