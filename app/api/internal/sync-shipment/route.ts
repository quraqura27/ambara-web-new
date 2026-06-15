import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const disabledMessage =
  "Google Sheets import has been disabled. Use manual shipment input or bulk shipment import.";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

export async function POST() {
  return jsonResponse(
    {
      success: false,
      error: {
        code: "GOOGLE_SHEETS_IMPORT_DISABLED",
        message: disabledMessage,
      },
    },
    410,
  );
}
