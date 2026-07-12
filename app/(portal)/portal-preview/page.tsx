import Link from "next/link";
import { notFound } from "next/navigation";

import type { OperationalDashboardData } from "@/actions/dashboard";
import { OperationsDashboard } from "@/components/portal/operations-dashboard";
import { getPortalCapabilities, normalizePortalRole, portalRoleLabels, portalRoles } from "@/lib/portal-roles";

type PreviewPageProps = {
  searchParams: Promise<{ role?: string }>;
};

function previewData(role: ReturnType<typeof normalizePortalRole>): OperationalDashboardData {
  const generatedAt = new Date("2026-07-12T08:30:00.000Z");

  return {
    capabilities: getPortalCapabilities({ role }),
    finance: [
      { currency: "IDR", outstanding: "148750000", overdue: 3, unpaid: 9 },
      { currency: "USD", outstanding: "12450", overdue: 1, unpaid: 4 },
    ],
    generatedAt,
    movements: [
      {
        carrierName: "Garuda Indonesia",
        destinationIata: "SIN",
        flightDate: "2026-07-12",
        flightNumber: "GA 836",
        mawbId: 101,
        mawbNumber: "126-00000001",
        originIata: "CGK",
        trackingNumber: "AA26-DEMO-1001",
      },
      {
        carrierName: "Singapore Airlines",
        destinationIata: "AMS",
        flightDate: "2026-07-13",
        flightNumber: "SQ 324",
        mawbId: 102,
        mawbNumber: "618-00000002",
        originIata: "SIN",
        trackingNumber: "AA26-DEMO-1002",
      },
    ],
    prioritizedQueue: [
      {
        detail: "Commercial invoice is missing before customs review",
        dueAt: "2026-07-12T10:00:00.000Z",
        href: "/shipments/AA26-DEMO-1001",
        id: "preview-1",
        kind: "shipment",
        owner: "Operations Desk",
        priority: "critical",
        title: "AA26-DEMO-1001",
      },
      {
        detail: "Confirm final chargeable weight and release booking",
        dueAt: "2026-07-12T12:30:00.000Z",
        href: "/shipments/AA26-DEMO-1002",
        id: "preview-2",
        kind: "task",
        owner: "Export Team",
        priority: "high",
        title: "Validate booking data",
      },
      {
        detail: "Last-mile delivery SLA is approaching",
        dueAt: "2026-07-13T02:00:00.000Z",
        href: "/delivery-batches/103",
        id: "preview-3",
        kind: "delivery",
        owner: "Delivery Partner",
        priority: "normal",
        title: "DB-2026-0712-03",
      },
    ],
    readinessRows: [
      { actionDueAt: generatedAt, customsReviewRequired: true, documentReadiness: "review", mawb: "126-00000001", operationalStage: "customs_review", regulatedCargo: false, trackingNumber: "AA26-DEMO-1001" },
      { actionDueAt: generatedAt, customsReviewRequired: false, documentReadiness: "collecting", mawb: null, operationalStage: "booking", regulatedCargo: false, trackingNumber: "AA26-DEMO-1002" },
      { actionDueAt: generatedAt, customsReviewRequired: true, documentReadiness: "exception", mawb: "618-00000002", operationalStage: "on_hold", regulatedCargo: true, trackingNumber: "AA26-DEMO-1003" },
      { actionDueAt: generatedAt, customsReviewRequired: false, documentReadiness: "not_ready", mawb: null, operationalStage: "intake", regulatedCargo: false, trackingNumber: "AA26-DEMO-1004" },
      { actionDueAt: generatedAt, customsReviewRequired: false, documentReadiness: "ready", mawb: null, operationalStage: "flight_ready", regulatedCargo: false, trackingNumber: "AA26-DEMO-1005" },
    ],
    recentShipments: [
      { customerName: "Demo Customer A", destination: "Singapore", operationalStage: "customs_review", origin: "Jakarta", status: "in_transit", trackingNumber: "AA26-DEMO-1001", updatedAt: new Date("2026-07-12T08:20:00.000Z") },
      { customerName: "Demo Customer B", destination: "Amsterdam", operationalStage: "flight_ready", origin: "Surabaya", status: "processed", trackingNumber: "AA26-DEMO-1002", updatedAt: new Date("2026-07-12T07:55:00.000Z") },
      { customerName: "Demo Customer C", destination: "Makassar", operationalStage: "last_mile", origin: "Jakarta", status: "out_for_delivery", trackingNumber: "AA26-DEMO-1003", updatedAt: new Date("2026-07-12T07:25:00.000Z") },
    ],
    role,
    stats: {
      active: 148,
      documentsNotReady: 18,
      dueNext24: 12,
      exceptions: 7,
      open: 27,
      overdue: 4,
      unassigned: 9,
    },
    userName: portalRoleLabels[role],
  };
}

export default async function PortalPreviewPage({ searchParams }: PreviewPageProps) {
  if (process.env.NODE_ENV === "production") notFound();

  const role = normalizePortalRole((await searchParams).role || "operations");

  return (
    <div className="space-y-6">
      <nav aria-label="Dashboard preview role" className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
        <span className="mr-2 text-xs font-semibold uppercase text-slate-500">Preview role</span>
        {portalRoles.map((value) => (
          <Link
            aria-current={value === role ? "page" : undefined}
            className={value === role
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200"
              : "rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 hover:border-white/20 hover:text-white"}
            href={`/portal-preview?role=${value}`}
            key={value}
          >
            {portalRoleLabels[value]}
          </Link>
        ))}
      </nav>
      <OperationsDashboard data={previewData(role)} />
    </div>
  );
}
