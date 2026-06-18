import {
  getShipmentStatusDefinition,
  normalizeShipmentStatus,
} from "../shipments/status-model.ts";

export type CustomerVisibleTrackingEvent = {
  label: string;
  publicDescription: string;
  status: string;
  statusCode: string;
};

type ExistingTrackingEvent = {
  publicDescription?: string | null;
  status?: string | null;
  statusCode?: string | null;
};

export function normalizePublicTrackingInput(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/^[,\s]+/, "")
    .trim()
    .toUpperCase();
}

function normalizeStatusKey(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

function labelFromStatusKey(statusKey: string) {
  return statusKey
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildCustomerVisibleTrackingEvent(
  statusInput: string | null | undefined,
  serviceType?: string | null,
): CustomerVisibleTrackingEvent {
  const statusKey = normalizeStatusKey(statusInput);
  const normalizedStatus = normalizeShipmentStatus(statusKey);
  const definition = getShipmentStatusDefinition(normalizedStatus, serviceType);
  const isKnown =
    statusKey === normalizedStatus.toUpperCase() ||
    [
      "CREATED",
      "DRAFT",
      "SHIPMENT_CREATED",
      "READY_FOR_VENDOR_HANDOVER",
      "DEPARTED",
      "HANDED_TO_DELIVERY_PARTNER",
      "VENDOR_TRACKING_ASSIGNED",
    ].includes(statusKey);

  if (isKnown) {
    return {
      label: definition.publicLabel,
      publicDescription: definition.publicDescription,
      status: definition.publicStatus,
      statusCode: definition.publicStatusCode,
    };
  }

  return {
    label: labelFromStatusKey(statusKey) || "Shipment Updated",
    publicDescription: "Shipment status has been updated.",
    status: statusKey.toLowerCase() || "pending",
    statusCode: statusKey || "SHIPMENT_UPDATED",
  };
}

export function isDuplicateCustomerVisibleEvent(
  existingEvent: ExistingTrackingEvent | null | undefined,
  nextEvent: CustomerVisibleTrackingEvent,
) {
  if (!existingEvent) {
    return false;
  }

  const existingStatus = normalizeStatusKey(existingEvent.statusCode || existingEvent.status);
  const nextStatus = normalizeStatusKey(nextEvent.statusCode);

  return (
    existingStatus === nextStatus &&
    (existingEvent.publicDescription || "") === nextEvent.publicDescription
  );
}
