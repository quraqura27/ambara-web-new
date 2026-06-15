type UnknownRecord = Record<string, unknown>;

export type PublicTrackingEvent = {
  status: string | null;
  label: string | null;
  description: string | null;
  location: string | null;
  event_time: string | null;
};

export type PublicShipment = {
  tracking_number: string | null;
  legacy_tracking_number: string | null;
  title: string | null;
  status: string | null;
  origin: string | null;
  destination: string | null;
  service_type: string | null;
  goods_description: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  total_pcs: number | null;
  weight_kg: number | null;
  chargeable_weight: number | null;
  cargo_type: string | null;
  commodity: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PublicTrackingResult = {
  shipment: PublicShipment;
  events: PublicTrackingEvent[];
};

export class PublicTrackingPayloadError extends Error {
  constructor(message = "Public tracking payload is invalid") {
    super(message);
    this.name = "PublicTrackingPayloadError";
  }
}

function stringValue(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function objectValue(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function toPublicShipment(value: unknown): PublicShipment | null {
  const shipment = objectValue(value);

  if (!shipment) {
    return null;
  }

  return {
    tracking_number: stringValue(shipment.tracking_number),
    legacy_tracking_number: stringValue(shipment.legacy_tracking_number),
    title: stringValue(shipment.title),
    status: stringValue(shipment.status),
    origin: stringValue(shipment.origin),
    destination: stringValue(shipment.destination),
    service_type: stringValue(shipment.service_type),
    goods_description: stringValue(shipment.goods_description),
    origin_iata: stringValue(shipment.origin_iata),
    destination_iata: stringValue(shipment.destination_iata),
    total_pcs: numberValue(shipment.total_pcs),
    weight_kg: numberValue(shipment.weight_kg),
    chargeable_weight: numberValue(shipment.chargeable_weight),
    cargo_type: stringValue(shipment.cargo_type),
    commodity: stringValue(shipment.commodity),
    created_at: stringValue(shipment.created_at),
    updated_at: stringValue(shipment.updated_at),
  };
}

function toPublicEvent(value: unknown): PublicTrackingEvent | null {
  const event = objectValue(value);

  if (!event) {
    return null;
  }

  return {
    status: stringValue(event.status),
    label: stringValue(event.label),
    description: stringValue(event.description),
    location: stringValue(event.location),
    event_time: stringValue(event.event_time),
  };
}

export function isNotFoundPayload(value: UnknownRecord | null) {
  const status = String(value?.status ?? value?.error ?? "").trim().toLowerCase();

  return value?.found === false || status === "not_found" || status === "shipment not found";
}

function eventTimeValue(event: PublicTrackingEvent) {
  if (!event.event_time) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = new Date(event.event_time).getTime();
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function sortTrackingEventsChronologically(events: PublicTrackingEvent[]) {
  return events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      const diff = eventTimeValue(left.event) - eventTimeValue(right.event);
      return diff || left.index - right.index;
    })
    .map(({ event }) => event);
}

export function sanitizeTrackingPayload(payload: unknown): PublicTrackingResult {
  const data = objectValue(payload);

  if (!data || isNotFoundPayload(data)) {
    throw new PublicTrackingPayloadError("Public tracking payload is missing shipment data");
  }

  const shipment = toPublicShipment(data.shipment);

  if (!shipment) {
    throw new PublicTrackingPayloadError("Public tracking payload is missing shipment data");
  }

  const events = Array.isArray(data.events)
    ? data.events.map(toPublicEvent).filter((event): event is PublicTrackingEvent => Boolean(event))
    : [];

  return {
    shipment,
    events: sortTrackingEventsChronologically(events),
  };
}

const publicTrackingPayload = {
  PublicTrackingPayloadError,
  isNotFoundPayload,
  sanitizeTrackingPayload,
  sortTrackingEventsChronologically,
};

export default publicTrackingPayload;
