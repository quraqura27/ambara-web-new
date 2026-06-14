import "server-only";

import { and, asc, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { shipments, trackingEvents } from "@/lib/db/schema";
import { normalizePublicTrackingInput } from "@/lib/tracking/public-events";
import {
  isNotFoundPayload,
  PublicTrackingPayloadError,
  type PublicTrackingResult,
  sanitizeTrackingPayload,
  sortTrackingEventsChronologically,
} from "./public-tracking-payload";

const trackingCacheTtlMs = 15_000;

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

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function findDatabaseTrackingResult(
  trackingInput: string,
): Promise<PublicTrackingResult | null> {
  const normalizedTrackingInput = normalizePublicTrackingInput(trackingInput);

  if (!normalizedTrackingInput) {
    return null;
  }

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, normalizedTrackingInput),
        eq(shipments.internalTrackingNo, normalizedTrackingInput),
      ),
    )
    .limit(1);

  if (!shipment) {
    return null;
  }

  const events = await db
    .select()
    .from(trackingEvents)
    .where(
      and(
        eq(trackingEvents.shipmentId, shipment.id),
        eq(trackingEvents.visibleToCustomer, true),
      ),
    )
    .orderBy(asc(trackingEvents.eventTime));

  return {
    shipment: {
      tracking_number: shipment.trackingNumber,
      internal_tracking_no: shipment.internalTrackingNo,
      legacy_tracking_number: null,
      title: shipment.title,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      service_type: shipment.serviceType,
      goods_description: shipment.goodsDescription,
      origin_iata: shipment.originIata,
      destination_iata: shipment.destinationIata,
      total_pcs: shipment.totalPcs,
      weight_kg: shipment.weightKg ? Number(shipment.weightKg) : null,
      chargeable_weight: shipment.chargeableWeight ? Number(shipment.chargeableWeight) : null,
      cargo_type: shipment.cargoType,
      commodity: shipment.commodity,
      created_at: shipment.createdAt?.toISOString() ?? null,
      updated_at: shipment.updatedAt?.toISOString() ?? null,
    },
    events: sortTrackingEventsChronologically(
      events.map((event) => ({
        status: event.status ?? event.statusCode,
        label: event.label,
        description: event.publicDescription ?? event.description,
        location: event.location,
        event_time: event.eventTime.toISOString(),
      })),
    ),
  };
}

export async function findPublicTrackingResult(
  trackingInput: string,
): Promise<PublicTrackingResult | null> {
  const normalizedTrackingInput = normalizePublicTrackingInput(trackingInput);
  const cacheKey = normalizeTrackingValue(normalizedTrackingInput);

  if (!normalizedTrackingInput) {
    return null;
  }

  const cached = getCache().get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const databaseResult = await findDatabaseTrackingResult(normalizedTrackingInput);

  if (databaseResult) {
    getCache().set(cacheKey, {
      data: databaseResult,
      expiresAt: Date.now() + trackingCacheTtlMs,
    });
    return databaseResult;
  }

  let webAppUrl: URL;

  try {
    webAppUrl = getTrackingWebAppUrl();
  } catch (error) {
    throw error;
  }

  webAppUrl.searchParams.set("id", normalizedTrackingInput);

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

  let result: PublicTrackingResult;

  try {
    result = sanitizeTrackingPayload(payload);
  } catch (error) {
    if (error instanceof PublicTrackingPayloadError) {
      throw new TrackingWebAppUpstreamError(error.message);
    }

    throw error;
  }

  getCache().set(cacheKey, {
    data: result,
    expiresAt: Date.now() + trackingCacheTtlMs,
  });

  return result;
}
