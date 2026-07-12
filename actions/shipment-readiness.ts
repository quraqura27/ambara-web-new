"use server";

import { and, asc, desc, eq, inArray, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  portalAuditLogs,
  shipmentDocuments,
  shipmentOperationalTasks,
  shipmentPackages,
  shipments,
  staffAccounts,
} from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import { canManageOperations } from "@/lib/portal-roles";
import {
  cargoRiskValues,
  calculateVolumetricWeightKg,
  clearanceModeValues,
  documentReadinessValues,
  incotermValues,
  normalizeCargoRisks,
  parseShipmentPackages,
  parseWibDateTime,
  shipmentOperationalStages,
  type DocumentReadiness,
  type ShipmentOperationalStage,
} from "@/lib/shipments/readiness";
import { normalizePublicTrackingInput } from "@/lib/tracking/public-events";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStaffId(value: string) {
  if (!value) return null;
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Select a valid staff owner.");
  return id;
}

async function requireOperationsManager() {
  const user = await requirePortalUser();
  if (!canManageOperations(user)) redirect("/dashboard?error=forbidden");
  return user;
}

async function findActiveShipment(trackingNumber: string) {
  const normalized = normalizePublicTrackingInput(trackingNumber);
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(or(eq(shipments.trackingNumber, normalized), eq(shipments.internalTrackingNo, normalized)))
    .limit(1);
  if (!shipment) throw new Error("Shipment was not found.");
  if (shipment.voidedAt) throw new Error("Voided shipments are read-only.");
  return shipment;
}

