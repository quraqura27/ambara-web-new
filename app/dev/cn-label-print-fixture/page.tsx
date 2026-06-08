import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConsignmentNotePrintDocument } from "@/components/consignment-notes/consignment-note-print";
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

export default function ConsignmentNotePrintFixturePage() {
  // Temporary Preview/dev-only physical print fixture. Remove before Production merge/deploy.
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <ConsignmentNotePrintDocument
      labels={fixtureLabels}
      title="CN Label Print Fixture"
    />
  );
}
