"use server";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import {
  deliveryBatches,
  invoices,
  mawbDocuments,
  mawbShipmentLinks,
  shipmentOperationalTasks,
  shipments,
  staffAccounts,
} from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import { getPortalCapabilities, hasPortalCapability } from "@/lib/portal-roles";
import { WIB_TIME_ZONE } from "@/lib/time/wib";

type QueuePriority = "critical" | "high" | "normal";

export type DashboardQueueItem = {
  detail: string;
  dueAt: Date | string | null;
  href: string;
  id: string;
  kind: "shipment" | "task" | "delivery";
  owner: string | null;
  priority: QueuePriority;
  title: string;
};

export type OperationalDashboardData = Awaited<ReturnType<typeof getOperationalDashboard>>;

function jakartaDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function queuePriority(input: { blocker?: string | null; dueAt?: Date | string | null; status?: string | null }, now: Date): QueuePriority {
  if (input.blocker || ["exception", "delivery_issue", "on_hold"].includes(input.status ?? "")) return "critical";
  if (input.dueAt && new Date(input.dueAt).getTime() <= now.getTime()) return "high";
  return "normal";
}

function priorityRank(priority: QueuePriority) {
  if (priority === "critical") return 0;
  if (priority === "high") return 1;
  return 2;
}

export async function getOperationalDashboard(now = new Date()) {
  const user = await requirePortalUser();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const today = jakartaDate(now);
  const tomorrow = jakartaDate(next24Hours);
  const canSeeFinance = hasPortalCapability(user, "invoice:view");
  const canSeeDelivery = hasPortalCapability(user, "delivery:view");
  const canSeeMawb = hasPortalCapability(user, "mawb:view");

  const [shipmentStatsRows, taskStatsRows, shipmentQueueRows, taskRows, overdueBatches, movements, readinessRows, recentShipments, financeRows] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where lower(${shipments.status}) not in ('delivered', 'cancelled'))::int`,
        dueNext24: sql<number>`count(*) filter (where ${shipments.actionDueAt} >= ${now} and ${shipments.actionDueAt} <= ${next24Hours})::int`,
        exceptions: sql<number>`count(*) filter (where lower(${shipments.status}) in ('exception', 'delivery_issue', 'on_hold') or nullif(btrim(${shipments.blocker}), '') is not null)::int`,
        documentsNotReady: sql<number>`count(*) filter (where ${shipments.documentReadiness} <> 'ready')::int`,
        unassigned: sql<number>`count(*) filter (where ${shipments.assignedTo} is null and lower(${shipments.status}) not in ('delivered', 'cancelled'))::int`,
      })
      .from(shipments)
      .where(isNull(shipments.voidedAt)),
    db
      .select({
        open: sql<number>`count(*) filter (where ${shipmentOperationalTasks.status} = 'open')::int`,
        overdue: sql<number>`count(*) filter (where ${shipmentOperationalTasks.status} = 'open' and ${shipmentOperationalTasks.dueAt} < ${now})::int`,
      })
      .from(shipmentOperationalTasks),
    db
      .select({
        actionDueAt: shipments.actionDueAt,
        blocker: shipments.blocker,
        customerName: shipments.customerName,
        nextAction: shipments.nextAction,
        owner: staffAccounts.fullName,
        status: shipments.status,
        trackingNumber: shipments.trackingNumber,
      })
      .from(shipments)
      .leftJoin(staffAccounts, eq(shipments.assignedTo, staffAccounts.id))
      .where(and(
        isNull(shipments.voidedAt),
        notInArray(shipments.status, ["delivered", "cancelled"]),
        or(
          sql`nullif(btrim(${shipments.blocker}), '') is not null`,
          sql`nullif(btrim(${shipments.nextAction}), '') is not null`,
          lte(shipments.actionDueAt, next24Hours),
          sql`lower(${shipments.status}) in ('exception', 'delivery_issue', 'on_hold')`,
        ),
      ))
      .orderBy(asc(shipments.actionDueAt), desc(shipments.updatedAt))
      .limit(12),
    db
      .select({
        blocker: shipmentOperationalTasks.blocker,
        dueAt: shipmentOperationalTasks.dueAt,
        id: shipmentOperationalTasks.id,
        owner: staffAccounts.fullName,
        title: shipmentOperationalTasks.title,
        trackingNumber: shipments.trackingNumber,
      })
      .from(shipmentOperationalTasks)
      .innerJoin(shipments, eq(shipmentOperationalTasks.shipmentId, shipments.id))
      .leftJoin(staffAccounts, eq(shipmentOperationalTasks.ownerId, staffAccounts.id))
      .where(and(eq(shipmentOperationalTasks.status, "open"), isNull(shipments.voidedAt)))
      .orderBy(asc(shipmentOperationalTasks.dueAt), desc(shipmentOperationalTasks.createdAt))
      .limit(12),
    db
      .select({
        batchCode: deliveryBatches.batchCode,
        id: deliveryBatches.id,
        slaDeadline: deliveryBatches.slaDeadline,
        vendorName: deliveryBatches.vendorName,
      })
      .from(deliveryBatches)
      .where(and(
        lte(deliveryBatches.slaDeadline, now),
        ne(deliveryBatches.batchStatus, "DELIVERED"),
      ))
      .orderBy(asc(deliveryBatches.slaDeadline))
      .limit(8),
    db
      .select({
        carrierName: mawbDocuments.carrierName,
        destinationIata: mawbDocuments.destinationIata,
        flightDate: mawbDocuments.flightDate,
        flightNumber: mawbDocuments.flightNumber,
        mawbId: mawbDocuments.id,
        mawbNumber: mawbDocuments.mawbNumber,
        originIata: mawbDocuments.originIata,
        trackingNumber: shipments.trackingNumber,
      })
      .from(mawbDocuments)
      .leftJoin(mawbShipmentLinks, eq(mawbShipmentLinks.mawbDocumentId, mawbDocuments.id))
      .leftJoin(shipments, eq(shipments.id, mawbShipmentLinks.shipmentId))
      .where(and(gte(mawbDocuments.flightDate, today), lte(mawbDocuments.flightDate, tomorrow)))
      .orderBy(asc(mawbDocuments.flightDate), asc(mawbDocuments.flightNumber))
      .limit(10),
    db
      .select({
        actionDueAt: shipments.actionDueAt,
        customsReviewRequired: shipments.customsReviewRequired,
        documentReadiness: shipments.documentReadiness,
        mawb: shipments.mawb,
        operationalStage: shipments.operationalStage,
        regulatedCargo: shipments.regulatedCargo,
        trackingNumber: shipments.trackingNumber,
      })
      .from(shipments)
      .where(and(
        isNull(shipments.voidedAt),
        notInArray(shipments.status, ["delivered", "cancelled"]),
        or(
          isNull(shipments.mawb),
          ne(shipments.documentReadiness, "ready"),
          eq(shipments.customsReviewRequired, true),
          eq(shipments.regulatedCargo, true),
        ),
      ))
      .orderBy(asc(shipments.actionDueAt), desc(shipments.updatedAt))
      .limit(10),
    db
      .select({
        customerName: shipments.customerName,
        destination: shipments.destination,
        operationalStage: shipments.operationalStage,
        origin: shipments.origin,
        status: shipments.status,
        trackingNumber: shipments.trackingNumber,
        updatedAt: shipments.updatedAt,
      })
      .from(shipments)
      .where(isNull(shipments.voidedAt))
      .orderBy(desc(shipments.updatedAt))
      .limit(8),
    canSeeFinance
      ? db
          .select({
            currency: invoices.currency,
            overdue: sql<number>`count(*) filter (where ${invoices.dueDate} < ${today})::int`,
            outstanding: sql<string>`coalesce(sum(${invoices.netPayable}), 0)::text`,
            unpaid: sql<number>`count(*)::int`,
          })
          .from(invoices)
          .where(and(eq(invoices.archived, false), eq(invoices.status, "sent"), isNull(invoices.paidAt)))
          .groupBy(invoices.currency)
      : Promise.resolve([]),
  ]);

  const shipmentQueue: DashboardQueueItem[] = shipmentQueueRows.map((row) => ({
    detail: row.blocker || row.nextAction || `${row.status.replace(/_/g, " ")} shipment`,
    dueAt: row.actionDueAt,
    href: `/shipments/${encodeURIComponent(row.trackingNumber)}`,
    id: `shipment-${row.trackingNumber}`,
    kind: "shipment",
    owner: row.owner,
    priority: queuePriority({ blocker: row.blocker, dueAt: row.actionDueAt, status: row.status }, now),
    title: row.trackingNumber,
  }));
  const taskQueue: DashboardQueueItem[] = taskRows.map((row) => ({
    detail: `${row.trackingNumber} / ${row.blocker || "Open task"}`,
    dueAt: row.dueAt,
    href: `/shipments/${encodeURIComponent(row.trackingNumber)}`,
    id: `task-${row.id}`,
    kind: "task",
    owner: row.owner,
    priority: queuePriority({ blocker: row.blocker, dueAt: row.dueAt }, now),
    title: row.title,
  }));
  const deliveryQueue: DashboardQueueItem[] = overdueBatches.map((row) => ({
    detail: `${row.vendorName} / delivery SLA overdue`,
    dueAt: row.slaDeadline,
    href: `/delivery-batches/${row.id}`,
    id: `delivery-${row.id}`,
    kind: "delivery",
    owner: row.vendorName,
    priority: "critical",
    title: row.batchCode,
  }));
  const prioritizedQueue = [
    ...shipmentQueue,
    ...taskQueue,
    ...(canSeeDelivery ? deliveryQueue : []),
  ]
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || new Date(a.dueAt || 8640000000000000).getTime() - new Date(b.dueAt || 8640000000000000).getTime())
    .slice(0, 12);

  return {
    capabilities: getPortalCapabilities(user),
    finance: financeRows,
    generatedAt: now,
    movements: canSeeMawb ? movements : [],
    prioritizedQueue,
    readinessRows,
    recentShipments,
    role: user.role,
    stats: {
      ...(shipmentStatsRows[0] ?? { active: 0, dueNext24: 0, exceptions: 0, documentsNotReady: 0, unassigned: 0 }),
      ...(taskStatsRows[0] ?? { open: 0, overdue: 0 }),
    },
    userName: user.name,
  };
}
