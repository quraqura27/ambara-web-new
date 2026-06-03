import "server-only";

const trackingCacheTtlMs = 15_000;

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
  internal_tracking_no: string | null;
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

export class TrackingWebAppConfigError extends Error {
  constructor(message = "Tracking web app URL is not configured") {
    super(message);
    this.name = "TrackingWebAppConfigError";
  }
}

export class TrackingWebAppUpstreamError extends Error {
  constructor(message = "Tracking web app request failed") {
    super(message);
    this.name = "TrackingWebAppUpstreamError";
  }
}

let trackingCache:
  | {
      values: Map<string, { data: PublicTrackingResult; expiresAt: number }>;
    }
  | null = null;

function getTrackingWebAppUrl() {
  const webAppUrl = process.env.GOOGLE_TRACKING_WEB_APP_URL;

  if (!webAppUrl) {
    throw new TrackingWebAppConfigError();
  }

  try {
    return new URL(webAppUrl);
  } catch {
    throw new TrackingWebAppConfigError("Tracking web app URL is invalid");
  }
}

function getCache() {
  if (!trackingCache) {
    trackingCache = { values: new Map() };
  }

  return trackingCache.values;
}

function normalizeTrackingValue(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
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
    internal_tracking_no: stringValue(shipment.internal_tracking_no),
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

function isNotFoundPayload(value: UnknownRecord | null) {
  const status = String(value?.status ?? value?.error ?? "").trim().toLowerCase();

  return value?.found === false || status === "not_found" || status === "shipment not found";
}

function sanitizeTrackingPayload(payload: unknown): PublicTrackingResult {
  const data = objectValue(payload);

  if (!data || isNotFoundPayload(data)) {
    throw new TrackingWebAppUpstreamError("Tracking web app response is missing shipment data");
  }

  const shipment = toPublicShipment(data?.shipment);

  if (!shipment) {
    throw new TrackingWebAppUpstreamError("Tracking web app response is missing shipment data");
  }

  const events = Array.isArray(data?.events)
    ? data.events.map(toPublicEvent).filter((event): event is PublicTrackingEvent => Boolean(event))
    : [];

  return { shipment, events };
}

export async function findPublicTrackingResult(
  trackingInput: string,
): Promise<PublicTrackingResult | null> {
  const trimmedTrackingInput = trackingInput.trim();
  const cacheKey = normalizeTrackingValue(trimmedTrackingInput);
  const cached = getCache().get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const webAppUrl = getTrackingWebAppUrl();
  webAppUrl.searchParams.set("id", trimmedTrackingInput);

  let response: Response;

  try {
    response = await fetch(webAppUrl, {
      cache: "no-store",
    });
  } catch {
    throw new TrackingWebAppUpstreamError();
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new TrackingWebAppUpstreamError(
      `Tracking web app responded with status ${response.status}`,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new TrackingWebAppUpstreamError("Tracking web app returned invalid JSON");
  }
  const data = objectValue(payload);

  if (isNotFoundPayload(data)) {
    return null;
  }

  const result = sanitizeTrackingPayload(payload);

  getCache().set(cacheKey, {
    data: result,
    expiresAt: Date.now() + trackingCacheTtlMs,
  });

  return result;
}
