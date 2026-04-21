"use server";

import { db } from "@/lib/db";
import { shipments, awbs } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { generateInternalTrackingNo } from "@/lib/utils/id-gen";
import { customers as customerTable } from "@/lib/db/schema";

/**
 * UPDATE SHIPMENT STATUS
 * Transitions a shipment through its lifecycle.
 */
export async function updateShipmentStatus(id: number, status: string) {
  const { userId } = await auth();
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
  const { userId } = await auth();
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
 * CREATE NEW SHIPMENT
 * Manually initializes a shipment in the command center.
 */
export async function createShipment(data: any) {
  try {
    console.log("CREATE_SHIPMENT_START", { customerId: data.customerId });
    const { userId } = await auth();
    if (!userId) {
      console.error("CREATE_SHIPMENT_AUTH_FAIL: No userId");
      return { success: false, error: "Unauthorized: Please sign in again." };
    }

    const parsedCustomerId = parseInt(data.customerId);
    if (isNaN(parsedCustomerId)) {
      console.error("CREATE_SHIPMENT_VALIDATION_FAIL: Invalid customerId", data.customerId);
      return { success: false, error: "Invalid Customer: Please select a billing account." };
    }

    // 1. Resolve Billing Country for Tracking ID
    console.log("RESOLVING_CUSTOMER", parsedCustomerId);
    const customer = await db.query.customers.findFirst({
      where: eq(customerTable.id, parsedCustomerId)
    });

    console.log("GENERATING_TRACKING_NO", { country: customer?.countryCode, service: data.serviceType });
    const internalTrackingNo = generateInternalTrackingNo(
      customer?.countryCode || "ID",
      data.serviceType || "PP"
    );

    console.log("STARTING_TRANSACTION", { internalTrackingNo });
    const result = await db.transaction(async (tx) => {
      // 2. Main Shipment Write
      console.log("INSERTING_SHIPMENT");
      const [newShipment] = await tx.insert(shipments).values({
        internalTrackingNo,
        trackingNumber: data.trackingNumber || "",
        customerId: parsedCustomerId,
        status: "RECEIVED",
        origin: data.origin,
        destination: data.destination,
        serviceType: data.serviceType || "PP",
        createdBy: userId,
        updatedAt: new Date(),
      }).returning();

      console.log("INSERTING_AWB", { shipmentId: newShipment.id });
      // 3. Companion AWB Init
      await tx.insert(awbs).values({
        shipmentId: newShipment.id,
        awbNumber: data.trackingNumber || "",
        pieces: parseInt(data.pieces) || 0,
        chargeableWeight: (data.weight || "0").toString(),
        origin: data.origin,
        destination: data.destination,
        uploadedBy: userId,
        parseStatus: "pending",
      });

      console.log("TRANSACTION_COMMIT_SUCCESS");
      return newShipment;
    });

    revalidatePath("/dashboard/shipments");
    console.log("CREATE_SHIPMENT_COMPLETED_REVALIDATED");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("CREATE_SHIPMENT_CRASH:", error);
    return { success: false, error: error.message || "A database constraint violation occurred." };
  }
}

/**
 * UPDATE FULL SHIPMENT
 * Updates routing and AWB metadata via the Edit SlideOver.
 */
export async function updateFullShipment(id: number, data: any) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(shipments)
        .set({
          origin: data.origin,
          destination: data.destination,
          serviceType: data.serviceType,
          trackingNumber: data.trackingNumber,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, id))
        .returning();

      await tx.update(awbs)
        .set({
          pieces: parseInt(data.pieces) || 0,
          chargeableWeight: (data.weight || "0").toString(),
          awbNumber: data.trackingNumber,
        })
        .where(eq(awbs.shipmentId, id));

      return updated;
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Shipment Error:", error);
    return { success: false, error: error.message || "Failed to update shipment records." };
  }
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
  const { userId } = await auth();
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
