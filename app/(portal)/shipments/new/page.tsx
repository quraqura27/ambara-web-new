import { randomUUID } from "crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getCommonShipmentLocations, getCustomersForSelect } from "@/actions/shipments";
import { GuidedShipmentForm } from "@/components/portal/guided-shipment-form";
import { Button } from "@/components/ui/core";

export default async function NewShipmentPage() {
  const [customers, locations] = await Promise.all([
    getCustomersForSelect(),
    getCommonShipmentLocations(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button aria-label="Back to shipments" className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Input One Shipment</h1>
          <p className="mt-1 text-slate-500">
            One submission creates one tracking number and one consignment note.
          </p>
        </div>
      </div>

      <GuidedShipmentForm
        customers={customers}
        idempotencyKey={randomUUID()}
        locations={locations}
      />
    </div>
  );
}
