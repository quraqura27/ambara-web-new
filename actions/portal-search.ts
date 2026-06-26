"use server";

import { desc, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers, deliveryBatches, mawbDocuments, shipments } from "@/lib/db/schema";
import { canUseMawbWorkflow } from "@/lib/mawbs/core";
import { requirePortalUser } from "@/lib/portal-auth";

export async function searchPortal(query: string) {
  const user = await requirePortalUser();
  const canUseMawbs = canUseMawbWorkflow(user);
  const search = query.trim();
  if (!search) return { batches: [], canUseMawbs, customers: [], mawbs: [], shipments: [] };
  const pattern = `%${search}%`;

  const [shipmentRows, customerRows, batchRows, mawbRows] = await Promise.all([
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
    canUseMawbs
      ? db
          .select({
            carrierCode: mawbDocuments.carrierCode,
            carrierName: mawbDocuments.carrierName,
            consigneeName: mawbDocuments.consigneeName,
            destinationIata: mawbDocuments.destinationIata,
            id: mawbDocuments.id,
            mawbNumber: mawbDocuments.mawbNumber,
            originIata: mawbDocuments.originIata,
            shipperName: mawbDocuments.shipperName,
          })
          .from(mawbDocuments)
          .where(
            or(
              ilike(mawbDocuments.mawbNumber, pattern),
              ilike(mawbDocuments.carrierName, pattern),
              ilike(mawbDocuments.shipperName, pattern),
              ilike(mawbDocuments.consigneeName, pattern),
            ),
          )
          .orderBy(desc(mawbDocuments.createdAt))
          .limit(8)
      : Promise.resolve([]),
  ]);

  return { batches: batchRows, canUseMawbs, customers: customerRows, mawbs: mawbRows, shipments: shipmentRows };
}
