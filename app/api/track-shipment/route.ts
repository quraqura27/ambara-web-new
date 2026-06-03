import { NextRequest, NextResponse } from "next/server";

import {
  findPublicTrackingResult,
  TrackingWebAppConfigError,
  TrackingWebAppUpstreamError,
} from "@/lib/google-sheets/tracking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function getTrackingQuery(searchParams: URLSearchParams) {
  for (const key of ["id", "tracking", "trackingNumber"]) {
    const value = searchParams.get(key);

    if (value?.trim()) {
      return value;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const trackingInput = getTrackingQuery(request.nextUrl.searchParams);

  if (!trackingInput) {
    return NextResponse.json(
      { error: "Tracking number is required" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const result = await findPublicTrackingResult(trackingInput);

    if (!result) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) {
    const isConfigError = error instanceof TrackingWebAppConfigError;
    const isUpstreamError = error instanceof TrackingWebAppUpstreamError;

    console.error(
      isConfigError
        ? "Tracking web app URL is not configured"
        : "Tracking web app lookup failed",
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: isUpstreamError ? 502 : 500, headers: noStoreHeaders },
    );
  }
}
