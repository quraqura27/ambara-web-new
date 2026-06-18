import { getShipmentServiceDefinition } from "./service-model.ts";

export const shipmentStatusValues = [
  "pending",
  "received",
  "processed",
  "departed_origin",
  "in_transit",
  "customs",
  "arrived_destination",
  "out_for_delivery",
  "delivered",
  "delivery_issue",
  "return_in_progress",
  "on_hold",
  "exception",
  "cancelled",
] as const;

export type ShipmentStatusValue = (typeof shipmentStatusValues)[number];

export type ShipmentStatusDefinition = {
  allowedTransitions: readonly ShipmentStatusValue[];
  label: string;
  publicDescription: string;
  publicLabel: string;
  publicStatus: ShipmentStatusValue;
  publicStatusCode: string;
  severity: "neutral" | "info" | "progress" | "success" | "warning" | "danger";
  terminal: boolean;
};

export const shipmentStatusDefinitions: Record<ShipmentStatusValue, ShipmentStatusDefinition> = {
  pending: {
    allowedTransitions: ["received", "cancelled"],
    label: "Pending",
    publicDescription: "Shipment information has been received.",
    publicLabel: "Shipment Information Received",
    publicStatus: "pending",
    publicStatusCode: "DRAFT",
    severity: "neutral",
    terminal: false,
  },
  received: {
    allowedTransitions: ["processed", "on_hold", "cancelled"],
    label: "Received",
    publicDescription: "Shipment information has been received.",
    publicLabel: "Shipment Information Received",
    publicStatus: "pending",
    publicStatusCode: "DRAFT",
    severity: "info",
    terminal: false,
  },
  processed: {
    allowedTransitions: ["departed_origin", "on_hold", "cancelled"],
    label: "Processed",
    publicDescription: "Shipment has been processed for onward movement.",
    publicLabel: "Shipment Processed",
    publicStatus: "processed",
    publicStatusCode: "PROCESSED",
    severity: "info",
    terminal: false,
  },
  departed_origin: {
    allowedTransitions: ["in_transit", "on_hold", "exception", "cancelled"],
    label: "Departed Origin",
    publicDescription: "Shipment has departed the origin facility.",
    publicLabel: "Departed Origin",
    publicStatus: "departed_origin",
    publicStatusCode: "DEPARTED_ORIGIN",
    severity: "progress",
    terminal: false,
  },
  in_transit: {
    allowedTransitions: ["customs", "arrived_destination", "on_hold", "exception", "cancelled"],
    label: "In Transit",
    publicDescription: "Shipment is in transit.",
    publicLabel: "In Transit",
    publicStatus: "in_transit",
    publicStatusCode: "HANDED_TO_DELIVERY_PARTNER",
    severity: "progress",
    terminal: false,
  },
  customs: {
    allowedTransitions: ["arrived_destination", "on_hold", "exception", "cancelled"],
    label: "Customs",
    publicDescription: "Shipment is undergoing destination processing.",
    publicLabel: "Destination Processing",
    publicStatus: "customs",
    publicStatusCode: "CUSTOMS",
    severity: "progress",
    terminal: false,
  },
  arrived_destination: {
    allowedTransitions: ["out_for_delivery", "on_hold", "exception"],
    label: "Arrived Destination",
    publicDescription: "Shipment has arrived at the destination facility.",
    publicLabel: "Arrived at Destination",
    publicStatus: "arrived_destination",
    publicStatusCode: "ARRIVED_DESTINATION",
    severity: "progress",
    terminal: false,
  },
  out_for_delivery: {
    allowedTransitions: ["delivered", "delivery_issue", "on_hold"],
    label: "Out For Delivery",
    publicDescription: "Shipment is out for delivery.",
    publicLabel: "Out For Delivery",
    publicStatus: "out_for_delivery",
    publicStatusCode: "OUT_FOR_DELIVERY",
    severity: "progress",
    terminal: false,
  },
  delivered: {
    allowedTransitions: [],
    label: "Delivered",
    publicDescription: "Shipment has been delivered successfully.",
    publicLabel: "Delivered",
    publicStatus: "delivered",
    publicStatusCode: "DELIVERED",
    severity: "success",
    terminal: true,
  },
  delivery_issue: {
    allowedTransitions: ["out_for_delivery", "return_in_progress", "on_hold"],
    label: "Delivery Issue",
    publicDescription:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    publicLabel: "Delivery Issue",
    publicStatus: "delivery_issue",
    publicStatusCode: "DELIVERY_ISSUE",
    severity: "danger",
    terminal: false,
  },
  return_in_progress: {
    allowedTransitions: ["cancelled"],
    label: "Return In Progress",
    publicDescription: "Shipment is being returned by the delivery partner.",
    publicLabel: "Return In Progress",
    publicStatus: "return_in_progress",
    publicStatusCode: "RETURN_IN_PROGRESS",
    severity: "warning",
    terminal: false,
  },
  on_hold: {
    allowedTransitions: [
      "processed",
      "in_transit",
      "customs",
      "arrived_destination",
      "out_for_delivery",
      "return_in_progress",
      "cancelled",
    ],
    label: "On Hold",
    publicDescription: "Shipment is pending further update.",
    publicLabel: "On Hold",
    publicStatus: "on_hold",
    publicStatusCode: "ON_HOLD",
    severity: "warning",
    terminal: false,
  },
  exception: {
    allowedTransitions: ["in_transit", "return_in_progress", "on_hold", "cancelled"],
    label: "Exception",
    publicDescription:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    publicLabel: "Delivery Issue",
    publicStatus: "exception",
    publicStatusCode: "DELIVERY_ISSUE",
    severity: "danger",
    terminal: false,
  },
  cancelled: {
    allowedTransitions: [],
    label: "Cancelled",
    publicDescription: "Shipment processing has been cancelled.",
    publicLabel: "Cancelled",
    publicStatus: "cancelled",
    publicStatusCode: "CANCELLED",
    severity: "danger",
    terminal: true,
  },
};

