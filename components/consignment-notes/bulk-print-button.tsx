"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/core";

export function BulkPrintConsignmentNotesButton() {
  function openBulkPrint() {
    const selectedTrackingNos = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="cnTrackingNo"]:checked'),
    )
      .map((input) => input.value)
      .filter(Boolean);

    if (selectedTrackingNos.length === 0) {
      window.alert("Select at least one shipment to print.");
      return;
    }

    const params = new URLSearchParams({
      ids: selectedTrackingNos.join(","),
    });

    window.open(`/shipments/consignment-notes/print?${params.toString()}`, "_blank", "noopener");
  }

  return (
    <Button className="gap-2" onClick={openBulkPrint} type="button" variant="secondary">
      <Printer className="h-4 w-4" />
      Bulk Print CN
    </Button>
  );
}
