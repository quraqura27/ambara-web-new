import Link from "next/link";
import { ArrowLeft, Search, Truck } from "lucide-react";

import { createDeliveryBatchFromForm, getAvailableParcelsForBatch } from "@/actions/vendor-tracking";
import { Button, Card, Input } from "@/components/ui/core";

type NewDeliveryBatchPageProps = {
  searchParams?: Promise<{ error?: string; notice?: string; search?: string }>;
};

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30";

function MessageBanner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;

  return (
    <div
      className={
        error
          ? "rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          : "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
      }
    >
      {error || notice}
    </div>
  );
}

export default async function NewDeliveryBatchPage({ searchParams }: NewDeliveryBatchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = resolvedSearchParams?.search?.trim() ?? "";
  const availableParcels = await getAvailableParcelsForBatch(search);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/delivery-batches">
          <Button className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Delivery Batch</h2>
          <p className="mt-1 text-slate-500">
            Select shipments and prepare a vendor handover batch.
          </p>
        </div>
      </div>

      <MessageBanner error={resolvedSearchParams?.error} notice={resolvedSearchParams?.notice} />

      <Card className="p-0">
        <div className="border-b border-white/5 p-6">
          <form className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-10"
              defaultValue={search}
              name="search"
              placeholder="Search shipment, receiver, tracking, or city..."
            />
          </form>
        </div>

        <form action={createDeliveryBatchFromForm}>
          <div className="grid gap-5 border-b border-white/5 p-6 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Vendor Name *
              </span>
              <Input name="vendorName" placeholder="e.g. JNT Cargo" required />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Vendor Service
              </span>
              <Input name="vendorServiceType" placeholder="e.g. Regular" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Handover Date
              </span>
              <Input name="handoverDate" type="date" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                SLA Deadline
              </span>
              <Input name="slaDeadline" type="datetime-local" />
            </label>
            <label className="block space-y-2 lg:col-span-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Notes
              </span>
              <textarea className={fieldClassName} name="notes" rows={2} />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Select</th>
                  <th className="px-6 py-4">Shipment</th>
                  <th className="px-6 py-4">Receiver</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Load</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {availableParcels.map((parcel) => (
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
                      <p className="text-sm font-medium text-slate-200">{parcel.receiverName}</p>
                      <p className="text-xs text-slate-500">{parcel.receiverPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {parcel.destinationCity}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {parcel.weight} kg / {parcel.pieces} pieces
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-blue-300">
                        {parcel.currentStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {availableParcels.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-sm text-slate-500" colSpan={6}>
                      No unassigned shipments found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 p-6">
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Truck className="h-4 w-4" />
              Available shipments for delivery: {availableParcels.length}
            </p>
            <Button type="submit">Create Batch</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
