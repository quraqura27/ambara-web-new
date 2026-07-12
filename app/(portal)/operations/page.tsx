import Link from "next/link";
import { AlertTriangle, CalendarClock, ListTodo, UserRoundX } from "lucide-react";

import { getOperationsQueue } from "@/actions/shipment-readiness";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/core";
import { shipmentOperationalStages } from "@/lib/shipments/readiness";
import { formatWibDateTime } from "@/lib/time/wib";

type OperationsPageProps = {
  searchParams: Promise<{
    owner?: string;
    readiness?: string;
    stage?: string;
    task?: string;
    window?: string;
  }>;
};

export default async function OperationsPage({ searchParams }: OperationsPageProps) {
  const filters = await searchParams;
  const rows = await getOperationsQueue(filters);
  const queueViews = [
    ["/operations", ListTodo, "All active"],
    ["/operations?window=24h", CalendarClock, "Due next 24h"],
    ["/operations?task=overdue", AlertTriangle, "Overdue tasks"],
    ["/operations?owner=unassigned", UserRoundX, "Unassigned"],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-300">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold">Readiness queue</h1>
          <p className="mt-1 text-sm text-slate-500">Ownership, blockers, documents, customs, and due work.</p>
        </div>
        <p className="font-mono text-xs text-slate-600">{rows.length} active records</p>
      </header>

      <nav aria-label="Operational queue views" className="flex flex-wrap gap-2">
        {queueViews.map(([href, Icon, label]) => (
          <Link href={href} key={href}>
            <Button className="gap-2" variant="secondary"><Icon className="h-4 w-4" />{label}</Button>
          </Link>
        ))}
      </nav>

      <form className="grid gap-3 border-y border-white/5 py-4 md:grid-cols-[1fr_1fr_auto]" method="get">
        <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm" defaultValue={filters.stage ?? ""} name="stage">
          <option value="">All stages</option>
          {shipmentOperationalStages.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
        </select>
        <select className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm" defaultValue={filters.readiness ?? ""} name="readiness">
          <option value="">All readiness</option>
          <option value="documents">Documents not ready</option>
          <option value="mawb">MAWB missing</option>
          <option value="customs">Customs or regulated</option>
        </select>
        {filters.owner ? <input name="owner" type="hidden" value={filters.owner} /> : null}
        <Button type="submit" variant="secondary">Apply filters</Button>
      </form>

      <div className="divide-y divide-white/5 rounded-lg border border-white/5 md:hidden">
        {rows.map((row) => (
          <article className={row.blocker ? "space-y-3 bg-rose-500/[0.03] p-4" : "space-y-3 p-4"} key={row.trackingNumber}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="break-all font-mono text-sm font-semibold text-blue-300" href={`/shipments/${encodeURIComponent(row.trackingNumber)}`}>{row.trackingNumber}</Link>
                <p className="mt-1 truncate text-xs text-slate-500">{row.customerName || "Unlinked"}</p>
              </div>
              <StatusBadge status={row.operationalStage} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <p><span className="block text-slate-600">Owner</span>{row.owner || "Unassigned"}</p>
              <p><span className="block text-slate-600">Due (WIB)</span>{row.actionDueAt ? formatWibDateTime(row.actionDueAt) : "-"}</p>
            </div>
            <p className="text-sm text-slate-300">{row.nextAction || "No next action"}</p>
            {row.blocker ? <p className="text-xs text-rose-300">Blocked: {row.blocker}</p> : null}
          </article>
        ))}
        {rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No active shipments match this queue.</p> : null}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-white/5 md:block">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-white/[0.03] text-[10px] font-semibold uppercase text-slate-600">
            <tr><th className="px-4 py-3">Shipment</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Next action</th><th className="px-4 py-3">Readiness</th><th className="px-4 py-3 text-right">Due (WIB)</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr className={row.blocker ? "bg-rose-500/[0.03]" : ""} key={row.trackingNumber}>
                <td className="px-4 py-4"><Link className="font-mono text-xs font-semibold text-blue-300" href={`/shipments/${encodeURIComponent(row.trackingNumber)}`}>{row.trackingNumber}</Link><p className="mt-1 text-xs text-slate-600">{row.customerName || "Unlinked"}</p></td>
                <td className="px-4 py-4"><StatusBadge status={row.operationalStage} /></td>
                <td className="px-4 py-4 text-xs text-slate-400">{row.owner || "Unassigned"}</td>
                <td className="max-w-sm px-4 py-4 text-xs"><p className="text-slate-300">{row.nextAction || "No next action"}</p>{row.blocker ? <p className="mt-1 text-rose-300">Blocked: {row.blocker}</p> : null}</td>
                <td className="px-4 py-4 text-xs text-slate-400">Docs {row.documentReadiness.replace(/_/g, " ")}{!row.mawb ? " / No MAWB" : ""}{row.regulatedCargo ? " / Regulated" : ""}</td>
                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{row.actionDueAt ? formatWibDateTime(row.actionDueAt) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No active shipments match this queue.</p> : null}
      </div>
    </div>
  );
}
