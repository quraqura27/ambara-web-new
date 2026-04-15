"use server";

import { db } from "@/lib/db";
import { shipments, awbs } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { createThermalLabel } from "@/lib/label-engine";

/**
 * GENERATE SHIPMENT LABELS (Bulk)
 * Fetches data and produces a multi-page PDF.
 */
export async function getShipmentLabels(ids: number[]) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch data
  const data = await db.select({
    internalTrackingNo: shipments.internalTrackingNo,
    trackingNumber: shipments.trackingNumber,
    carrier: awbs.carrier,
    origin: shipments.origin,
    destination: shipments.destination,
    pieces: awbs.pieces,
    weight: awbs.chargeableWeight,
    serviceType: shipments.serviceType,
  })
  .from(shipments)
  .leftJoin(awbs, eq(shipments.id, awbs.shipmentId))
  .where(inArray(shipments.id, ids));

  // Transform to required format
  const labelData = data.map(d => ({
    internalTrackingNo: d.internalTrackingNo || "",
    trackingNumber: d.trackingNumber || "",
    carrier: d.carrier || "GEN",
    origin: d.origin || "Unknown",
    destination: d.destination || "Unknown",
    pieces: d.pieces || 0,
    weight: d.weight || "0",
    serviceType: d.serviceType || "PP",
  }));

  const pdfBytes = await createThermalLabel(labelData);
  
  // Return as Base64 for client-side download
  // In a production app, we would upload to R2 and return a signed URL
  return Buffer.from(pdfBytes).toString("base64");
}
