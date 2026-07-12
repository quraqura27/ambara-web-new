import { notFound } from "next/navigation";

import { ShipmentLifecycleActions } from "@/components/portal/shipment-lifecycle-actions";
import { Card } from "@/components/ui/core";

export default function ShipmentVoidPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Shipment Lifecycle Preview</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <ShipmentLifecycleActions
            blockedBySafeguard={false}
            canRestore={false}
            defaultOpen
            isVoided={false}
            previewMode
            requiresElevatedOverride
            trackingNumber="AA26-PREVIEW-0001"
            warnings={[
              "Tracking history will be preserved.",
              "This shipment is linked to a MAWB record.",
              "Shipment documents will be preserved.",
            ]}
          />
        </Card>

        <Card className="p-6">
          <ShipmentLifecycleActions
            blockedBySafeguard={false}
            canRestore
            defaultOpen
            isVoided
            previewMode
            requiresElevatedOverride={false}
            trackingNumber="AA26-PREVIEW-0002"
            warnings={[]}
          />
        </Card>
      </div>
    </div>
  );
}
