"use server";

import { and, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  invoiceLineItems,
  awbs,
  mawbShipmentLinks,
  parcels,
  parcelVendorTracking,
  portalAuditLogs,
  shipments,
  trackingEvents,
} from "@/lib/db/schema";
import { type PortalActionState, formValues } from "@/lib/forms/action-state";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  canOverrideShipmentVoidSafeguards,
  canRestoreShipment,
  canVoidShipment,
} from "@/lib/portal-roles";
import { getShipmentStatusDefinition, normalizeShipmentStatus } from "@/lib/shipments/status-model";
import {
  assessShipmentVoid,
  isShipmentVoidReason,
  type ShipmentVoidRelations,
} from "@/lib/shipments/voiding";
import { normalizePublicTrackingInput } from "@/lib/tracking/public-events";

export type ShipmentVoidActionState = PortalActionState;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function findShipment(trackingNumber: string) {
  const normalized = normalizePublicTrackingInput(trackingNumber);
  const [shipment] = await db
    .select({
      customerId: shipments.customerId,
      id: shipments.id,
      mawb: shipments.mawb,
      previousStatus: shipments.previousStatus,
      status: shipments.status,
      trackingNumber: shipments.trackingNumber,
      voidedAt: shipments.voidedAt,
    })
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, normalized),
        eq(shipments.internalTrackingNo, normalized),
      ),
    )
    .limit(1);

  return shipment ?? null;
}

async function countShipmentDocuments(shipmentId: number) {
  const tableCheck = await db.execute<{ exists: boolean }>(sql`
    select to_regclass('public.documents') is not null as exists
  `);
  if (!tableCheck.rows[0]?.exists) return 0;

  const result = await db.execute<{ count: number }>(sql`
    select count(*)::int as count from documents where shipment_id = ${shipmentId}
  `);
  return Number(result.rows[0]?.count ?? 0);
}

