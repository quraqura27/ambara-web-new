import type { Metadata } from "next";

import { ConsignmentNotePrintDocument } from "@/components/consignment-notes/consignment-note-print";
import { getBulkConsignmentNotesForTrackingNos } from "@/lib/consignment-notes/database";
import { normalizeConsignmentNoteIds } from "@/lib/consignment-notes/label";

type BulkConsignmentNotesPrintPageProps = {
  searchParams?: Promise<{ ids?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bulk Print Consignment Notes | Ambara Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BulkConsignmentNotesPrintPage({
  searchParams,
}: BulkConsignmentNotesPrintPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedTrackingNos = normalizeConsignmentNoteIds(resolvedSearchParams?.ids);
  const model = await getBulkConsignmentNotesForTrackingNos(requestedTrackingNos);

  return (
    <ConsignmentNotePrintDocument
      labels={model.labels}
      missingTrackingNos={model.missingTrackingNos}
      title="Bulk Consignment Notes"
    />
  );
}
