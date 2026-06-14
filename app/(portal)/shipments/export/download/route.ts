import { NextRequest, NextResponse } from "next/server";

import {
  buildShipmentExportCsv,
  buildShipmentExportFilename,
  canExportShipments,
  isXlsxExportEnabled,
  parseShipmentExportFilters,
  xlsxExportUnavailableMessage,
} from "@/lib/shipment-export/core";
import {
  getShipmentExportRows,
  ShipmentExportTooLargeError,
} from "@/lib/shipment-export/database";
import { getPortalUser } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(request: NextRequest) {
  const user = await getPortalUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  if (!canExportShipments(user)) {
    return NextResponse.json(
      { error: "Admin access is required for shipment exports." },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const { errors, filters } = parseShipmentExportFilters(request.nextUrl.searchParams);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400, headers: noStoreHeaders });
  }

  if (filters.format === "xlsx" && !isXlsxExportEnabled()) {
    return new Response(xlsxExportUnavailableMessage, {
      status: 501,
      headers: {
        ...noStoreHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  try {
    const rows = await getShipmentExportRows(filters);
    const csv = buildShipmentExportCsv(filters, rows);
    const filename = buildShipmentExportFilename({ ...filters, format: "csv" });

    return new Response(csv, {
      headers: {
        ...noStoreHeaders,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof ShipmentExportTooLargeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 413, headers: noStoreHeaders },
      );
    }

    throw error;
  }
}
