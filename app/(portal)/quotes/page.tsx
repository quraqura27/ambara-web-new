import Link from "next/link";
import { ArrowRight, MessageSquareQuote, Search } from "lucide-react";

import { getQuotesPage } from "@/actions/quotes";
import { quoteStatusValues } from "@/lib/quotes/core";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button, Input } from "@/components/ui/core";
import { formatWibDate, formatWibDateTime } from "@/lib/time/wib";

type QuotesPageProps = {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
};

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const result = await getQuotesPage({
    page: Number.parseInt(params.page || "1", 10) || 1,
    search: params.search,
    status: params.status,
  });
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    query.set("page", String(page));
    return `/quotes?${query}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase text-emerald-300">Commercial</p><h1 className="mt-2 text-2xl font-semibold">Quote requests</h1><p className="mt-1 text-sm text-slate-500">Public requests, ownership, next action, and outcome.</p></div>
        <MessageSquareQuote className="h-7 w-7 text-blue-300" />
      </header>

      <form className="grid gap-3 border-y border-white/5 py-4 md:grid-cols-[minmax(260px,1fr)_180px_auto]" method="get">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><Input className="pl-10" defaultValue={params.search} name="search" placeholder="Reference, contact, company, route..." /></label>
        <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm" defaultValue={params.status ?? ""} name="status"><option value="">All statuses</option>{quoteStatusValues.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <Button type="submit" variant="secondary">Apply filters</Button>
      </form>

      <div className="divide-y divide-white/5 rounded-lg border border-white/5 md:hidden">
        {result.rows.map((row) => (
          <article className="space-y-3 p-4" key={row.id}>
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-mono text-xs font-semibold text-blue-300" href={`/quotes/${row.id}`}>{row.referenceNumber}</Link><p className="mt-1 truncate text-sm text-slate-300">{row.companyName || row.contactName}</p></div><StatusBadge status={row.status} /></div>
            <p className="text-xs text-slate-400">{row.origin} to {row.destination} / {row.weightKg || "-"} kg / ready {formatWibDate(row.readyDate)}</p>
            <div className="grid grid-cols-2 gap-3 text-xs"><p><span className="block text-slate-600">Owner</span>{row.assignedTo || "Unassigned"}</p><p><span className="block text-slate-600">Received</span>{formatWibDateTime(row.createdAt)}</p></div>
            <Link className="block" href={`/quotes/${row.id}`}><Button className="w-full" variant="secondary">Open request</Button></Link>
          </article>
        ))}
        {result.rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No quote requests match these filters.</p> : null}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-white/5 md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-white/[0.03] text-[10px] font-semibold uppercase text-slate-600"><tr><th className="px-4 py-3">Request</th><th className="px-4 py-3">Route / cargo</th><th className="px-4 py-3">Owner / next action</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Received</th><th className="w-12" /></tr></thead>
          <tbody className="divide-y divide-white/5">
            {result.rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4"><Link className="font-mono text-xs font-semibold text-blue-300" href={`/quotes/${row.id}`}>{row.referenceNumber}</Link><p className="mt-1 text-xs text-slate-300">{row.companyName || row.contactName}</p></td>
                <td className="px-4 py-4 text-xs text-slate-400"><p>{row.origin} to {row.destination}</p><p className="mt-1 text-slate-600">{row.weightKg || "-"} kg / ready {formatWibDate(row.readyDate)}</p></td>
                <td className="max-w-xs px-4 py-4 text-xs"><p className="text-slate-300">{row.assignedTo || "Unassigned"}</p><p className="mt-1 truncate text-slate-600">{row.nextAction || "No next action"}{row.dueAt ? ` / ${formatWibDateTime(row.dueAt)}` : ""}</p></td>
                <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{formatWibDateTime(row.createdAt)}</td>
                <td><Link aria-label={`Open ${row.referenceNumber}`} href={`/quotes/${row.id}`}><ArrowRight className="h-4 w-4 text-slate-600" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No quote requests match these filters.</p> : null}
      </div>

      <div className="flex items-center justify-between">
        {result.page > 1 ? <Link href={pageHref(result.page - 1)}><Button variant="secondary">Previous</Button></Link> : <span />}
        <p className="text-xs text-slate-600">Page {result.page} of {result.totalPages} / {result.total} requests</p>
        {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)}><Button variant="secondary">Next</Button></Link> : <span />}
      </div>
    </div>
  );
}
