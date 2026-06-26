import { randomUUID } from "crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { getMawbCustomerOptions } from "@/actions/mawbs";
import { MawbForm } from "@/components/mawbs/mawb-form";
import { Button } from "@/components/ui/core";
import { canOverwriteShipmentFromMawb, canUseMawbWorkflow } from "@/lib/mawbs/core";
import { requirePortalUser } from "@/lib/portal-auth";

type NewMawbPageProps = {
  searchParams: Promise<{
    shipment?: string;
  }>;
};

export default async function NewMawbPage({ searchParams }: NewMawbPageProps) {
  const user = await requirePortalUser();
  if (!canUseMawbWorkflow(user)) redirect("/dashboard");

  const params = await searchParams;
  const initialShipmentTracking = params.shipment?.trim() ?? "";
  const customers = await getMawbCustomerOptions();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/mawbs">
          <Button aria-label="Back to MAWB documents" className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New MAWB</h1>
          <p className="mt-1 text-slate-500">Input MAWB data once, then save it with a shipment action.</p>
        </div>
      </div>

      <MawbForm
        canOverwrite={canOverwriteShipmentFromMawb(user)}
        customers={customers}
        idempotencyKey={randomUUID()}
        initialActionMode={initialShipmentTracking ? "link_shipment" : "create_shipment"}
        initialShipmentTracking={initialShipmentTracking}
      />
    </div>
  );
}
