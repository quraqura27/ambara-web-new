"use server";

import { db } from "@/lib/db";
import { shipments, awbs } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

/**
 * UPDATE SHIPMENT STATUS
 * Transitions a shipment through its lifecycle.
 */
export async function updateShipmentStatus(id: number, status: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Check current status for locking
  const current = await db.query.shipments.findFirst({
    where: eq(shipments.id, id)
  });

  if (current?.status === "DELIVERED") {
    throw new Error("Shipment is already DELIVERED and cannot be modified.");
  }

  // 2. Perform Update
  const [updated] = await db.update(shipments)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(shipments.id, id))
    .returning();

  revalidatePath("/dashboard/shipments");
  return updated;
}

/**
 * BULK UPDATE SHIPMENT STATUS
 * Efficiently transitions multiple shipments at once.
 */
export async function bulkUpdateStatus(ids: number[], status: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const updated = await db.update(shipments)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(inArray(shipments.id, ids))
    .returning();

  revalidatePath("/dashboard/shipments");
  return updated;
}

/**
 * GET PUBLIC SHIPMENT (Unauthenticated)
 * Provides restricted visibility for end-customers scanning QR/Tracking IDs.
 */
export async function getPublicShipment(trackingNo: string) {
  const result = await db.query.shipments.findFirst({
    where: eq(shipments.internalTrackingNo, trackingNo),
  });

  if (!result) return null;

  const awbData = await db.query.awbs.findFirst({
    where: eq(awbs.shipmentId, result.id),
  });

  return {
    ...result,
    cargo: awbData ? {
      pieces: awbData.pieces,
      weight: awbData.chargeableWeight,
      carrier: awbData.carrier,
      flight: awbData.flightNumber
    } : null
  };
}

/**
 * GET SHIPMENTS FOR LABELS
 * Retrieves shipments with AWB metadata for thermal printing terminal.
 */
export async function getShipmentsForLabels() {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const results = await db.select({
    id: shipments.id,
    internalTrackingNo: shipments.internalTrackingNo,
    origin: shipments.origin,
    destination: shipments.destination,
    status: shipments.status,
    serviceType: shipments.serviceType,
    updatedAt: shipments.updatedAt,
    weight: awbs.chargeableWeight,
    pieces: awbs.pieces,
    carrier: awbs.carrier,
    awbNumber: awbs.awbNumber,
    shipper: awbs.shipper,
    consignee: awbs.consignee
  })
  .from(shipments)
  .leftJoin(awbs, eq(shipments.id, awbs.shipmentId))
  .orderBy(shipments.createdAt);

  return results;
}
