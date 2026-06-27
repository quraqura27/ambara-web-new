import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileUp,
  PackagePlus,
  Search,
} from "lucide-react";

import { getOperationalDashboard } from "@/actions/dashboard";
import { Card } from "@/components/ui/core";

function formatDate(value: Date | string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

const quickActions = [
  {
    description: "Create one MAWB with one or more tracking numbers/CNs.",
    href: "/shipments/new",
    icon: PackagePlus,
    label: "Create Shipments + MAWB",
  },
  {
    description: "Rows are grouped into MAWBs by MAWB number.",
    href: "/shipments/bulk-import",
    icon: FileUp,
    label: "Bulk Input",
  },
  {
    description: "Search tracking, customer, AWB, or reference.",
    href: "/search",
    icon: Search,
    label: "Find and Track Shipment",
  },
];

export default async function DashboardPage() {
  const dashboard = await getOperationalDashboard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operations Home</h1>
        <p className="mt-1 text-slate-500">
          Start a shipment, import a file, or find an existing shipment.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link href={action.href} key={action.href}>
              <Card className="h-full p-6 transition hover:border-blue-500/40 hover:bg-blue-500/[0.04]">
                <Icon className="h-7 w-7 text-blue-400" />
                <h2 className="mt-5 text-lg font-bold text-white">{action.label}</h2>
                <p className="mt-2 text-sm text-slate-500">{action.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-300">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <h2 className="font-semibold">Shipment exceptions</h2>
              <p className="mt-1 text-xs text-slate-500">Holds and genuine delivery problems.</p>
            </div>
            <Link className="text-xs font-semibold text-blue-300" href="/shipments?view=needs_attention">
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {dashboard.attentionShipments.map((shipment) => (
              <Link
                className="flex items-center gap-4 p-5 transition hover:bg-white/[0.02]"
                href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}
                key={shipment.trackingNumber}
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-white">
                    {shipment.trackingNumber}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {shipment.customerName || "Unlinked"} / {shipment.serviceType || "-"} /{" "}
                    {shipment.status.replace(/_/g, " ")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </Link>
            ))}
            {dashboard.attentionShipments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No shipment exceptions need attention.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <h2 className="font-semibold">Overdue delivery batches</h2>
              <p className="mt-1 text-xs text-slate-500">DTD and PTD last-mile work past SLA.</p>
            </div>
            <Link className="text-xs font-semibold text-blue-300" href="/delivery-batches?view=overdue">
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {dashboard.overdueBatches.map((batch) => (
              <Link
                className="flex items-center gap-4 p-5 transition hover:bg-white/[0.02]"
                href={`/delivery-batches/${batch.id}`}
                key={batch.id}
              >
                <Clock3 className="h-5 w-5 shrink-0 text-orange-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-white">{batch.batchCode}</p>
                  <p className="truncate text-xs text-slate-500">
                    {batch.vendorName} / SLA {formatDate(batch.slaDeadline)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </Link>
            ))}
            {dashboard.overdueBatches.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No overdue delivery batches.</div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div>
            <h2 className="font-semibold">Recent shipments</h2>
            <p className="mt-1 text-xs text-slate-500">Latest operational activity.</p>
          </div>
          <Link className="text-xs font-semibold text-blue-300" href="/shipments?view=updated_today">
            View all
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {dashboard.recentShipments.map((shipment) => (
            <Link
              className="grid gap-2 p-5 transition hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center"
              href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}
              key={shipment.trackingNumber}
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-blue-300">
                  {shipment.trackingNumber}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {shipment.customerName || "Unlinked"} / {shipment.serviceType || "-"}
                </p>
              </div>
              <p className="truncate text-xs text-slate-400">
                {shipment.origin} → {shipment.destination}
              </p>
              <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                <p className="text-xs font-semibold uppercase text-slate-300">
                  {shipment.status.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">{formatDate(shipment.updatedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
