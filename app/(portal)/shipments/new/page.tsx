import { randomUUID } from "crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  getCommonShipmentLocations,
  getCustomersForSelect,
  getShipmentByTracking,
} from "@/actions/shipments";
import {
  GuidedShipmentForm,
  type GuidedShipmentPrefillValues,
} from "@/components/portal/guided-shipment-form";
import { Button } from "@/components/ui/core";
import { buildGuidedShipmentCopyValues } from "@/lib/shipments/guided-copy";

type NewShipmentPageProps = {
  searchParams?: Promise<{ copyFrom?: string }>;
};

async function buildCopyPrefill(copyFrom: string): Promise<{
  notice?: string;
  values?: GuidedShipmentPrefillValues;
}> {
  if (!copyFrom) return {};

  const { flightLegs, parcels, shipment } = await getShipmentByTracking(copyFrom);
  if (!shipment) {
    return {
      notice: `Source shipment ${copyFrom} was not found. Start a blank shipment instead.`,
    };
  }

  return {
    notice: `Shipment details copied from ${shipment.trackingNumber}. Enter a new AWB/MAWB before creating.`,
    values: buildGuidedShipmentCopyValues({ flightLegs, parcels, shipment }),
  };
}

export default async function NewShipmentPage({ searchParams }: NewShipmentPageProps) {
  const params = await searchParams;
  const copyFrom = params?.copyFrom?.trim() ?? "";
  const [customers, locations, copyPrefill] = await Promise.all([
    getCustomersForSelect(),
    getCommonShipmentLocations(),
    buildCopyPrefill(copyFrom),
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
          <h1 className="text-3xl font-bold tracking-tight">Create Shipment</h1>
          <p className="mt-1 text-slate-500">
            Create one Ambara tracking number, CN, and optional MAWB workbook from one shipment input.
          </p>
        </div>
      </div>

      <GuidedShipmentForm
        copyNotice={copyPrefill.notice}
        customers={customers}
        idempotencyKey={randomUUID()}
        initialValues={copyPrefill.values}
        locations={locations}
      />
    </div>
  );
}
