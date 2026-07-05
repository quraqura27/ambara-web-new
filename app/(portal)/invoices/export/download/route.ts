import { NextRequest, NextResponse } from "next/server";

import {
  buildInvoiceExportCsv,
  buildInvoiceExportFilename,
  canExportInvoices,
  InvoiceExportTooLargeError,
  parseInvoiceExportFilters,
} from "@/lib/invoices/export";
import { getInvoiceExportRows } from "@/lib/invoices/export-database";
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

  if (!canExportInvoices(user)) {
    return NextResponse.json(
      { error: "Finance access is required for invoice exports." },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const { errors, filters } = parseInvoiceExportFilters(request.nextUrl.searchParams);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400, headers: noStoreHeaders });
  }

  try {
    const rows = await getInvoiceExportRows(filters);
    const csv = buildInvoiceExportCsv(filters, rows);
    const filename = buildInvoiceExportFilename(filters);

    return new Response(csv, {
      headers: {
        ...noStoreHeaders,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof InvoiceExportTooLargeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 413, headers: noStoreHeaders },
      );
    }

    throw error;
  }
}
