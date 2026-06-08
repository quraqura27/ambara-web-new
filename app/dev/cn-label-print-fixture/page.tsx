import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ConsignmentNotePrintDocument,
  type ConsignmentNotePrintMode,
} from "@/components/consignment-notes/consignment-note-print";
import { expandShipmentToConsignmentNoteLabels } from "@/lib/consignment-notes/label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CN Label Print Fixture | Ambara Portal",
  robots: {
    index: false,
    follow: false,
  },
};

const fixtureLabels = expandShipmentToConsignmentNoteLabels({
  chargeableWeight: "12.5",
  commodity: "General Cargo",
  consigneeName: "Fixture Consignee",
  destination: "Jakarta",
  destinationIata: "CGK",
  goodsDescription: "Fixture cartons for print calibration",
  internalTrackingNo: "AA26-TEST-0001",
  origin: "Singapore",
  originIata: "SIN",
  serviceType: "Air Freight",
  shipperName: "Fixture Shipper",
  totalPcs: 5,
});

type ConsignmentNotePrintFixturePageProps = {
  searchParams?: Promise<{ printMode?: string | string[] }>;
};

function resolvePrintMode(printMode: string | string[] | undefined): ConsignmentNotePrintMode {
  const value = Array.isArray(printMode) ? printMode[0] : printMode;
  return value === "rotated" ? "rotated" : "normal";
}

export default async function ConsignmentNotePrintFixturePage({
  searchParams,
}: ConsignmentNotePrintFixturePageProps) {
  // Temporary Preview/dev-only physical print fixture. Remove before Production merge/deploy.
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const printMode = resolvePrintMode(resolvedSearchParams?.printMode);

  return (
    <ConsignmentNotePrintDocument
      labels={fixtureLabels}
      normalModeHref="/dev/cn-label-print-fixture"
      printMode={printMode}
      rotatedModeHref="/dev/cn-label-print-fixture?printMode=rotated"
      title="CN Label Print Fixture"
    />
  );
}
