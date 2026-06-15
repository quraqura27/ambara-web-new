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

const shipmentCreatedEvent = {
  label: "Shipment Information Received",
  publicDescription: "Shipment information has been received.",
  status: "pending",
  statusCode: "DRAFT",
} satisfies CustomerVisibleTrackingEvent;

const statusEvents: Record<string, CustomerVisibleTrackingEvent> = {
  CREATED: shipmentCreatedEvent,
  DRAFT: shipmentCreatedEvent,
  PENDING: shipmentCreatedEvent,
  RECEIVED: shipmentCreatedEvent,
  SHIPMENT_CREATED: shipmentCreatedEvent,
  OUT_FOR_DELIVERY: {
    label: "Out For Delivery",
    publicDescription: "Shipment is out for delivery.",
    status: "out_for_delivery",
    statusCode: "OUT_FOR_DELIVERY",
  },
  DELIVERED: {
    label: "Delivered",
    publicDescription: "Shipment has been delivered successfully.",
    status: "delivered",
    statusCode: "DELIVERED",
  },
  DELIVERY_ISSUE: {
    label: "Delivery Issue",
    publicDescription:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    status: "delivery_issue",
    statusCode: "DELIVERY_ISSUE",
  },
  EXCEPTION: {
    label: "Delivery Issue",
    publicDescription:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    status: "exception",
    statusCode: "DELIVERY_ISSUE",
  },
  ON_HOLD: {
    label: "On Hold",
    publicDescription: "Shipment is pending further update.",
    status: "on_hold",
    statusCode: "ON_HOLD",
  },
  RETURN_IN_PROGRESS: {
    label: "Return In Progress",
    publicDescription: "Shipment is being returned by the delivery partner.",
    status: "return_in_progress",
    statusCode: "RETURN_IN_PROGRESS",
  },
  IN_TRANSIT: {
    label: "In Transit",
    publicDescription: "Shipment is in transit.",
    status: "in_transit",
    statusCode: "HANDED_TO_DELIVERY_PARTNER",
  },
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
): CustomerVisibleTrackingEvent {
  const statusKey = normalizeStatusKey(statusInput);
  const mappedEvent = statusEvents[statusKey];

  if (mappedEvent) {
    return { ...mappedEvent };
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
