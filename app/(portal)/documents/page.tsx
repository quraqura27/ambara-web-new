import Link from "next/link";
import { Download, FileCheck2, Search } from "lucide-react";

import { getDocumentsPage } from "@/actions/documents";
import { Button, Input } from "@/components/ui/core";
import { shipmentDocumentTypes } from "@/lib/documents/core";
import { formatWibDateTime } from "@/lib/time/wib";

type DocumentsPageProps = { searchParams: Promise<{ search?: string; type?: string }> };

function fileSize(value: number | null) {
  if (!value) return "-";
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(value / 1024)} KB`;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;
  const rows = await getDocumentsPage(params);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div><p className="text-xs font-semibold uppercase text-emerald-300">Records</p><h1 className="mt-2 text-2xl font-semibold">Documents</h1><p className="mt-1 text-sm text-slate-500">Current shipment document versions.</p></div>
        <FileCheck2 className="h-7 w-7 text-blue-300" />
      </header>

      <form className="grid gap-3 border-y border-white/5 py-4 md:grid-cols-[1fr_220px_auto]" method="get">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><Input className="pl-10" defaultValue={params.search} name="search" placeholder="Tracking, customer, file name..." /></label>
        <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm" defaultValue={params.type ?? ""} name="type"><option value="">All document types</option>{shipmentDocumentTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}</select>
        <Button type="submit" variant="secondary">Apply filters</Button>
      </form>

      <div className="divide-y divide-white/5 rounded-lg border border-white/5 md:hidden">
        {rows.map((row) => (
          <article className="space-y-3 p-4" key={row.id}>
            <div><Link className="break-all font-mono text-xs font-semibold text-blue-300" href={`/shipments/${encodeURIComponent(row.trackingNumber)}#documents`}>{row.trackingNumber}</Link><p className="mt-1 truncate text-xs text-slate-600">{row.customerName || "Unlinked"}</p></div>
            <div><p className="break-words text-sm font-semibold text-slate-200">{row.fileName}</p><p className="mt-1 text-xs text-slate-600">{row.docType.replace(/_/g, " ")} / v{row.version} / {fileSize(row.fileSize)}</p></div>
            <p className="text-xs text-slate-500">Uploaded {formatWibDateTime(row.uploadedAt)}</p>
            <Link className="block" href={`/documents/${row.id}/download`}><Button className="w-full gap-2" variant="secondary"><Download className="h-4 w-4" />Download</Button></Link>
          </article>
        ))}
        {rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No current documents match these filters.</p> : null}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-white/5 md:block">
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-white/[0.03] text-[10px] font-semibold uppercase text-slate-600"><tr><th className="px-4 py-3">Shipment</th><th className="px-4 py-3">Document</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3 text-right">Download</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4"><Link className="font-mono text-xs font-semibold text-blue-300" href={`/shipments/${encodeURIComponent(row.trackingNumber)}#documents`}>{row.trackingNumber}</Link><p className="mt-1 text-xs text-slate-600">{row.customerName || "Unlinked"}</p></td>
                <td className="px-4 py-4"><p className="text-sm font-semibold text-slate-200">{row.fileName}</p><p className="mt-1 text-xs text-slate-600">{row.docType.replace(/_/g, " ")} / {fileSize(row.fileSize)}</p></td>
                <td className="px-4 py-4 font-mono text-xs text-slate-400">v{row.version}</td>
                <td className="px-4 py-4 text-xs text-slate-500">{formatWibDateTime(row.uploadedAt)}</td>
                <td className="px-4 py-4 text-right"><Link href={`/documents/${row.id}/download`}><Button aria-label={`Download ${row.fileName}`} className="h-9 w-9 p-0" title={`Download ${row.fileName}`} variant="ghost"><Download className="h-4 w-4" /></Button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No current documents match these filters.</p> : null}
      </div>
    </div>
  );
}
