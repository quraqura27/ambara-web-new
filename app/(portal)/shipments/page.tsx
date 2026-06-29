import Link from "next/link";
import { Copy, FileText, MapPin, Package, Plus, Printer, Search, Truck } from "lucide-react";

import { getShipmentsPage } from "@/actions/shipments";
import { BulkPrintConsignmentNotesButton } from "@/components/consignment-notes/bulk-print-button";
import { Button, Card, Input } from "@/components/ui/core";
import { canUseMawbWorkflow } from "@/lib/mawbs/core";
import { getPortalUser } from "@/lib/portal-auth";
import { shipmentStatusDefinitions, shipmentStatusValues } from "@/lib/shipments/status-model";

type ShipmentsPageProps = {
  searchParams: Promise<{
    page?: string;
    from?: string;
    search?: string;
    sort?: "created_desc" | "tracking_asc" | "updated_asc" | "updated_desc";
    status?: string;
    to?: string;
    view?: "in_transit" | "needs_attention" | "updated_today";
  }>;
};

function statusClassName(status: string) {
  if (status === "delivered") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (["exception", "delivery_issue", "cancelled"].includes(status)) return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  if (["in_transit", "departed_origin", "customs", "arrived_destination", "out_for_delivery"].includes(status)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
  return "border-blue-500/20 bg-blue-500/10 text-blue-300";
}

export default async function ShipmentsPage({ searchParams }: ShipmentsPageProps) {
  const params = await searchParams;
  const result = await getShipmentsPage({
    page: Number.parseInt(params.page ?? "1", 10) || 1,
    from: params.from,
    search: params.search,
    sort: params.sort,
    status: params.status,
    to: params.to,
    view: params.view ?? "",
  });
  const user = await getPortalUser();
  const canUseMawbs = canUseMawbWorkflow(user);
  const makeHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.from) query.set("from", params.from);
    if (params.sort) query.set("sort", params.sort);
    if (params.status) query.set("status", params.status);
    if (params.to) query.set("to", params.to);
    if (params.view) query.set("view", params.view);
    query.set("page", String(page));
    return `/shipments?${query}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="mt-1 text-slate-500">Find shipments, review status, print consignment notes, or create a new record.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <BulkPrintConsignmentNotesButton />
          {canUseMawbs ? (
            <Link href="/shipments/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Shipment
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Saved shipment views">
        {[
          ["", "All shipments"],
          ["needs_attention", "Needs attention"],
          ["in_transit", "In transit"],
          ["updated_today", "Updated today"],
        ].map(([view, label]) => (
          <Link
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${params.view === view || (!params.view && !view) ? "border-blue-500/30 bg-blue-500/10 text-blue-200" : "border-white/10 text-slate-400 hover:text-white"}`}
            href={view ? `/shipments?view=${view}` : "/shipments"}
            key={view}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card className="p-0">
        <form className="grid gap-4 border-b border-white/5 p-5 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_160px_160px_190px_auto]" method="get">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="pl-10" defaultValue={params.search} name="search" placeholder="Tracking, AWB, reference, customer, route..." />
          </label>
          <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" defaultValue={params.status ?? ""} name="status">
            <option value="">All statuses</option>
            {shipmentStatusValues.map((status) => <option key={status} value={status}>{shipmentStatusDefinitions[status].label}</option>)}
          </select>
          <Input aria-label="Updated from date" defaultValue={params.from} name="from" title="Updated from" type="date" />
          <Input aria-label="Updated to date" defaultValue={params.to} name="to" title="Updated to" type="date" />
          <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" defaultValue={params.sort ?? "updated_desc"} name="sort">
            <option value="updated_desc">Recently updated</option>
            <option value="updated_asc">Oldest update</option>
            <option value="created_desc">Recently created</option>
            <option value="tracking_asc">Tracking number</option>
          </select>
          <Button type="submit" variant="secondary">Apply Filters</Button>
        </form>

        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-xs text-slate-500">
          <span>{result.total.toLocaleString()} matching shipments</span>
          <span>Page {result.page} of {result.totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="sticky top-0 z-10 bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="w-12 px-5 py-4">CN</th><th className="px-5 py-4">Shipment</th><th className="px-5 py-4">Route</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.rows.map((shipment) => {
                const customerLabel = shipment.customerFullName || shipment.customerCompanyName || shipment.customerName || "Unlinked";
                const cn = shipment.internalTrackingNo ?? "";
                return (
                  <tr className="transition hover:bg-white/[0.02]" key={shipment.id}>
                    <td className="px-5 py-4"><input aria-label={`Select ${shipment.trackingNumber} for consignment note printing`} disabled={!cn} name="cnTrackingNo" type="checkbox" value={cn} /></td>
                    <td className="px-5 py-4">
                      <Link className="font-mono text-sm font-semibold text-blue-300 hover:text-blue-200" href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}>{shipment.trackingNumber}</Link>
                      <p className="mt-1 max-w-60 truncate text-xs text-slate-500">{shipment.title}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> {shipment.origin}</p>
                      <p className="mt-1 flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {shipment.destination}</p>
                    </td>
                    <td className="px-5 py-4"><p className="text-sm text-slate-300">{customerLabel}</p><p className="text-xs text-slate-600">{shipment.customerEmail || "No email"}</p></td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${statusClassName(shipment.status)}`}>{shipment.status.replace(/_/g, " ")}</span></td>
                    <td className="px-5 py-4 text-xs text-slate-500">{shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleDateString() : "N/A"}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {cn ? <Link href={`/shipments/${encodeURIComponent(cn)}/consignment-note`}><Button className="gap-2" variant="ghost"><Printer className="h-4 w-4" /> Print</Button></Link> : null}
                        {canUseMawbs ? (
                          <Link href={`/shipments/new?copyFrom=${encodeURIComponent(shipment.trackingNumber)}`}>
                            <Button className="gap-2" variant="ghost">
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                          </Link>
                        ) : null}
                        {canUseMawbs ? (
                          <Link href={`/mawbs/new?shipment=${encodeURIComponent(shipment.trackingNumber)}`}>
                            <Button className="gap-2" variant="ghost">
                              <FileText className="h-4 w-4" />
                              MAWB
                            </Button>
                          </Link>
                        ) : null}
                        <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}><Button variant="secondary">Open</Button></Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {result.rows.length === 0 ? (
                <tr><td className="px-6 py-14 text-center text-slate-500" colSpan={7}><Package className="mx-auto mb-3 h-10 w-10 text-slate-700" />No shipments match these filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 p-5">
          {result.page > 1 ? <Link href={makeHref(result.page - 1)}><Button variant="secondary">Previous</Button></Link> : <span />}
          {result.page < result.totalPages ? <Link href={makeHref(result.page + 1)}><Button variant="secondary">Next</Button></Link> : <span />}
        </div>
      </Card>
    </div>
  );
}
