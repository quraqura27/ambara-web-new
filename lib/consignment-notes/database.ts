import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { shipments } from "@/lib/db/schema";
import { requireConsignmentNoteUser } from "@/lib/consignment-notes/auth";
import {
  buildBulkConsignmentNotePrintModel,
  expandShipmentToConsignmentNoteLabels,
  normalizeConsignmentNoteTrackingNo,
  type ConsignmentNotePieceViewModel,
} from "@/lib/consignment-notes/label";

const consignmentNoteShipmentFields = {
  id: shipments.id,
  trackingNumber: shipments.trackingNumber,
  internalTrackingNo: shipments.internalTrackingNo,
  title: shipments.title,
  serviceType: shipments.serviceType,
  origin: shipments.origin,
  originIata: shipments.originIata,
  destination: shipments.destination,
  destinationIata: shipments.destinationIata,
  shipperName: shipments.shipperName,
  shipperAddress: shipments.shipperAddress,
  shipperPhone: shipments.shipperPhone,
  consigneeName: shipments.consigneeName,
  consigneeAddress: shipments.consigneeAddress,
  consigneePhone: shipments.consigneePhone,
  goodsDescription: shipments.goodsDescription,
  commodity: shipments.commodity,
  totalPcs: shipments.totalPcs,
  chargeableWeight: shipments.chargeableWeight,
  createdAt: shipments.createdAt,
};

export type SingleConsignmentNotePrintResult = {
  trackingNo: string;
  labels: ConsignmentNotePieceViewModel[];
};

export async function getConsignmentNoteForTrackingNo(
  trackingNo: string,
): Promise<SingleConsignmentNotePrintResult | null> {
  await requireConsignmentNoteUser();

  const normalizedTrackingNo = normalizeConsignmentNoteTrackingNo(trackingNo);
  if (!normalizedTrackingNo) return null;

  const [shipment] = await db
    .select(consignmentNoteShipmentFields)
    .from(shipments)
    .where(eq(shipments.internalTrackingNo, normalizedTrackingNo))
    .limit(1);

  if (!shipment) return null;

  return {
    trackingNo: normalizedTrackingNo,
    labels: expandShipmentToConsignmentNoteLabels(shipment),
  };
}

export async function getBulkConsignmentNotesForTrackingNos(trackingNos: string[]) {
  await requireConsignmentNoteUser();

  const normalizedTrackingNos = trackingNos
    .map(normalizeConsignmentNoteTrackingNo)
    .filter(Boolean);
  const uniqueTrackingNos = Array.from(new Set(normalizedTrackingNos));

  if (uniqueTrackingNos.length === 0) {
    return buildBulkConsignmentNotePrintModel([], []);
  }

  const matchedShipments = await db
    .select(consignmentNoteShipmentFields)
    .from(shipments)
    .where(inArray(shipments.internalTrackingNo, uniqueTrackingNos));

  return buildBulkConsignmentNotePrintModel(normalizedTrackingNos, matchedShipments);
}
