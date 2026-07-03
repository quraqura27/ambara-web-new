import { headers } from "next/headers";

import { getInvoiceDetail } from "@/actions/invoices";
import {
  buildInvoicePdfDownloadName,
  generateInvoicePdf,
} from "@/lib/invoices/pdf";

export const dynamic = "force-dynamic";

function verificationBaseUrl(host: string | null, protocol: string | null) {
  if (host) return `${protocol || "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.ambaraartha.com";
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const detail = await getInvoiceDetail(id);
  if (!detail) {
    return new Response("Invoice not found", { status: 404 });
  }

  const hdrs = await headers();
  const baseUrl = verificationBaseUrl(hdrs.get("host"), hdrs.get("x-forwarded-proto"));
  const verificationUrl = detail.invoice.verificationToken
    ? `${baseUrl}/invoice/verify/${detail.invoice.verificationToken}`
    : baseUrl;
  const pdfBytes = await generateInvoicePdf({ ...detail, verificationUrl });
  const filename = buildInvoicePdfDownloadName(detail.invoice);
  const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfBuffer).set(pdfBytes);
  const pdfBody = new Blob([pdfBuffer], { type: "application/pdf" });
  const disposition = new URL(request.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";

  return new Response(pdfBody, {
    headers: {
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Content-Type": "application/pdf",
    },
  });
}
