import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";

import { getMawbsPage } from "@/actions/mawbs";
import { Button, Card, Input } from "@/components/ui/core";

type MawbsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
};

function actionLabel(value: string) {
  if (value === "create_shipment") return "Created shipment";
  if (value === "link_shipment") return "Linked shipment";
  return "Print/store only";
}

export default async function MawbsPage({ searchParams }: MawbsPageProps) {
  const params = await searchParams;
  const result = await getMawbsPage({
    page: Number.parseInt(params.page ?? "1", 10) || 1,
    search: params.search,
  });
  const makeHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    query.set("page", String(page));
    return `/mawbs?${query}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MAWB Documents</h1>
          <p className="mt-1 text-slate-500">Review, print, download, and correct MAWB workbook records.</p>
        </div>
        <Link href="/shipments/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Shipments + MAWB
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        <form className="flex flex-col gap-3 border-b border-white/5 p-5 sm:flex-row" method="get">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-10"
              defaultValue={params.search}
              name="search"
              placeholder="MAWB, carrier, shipper, consignee, tracking..."
            />
          </label>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-xs text-slate-500">
          <span>{result.total.toLocaleString()} matching MAWB documents</span>
          <span>Page {result.page} of {result.totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="sticky top-0 z-10 bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">MAWB</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Parties</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Shipment</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.rows.map((mawb) => (
                <tr className="transition hover:bg-white/[0.02]" key={mawb.id}>
                  <td className="px-5 py-4">
                    <Link className="font-mono text-sm font-semibold text-blue-300 hover:text-blue-200" href={`/mawbs/${mawb.id}`}>
                      {mawb.mawbNumber}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{mawb.carrierCode} / {mawb.carrierName}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{mawb.originIata} → {mawb.destinationIata}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    <p>{mawb.shipperName}</p>
                    <p className="mt-1">{mawb.consigneeName}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">{actionLabel(mawb.actionMode)}</td>
                  <td className="px-5 py-4">
                    {mawb.shipmentTrackingNumber ? (
                      <Link className="font-mono text-xs text-blue-300 hover:text-blue-200" href={`/shipments/${encodeURIComponent(mawb.shipmentTrackingNumber)}`}>
                        {mawb.shipmentTrackingNumber}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600">No link</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {mawb.createdAt ? new Date(mawb.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/mawbs/${mawb.id}`}>
                      <Button variant="secondary">Open</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-slate-500" colSpan={7}>
                    <FileText className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                    No MAWB documents match these filters.
                  </td>
                </tr>
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