export async function getShipmentOperationalReadiness(trackingNumber: string) {
  await requirePortalUser();
  const normalized = normalizePublicTrackingInput(trackingNumber);
  const [shipment] = await db
    .select({
      actionDueAt: shipments.actionDueAt,
      assignedTo: shipments.assignedTo,
      blocker: shipments.blocker,
      cargoRisks: shipments.cargoRisks,
      clearanceMode: shipments.clearanceMode,
      customsReviewRequired: shipments.customsReviewRequired,
      documentReadiness: shipments.documentReadiness,
      hsCode: shipments.hsCode,
      id: shipments.id,
      incoterm: shipments.incoterm,
      nextAction: shipments.nextAction,
      operationalStage: shipments.operationalStage,
      regulatedCargo: shipments.regulatedCargo,
      slaDueAt: shipments.slaDueAt,
      trackingNumber: shipments.trackingNumber,
      voidedAt: shipments.voidedAt,
      volumetricWeightKg: shipments.volumetricWeightKg,
    })
    .from(shipments)
    .where(or(eq(shipments.trackingNumber, normalized), eq(shipments.internalTrackingNo, normalized)))
    .limit(1);
  if (!shipment) return null;

  const [packages, tasks, staff, documents] = await Promise.all([
    db.select().from(shipmentPackages).where(eq(shipmentPackages.shipmentId, shipment.id)).orderBy(asc(shipmentPackages.packageNumber)),
    db
      .select({
        blocker: shipmentOperationalTasks.blocker,
        completedAt: shipmentOperationalTasks.completedAt,
        dueAt: shipmentOperationalTasks.dueAt,
        id: shipmentOperationalTasks.id,
        ownerName: staffAccounts.fullName,
        status: shipmentOperationalTasks.status,
        taskType: shipmentOperationalTasks.taskType,
        title: shipmentOperationalTasks.title,
      })
      .from(shipmentOperationalTasks)
      .leftJoin(staffAccounts, eq(shipmentOperationalTasks.ownerId, staffAccounts.id))
      .where(eq(shipmentOperationalTasks.shipmentId, shipment.id))
      .orderBy(sql`case when ${shipmentOperationalTasks.status} = 'open' then 0 else 1 end`, asc(shipmentOperationalTasks.dueAt), desc(shipmentOperationalTasks.createdAt)),
    db
      .select({ fullName: staffAccounts.fullName, id: staffAccounts.id, role: staffAccounts.role })
      .from(staffAccounts)
      .where(eq(staffAccounts.isActive, true))
      .orderBy(asc(staffAccounts.fullName)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(shipmentDocuments)
      .where(and(eq(shipmentDocuments.shipmentId, shipment.id), eq(shipmentDocuments.status, "current"))),
  ]);

  return { currentDocumentCount: documents[0]?.count ?? 0, packages, shipment, staff, tasks };
}

export async function updateShipmentReadinessFromForm(trackingNumber: string, formData: FormData) {
  const user = await requireOperationsManager();
  const shipment = await findActiveShipment(trackingNumber);
  const operationalStage = text(formData, "operationalStage") as ShipmentOperationalStage;
  const documentReadiness = text(formData, "documentReadiness") as DocumentReadiness;
  const incoterm = text(formData, "incoterm").toUpperCase();
  const clearanceMode = text(formData, "clearanceMode");
  const hsCode = text(formData, "hsCode").replace(/[.\s-]/g, "");
  const cargoRisks = normalizeCargoRisks(formData.getAll("cargoRisks").map(String));
  const packages = parseShipmentPackages(text(formData, "packagesJson"));
  const assignedTo = optionalStaffId(text(formData, "assignedTo"));
  const actionDueAt = parseWibDateTime(text(formData, "actionDueAt"));
  const slaDueAt = parseWibDateTime(text(formData, "slaDueAt"));
  const blocker = text(formData, "blocker") || null;
  const nextAction = text(formData, "nextAction") || null;

  if (!shipmentOperationalStages.includes(operationalStage)) throw new Error("Select a valid operational stage.");
  if (!documentReadinessValues.includes(documentReadiness)) throw new Error("Select a valid document readiness status.");
  if (incoterm && !incotermValues.includes(incoterm as (typeof incotermValues)[number])) throw new Error("Select a valid Incoterm.");
  if (clearanceMode && !clearanceModeValues.includes(clearanceMode as (typeof clearanceModeValues)[number])) throw new Error("Select a valid clearance mode.");
  if (hsCode && !/^\d{4,10}$/.test(hsCode)) throw new Error("HS code must contain 4 to 10 digits.");
  if (nextAction && !actionDueAt) throw new Error("Set a due time for the next action.");

  if (assignedTo) {
    const [owner] = await db.select({ id: staffAccounts.id }).from(staffAccounts).where(and(eq(staffAccounts.id, assignedTo), eq(staffAccounts.isActive, true))).limit(1);
    if (!owner) throw new Error("The selected owner is not active.");
  }
  if (documentReadiness === "ready") {
    const [documentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(shipmentDocuments).where(and(eq(shipmentDocuments.shipmentId, shipment.id), eq(shipmentDocuments.status, "current")));
    if (!documentCount?.count) throw new Error("Upload at least one current document before marking documents ready.");
  }

  const now = new Date();
  const totalVolumetricWeight = packages.reduce((sum, row) => sum + calculateVolumetricWeightKg(row), 0);
  const queries: BatchItem<"pg">[] = [
    db.update(shipments).set({
      actionDueAt,
      assignedTo,
      blocker,
      cargoRisks,
      clearanceMode: clearanceMode || null,
      customsReviewRequired: text(formData, "customsReviewRequired") === "yes" || cargoRisks.includes("restricted"),
      documentReadiness,
      hsCode: hsCode || null,
      incoterm: incoterm || null,
      nextAction,
      operationalStage,
      readinessUpdatedAt: now,
      readinessUpdatedBy: user.id,
      regulatedCargo: text(formData, "regulatedCargo") === "yes" || cargoRisks.includes("dangerous_goods"),
      slaDueAt,
      updatedAt: now,
      updatedByStaff: user.id,
      volumetricWeightKg: packages.length ? String(totalVolumetricWeight) : null,
    }).where(eq(shipments.id, shipment.id)),
    db.delete(shipmentPackages).where(eq(shipmentPackages.shipmentId, shipment.id)),
  ];
  if (packages.length) {
    queries.push(db.insert(shipmentPackages).values(packages.map((row) => ({
      createdAt: now,
      grossWeightKg: row.grossWeightKg == null ? null : String(row.grossWeightKg),
      heightCm: String(row.heightCm),
      lengthCm: String(row.lengthCm),
      packageNumber: row.packageNumber,
      pieces: row.pieces,
      shipmentId: shipment.id,
      updatedAt: now,
      volumetricWeightKg: String(calculateVolumetricWeightKg(row)),
      widthCm: String(row.widthCm),
    }))));
  }
  queries.push(db.insert(portalAuditLogs).values({
    action: "shipment.readiness_updated",
    createdAt: now,
    entityId: String(shipment.id),
    entityType: "shipment",
    metadataJson: JSON.stringify({ cargoRisks, documentReadiness, operationalStage, packageRows: packages.length }),
    performedBy: user.id,
  }));
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  revalidatePath("/dashboard");
  revalidatePath("/operations");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
  redirect(`/shipments/${encodeURIComponent(shipment.trackingNumber)}?notice=${encodeURIComponent("Operational readiness updated.")}`);
}

export async function createShipmentTaskFromForm(trackingNumber: string, formData: FormData) {
  const user = await requireOperationsManager();
  const shipment = await findActiveShipment(trackingNumber);
  const title = text(formData, "title");
  const ownerId = optionalStaffId(text(formData, "ownerId"));
  const dueAt = parseWibDateTime(text(formData, "dueAt"));
  const blocker = text(formData, "taskBlocker") || null;
  if (!title) throw new Error("Task title is required.");
  if (!dueAt) throw new Error("Task due time is required.");
  if (ownerId) {
    const [owner] = await db
      .select({ id: staffAccounts.id })
      .from(staffAccounts)
      .where(and(eq(staffAccounts.id, ownerId), eq(staffAccounts.isActive, true)))
      .limit(1);
    if (!owner) throw new Error("The selected task owner is not active.");
  }

  const now = new Date();
  const [taskIdResult] = (await db.execute<{ id: number }>(sql`select nextval(pg_get_serial_sequence('shipment_operational_tasks', 'id'))::int as id`)).rows;
  if (!taskIdResult) throw new Error("Unable to allocate a task identifier.");
  await db.batch([
    db.insert(shipmentOperationalTasks).values({
      blocker,
      createdAt: now,
      createdBy: user.id,
      dueAt,
      id: taskIdResult.id,
      ownerId,
      shipmentId: shipment.id,
      status: "open",
      taskType: text(formData, "taskType") || "next_action",
      title,
      updatedAt: now,
    }),
    db.insert(portalAuditLogs).values({
      action: "shipment.task_created",
      createdAt: now,
      entityId: String(shipment.id),
      entityType: "shipment",
      metadataJson: JSON.stringify({ taskId: taskIdResult.id, title }),
      performedBy: user.id,
    }),
  ]);
  revalidatePath("/dashboard");
  revalidatePath("/operations");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
}

export async function completeShipmentTask(taskId: number, trackingNumber: string, formData: FormData) {
  const user = await requireOperationsManager();
  const shipment = await findActiveShipment(trackingNumber);
  if (text(formData, "confirmed") !== "yes") throw new Error("Task completion confirmation is required.");
  const now = new Date();
  const result = await db.execute<{ updated: boolean }>(sql`
    with completed_task as (
      update shipment_operational_tasks
      set completed_at = ${now}, completed_by = ${user.id}, status = 'completed', updated_at = ${now}
      where id = ${taskId} and shipment_id = ${shipment.id} and status = 'open'
      returning id
    ), inserted_audit as (
      insert into portal_audit_logs (
        action, entity_type, entity_id, performed_by, metadata_json, created_at
      )
      select
        'shipment.task_completed', 'shipment', ${String(shipment.id)}, ${user.id},
        ${JSON.stringify({ taskId })}, ${now}
      from completed_task
      returning id
    )
    select exists(select 1 from completed_task) as updated
  `);
  if (!result.rows[0]?.updated) throw new Error("The task is no longer open.");
  revalidatePath("/dashboard");
  revalidatePath("/operations");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
}

export async function getOperationsQueue(options: { owner?: string; readiness?: string; stage?: string; task?: string; window?: string } = {}) {
  await requireOperationsManager();
  const now = new Date();
  const conditions = [isNull(shipments.voidedAt), notInArray(shipments.status, ["delivered", "cancelled"])];
  if (options.owner === "unassigned") conditions.push(isNull(shipments.assignedTo));
  if (options.stage && shipmentOperationalStages.includes(options.stage as ShipmentOperationalStage)) conditions.push(eq(shipments.operationalStage, options.stage));
  if (options.readiness === "documents") conditions.push(ne(shipments.documentReadiness, "ready"));
  if (options.readiness === "customs") conditions.push(or(eq(shipments.customsReviewRequired, true), eq(shipments.regulatedCargo, true))!);
  if (options.readiness === "mawb") conditions.push(sql`nullif(btrim(${shipments.mawb}), '') is null`);
  if (options.window === "24h") conditions.push(sql`${shipments.actionDueAt} between ${now} and ${new Date(now.getTime() + 24 * 60 * 60 * 1000)}`);
  if (options.task === "overdue") conditions.push(sql`exists (select 1 from shipment_operational_tasks sot where sot.shipment_id = ${shipments.id} and sot.status = 'open' and sot.due_at < ${now})`);

  return db
    .select({
      actionDueAt: shipments.actionDueAt,
      blocker: shipments.blocker,
      customerName: shipments.customerName,
      documentReadiness: shipments.documentReadiness,
      mawb: shipments.mawb,
      nextAction: shipments.nextAction,
      operationalStage: shipments.operationalStage,
      owner: staffAccounts.fullName,
      regulatedCargo: shipments.regulatedCargo,
      status: shipments.status,
      trackingNumber: shipments.trackingNumber,
    })
    .from(shipments)
    .leftJoin(staffAccounts, eq(shipments.assignedTo, staffAccounts.id))
    .where(and(...conditions))
    .orderBy(sql`case when ${shipments.blocker} is not null then 0 else 1 end`, asc(shipments.actionDueAt), desc(shipments.updatedAt))
    .limit(250);
}
