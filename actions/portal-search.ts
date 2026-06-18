"use server";

import { desc, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers, deliveryBatches, shipments } from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";

export async function searchPortal(query: string) {
  await requirePortalUser();
  const search = query.trim();
  if (!search) return { batches: [], customers: [], shipments: [] };
  const pattern = `%${search}%`;

  const [shipmentRows, customerRows, batchRows] = await Promise.all([
    db
      .select({
        customerName: shipments.customerName,
        destination: shipments.destination,
        mawb: shipments.mawb,
        origin: shipments.origin,
        status: shipments.status,
        title: shipments.title,
        trackingNumber: shipments.trackingNumber,
      })
      .from(shipments)
      .where(
        or(
          ilike(shipments.trackingNumber, pattern),
          ilike(shipments.internalTrackingNo, pattern),
          ilike(shipments.mawb, pattern),
          ilike(shipments.customerReference, pattern),
          ilike(shipments.customerName, pattern),
          ilike(shipments.consigneeName, pattern),
        ),
      )
      .orderBy(desc(shipments.updatedAt))
      .limit(12),
    db
      .select({
        companyName: customers.companyName,
        email: customers.email,
        fullName: customers.fullName,
        id: customers.id,
        phone: customers.phone,
      })
      .from(customers)
      .where(
        or(
          ilike(customers.fullName, pattern),
          ilike(customers.companyName, pattern),
          ilike(customers.email, pattern),
          ilike(customers.phone, pattern),
        ),
      )
      .orderBy(desc(customers.updatedAt))
      .limit(8),
    db
      .select({
        batchCode: deliveryBatches.batchCode,
        batchStatus: deliveryBatches.batchStatus,
        id: deliveryBatches.id,
        totalParcels: deliveryBatches.totalParcels,
        vendorName: deliveryBatches.vendorName,
      })
      .from(deliveryBatches)
      .where(
        or(
          ilike(deliveryBatches.batchCode, pattern),
          ilike(deliveryBatches.vendorName, pattern),
        ),
      )
      .orderBy(desc(deliveryBatches.updatedAt))
      .limit(8),
  ]);

  return { batches: batchRows, customers: customerRows, shipments: shipmentRows };
}
