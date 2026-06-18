import type { ShipmentStatusValue } from "./status-model.ts";

export const shipmentServiceValues = ["DTD", "DTP", "PTD", "PTP"] as const;

export type ShipmentServiceValue = (typeof shipmentServiceValues)[number];

export type ShipmentServiceDefinition = {
  allowedStatuses: readonly ShipmentStatusValue[];
  arrivalPublicDescription: string;
  arrivalPublicLabel: string;
  doorDelivery: boolean;
  label: string;
  requiredFields: readonly (
    | "receiverName"
    | "receiverPhone"
    | "destinationCity"
    | "receiverAddress"
  )[];
  terminalStatus: ShipmentStatusValue;
};

const coreStatuses = [
  "pending",
  "received",
  "processed",
  "departed_origin",
  "in_transit",
  "customs",
  "arrived_destination",
  "on_hold",
  "exception",
  "cancelled",
] as const satisfies readonly ShipmentStatusValue[];

const doorStatuses = [
  ...coreStatuses,
  "out_for_delivery",
  "delivery_issue",
  "delivered",
  "return_in_progress",
] as const satisfies readonly ShipmentStatusValue[];

const doorRequiredFields = [
  "receiverName",
  "receiverPhone",
  "destinationCity",
  "receiverAddress",
] as const;

const portRequiredFields = ["receiverName", "receiverPhone"] as const;

export const shipmentServiceDefinitions: Record<
  ShipmentServiceValue,
  ShipmentServiceDefinition
> = {
  DTD: {
    allowedStatuses: doorStatuses,
    arrivalPublicDescription: "Shipment has arrived at the destination facility.",
    arrivalPublicLabel: "Arrived at Destination",
    doorDelivery: true,
    label: "Door to Door",
    requiredFields: doorRequiredFields,
    terminalStatus: "delivered",
  },
  DTP: {
    allowedStatuses: coreStatuses,
    arrivalPublicDescription: "Shipment has arrived at the destination port.",
    arrivalPublicLabel: "Arrived at Destination Port",
    doorDelivery: false,
    label: "Door to Port",
    requiredFields: portRequiredFields,
    terminalStatus: "arrived_destination",
  },
  PTD: {
    allowedStatuses: doorStatuses,
    arrivalPublicDescription: "Shipment has arrived at the destination facility.",
    arrivalPublicLabel: "Arrived at Destination",
    doorDelivery: true,
    label: "Port to Door",
    requiredFields: doorRequiredFields,
    terminalStatus: "delivered",
  },
  PTP: {
    allowedStatuses: coreStatuses,
    arrivalPublicDescription: "Shipment has arrived at the destination port.",
    arrivalPublicLabel: "Arrived at Destination Port",
    doorDelivery: false,
    label: "Port to Port",
    requiredFields: portRequiredFields,
    terminalStatus: "arrived_destination",
  },
};

export function normalizeShipmentService(value: unknown): ShipmentServiceValue | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  return shipmentServiceValues.find((service) => service === normalized) ?? null;
}

export function getShipmentServiceDefinition(value: unknown) {
  const service = normalizeShipmentService(value);
  return service ? shipmentServiceDefinitions[service] : null;
}

export function isDoorDeliveryService(value: unknown) {
  return getShipmentServiceDefinition(value)?.doorDelivery === true;
}

export function isShipmentStatusAllowedForService(status: ShipmentStatusValue, service: unknown) {
  const definition = getShipmentServiceDefinition(service);
  return definition ? definition.allowedStatuses.includes(status) : true;
}
