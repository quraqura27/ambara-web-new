import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ConsignmentNotePrintDocument,
  type ConsignmentNotePrintMode,
} from "@/components/consignment-notes/consignment-note-print";
import { getConsignmentNoteForTrackingNo } from "@/lib/consignment-notes/database";

type ConsignmentNotePageProps = {
  params: Promise<{ number: string }>;
  searchParams?: Promise<{ printMode?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Print Consignment Note | Ambara Portal",
  robots: {
    index: false,
    follow: false,
  },
};

function resolvePrintMode(printMode: string | string[] | undefined): ConsignmentNotePrintMode {
  const value = Array.isArray(printMode) ? printMode[0] : printMode;
  return value === "rotated" ? "rotated" : "normal";
}

export default async function ConsignmentNotePage({ params, searchParams }: ConsignmentNotePageProps) {
  const { number } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const printMode = resolvePrintMode(resolvedSearchParams?.printMode);
  const encodedNumber = encodeURIComponent(number);
  const result = await getConsignmentNoteForTrackingNo(decodeURIComponent(number));

  if (!result) {
    notFound();
  }

  return (
    <ConsignmentNotePrintDocument
      labels={result.labels}
      normalModeHref={`/shipments/${encodedNumber}/consignment-note`}
      printMode={printMode}
      rotatedModeHref={`/shipments/${encodedNumber}/consignment-note?printMode=rotated`}
      title={`Consignment Note ${result.trackingNo}`}
    />
  );
}
