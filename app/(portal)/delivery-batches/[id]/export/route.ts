import { getDeliveryBatchExportCsv } from "@/actions/vendor-tracking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batchId = Number.parseInt(id, 10);

  if (!Number.isInteger(batchId) || batchId <= 0) {
    return new Response("Invalid batch id", { status: 400 });
  }

  const { batchCode, csv } = await getDeliveryBatchExportCsv(batchId);

  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${batchCode}-vendor-upload.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
