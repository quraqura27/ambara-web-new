import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  PackageCheck,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  bulkUpdateBatchStatusFromForm,
  getDeliveryBatchDetail,
  markBatchCheckedNoChange,
} from "@/actions/vendor-tracking";
import { Button, Card, cn } from "@/components/ui/core";
import { VendorStatusUpdateForm } from "@/components/vendor-tracking/vendor-status-update-form";
import { VendorTrackingImportForm } from "@/components/vendor-tracking/vendor-tracking-import-form";

type DeliveryBatchDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; notice?: string }>;
};

const updateStatusOptions = [
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DELIVERY_ISSUE", label: "Delivery Issue" },
  { value: "RETURN_IN_PROGRESS", label: "Return in Progress" },
  { value: "ON_HOLD", label: "On Hold" },
];

function parseBatchId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function statusClassName(status: string) {
  if (status === "DELIVERED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "DELIVERY_ISSUE") return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  if (status === "OUT_FOR_DELIVERY") return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-blue-500/20 bg-blue-500/10 text-blue-300";
}

function MessageBanner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {error || notice}
    </div>
  );
}

function StatusSelect({ name = "status" }: { name?: string }) {
  return (
    <select
      className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
      name={name}
    >
      {updateStatusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default async function DeliveryBatchDetailPage({
  params,
  searchParams,
}: DeliveryBatchDetailPageProps) {
  const { id } = await params;
  const batchId = parseBatchId(id);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { batch, parcels, summary } = await getDeliveryBatchDetail(batchId);
  const markCheckedAction = markBatchCheckedNoChange.bind(null, batch.id);
  const bulkUpdateAction = bulkUpdateBatchStatusFromForm.bind(null, batch.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/delivery-batches">
            <Button className="h-auto rounded-full p-2" type="button" variant="ghost">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{batch.batchCode}</h2>
            <p className="mt-1 text-slate-500">
              {batch.vendorName} / {batch.vendorServiceType || "Standard service"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`/delivery-batches/${batch.id}/export`}>
            <Button className="gap-2" variant="secondary">
              <Download className="h-4 w-4" />
              Export Batch
            </Button>
          </a>
          <form action={markCheckedAction}>
            <Button className="gap-2" type="submit" variant="ghost">
              <RefreshCw className="h-4 w-4" />
              Mark Checked
            </Button>
          </form>
        </div>
      </div>

      <MessageBanner error={resolvedSearchParams?.error} notice={resolvedSearchParams?.notice} />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Parcels", batch.totalParcels],
          ["Delivered", summary.deliveredCount],
          ["Issues", summary.issueCount],
          ["Missing Tracking", summary.missingVendorTrackingCount],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <div className="grid gap-4 border-b border-white/5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Parcel Rows
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              Last checked: {formatDate(batch.lastCheckedAt)} / SLA: {formatDate(batch.slaDeadline)}
            </p>
          </div>
          <form action={bulkUpdateAction} className="flex flex-wrap items-center gap-3">
            <input name="scope" type="hidden" value="all" />
            <StatusSelect />
            <Button className="gap-2" type="submit" variant="secondary">
              <PackageCheck className="h-4 w-4" />
              Bulk Update All
            </Button>
          </form>
        </div>

        <form action={bulkUpdateAction}>
          <input name="scope" type="hidden" value="selected" />
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-6">
            <StatusSelect />
            <Button className="gap-2" type="submit">
              <CheckCircle2 className="h-4 w-4" />
              Bulk Update Selected
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Select</th>
                  <th className="px-6 py-4">Ambara Parcel</th>
                  <th className="px-6 py-4">Vendor Tracking</th>
                  <th className="px-6 py-4">Receiver</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vendor Event</th>
                  <th className="px-6 py-4">POD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parcels.map((parcel) => (
                  <tr key={parcel.id} className="align-top transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <input
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                        name="parcelIds"
                        type="checkbox"
                        value={parcel.id}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-white">
                        {parcel.ambaraParcelId}
                      </p>
                      <p className="text-xs text-slate-500">{parcel.shipmentTrackingNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-slate-300">
                        {parcel.vendorTrackingNumber || "-"}
                      </p>
                      <p className="text-xs text-slate-500">{parcel.exportRowId || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-200">{parcel.receiverName}</p>
                      <p className="text-xs text-slate-500">{parcel.receiverPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {parcel.destinationCity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight ${statusClassName(
                          parcel.currentStatus,
                        )}`}
                      >
                        {parcel.currentStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <p>{parcel.lastVendorStatus || "-"}</p>
                      <p>{formatDate(parcel.lastVendorEventTime)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {parcel.podUrl ? (
                        <a className="text-xs font-semibold text-blue-300" href={parcel.podUrl}>
                          Open
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      </Card>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Upload className="h-4 w-4" />
            Vendor Tracking Import
          </div>
          <VendorTrackingImportForm batchId={batch.id} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Upload className="h-4 w-4" />
            Vendor Status Report
          </div>
          <VendorStatusUpdateForm batchId={batch.id} />
        </div>
      </div>
    </div>
  );
}
