import { NextRequest, NextResponse } from "next/server";

import { findPublicTrackingResult } from "@/lib/tracking/public-tracking";

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
        { error: "Shipment not found", code: "SHIPMENT_NOT_FOUND" },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) {
    const databaseError =
      error && typeof error === "object"
        ? {
            code: "code" in error ? String(error.code) : undefined,
            message: error instanceof Error ? error.message : "Unknown database error",
            name: error instanceof Error ? error.name : "UnknownError",
          }
        : { message: "Unknown database error", name: "UnknownError" };

    console.error(
      JSON.stringify({
        event: "public_tracking_lookup_failed",
        ...databaseError,
      }),
    );

    return NextResponse.json(
      {
        error: "Tracking service is temporarily unavailable",
        code: "TRACKING_DATABASE_ERROR",
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
