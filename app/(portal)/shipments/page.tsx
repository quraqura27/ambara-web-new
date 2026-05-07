import Link from "next/link";
import { ArrowRight, MapPin, Package, Plus, Search, Truck } from "lucide-react";

import { getShipments, searchShipmentByTracking } from "@/actions/shipments";
import { Button, Card, Input } from "@/components/ui/core";

type ShipmentsPageProps = {
  searchParams?: Promise<{ search?: string }>;
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function statusClassName(status: string) {
  if (status === "delivered") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "exception") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-400";
  }

  if (status === "in_transit" || status === "departed_origin" || status === "arrived_destination") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  }

  return "border-blue-500/20 bg-blue-500/10 text-blue-500";
}

export default async function ShipmentsPage({ searchParams }: ShipmentsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = resolvedSearchParams?.search?.trim() ?? "";
  const shipments = await getShipments(search);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shipment List</h2>
          <p className="mt-1 text-slate-500">
            Review stored shipments, search tracking numbers, and open shipment details.
          </p>
        </div>
        <Link href="/shipments/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create New Shipment
          </Button>
        </Link>
      </div>

      <Card className="overflow-visible p-0">
        <div className="grid gap-4 border-b border-white/5 p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-10"
              defaultValue={search}
              name="search"
              placeholder="Search shipment, route, customer..."
            />
          </form>

          <form action={searchShipmentByTracking} className="flex flex-col gap-3 sm:flex-row">
            <Input
              className="min-w-0 flex-1"
              name="trackingNumber"
              placeholder="Jump to tracking number..."
            />
            <Button className="gap-2" type="submit" variant="secondary">
              Track <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Results: {shipments.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Shipment</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {shipments.map((shipment) => {
                const customerLabel =
                  shipment.customerFullName ||
                  shipment.customerCompanyName ||
                  shipment.customerName ||
                  "Unlinked";

                return (
                  <tr key={shipment.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-600/20 bg-blue-600/10 text-blue-400">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white transition-colors group-hover:text-blue-400">
                            {shipment.trackingNumber}
                          </p>
                          <p className="text-xs text-slate-500">{shipment.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-slate-400">
                        <p className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-slate-500" />
                          {shipment.origin}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {shipment.destination}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-300">{customerLabel}</p>
                      <p className="text-xs text-slate-600">
                        {shipment.customerEmail || (shipment.customerId ? `Customer #${shipment.customerId}` : "No customer linked")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight ${statusClassName(
                          shipment.status,
                        )}`}
                      >
                        {formatStatus(shipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {shipment.updatedAt
                        ? new Date(shipment.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/shipments/${shipment.trackingNumber}`}>
                        <Button className="h-auto p-2" variant="ghost">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {shipments.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={6}>
                    <div className="flex flex-col items-center">
                      <Package className="mb-4 h-12 w-12 text-slate-800" />
                      <p className="text-lg font-medium">No shipments found</p>
                      <p className="text-sm">
                        Try another search or create a new shipment record.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