const aliases: Record<string, ShipmentStatusValue> = {
  CREATED: "received",
  DRAFT: "received",
  PENDING: "pending",
  RECEIVED: "received",
  PROCESSED: "processed",
  SHIPMENT_CREATED: "received",
  READY_FOR_VENDOR_HANDOVER: "processed",
  DEPARTED: "departed_origin",
  DEPARTED_ORIGIN: "departed_origin",
  HANDED_TO_DELIVERY_PARTNER: "in_transit",
  VENDOR_TRACKING_ASSIGNED: "in_transit",
  IN_TRANSIT: "in_transit",
  CUSTOMS: "customs",
  ARRIVED_DESTINATION: "arrived_destination",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  DELIVERY_ISSUE: "delivery_issue",
  RETURN_IN_PROGRESS: "return_in_progress",
  ON_HOLD: "on_hold",
  EXCEPTION: "exception",
  CANCELLED: "cancelled",
};

export function normalizeShipmentStatus(value: unknown): ShipmentStatusValue {
  const key = String(value ?? "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

  return aliases[key] ?? "pending";
}

export function getShipmentStatusDefinition(value: unknown, serviceType?: unknown) {
  const status = normalizeShipmentStatus(value);
  const definition = shipmentStatusDefinitions[status];

  if (status !== "arrived_destination" || !serviceType) {
    return definition;
  }

  const service = getShipmentServiceDefinition(serviceType);
  if (!service) return definition;

  return {
    ...definition,
    allowedTransitions:
      service.terminalStatus === "arrived_destination" ? [] : definition.allowedTransitions,
    label: service.arrivalPublicLabel,
    publicDescription: service.arrivalPublicDescription,
    publicLabel: service.arrivalPublicLabel,
    terminal: service.terminalStatus === "arrived_destination",
  };
}

export function getAllowedShipmentTransitions(value: unknown, serviceType?: unknown) {
  const service = getShipmentServiceDefinition(serviceType);
  return getShipmentStatusDefinition(value, serviceType).allowedTransitions
    .filter((status) => !service || service.allowedStatuses.includes(status))
    .map((status) => ({
      status,
      ...getShipmentStatusDefinition(status, serviceType),
    }));
}

export function canTransitionShipmentStatus(current: unknown, next: unknown, serviceType?: unknown) {
  const currentStatus = normalizeShipmentStatus(current);
  const nextStatus = normalizeShipmentStatus(next);
  const service = getShipmentServiceDefinition(serviceType);

  return (
    (!service || service.allowedStatuses.includes(nextStatus)) &&
    getShipmentStatusDefinition(currentStatus, serviceType).allowedTransitions.includes(nextStatus)
  );
}
