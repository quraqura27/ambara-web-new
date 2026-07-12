import Link from "next/link";
import { Download, FileCheck2, Upload } from "lucide-react";

import { archiveShipmentDocument, uploadShipmentDocument } from "@/actions/documents";
import { TypedConfirmSubmitButton } from "@/components/portal/confirm-submit-button";
import { Button, Input } from "@/components/ui/core";
import { shipmentDocumentTypes } from "@/lib/documents/core";
import { formatWibDateTime } from "@/lib/time/wib";

type DocumentData = NonNullable<Awaited<ReturnType<typeof import("@/actions/documents").getShipmentDocuments>>>;

function fileSize(value: number | null) {
  if (!value) return "-";
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
}

export function ShipmentDocumentsPanel({ canManage, data }: { canManage: boolean; data: DocumentData }) {
  const uploadAction = uploadShipmentDocument.bind(null, data.shipment.trackingNumber);
  return (
    <section className="space-y-4 border-t border-white/5 pt-6" id="documents">
      <div><h2 className="text-base font-semibold">Shipment documents</h2><p className="mt-1 text-xs text-slate-500">Current and retained versions. Archived files remain stored for audit history.</p></div>
      <div className="overflow-x-auto rounded-lg border border-white/5"><table className="w-full min-w-[760px] text-left"><thead className="bg-white/[0.03] text-[10px] font-semibold uppercase text-slate-600"><tr><th className="px-4 py-3">Document</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/5">{data.rows.map((document) => { const archiveAction = archiveShipmentDocument.bind(null, document.id, data.shipment.trackingNumber); return <tr key={document.id}><td className="px-4 py-4"><p className="text-sm font-semibold text-slate-200">{document.fileName}</p><p className="mt-1 text-xs text-slate-600">{document.docType.replace(/_/g, " ")} / {fileSize(document.fileSize)}</p></td><td className="px-4 py-4 font-mono text-xs text-slate-400">v{document.version}</td><td className="px-4 py-4 text-xs text-slate-500">{formatWibDateTime(document.uploadedAt)}</td><td className="px-4 py-4"><span className="rounded-md bg-white/5 px-2 py-1 text-[10px] uppercase text-slate-400">{document.status}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-2">{document.status !== "archived" ? <Link href={`/documents/${document.id}/download`}><Button className="h-9 gap-2" variant="ghost"><Download className="h-4 w-4" />Download</Button></Link> : null}{canManage && document.status === "current" && !data.shipment.voidedAt ? <form action={archiveAction} className="flex min-w-56 gap-2"><Input aria-label={`Archive reason for ${document.fileName}`} name="reason" placeholder="Archive reason" required /><TypedConfirmSubmitButton confirmText={document.fileName} description="The R2 object and metadata will be retained. This removes the file from current operational use without deleting history." title="Archive document?"><FileCheck2 className="mr-2 h-4 w-4" />Archive</TypedConfirmSubmitButton></form> : null}</div></td></tr>; })}</tbody></table>{data.rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">No documents uploaded.</p> : null}</div>
      {canManage && !data.shipment.voidedAt ? <form action={uploadAction} className="grid gap-3 rounded-lg border border-dashed border-white/10 p-4 md:grid-cols-[180px_1fr_1fr_auto] md:items-end"><label className="space-y-2"><span className="text-xs text-slate-500">Document type</span><select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm" name="docType" required>{shipmentDocumentTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}</select></label><label className="space-y-2"><span className="text-xs text-slate-500">File (PDF, JPEG, PNG / max 8 MB)</span><Input accept="application/pdf,image/jpeg,image/png" name="file" required type="file" /></label><label className="space-y-2"><span className="text-xs text-slate-500">Internal note</span><Input maxLength={500} name="note" /></label><Button className="gap-2" type="submit"><Upload className="h-4 w-4" />Upload version</Button></form> : null}
    </section>
  );
}
