import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  FileUp,
  Gauge,
  PackagePlus,
  PlaneTakeoff,
  Search,
  UserRoundX,
} from "lucide-react";

import type { OperationalDashboardData } from "@/actions/dashboard";
import { Button, Card, cn } from "@/components/ui/core";
import type { PortalCapability } from "@/lib/portal-roles";
import { formatWibDate, formatWibDateTime } from "@/lib/time/wib";

type OperationsDashboardProps = {
  data: OperationalDashboardData;
};

const metricTone = {
  blue: "border-blue-500/20 bg-blue-500/[0.06] text-blue-300",
  emerald: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
  amber: "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
  rose: "border-rose-500/20 bg-rose-500/[0.06] text-rose-300",
} as const;

function Metric({ context, href, icon: Icon, label, tone, value }: {
  context: string;
  href: string;
  icon: typeof Gauge;
  label: string;
  tone: keyof typeof metricTone;
  value: number | string;
}) {
  return (
    <Link className="group" href={href}>
      <Card className="h-full p-4 transition hover:border-white/15 hover:bg-white/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", metricTone[tone])}>
            <Icon className="h-4 w-4" />
          </div>
          <ArrowRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
        </div>
        <p className="mt-4 font-mono text-2xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-200">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{context}</p>
      </Card>
    </Link>
  );
}

function priorityClass(priority: "critical" | "high" | "normal") {
  if (priority === "critical") return "border-rose-500/25 bg-rose-500/10 text-rose-200";
  if (priority === "high") return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  return "border-slate-700 bg-slate-800/60 text-slate-300";
}

function currencyValue(value: string, currency: string | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    currency: currency || "IDR",
    maximumFractionDigits: 0,
    notation: amount >= 1_000_000_000 ? "compact" : "standard",
    style: "currency",
  }).format(amount);
}

