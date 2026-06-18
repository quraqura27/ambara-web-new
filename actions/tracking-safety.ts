"use server";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  portalAuditLogs,
  shipments,
  trackingEvents,
  trackingUpdates,
} from "@/lib/db/schema";
import { type PortalActionState, formValues } from "@/lib/forms/action-state";
import { requirePortalUser } from "@/lib/portal-auth";
import { isSuperadmin } from "@/lib/portal-roles";
import { isShipmentStatusAllowedForService } from "@/lib/shipments/service-model";
import {
  canTransitionShipmentStatus,
  getShipmentStatusDefinition,
  normalizeShipmentStatus,
  shipmentStatusValues,
} from "@/lib/shipments/status-model";
import { normalizePublicTrackingInput } from "@/lib/tracking/public-events";

export type TrackingUpdateState = PortalActionState;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseJakartaDateTime(value: string) {
  if (!value) return new Date();
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const parsed = new Date(hasOffset ? value : `${value}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getShipment(trackingNumber: string) {
  const normalized = normalizePublicTrackingInput(trackingNumber);
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, normalized),
        eq(shipments.internalTrackingNo, normalized),
      ),
    )
    .limit(1);
  return shipment;
}

export async function updateTrackingSafely(
  trackingNumber: string,
  _previousState: TrackingUpdateState,
  formData: FormData,
): Promise<TrackingUpdateState> {
  const user = await requirePortalUser();
  const values = formValues(formData);
  const shipment = await getShipment(trackingNumber);
  if (!shipment) return { formError: "Shipment was not found.", values };

  const currentStatus = normalizeShipmentStatus(shipment.status);
  const nextStatus = normalizeShipmentStatus(text(formData, "status"));
  const override = text(formData, "override") === "yes";
  const overrideReason = text(formData, "overrideReason");
  const location = text(formData, "location");
  const internalNote = text(formData, "internalNote");
  const timestamp = parseJakartaDateTime(text(formData, "timestamp"));
  const expectedUpdatedAt = parseJakartaDateTime(text(formData, "expectedUpdatedAt"));
  const fieldErrors: Record<string, string> = {};

  if (!shipmentStatusValues.includes(nextStatus)) {
    fieldErrors.status = "Select a valid next status.";
  }
  if (!isShipmentStatusAllowedForService(nextStatus, shipment.serviceType)) {
    fieldErrors.status = "This status is not available for the shipment service.";
  } else if (!canTransitionShipmentStatus(currentStatus, nextStatus, shipment.serviceType)) {
    if (!override || !isSuperadmin(user)) {
      fieldErrors.status = `The shipment cannot move directly from ${getShipmentStatusDefinition(currentStatus, shipment.serviceType).label} to ${getShipmentStatusDefinition(nextStatus, shipment.serviceType).label} for ${shipment.serviceType || "this service"}.`;
    } else if (!overrideReason) {
      fieldErrors.overrideReason = "Explain why the normal status sequence is being overridden.";
    }
  }
  if (!expectedUpdatedAt) {
    fieldErrors.expectedUpdatedAt = "The page version is missing. Reload before saving.";
  } else if (
    shipment.updatedAt &&
    shipment.updatedAt.getTime() !== expectedUpdatedAt.getTime()
  ) {
    return {
      formError: "This shipment changed after the page loaded. Review the latest status before saving.",
      values,
    };
  }
  if (!location) fieldErrors.location = "Location is required for customer-visible tracking.";
  if (!timestamp) {
    fieldErrors.timestamp = "Enter a valid timestamp.";
  } else if (timestamp.getTime() > Date.now() + 5 * 60 * 1000) {
    fieldErrors.timestamp = "Tracking time cannot be more than five minutes in the future.";
  }
  if (text(formData, "reviewConfirmed") !== "yes") {
    fieldErrors.reviewConfirmed = "Confirm the customer-visible update before saving.";
  }

  const [latestEvent] = await db
    .select({ eventTime: trackingEvents.eventTime })
    .from(trackingEvents)
    .where(eq(trackingEvents.shipmentId, shipment.id))
    .orderBy(desc(trackingEvents.eventTime))
    .limit(1);
  if (
    timestamp &&
    latestEvent &&
    timestamp.getTime() < latestEvent.eventTime.getTime() &&
    text(formData, "confirmOlderTimestamp") !== "yes"
  ) {
    fieldErrors.confirmOlderTimestamp =
      "This time is older than the latest event. Confirm that the out-of-sequence entry is intentional.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const definition = getShipmentStatusDefinition(nextStatus, shipment.serviceType);
  const operationTime = new Date();
  const auditAction = override ? "shipment.status_overridden" : "shipment.status_updated";
  const auditReason = override ? overrideReason : internalNote;
  const result = await db.execute<{ updated: boolean }>(sql`
    with updated_shipment as (
      update shipments
      set
        status = ${nextStatus},
        delivered_at = case
          when ${nextStatus === "delivered"} then ${timestamp!}
          else delivered_at
        end,
        updated_at = ${operationTime},
        updated_by_staff = ${user.id}
      where id = ${shipment.id}
        and date_trunc('milliseconds', updated_at) = ${expectedUpdatedAt!}
      returning id
    ),
    updated_parcel as (
      update parcels
      set current_status = ${definition.publicStatusCode}, updated_at = ${operationTime}
      where shipment_id in (select id from updated_shipment)
      returning id
    ),
    inserted_event as (
      insert into tracking_events (
        shipment_id, status_code, status, label, public_description, description,
        internal_note, location, event_time, source, visible_to_customer, created_by,
        state, created_at
      )
      select
        id, ${definition.publicStatusCode}, ${definition.publicStatus}, ${definition.publicLabel},
        ${definition.publicDescription}, ${definition.publicDescription}, ${internalNote || null},
        ${location}, ${timestamp!}, ${override ? "manual_override" : "manual_portal_update"},
        true, ${user.id}, 'done', ${operationTime}
      from updated_shipment
      returning id
    ),
    inserted_update as (
      insert into tracking_updates (
        shipment_id, status, description, location, timestamp
      )
      select
        id, ${definition.publicStatus}, ${definition.publicDescription}, ${location}, ${timestamp!}
      from updated_shipment
      returning id
    ),
    inserted_audit as (
      insert into portal_audit_logs (
        action, entity_type, entity_id, performed_by, reason, metadata_json, created_at
      )
      select
        ${auditAction}, 'shipment', id::text, ${user.id}, ${auditReason || null},
        ${JSON.stringify({
          currentStatus,
          nextStatus,
          timestamp: timestamp!.toISOString(),
        })},
        ${operationTime}
      from updated_shipment
      returning id
    )
    select exists(select 1 from updated_shipment) as updated
  `);

  if (!result.rows[0]?.updated) {
    return {
      formError: "This shipment changed while you were saving. Review the latest status and try again.",
      values,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
  if (shipment.customerId) revalidatePath(`/customers/${shipment.customerId}`);
  redirect(
    `/shipments/${encodeURIComponent(shipment.trackingNumber)}?notice=${encodeURIComponent(
      `Tracking updated to ${definition.label}.`,
    )}`,
  );
}

export async function correctTrackingEvent(
  trackingNumber: string,
  _previousState: TrackingUpdateState,
  formData: FormData,
): Promise<TrackingUpdateState> {
  const user = await requirePortalUser();
  const values = formValues(formData);
  if (!isSuperadmin(user)) return { formError: "Superadmin access is required.", values };

  const shipment = await getShipment(trackingNumber);
  if (!shipment) return { formError: "Shipment was not found.", values };

  const eventId = Number.parseInt(text(formData, "eventId"), 10);
  const reason = text(formData, "reason");
  const location = text(formData, "location");
  const status = normalizeShipmentStatus(text(formData, "status"));
  const timestamp = parseJakartaDateTime(text(formData, "timestamp"));
  const fieldErrors: Record<string, string> = {};

  const [event] = Number.isInteger(eventId)
    ? await db
        .select({ id: trackingEvents.id })
        .from(trackingEvents)
        .where(and(eq(trackingEvents.id, eventId), eq(trackingEvents.shipmentId, shipment.id)))
        .limit(1)
    : [];
  if (!event) fieldErrors.eventId = "Select an event from this shipment.";
  if (!isShipmentStatusAllowedForService(status, shipment.serviceType)) {
    fieldErrors.status = "This status is not available for the shipment service.";
  }
  if (!reason) fieldErrors.reason = "Explain what was incorrect and why this correction is needed.";
  if (!location) fieldErrors.location = "Location is required.";
  if (!timestamp) fieldErrors.timestamp = "Enter a valid corrected timestamp.";
  if (text(formData, "reviewConfirmed") !== "yes") {
    fieldErrors.reviewConfirmed = "Confirm that this correction will append a customer-visible event.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const definition = getShipmentStatusDefinition(status, shipment.serviceType);
  const correctionCreatedAt = new Date();
  const shipmentTouch = db
    .update(shipments)
    .set({ updatedAt: correctionCreatedAt, updatedByStaff: user.id })
    .where(eq(shipments.id, shipment.id));
  const eventInsert = db.insert(trackingEvents).values({
    correctedEventId: eventId,
    correctionReason: reason,
    createdBy: user.id,
    eventTime: timestamp!,
    internalNote: `Correction for event #${eventId}: ${reason}`,
    label: definition.publicLabel,
    location,
    publicDescription: definition.publicDescription,
    description: definition.publicDescription,
    shipmentId: shipment.id,
    source: "manual_correction",
    state: "done",
    status: definition.publicStatus,
    statusCode: definition.publicStatusCode,
    visibleToCustomer: true,
  });
  const updateInsert = db.insert(trackingUpdates).values({
    description: definition.publicDescription,
    location,
    shipmentId: shipment.id,
    status: definition.publicStatus,
    timestamp: timestamp!,
  });
  const auditInsert = db.insert(portalAuditLogs).values({
    action: "shipment.tracking_corrected",
    entityId: String(shipment.id),
    entityType: "shipment",
    metadataJson: JSON.stringify({ correctedEventId: eventId, status }),
    performedBy: user.id,
    reason,
    createdAt: correctionCreatedAt,
  });
  await db.batch([shipmentTouch, eventInsert, updateInsert, auditInsert] as const);

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
  redirect(
    `/shipments/${encodeURIComponent(shipment.trackingNumber)}?notice=${encodeURIComponent(
      "Correction appended to the tracking timeline.",
    )}`,
  );
}
