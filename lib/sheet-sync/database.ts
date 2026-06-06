import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { shipments } from "@/lib/db/schema";
import type { SheetShipmentUpsertValues } from "@/lib/sheet-sync/payload";

export type SheetShipmentSyncResult = {
  action: "created" | "updated";
  id: number;
  trackingNumber: string;
  internalTrackingNo: string;
};

const internalTrackingNoIndexPredicate = sql`${shipments.internalTrackingNo} is not null and btrim(${shipments.internalTrackingNo}) <> ''`;

const returningFields = {
  id: shipments.id,
  trackingNumber: shipments.trackingNumber,
  internalTrackingNo: shipments.internalTrackingNo,
};

export async function upsertSheetShipmentToDatabase(
  values: SheetShipmentUpsertValues,
): Promise<SheetShipmentSyncResult> {
  const [existingShipment] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(eq(shipments.internalTrackingNo, values.internalTrackingNo))
    .limit(1);

  const [savedShipment] = await db
    .insert(shipments)
    .values(values)
    .onConflictDoUpdate({
      target: shipments.internalTrackingNo,
      targetWhere: internalTrackingNoIndexPredicate,
      set: {
        trackingNumber: values.trackingNumber,
        mawb: values.mawb,
        title: values.title,
        status: values.status,
        origin: values.origin,
        destination: values.destination,
        serviceType: values.serviceType,
        shipperName: values.shipperName,
        shipperAddress: values.shipperAddress,
        shipperPhone: values.shipperPhone,
        consigneeName: values.consigneeName,
        consigneeAddress: values.consigneeAddress,
        consigneePhone: values.consigneePhone,
        customerName: values.customerName,
        goodsDescription: values.goodsDescription,
        originIata: values.originIata,
        destinationIata: values.destinationIata,
        totalPcs: values.totalPcs,
        weightKg: values.weightKg,
        chargeableWeight: values.chargeableWeight,
        cargoType: values.cargoType,
        commodity: values.commodity,
        updatedAt: values.updatedAt,
      },
    })
    .returning(returningFields);

  if (!savedShipment?.internalTrackingNo) {
    throw new Error("Sheet shipment upsert did not return a shipment");
  }

  return {
    action: existingShipment ? "updated" : "created",
    id: savedShipment.id,
    trackingNumber: savedShipment.trackingNumber,
    internalTrackingNo: savedShipment.internalTrackingNo,
  };
}
