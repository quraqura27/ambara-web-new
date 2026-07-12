import type { PortalRoleUser } from "../portal-roles.ts";
import {
  canOverrideShipmentVoidSafeguards,
  canVoidShipment,
} from "../portal-roles.ts";

export const shipmentVoidReasonValues = [
  "duplicate_shipment",
  "created_by_mistake",
  "customer_cancelled",
  "wrong_shipment_data",
  "test_record",
  "other",
] as const;

export type ShipmentVoidReason = (typeof shipmentVoidReasonValues)[number];

export const shipmentVoidReasonLabels: Record<ShipmentVoidReason, string> = {
  duplicate_shipment: "Duplicate shipment",
  created_by_mistake: "Created by mistake",
  customer_cancelled: "Customer cancelled",
  wrong_shipment_data: "Wrong shipment data",
  test_record: "Test record",
  other: "Other",
};

export type ShipmentVoidRelations = {
  deliveryBatchLinks: number;
  documentCount: number;
  exportOrPrintEvents: number;
  hasCustomer: boolean;
  invoiceLinks: number;
  mawbLinks: number;
  trackingEvents: number;
};

export function isShipmentVoidReason(value: unknown): value is ShipmentVoidReason {
  return shipmentVoidReasonValues.includes(value as ShipmentVoidReason);
}

export function isShipmentVoided(voidedAt: Date | string | null | undefined) {
  return Boolean(voidedAt);
}

export function shouldIncludeShipment(
  voidedAt: Date | string | null | undefined,
  includeVoided: boolean,
) {
  return includeVoided || !isShipmentVoided(voidedAt);
}

export function assessShipmentVoid(
  relations: ShipmentVoidRelations,
  user: PortalRoleUser | null | undefined,
) {
  const warnings: string[] = [];

  if (relations.trackingEvents > 0) warnings.push("Tracking history will be preserved.");
  if (relations.invoiceLinks > 0) warnings.push("This shipment is linked to an invoice.");
  if (relations.mawbLinks > 0) warnings.push("This shipment is linked to a MAWB record.");
  if (relations.deliveryBatchLinks > 0) warnings.push("Delivery batch linkage will be preserved.");
  if (relations.documentCount > 0) warnings.push("Shipment documents will be preserved.");
  if (relations.hasCustomer) warnings.push("The customer relationship will be preserved.");
  if (relations.exportOrPrintEvents > 0) warnings.push("Print or export audit history will be preserved.");

  const requiresElevatedOverride = relations.invoiceLinks > 0 || relations.mawbLinks > 0;
  const authorized = canVoidShipment(user);
  const canOverride = canOverrideShipmentVoidSafeguards(user);

  return {
    allowed: authorized && (!requiresElevatedOverride || canOverride),
    canOverride,
    requiresElevatedOverride,
    warnings,
  };
}
