import { getMawbWorkbookInput } from "@/actions/mawbs";
import { buildMawbWorkbookFilename, generateMawbWorkbook } from "@/lib/mawbs/xlsx";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const mawbId = Number.parseInt(id, 10);

  if (!Number.isInteger(mawbId) || mawbId <= 0) {
    return new Response("MAWB not found", { status: 404 });
  }

  const input = await getMawbWorkbookInput(mawbId);
  if (!input) {
    return new Response("MAWB not found", { status: 404 });
  }

  const workbook = await generateMawbWorkbook(input);

  return new Response(workbook, {
    headers: {
      "Content-Disposition": `attachment; filename="${buildMawbWorkbookFilename(input.mawbNumber)}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
