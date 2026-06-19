import "server-only";

import { and, asc, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { parcels, shipments, trackingEvents } from "@/lib/db/schema";
import { buildCustomerVisibleTrackingEvent, normalizePublicTrackingInput } from "@/lib/tracking/public-events";
import {
  sortTrackingEventsChronologically,
  type PublicTrackingEvent,
  type PublicTrackingResult,
} from "@/lib/tracking/public-tracking-payload";

function numericValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

type PublicTrackingEventRow = {
  description: string | null;
  eventTime: Date;
  label: string;
  location: string | null;
  publicDescription: string | null;
  status: string | null;
  statusCode: string | null;
};

function toPublicEvent(event: PublicTrackingEventRow): PublicTrackingEvent {
  return {
    status: event.status ?? event.statusCode,
    label: event.label,
    description: event.publicDescription ?? event.description,
    location: event.location,
    event_time: event.eventTime.toISOString(),
  };
}

function fallbackStatusEvent(input: {
  destinationCity?: string | null;
  eventTime?: Date | null;
  origin?: string | null;
  serviceType?: string | null;
  status?: string | null;
}): PublicTrackingEvent {
  const publicEvent = buildCustomerVisibleTrackingEvent(
    input.status || "pending",
    input.serviceType,
  );

  return {
    status: publicEvent.status,
    label: publicEvent.label,
    description: publicEvent.publicDescription,
    location: input.origin || input.destinationCity || null,
    event_time: dateValue(input.eventTime ?? new Date()),
  };
}

export async function findPublicTrackingResult(
  trackingInput: string,
): Promise<PublicTrackingResult | null> {
  const normalizedTrackingInput = normalizePublicTrackingInput(trackingInput);

  if (!normalizedTrackingInput) {
    return null;
  }

  const [shipment] = await db
    .select({
      cargoType: shipments.cargoType,
      chargeableWeight: shipments.chargeableWeight,
      commodity: shipments.commodity,
      createdAt: shipments.createdAt,
      destination: shipments.destination,
      destinationIata: shipments.destinationIata,
      goodsDescription: shipments.goodsDescription,
      id: shipments.id,
      internalTrackingNo: shipments.internalTrackingNo,
      origin: shipments.origin,
      originIata: shipments.originIata,
      serviceType: shipments.serviceType,
      status: shipments.status,
      title: shipments.title,
      totalPcs: shipments.totalPcs,
      trackingNumber: shipments.trackingNumber,
      updatedAt: shipments.updatedAt,
      weightKg: shipments.weightKg,
    })
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, normalizedTrackingInput),
        eq(shipments.internalTrackingNo, normalizedTrackingInput),
      ),
    )
    .limit(1);

  if (!shipment) {
    return null;
  }

  const [eventRows, parcelRows] = await Promise.all([
    db
      .select({
        description: trackingEvents.description,
        eventTime: trackingEvents.eventTime,
        label: trackingEvents.label,
        location: trackingEvents.location,
        publicDescription: trackingEvents.publicDescription,
        status: trackingEvents.status,
        statusCode: trackingEvents.statusCode,
      })
      .from(trackingEvents)
      .where(
        and(
          eq(trackingEvents.shipmentId, shipment.id),
          eq(trackingEvents.visibleToCustomer, true),
        ),
      )
      .orderBy(asc(trackingEvents.eventTime)),
    db
      .select({
        currentStatus: parcels.currentStatus,
        destinationCity: parcels.destinationCity,
      })
      .from(parcels)
      .where(eq(parcels.shipmentId, shipment.id))
      .orderBy(asc(parcels.parcelNumber))
      .limit(1),
  ]);

  const parcel = parcelRows[0];
  const events = eventRows.length
    ? eventRows.map(toPublicEvent)
    : [
        fallbackStatusEvent({
          destinationCity: parcel?.destinationCity,
          eventTime: shipment.updatedAt ?? shipment.createdAt,
          origin: shipment.origin,
          serviceType: shipment.serviceType,
          status: shipment.status || parcel?.currentStatus,
        }),
      ];

  return {
    shipment: {
      tracking_number: shipment.trackingNumber,
      legacy_tracking_number: null,
      title: shipment.title,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      service_type: shipment.serviceType,
      goods_description: shipment.goodsDescription,
      origin_iata: shipment.originIata,
      destination_iata: shipment.destinationIata,
      total_pcs: shipment.totalPcs,
      weight_kg: numericValue(shipment.weightKg),
      chargeable_weight: numericValue(shipment.chargeableWeight),
      cargo_type: shipment.cargoType,
      commodity: shipment.commodity,
      created_at: dateValue(shipment.createdAt),
      updated_at: dateValue(shipment.updatedAt),
    },
    events: sortTrackingEventsChronologically(events),
  };
}
