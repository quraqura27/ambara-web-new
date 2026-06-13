import Link from "next/link";
import { ArrowRight, CalendarClock, PackageCheck, Plus, Truck } from "lucide-react";

import { getDeliveryBatchDashboard } from "@/actions/vendor-tracking";
import { Button, Card } from "@/components/ui/core";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function statusClassName(status: string) {
  if (status === "DELIVERED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "DELIVERY_ISSUE") return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  if (status === "VENDOR_TRACKING_IMPORTED") return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-300";
}

export default async function DeliveryBatchesPage() {
  const batches = await getDeliveryBatchDashboard();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Delivery Batches</h2>
          <p className="mt-1 text-slate-500">
            Monitor vendor handovers, imported tracking numbers, and batch-level status work.
          </p>
        </div>
        <Link href="/delivery-batches/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Batch
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Parcels</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Counts</th>
                <th className="px-6 py-4">Check / SLA</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {batches.map((batch) => (
                <tr key={batch.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white">
                      {batch.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm font-semibold text-white">{batch.batchCode}</p>
                    <p className="text-xs text-slate-500">{formatDate(batch.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-200">{batch.vendorName}</p>
                    <p className="text-xs text-slate-500">{batch.vendorServiceType || "-"}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{batch.totalParcels}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight ${statusClassName(
                        batch.batchStatus,
                      )}`}
                    >
                      {batch.batchStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-2">
                        <PackageCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Delivered: {batch.deliveredCount}
                      </p>
                      <p className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-rose-300" />
                        Issues: {batch.deliveryIssueCount}
                      </p>
                      <p>Missing vendor tracking: {batch.missingVendorTrackingCount}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(batch.lastCheckedAt)}
                      </p>
                      <p>SLA: {formatDate(batch.slaDeadline)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/delivery-batches/${batch.id}`}>
                      <Button className="h-auto p-2" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {batches.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-slate-500" colSpan={8}>
                    No delivery batches yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
