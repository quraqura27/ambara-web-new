import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConsignmentNotePrintDocument } from "@/components/consignment-notes/consignment-note-print";
import { getConsignmentNoteForTrackingNo } from "@/lib/consignment-notes/database";

type ConsignmentNotePageProps = {
  params: Promise<{ number: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Print Consignment Note | Ambara Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ConsignmentNotePage({ params }: ConsignmentNotePageProps) {
  const { number } = await params;
  const result = await getConsignmentNoteForTrackingNo(decodeURIComponent(number));

  if (!result) {
    notFound();
  }

  return (
    <ConsignmentNotePrintDocument
      labels={result.labels}
      title={`Consignment Note ${result.trackingNo}`}
    />
  );
}