async function getShipmentRelations(
  shipmentId: number,
  hasCustomer: boolean,
  hasDirectMawb: boolean,
): Promise<ShipmentVoidRelations> {
  const [trackingRows, invoiceRows, legacyInvoiceRows, mawbRows, deliveryRows, auditRows, documentCount] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(trackingEvents)
        .where(eq(trackingEvents.shipmentId, shipmentId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.shipmentId, shipmentId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(awbs)
        .where(
          and(
            eq(awbs.shipmentId, shipmentId),
            or(eq(awbs.invoiced, true), isNotNull(awbs.invoiceId)),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(mawbShipmentLinks)
        .where(eq(mawbShipmentLinks.shipmentId, shipmentId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(parcelVendorTracking)
        .innerJoin(parcels, eq(parcels.id, parcelVendorTracking.parcelId))
        .where(eq(parcels.shipmentId, shipmentId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(portalAuditLogs)
        .where(
          and(
            eq(portalAuditLogs.entityType, "shipment"),
            eq(portalAuditLogs.entityId, String(shipmentId)),
            or(
              ilike(portalAuditLogs.action, "%print%"),
              ilike(portalAuditLogs.action, "%export%"),
            ),
          ),
        ),
      countShipmentDocuments(shipmentId),
    ]);

  return {
    deliveryBatchLinks: Number(deliveryRows[0]?.count ?? 0),
    documentCount,
    exportOrPrintEvents: Number(auditRows[0]?.count ?? 0),
    hasCustomer,
    invoiceLinks:
      Number(invoiceRows[0]?.count ?? 0) + Number(legacyInvoiceRows[0]?.count ?? 0),
    mawbLinks: Number(mawbRows[0]?.count ?? 0) + (hasDirectMawb ? 1 : 0),
    trackingEvents: Number(trackingRows[0]?.count ?? 0),
  };
}

export async function getShipmentVoidContext(trackingNumber: string) {
  const user = await requirePortalUser();
  if (!canVoidShipment(user)) return null;

  const shipment = await findShipment(trackingNumber);
  if (!shipment) return null;
  const relations = await getShipmentRelations(
    shipment.id,
    Boolean(shipment.customerId),
    Boolean(shipment.mawb?.trim()),
  );

  return {
    assessment: assessShipmentVoid(relations, user),
    relations,
    trackingNumber: shipment.trackingNumber,
  };
}

export async function voidShipment(
  trackingNumber: string,
  _previousState: ShipmentVoidActionState,
  formData: FormData,
): Promise<ShipmentVoidActionState> {
  const user = await requirePortalUser();
  const values = formValues(formData);
  if (!canVoidShipment(user)) {
    return { formError: "Admin or superadmin access is required to void shipments.", values };
  }

  const shipment = await findShipment(trackingNumber);
  if (!shipment) return { formError: "Shipment was not found.", values };
  if (shipment.voidedAt) return { formError: "Shipment is already voided.", values };

  const reason = text(formData, "reason");
  const note = text(formData, "note");
  const fieldErrors: Record<string, string> = {};
  if (!isShipmentVoidReason(reason)) fieldErrors.reason = "Select a void reason.";
  if (reason === "other" && !note) fieldErrors.note = "Add a note when the reason is Other.";
  if (note.length > 500) fieldErrors.note = "Void note must be 500 characters or fewer.";
  if (text(formData, "confirmed") !== "yes") {
    fieldErrors.confirmed = "Confirm that the shipment should be voided.";
  }

  const relations = await getShipmentRelations(
    shipment.id,
    Boolean(shipment.customerId),
    Boolean(shipment.mawb?.trim()),
  );
  const assessment = assessShipmentVoid(relations, user);
  if (!assessment.allowed) {
    return {
      formError: assessment.requiresElevatedOverride
        ? "Only a superadmin can void a shipment linked to an invoice or MAWB."
        : "You are not authorized to void this shipment.",
      values,
    };
  }
  if (
    assessment.requiresElevatedOverride &&
    text(formData, "confirmTrackingNumber") !== shipment.trackingNumber
  ) {
    fieldErrors.confirmTrackingNumber = "Enter the exact tracking number to confirm the override.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const now = new Date();
  const previousStatus = normalizeShipmentStatus(shipment.status);
  const metadata = JSON.stringify({
    previousStatus,
    relations,
    warnings: assessment.warnings,
  });
  const canOverrideLinks = canOverrideShipmentVoidSafeguards(user);
  const result = await db.execute<{ updated: boolean }>(sql`
    with updated_shipment as (
      update shipments
      set
        status = 'cancelled',
        previous_status = ${previousStatus},
        voided_at = ${now},
        voided_by = ${user.id},
        void_reason = ${reason},
        void_note = ${note || null},
        restored_at = null,
        restored_by = null,
        restore_reason = null,
        updated_at = ${now},
        updated_by_staff = ${user.id}
      where id = ${shipment.id}
        and voided_at is null
        and (
          ${canOverrideLinks}
          or (
            nullif(btrim(mawb), '') is null
            and not exists (
              select 1 from invoice_line_items where shipment_id = ${shipment.id}
            )
            and not exists (
              select 1 from awbs
              where shipment_id = ${shipment.id}
                and (invoiced = true or invoice_id is not null)
            )
            and not exists (
              select 1 from mawb_shipment_links where shipment_id = ${shipment.id}
            )
          )
        )
      returning id
    ),
    updated_parcels as (
      update parcels
      set current_status = 'CANCELLED', updated_at = ${now}
      where shipment_id in (select id from updated_shipment)
      returning id
    ),
    inserted_audit as (
      insert into portal_audit_logs (
        action, entity_type, entity_id, performed_by, reason, metadata_json, created_at
      )
      select
        'shipment_voided', 'shipment', id::text, ${user.id}, ${reason}, ${metadata}, ${now}
      from updated_shipment
      returning id
    )
    select exists(select 1 from updated_shipment) as updated
  `);

  if (!result.rows[0]?.updated) {
    return { formError: "Shipment changed while it was being voided. Reload and try again.", values };
  }

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
  if (shipment.customerId) revalidatePath(`/customers/${shipment.customerId}`);
  redirect(
    `/shipments/${encodeURIComponent(shipment.trackingNumber)}?notice=${encodeURIComponent(
      "Shipment voided. Operational history was preserved.",
    )}`,
  );
}

export async function restoreShipment(
  trackingNumber: string,
  _previousState: ShipmentVoidActionState,
  formData: FormData,
): Promise<ShipmentVoidActionState> {
  const user = await requirePortalUser();
  const values = formValues(formData);
  if (!canRestoreShipment(user)) {
    return { formError: "Superadmin access is required to restore shipments.", values };
  }

  const shipment = await findShipment(trackingNumber);
  if (!shipment) return { formError: "Shipment was not found.", values };
  if (!shipment.voidedAt) return { formError: "Shipment is not currently voided.", values };

  const reason = text(formData, "restoreReason");
  const fieldErrors: Record<string, string> = {};
  if (!reason) fieldErrors.restoreReason = "Explain why this shipment should be restored.";
  if (reason.length > 500) fieldErrors.restoreReason = "Restore reason must be 500 characters or fewer.";
  if (text(formData, "confirmTrackingNumber") !== shipment.trackingNumber) {
    fieldErrors.confirmTrackingNumber = "Enter the exact tracking number to restore this shipment.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const priorStatus = normalizeShipmentStatus(shipment.previousStatus);
  const restoredStatus = priorStatus === "cancelled" ? "pending" : priorStatus;
  const parcelStatus = getShipmentStatusDefinition(restoredStatus).publicStatusCode;
  const now = new Date();
  const result = await db.execute<{ updated: boolean }>(sql`
    with updated_shipment as (
      update shipments
      set
        status = ${restoredStatus},
        voided_at = null,
        restored_at = ${now},
        restored_by = ${user.id},
        restore_reason = ${reason},
        updated_at = ${now},
        updated_by_staff = ${user.id}
      where id = ${shipment.id} and voided_at is not null
      returning id
    ),
    updated_parcels as (
      update parcels
      set current_status = ${parcelStatus}, updated_at = ${now}
      where shipment_id in (select id from updated_shipment)
      returning id
    ),
    inserted_audit as (
      insert into portal_audit_logs (
        action, entity_type, entity_id, performed_by, reason, metadata_json, created_at
      )
      select
        'shipment_restored', 'shipment', id::text, ${user.id}, ${reason},
        ${JSON.stringify({ restoredStatus })}, ${now}
      from updated_shipment
      returning id
    )
    select exists(select 1 from updated_shipment) as updated
  `);

  if (!result.rows[0]?.updated) {
    return { formError: "Shipment changed while it was being restored. Reload and try again.", values };
  }

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
  if (shipment.customerId) revalidatePath(`/customers/${shipment.customerId}`);
  redirect(
    `/shipments/${encodeURIComponent(shipment.trackingNumber)}?notice=${encodeURIComponent(
      `Shipment restored to ${restoredStatus.replace(/_/g, " ")}.`,
    )}`,
  );
}
