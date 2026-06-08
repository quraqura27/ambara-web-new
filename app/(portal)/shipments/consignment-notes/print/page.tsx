import type { Metadata } from "next";

import {
  ConsignmentNotePrintDocument,
  type ConsignmentNotePrintMode,
} from "@/components/consignment-notes/consignment-note-print";
import { getBulkConsignmentNotesForTrackingNos } from "@/lib/consignment-notes/database";
import { normalizeConsignmentNoteIds } from "@/lib/consignment-notes/label";

type BulkConsignmentNotesPrintPageProps = {
  searchParams?: Promise<{ ids?: string | string[]; printMode?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bulk Print Consignment Notes | Ambara Portal",
  robots: {
    index: false,
    follow: false,
  },
};

function resolvePrintMode(printMode: string | string[] | undefined): ConsignmentNotePrintMode {
  const value = Array.isArray(printMode) ? printMode[0] : printMode;
  return value === "rotated" ? "rotated" : "normal";
}

function buildBulkPrintHref(ids: string, printMode: ConsignmentNotePrintMode) {
  const params = new URLSearchParams();
  if (ids) {
    params.set("ids", ids);
  }
  if (printMode === "rotated") {
    params.set("printMode", "rotated");
  }
  const query = params.toString();
  return query ? `/shipments/consignment-notes/print?${query}` : "/shipments/consignment-notes/print";
}

export default async function BulkConsignmentNotesPrintPage({
  searchParams,
}: BulkConsignmentNotesPrintPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedTrackingNos = normalizeConsignmentNoteIds(resolvedSearchParams?.ids);
  const printMode = resolvePrintMode(resolvedSearchParams?.printMode);
  const idsQuery = requestedTrackingNos.join(",");
  const model = await getBulkConsignmentNotesForTrackingNos(requestedTrackingNos);

  return (
    <ConsignmentNotePrintDocument
      labels={model.labels}
      missingTrackingNos={model.missingTrackingNos}
      normalModeHref={buildBulkPrintHref(idsQuery, "normal")}
      printMode={printMode}
      rotatedModeHref={buildBulkPrintHref(idsQuery, "rotated")}
      title="Bulk Consignment Notes"
    />
  );
}
