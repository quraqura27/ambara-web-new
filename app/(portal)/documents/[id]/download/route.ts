import { NextResponse } from "next/server";

import { getDocumentDownload } from "@/actions/documents";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const documentId = Number.parseInt((await context.params).id, 10);
  if (!Number.isInteger(documentId) || documentId <= 0) return new Response("Document not found", { status: 404 });
  const signedUrl = await getDocumentDownload(documentId);
  if (!signedUrl) return new Response("Document not found", { status: 404 });
  const response = NextResponse.redirect(signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
