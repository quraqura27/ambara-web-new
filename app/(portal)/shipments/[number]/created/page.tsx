import Link from "next/link";
import { CheckCircle2, Copy, MapPin, Package, Plus, Printer } from "lucide-react";
import { notFound } from "next/navigation";

import { getShipmentByTracking } from "@/actions/shipments";
import { CopyTrackingButton } from "@/components/portal/copy-tracking-button";
import { Button, Card } from "@/components/ui/core";

type ShipmentCreatedPageProps = {
  params: Promise<{ number: string }>;
};

export default async function ShipmentCreatedPage({ params }: ShipmentCreatedPageProps) {
  const { number } = await params;
  const { shipment } = await getShipmentByTracking(number);
  if (!shipment) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-emerald-300">
          Shipment created
        </p>
        <h1 className="mt-2 break-all font-mono text-3xl font-bold text-white">
          {shipment.trackingNumber}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          One shipment, tracking number, and consignment note were created. The shipment starts at Received.
        </p>
        <div className="mt-8 grid gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-5 text-left sm:grid-cols-2">
          <div className="flex gap-3">
            <Package className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-semibold">{shipment.customerName || "Unlinked"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-xs text-slate-500">Route</p>
              <p className="font-semibold">{shipment.origin} → {shipment.destination}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <CopyTrackingButton trackingNumber={shipment.trackingNumber} />
        <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}/consignment-note`}>
          <Button className="w-full gap-2" variant="secondary">
            <Printer className="h-4 w-4" /> Print consignment note
          </Button>
        </Link>
        <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}>
          <Button className="w-full gap-2">
            <Package className="h-4 w-4" /> Open shipment
          </Button>
        </Link>
        <Link href={`/shipments/new?copyFrom=${encodeURIComponent(shipment.trackingNumber)}`}>
          <Button className="w-full gap-2" variant="secondary">
            <Copy className="h-4 w-4" /> Copy shipment
          </Button>
        </Link>
        <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}#tracking-update`}>
          <Button className="w-full gap-2" variant="secondary">
            <Plus className="h-4 w-4" /> Add first tracking update
          </Button>
        </Link>
      </div>
    </div>
  );
}
