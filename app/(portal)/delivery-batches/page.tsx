import Link from "next/link";
import { CalendarClock, PackageCheck, Plus, Search, Truck } from "lucide-react";

import { getDeliveryBatchPage } from "@/actions/vendor-tracking";
import { Button, Card, Input } from "@/components/ui/core";

type DeliveryBatchesPageProps = {
  searchParams: Promise<{ from?: string; page?: string; search?: string; sort?: "created_asc" | "created_desc" | "sla_asc"; to?: string; view?: "delivery_issues" | "missing_tracking" | "overdue" }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default async function DeliveryBatchesPage({ searchParams }: DeliveryBatchesPageProps) {
  const params = await searchParams;
  const result = await getDeliveryBatchPage({
    from: params.from,
    page: Number.parseInt(params.page ?? "1", 10) || 1,
    search: params.search,
    sort: params.sort,
    to: params.to,
    view: params.view ?? "",
  });
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.from) query.set("from", params.from);
    if (params.sort) query.set("sort", params.sort);
    if (params.to) query.set("to", params.to);
    if (params.view) query.set("view", params.view);
    query.set("page", String(page));
    return `/delivery-batches?${query}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Delivery Batches</h1><p className="mt-1 text-slate-500">Start with overdue, issue, or missing-tracking work.</p></div>
        <Link href="/delivery-batches/new"><Button className="gap-2"><Plus className="h-4 w-4" /> Create Batch</Button></Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {[["", "All batches"], ["overdue", "Overdue"], ["delivery_issues", "Delivery issues"], ["missing_tracking", "Missing tracking"]].map(([view, label]) => (
          <Link className={`rounded-full border px-4 py-2 text-xs font-semibold ${params.view === view || (!params.view && !view) ? "border-blue-500/30 bg-blue-500/10 text-blue-200" : "border-white/10 text-slate-400"}`} href={view ? `/delivery-batches?view=${view}` : "/delivery-batches"} key={view}>{label}</Link>
        ))}
      </div>
      <Card className="p-0">
        <form className="grid gap-3 border-b border-white/5 p-5 md:grid-cols-2 xl:grid-cols-[1fr_160px_160px_180px_auto]" method="get">
          {params.view ? <input name="view" type="hidden" value={params.view} /> : null}
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="pl-10" defaultValue={params.search} name="search" placeholder="Batch code, vendor, or service..." />
          </label>
          <Input aria-label="Created from date" defaultValue={params.from} name="from" title="Created from" type="date" />
          <Input aria-label="Created to date" defaultValue={params.to} name="to" title="Created to" type="date" />
          <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" defaultValue={params.sort ?? "created_desc"} name="sort">
            <option value="created_desc">Newest batches</option>
            <option value="created_asc">Oldest batches</option>
            <option value="sla_asc">Earliest SLA</option>
          </select>
          <Button type="submit" variant="secondary">Search Batches</Button>
        </form>
        <div className="flex justify-between border-b border-white/5 px-5 py-3 text-xs text-slate-500"><span>{result.total} batches</span><span>Page {result.page} of {result.totalPages}</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="sticky top-0 bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Priority</th><th className="px-5 py-4">Batch</th><th className="px-5 py-4">Vendor</th><th className="px-5 py-4">Parcels</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Counts</th><th className="px-5 py-4">Check / SLA</th><th className="px-5 py-4 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {result.rows.map((batch) => (
                <tr className="transition hover:bg-white/[0.02]" key={batch.id}>
                  <td className="px-5 py-4"><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-bold">{batch.priority}</span></td>
                  <td className="px-5 py-4"><Link className="font-mono text-sm font-semibold text-blue-300" href={`/delivery-batches/${batch.id}`}>{batch.batchCode}</Link><p className="text-xs text-slate-500">{formatDate(batch.createdAt)}</p></td>
                  <td className="px-5 py-4"><p className="text-sm text-slate-200">{batch.vendorName}</p><p className="text-xs text-slate-500">{batch.vendorServiceType || "-"}</p></td>
                  <td className="px-5 py-4 text-sm">{batch.totalParcels}</td>
                  <td className="px-5 py-4 text-xs font-semibold uppercase text-slate-300">{batch.batchStatus.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4 text-xs text-slate-500"><p className="flex gap-2"><PackageCheck className="h-3.5 w-3.5 text-emerald-400" /> Delivered: {batch.deliveredCount}</p><p className="mt-1 flex gap-2"><Truck className="h-3.5 w-3.5 text-rose-300" /> Issues: {batch.deliveryIssueCount}</p><p className="mt-1">Missing tracking: {batch.missingVendorTrackingCount}</p></td>
                  <td className="px-5 py-4 text-xs text-slate-500"><p className="flex gap-2"><CalendarClock className="h-3.5 w-3.5" /> {formatDate(batch.lastCheckedAt)}</p><p className="mt-1">SLA: {formatDate(batch.slaDeadline)}</p></td>
                  <td className="px-5 py-4 text-right"><Link href={`/delivery-batches/${batch.id}`}><Button variant="secondary">Open Batch</Button></Link></td>
                </tr>
              ))}
              {result.rows.length === 0 ? <tr><td className="py-14 text-center text-slate-500" colSpan={8}>No delivery batches match this view.</td></tr> : null}
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
