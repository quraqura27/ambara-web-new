"use server";

import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { deliveryBatches, shipments } from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";

export async function getOperationalDashboard() {
  await requirePortalUser();
  const now = new Date();

  const [recentShipments, attentionShipments, overdueBatches] = await Promise.all([
    db
      .select({
        customerName: shipments.customerName,
        destination: shipments.destination,
        origin: shipments.origin,
        serviceType: shipments.serviceType,
        status: shipments.status,
        trackingNumber: shipments.trackingNumber,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .orderBy(desc(shipments.updatedAt))
      .limit(8),
    db
      .select({
        customerName: shipments.customerName,
        serviceType: shipments.serviceType,
        status: shipments.status,
        trackingNumber: shipments.trackingNumber,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .where(
        or(
          inArray(shipments.status, ["exception", "on_hold"]),
          and(
            eq(shipments.status, "delivery_issue"),
            sql`upper(coalesce(${shipments.serviceType}, '')) in ('DTD', 'PTD')`,
          ),
        ),
      )
      .orderBy(desc(shipments.updatedAt))
      .limit(6),
    db
      .select({
        batchCode: deliveryBatches.batchCode,
        id: deliveryBatches.id,
        slaDeadline: deliveryBatches.slaDeadline,
        vendorName: deliveryBatches.vendorName,
      })
      .from(deliveryBatches)
      .where(
        sql`${deliveryBatches.slaDeadline} is not null
          and ${deliveryBatches.slaDeadline} < ${now}
          and upper(${deliveryBatches.batchStatus}) <> 'DELIVERED'
          and exists (
            select 1
            from parcel_vendor_tracking pvt
            inner join parcels p on p.id = pvt.parcel_id
            inner join shipments s on s.id = p.shipment_id
            where pvt.delivery_batch_id = ${deliveryBatches.id}
              and upper(coalesce(s.service_type, p.service_type, '')) in ('DTD', 'PTD')
          )`,
      )
      .orderBy(asc(deliveryBatches.slaDeadline))
      .limit(6),
  ]);

  return {
    attentionShipments,
    overdueBatches,
    recentShipments,
  };
}