export function OperationsDashboard({ data }: OperationsDashboardProps) {
  const can = (value: PortalCapability) => data.capabilities.includes(value);
  const operationsMetrics = [
    { context: "Non-voided work not yet completed", href: "/shipments", icon: Gauge, label: "Active shipments", tone: "blue" as const, value: data.stats.active },
    { context: "Exceptions, holds, or explicit blockers", href: "/shipments?view=needs_attention", icon: AlertTriangle, label: "Needs attention", tone: "rose" as const, value: data.stats.exceptions },
    { context: "Shipment actions due by this time tomorrow", href: "/operations?window=24h", icon: CalendarClock, label: "Due next 24h", tone: "amber" as const, value: data.stats.dueNext24 },
    { context: "Active records missing required document readiness", href: "/operations?readiness=documents", icon: FileCheck2, label: "Documents not ready", tone: "amber" as const, value: data.stats.documentsNotReady },
    { context: "Open operational tasks already past due", href: "/operations?task=overdue", icon: ClipboardCheck, label: "Overdue tasks", tone: "rose" as const, value: data.stats.overdue },
    { context: "Active shipments without an accountable owner", href: "/operations?owner=unassigned", icon: UserRoundX, label: "Unassigned", tone: "emerald" as const, value: data.stats.unassigned },
  ];
  const readOnlyMetrics = operationsMetrics.filter((metric) =>
    ["Active shipments", "Needs attention", "Documents not ready"].includes(metric.label),
  ).map((metric) => ({ ...metric, href: metric.label === "Needs attention" ? "/shipments?view=needs_attention" : "/shipments" }));
  const financeMetrics = data.finance.flatMap((row) => [
    { context: `${row.unpaid} sent invoices awaiting payment`, href: "/invoices/collections", icon: CircleDollarSign, label: `Outstanding ${row.currency || "IDR"}`, tone: "emerald" as const, value: currencyValue(row.outstanding, row.currency) },
    { context: "Requires collection follow-up", href: "/invoices/collections", icon: AlertTriangle, label: `Overdue ${row.currency || "IDR"}`, tone: "rose" as const, value: row.overdue },
  ]);
  const metrics = data.role === "finance" && financeMetrics.length > 0
    ? financeMetrics
    : can("operations:manage")
      ? operationsMetrics
      : readOnlyMetrics;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-300">Operational control</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Today&apos;s work</h1>
          <p className="mt-1 text-sm text-slate-500">Prioritized for {data.userName} / {data.role}.</p>
        </div>
        <p className="font-mono text-xs text-slate-500">Snapshot {formatWibDateTime(data.generatedAt)}</p>
      </header>

      <section aria-label="Role-aware metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </section>

      {can("shipment:create") ? (
        <nav aria-label="Quick actions" className="flex flex-wrap items-center gap-2 border-y border-white/5 py-3">
          <span className="mr-2 text-xs font-semibold uppercase text-slate-600">Start</span>
          <Link href="/shipments/new"><Button className="gap-2" variant="secondary"><PackagePlus className="h-4 w-4" /> Shipment</Button></Link>
          <Link href="/shipments/bulk-import"><Button className="gap-2" variant="ghost"><FileUp className="h-4 w-4" /> Bulk input</Button></Link>
          <Link href="/search"><Button className="gap-2" variant="ghost"><Search className="h-4 w-4" /> Find record</Button></Link>
        </nav>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><h2 className="text-base font-semibold text-white">Prioritized next actions</h2><p className="mt-1 text-xs text-slate-500">Blockers and deadlines first.</p></div>
            {can("operations:manage") ? <Link className="text-xs font-semibold text-blue-300" href="/operations">Open queue</Link> : null}
          </div>
          <div className="overflow-hidden rounded-lg border border-white/5 bg-[#101016]">
            <div className="divide-y divide-white/5">
              {data.prioritizedQueue.map((item) => (
                <Link className="grid gap-3 p-4 transition hover:bg-white/[0.03] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center" href={item.href} key={item.id}>
                  <span className={cn("w-fit rounded-md border px-2 py-1 text-[10px] font-semibold uppercase", priorityClass(item.priority))}>{item.priority}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">{item.detail}</p></div>
                  <div className="text-left sm:text-right"><p className="text-xs text-slate-300">{item.dueAt ? formatWibDateTime(item.dueAt) : "No deadline"}</p><p className="mt-1 text-[11px] text-slate-600">{item.owner || "Unassigned"}</p></div>
                </Link>
              ))}
              {data.prioritizedQueue.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No urgent work is queued.</p> : null}
            </div>
          </div>
        </section>

        {data.movements.length > 0 ? <section>
          <div className="mb-3"><h2 className="text-base font-semibold text-white">Next 24-hour movements</h2><p className="mt-1 text-xs text-slate-500">Flight-linked MAWB activity.</p></div>
          <div className="space-y-2">
            {data.movements.map((movement) => (
              <Link className="block rounded-lg border border-white/5 bg-[#101016] p-4 transition hover:border-blue-500/20" href={`/mawbs/${movement.mawbId}`} key={`${movement.mawbId}-${movement.trackingNumber || "unlinked"}`}>
                <div className="flex items-center justify-between gap-3"><p className="font-mono text-xs font-semibold text-blue-300">{movement.mawbNumber}</p><PlaneTakeoff className="h-4 w-4 text-emerald-300" /></div>
                <p className="mt-3 text-sm font-semibold text-white">{movement.originIata} to {movement.destinationIata}</p>
                <p className="mt-1 text-xs text-slate-500">{movement.flightNumber || "Flight TBA"} / {formatWibDate(movement.flightDate)}</p>
              </Link>
            ))}
            {data.movements.length === 0 ? <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No linked movement is scheduled.</div> : null}
          </div>
        </section> : null}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-semibold text-white">MAWB, document, and customs readiness</h2><p className="mt-1 text-xs text-slate-500">Incomplete active records requiring preparation or review.</p></div><Link className="text-xs font-semibold text-blue-300" href="/operations?readiness=all">View all</Link></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {data.readinessRows.slice(0, 5).map((row) => (
            <Link className="rounded-lg border border-white/5 bg-[#101016] p-4 transition hover:bg-white/[0.03]" href={`/shipments/${encodeURIComponent(row.trackingNumber)}`} key={row.trackingNumber}>
              <p className="truncate font-mono text-xs font-semibold text-white">{row.trackingNumber}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase">
                {!row.mawb ? <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-200">MAWB missing</span> : null}
                {row.documentReadiness !== "ready" ? <span className="rounded bg-rose-500/10 px-2 py-1 text-rose-200">Docs {row.documentReadiness.replace(/_/g, " ")}</span> : null}
                {row.customsReviewRequired || row.regulatedCargo ? <span className="rounded bg-blue-500/10 px-2 py-1 text-blue-200">Customs review</span> : null}
              </div>
              <p className="mt-3 text-xs text-slate-600">{row.operationalStage.replace(/_/g, " ")}</p>
            </Link>
          ))}
        </div>
      </section>

      {data.finance.length > 0 ? (
        <section>
          <div className="mb-3"><h2 className="text-base font-semibold text-white">Finance follow-up</h2><p className="mt-1 text-xs text-slate-500">Sent invoices awaiting payment.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.finance.map((row) => (
              <Link className="rounded-lg border border-white/5 bg-[#101016] p-4" href="/invoices/collections" key={row.currency || "IDR"}>
                <div className="flex items-center justify-between"><CircleDollarSign className="h-5 w-5 text-emerald-300" /><span className="font-mono text-xs text-slate-500">{row.currency || "IDR"}</span></div>
                <p className="mt-4 text-xl font-semibold text-white">{currencyValue(row.outstanding, row.currency)}</p>
                <p className="mt-1 text-xs text-slate-500">{row.unpaid} unpaid / {row.overdue} overdue</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-semibold text-white">Recent shipment activity</h2><p className="mt-1 text-xs text-slate-500">Secondary context after the active queues.</p></div><Link className="text-xs font-semibold text-blue-300" href="/shipments?view=updated_today">All activity</Link></div>
        <div className="divide-y divide-white/5 rounded-lg border border-white/5 md:hidden">
          {data.recentShipments.map((row) => (
            <Link className="block p-4" href={`/shipments/${encodeURIComponent(row.trackingNumber)}`} key={row.trackingNumber}>
              <div className="flex items-start justify-between gap-3"><p className="font-mono text-xs font-semibold text-blue-300">{row.trackingNumber}</p><p className="text-[11px] text-slate-600">{formatWibDateTime(row.updatedAt)}</p></div>
              <p className="mt-2 truncate text-sm text-slate-300">{row.customerName || "Unlinked"}</p>
              <p className="mt-1 text-xs text-slate-500">{row.origin} to {row.destination} / {row.operationalStage.replace(/_/g, " ")}</p>
            </Link>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-white/5 md:block">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white/[0.03] text-[10px] font-semibold uppercase text-slate-600"><tr><th className="px-4 py-3">Shipment</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3 text-right">Updated</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {data.recentShipments.map((row) => <tr key={row.trackingNumber}><td className="px-4 py-3"><Link className="font-mono text-xs font-semibold text-blue-300" href={`/shipments/${encodeURIComponent(row.trackingNumber)}`}>{row.trackingNumber}</Link></td><td className="px-4 py-3 text-xs text-slate-400">{row.customerName || "Unlinked"}</td><td className="px-4 py-3 text-xs text-slate-400">{row.origin} to {row.destination}</td><td className="px-4 py-3 text-xs text-slate-300">{row.operationalStage.replace(/_/g, " ")}</td><td className="px-4 py-3 text-right text-xs text-slate-500">{formatWibDateTime(row.updatedAt)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
