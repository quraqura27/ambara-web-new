"use server";

import { db } from "@/lib/db";
import { shipments, awbs } from "@/lib/db/schema";
import { eq, inArray, desc, ilike, count } from "drizzle-orm";
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
        trackingNumber: data.trackingNumber || `MANUAL-${Date.now()}`, // Ensure not null
        title: data.trackingNumber ? `Shipment ${data.trackingNumber}` : "Manual Entry", // Required field
        customerId: parsedCustomerId,
        status: "RECEIVED",
        origin: data.origin,
        destination: data.destination,
        serviceType: data.serviceType || "PP",
        chargeableWeight: (data.weight || "0").toString(), // Dual-Sync for Dashboard
        totalPcs: parseInt(data.pieces) || 0, // Dual-Sync for Dashboard
        createdBy: userId,
        updatedAt: new Date(),
      }).returning();

      console.log("INSERTING_AWB", { shipmentId: newShipment.id });
      // 3. Companion AWB Init
      await tx.insert(awbs).values({
        shipmentId: newShipment.id,
        customerId: parsedCustomerId, // Required field
        awbNumber: data.trackingNumber || "",
        pieces: parseInt(data.pieces) || 0,
        chargeableWeight: (data.weight || "0").toString(),
        origin: data.origin.slice(0, 3), // Ensure char(3)
        destination: data.destination.slice(0, 3), // Ensure char(3)
        uploadedBy: userId, // Required field
        rawPdfUrl: "manual://none", // Required field - placeholder for manual entries
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
          status: data.status, // Now allowing status updates in the full update
          serviceType: data.serviceType,
          trackingNumber: data.trackingNumber,
          chargeableWeight: (data.weight || "0").toString(), // Dual-Sync for Dashboard
          totalPcs: parseInt(data.pieces) || 0, // Dual-Sync for Dashboard
          customerId: data.customerId ? parseInt(data.customerId) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, id))
        .returning();

      await tx.update(awbs)
        .set({
          pieces: parseInt(data.pieces) || 0,
          chargeableWeight: (data.weight || "0").toString(),
          awbNumber: data.trackingNumber,
          origin: data.origin?.slice(0, 3),
          destination: data.destination?.slice(0, 3),
          updatedAt: new Date(),
          editedBy: userId,
          editedAt: new Date(),
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
    createdAt: shipments.createdAt,
    weight: awbs.chargeableWeight,
    pieces: awbs.pieces,
    carrier: awbs.carrier,
    awbNumber: awbs.awbNumber,
    shipper: awbs.shipper,
    consignee: awbs.consignee
  })
  .from(shipments)
  .leftJoin(awbs, eq(shipments.id, awbs.shipmentId))
  .orderBy(desc(shipments.createdAt));

  return results;
}

/**
 * GET ALL SHIPMENTS (Unified Grid)
 * Optimized fetch for the main command center grid.
 */
export async function getShipments(limit: number = 10, offset: number = 0) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [countResult] = await db.select({ total: count() }).from(shipments);
  const totalCount = Number(countResult.total);

  const data = await db.select({
    id: shipments.id,
    internalTrackingNo: shipments.internalTrackingNo,
    trackingNumber: shipments.trackingNumber,
    status: shipments.status,
    origin: shipments.origin,
    destination: shipments.destination,
    serviceType: shipments.serviceType,
    updatedAt: shipments.updatedAt,
    createdAt: shipments.createdAt,
    customerId: shipments.customerId,
    weight: awbs.chargeableWeight,
    pieces: awbs.pieces,
    awbNumber: awbs.awbNumber,
    shipper: awbs.shipper,
    consignee: awbs.consignee
  })
  .from(shipments)
  .leftJoin(awbs, eq(shipments.id, awbs.shipmentId))
  .orderBy(desc(shipments.createdAt))
  .limit(limit)
  .offset(offset);

  return { shipments: data, totalCount };
}

/**
 * GET BILLING CUSTOMERS
 * Used for shipment creation and filtering.
 */
export async function getCustomers() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select().from(customerTable).orderBy(customerTable.fullName);
}

/**
 * DELETE SHIPMENT
 * Permanently removes a shipment and its associated AWB record.
 */
export async function deleteShipment(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    // 1. Delete associated AWB
    await tx.delete(awbs).where(eq(awbs.shipmentId, id));
    // 2. Delete Shipment
    await tx.delete(shipments).where(eq(shipments.id, id));
  });

  revalidatePath("/dashboard/shipments");
  return { success: true };
}
