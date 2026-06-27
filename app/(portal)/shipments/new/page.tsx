import { randomUUID } from "crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getCustomersForSelect } from "@/actions/shipments";
import { MawbShipmentForm } from "@/components/portal/mawb-shipment-form";
import { Button } from "@/components/ui/core";

export default async function NewShipmentPage() {
  const customers = await getCustomersForSelect();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button aria-label="Back to shipments" className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Shipments + MAWB</h1>
          <p className="mt-1 text-slate-500">
            Enter one MAWB header, then add one shipment line for each tracking number/CN.
          </p>
        </div>
      </div>

      <MawbShipmentForm
        customers={customers}
        idempotencyKey={randomUUID()}
      />
    </div>
  );
}
