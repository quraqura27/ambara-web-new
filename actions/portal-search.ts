"use server";

import { and, desc, ilike, isNull, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { getCrmCompanies, getCrmContacts, getCrmLeads, getCrmOpportunities } from "@/lib/crm/data";
import { customers, deliveryBatches, mawbDocuments, shipments } from "@/lib/db/schema";
import { canUseMawbWorkflow } from "@/lib/mawbs/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { canViewCrm, hasPortalCapability } from "@/lib/portal-roles";

export async function searchPortal(query: string) {
  const user = await requirePortalUser();
  const canUseMawbs = canUseMawbWorkflow(user);
  const canViewDelivery = hasPortalCapability(user, "delivery:view");
  const canSearchCrm = canViewCrm(user);
  const search = query.trim();
  if (!search) return { batches: [], canUseMawbs, crmCompanies: [], crmContacts: [], crmLeads: [], crmOpportunities: [], customers: [], mawbs: [], shipments: [] };
  const pattern = `%${search}%`;

  const [shipmentRows, customerRows, batchRows, mawbRows, crmRows] = await Promise.all([
    db
      .select({
        customerName: shipments.customerName,
        destination: shipments.destination,
        mawb: shipments.mawb,
        origin: shipments.origin,
        status: shipments.status,
        title: shipments.title,
        trackingNumber: shipments.trackingNumber,
        voidedAt: shipments.voidedAt,
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
        and(
          isNull(customers.archivedAt),
          or(
          ilike(customers.fullName, pattern),
          ilike(customers.companyName, pattern),
          ilike(customers.email, pattern),
          ilike(customers.phone, pattern),
          ),
        ),
      )
      .orderBy(desc(customers.updatedAt))
      .limit(8),
    canViewDelivery ? db
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
      .limit(8) : Promise.resolve([]),
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
    canSearchCrm
      ? Promise.all([
          getCrmLeads({ limit: 6, search }),
          getCrmCompanies({ limit: 6, search }),
          getCrmOpportunities({ limit: 6, search }),
          getCrmContacts({ limit: 6, search }),
        ])
      : Promise.resolve(null),
  ]);

  return {
    batches: batchRows,
    canUseMawbs,
    crmCompanies: crmRows?.[1].rows ?? [],
    crmContacts: crmRows?.[3].rows ?? [],
    crmLeads: crmRows?.[0].rows ?? [],
    crmOpportunities: crmRows?.[2].rows ?? [],
    customers: customerRows,
    mawbs: mawbRows,
    shipments: shipmentRows,
  };
}
