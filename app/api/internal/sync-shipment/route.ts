import { NextRequest, NextResponse } from "next/server";

import { getSheetsSyncAuthError } from "@/lib/sheet-sync/auth";
import { upsertSheetShipmentToDatabase } from "@/lib/sheet-sync/database";
import {
  parseSheetShipmentPayload,
  SheetShipmentPayloadError,
} from "@/lib/sheet-sync/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

export async function POST(request: NextRequest) {
  const authError = getSheetsSyncAuthError(request.headers);
  if (authError) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: authError.code,
          message: authError.message,
        },
      },
      authError.status,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "SYNC_INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      },
      400,
    );
  }

  try {
    const parsed = parseSheetShipmentPayload(payload);
    const result = await upsertSheetShipmentToDatabase(parsed.values);

    return jsonResponse({
      success: true,
      result: result.action,
      tracking_number: parsed.trackingNumber,
      shipment_id: result.id,
    });
  } catch (error) {
    if (error instanceof SheetShipmentPayloadError) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        400,
      );
    }

    console.error("Sheet shipment sync failed");
    return jsonResponse(
      {
        success: false,
        error: {
          code: "SYNC_DATABASE_ERROR",
          message: "Shipment sync failed",
        },
      },
      500,
    );
  }
}
