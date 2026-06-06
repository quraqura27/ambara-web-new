import "server-only";

import {
  isNotFoundPayload,
  PublicTrackingPayloadError,
  type PublicTrackingResult,
  sanitizeTrackingPayload,
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
