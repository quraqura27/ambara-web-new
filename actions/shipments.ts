"use server";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { customers, parcels, shipments, trackingEvents, trackingUpdates } from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  buildCustomerVisibleTrackingEvent,
  isDuplicateCustomerVisibleEvent,
  normalizePublicTrackingInput,
} from "@/lib/tracking/public-events";
import {
  ManualShipmentFormError,
  type ManualShipmentFormValues,
  parseManualShipmentForm,
} from "@/lib/shipments/manual-create";
import { TrackingEvent } from "@/lib/tracking/interface";
import { resolveAmbaraTrackingNumber } from "@/lib/vendor-tracking/core";

const trackingStatusValues = [
  "pending",
  "received",
  "processed",
  "departed_origin",
  "in_transit",
  "customs",
  "arrived_destination",
  "out_for_delivery",
  "delivered",
  "delivery_issue",
  "return_in_progress",
  "on_hold",
  "exception",
  "cancelled",
] as const;

type TrackingStatusValue = (typeof trackingStatusValues)[number];

function normalizeTrackingNumber(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return normalizePublicTrackingInput(value);
}

function normalizeOptionalText(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeStoredStatus(value: string | null | undefined): TrackingEvent["status"] {
  const status = value?.trim().toLowerCase() ?? "";

  if (status === "departed") {
    return "departed_origin";
  }

  if (status === "out_for_delivery") {
    return "out_for_delivery";
  }

  if (status === "delivery_issue") {
    return "delivery_issue";
  }

  if (status === "return_in_progress") {
    return "return_in_progress";
  }

  if (status === "on_hold") {
    return "on_hold";
  }

  if (trackingStatusValues.includes(status as TrackingStatusValue)) {
    return status as TrackingEvent["status"];
  }

  return "pending";
}

function normalizeManualStatus(value: FormDataEntryValue | string | null): TrackingStatusValue {
  const status = normalizeOptionalText(value).toLowerCase();

  if (trackingStatusValues.includes(status as TrackingStatusValue)) {
    return status as TrackingStatusValue;
  }

  return "in_transit";
}

function defaultTrackingDescription(status: string) {
  return `Tracking updated to ${status.replace(/_/g, " ")}`;
}

function parseTrackingTimestamp(value: FormDataEntryValue | string | null) {
  const timestampValue = normalizeOptionalText(value);

  if (!timestampValue) {
    return new Date();
  }

  const timestamp = new Date(timestampValue);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Invalid tracking timestamp");
  }

  return timestamp;
}

async function requireUser() {
  return requirePortalUser();
}

async function shipmentTrackingNumberExists(trackingNumber: string) {
  const [existingShipment] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, trackingNumber),
        eq(shipments.internalTrackingNo, trackingNumber),
      ),
    )
    .limit(1);

  return Boolean(existingShipment);
}

async function createCustomerVisibleTrackingEvent(input: {
  createdBy?: number | null;
  eventTime?: Date;
  internalNote?: string;
  location?: string;
  shipmentId: number;
  source: string;
  status: string;
}) {
  const publicEvent = buildCustomerVisibleTrackingEvent(input.status);
  const [latestVisibleEvent] = await db
    .select({
      publicDescription: trackingEvents.publicDescription,
      status: trackingEvents.status,
      statusCode: trackingEvents.statusCode,
    })
    .from(trackingEvents)
    .where(
      and(
        eq(trackingEvents.shipmentId, input.shipmentId),
        eq(trackingEvents.visibleToCustomer, true),
      ),
    )
    .orderBy(desc(trackingEvents.eventTime))
    .limit(1);

  if (isDuplicateCustomerVisibleEvent(latestVisibleEvent, publicEvent)) {
    return { created: false, publicEvent };
  }

  await db.insert(trackingEvents).values({
    shipmentId: input.shipmentId,
    statusCode: publicEvent.statusCode,
    status: publicEvent.status,
    label: publicEvent.label,
    publicDescription: publicEvent.publicDescription,
    description: publicEvent.publicDescription,
    internalNote: input.internalNote || null,
    location: input.location || null,
    eventTime: input.eventTime ?? new Date(),
    source: input.source,
    visibleToCustomer: true,
    createdBy: input.createdBy ?? null,
    state: "done",
    createdAt: new Date(),
  });

  return { created: true, publicEvent };
}

function redirectWithCreateError(message: string): never {
  redirect(`/shipments/new?error=${encodeURIComponent(message)}`);
}

function fallbackTrackingEvent(input: {
  location?: string | null;
  status: string;
  timestamp?: Date | null;
}): TrackingEvent {
  const publicEvent = buildCustomerVisibleTrackingEvent(input.status);

  return {
    status: normalizeStoredStatus(publicEvent.status),
    description: publicEvent.publicDescription,
    location: input.location || undefined,
    timestamp: input.timestamp ?? new Date(),
  };
}

async function getPersistedTrackingEvents(shipmentId: number) {
  const visibleEvents = await db
    .select()
    .from(trackingEvents)
    .where(
      and(
        eq(trackingEvents.shipmentId, shipmentId),
        eq(trackingEvents.visibleToCustomer, true),
      ),
    )
    .orderBy(desc(trackingEvents.eventTime));

  return visibleEvents.map((event) => ({
    status: normalizeStoredStatus(event.status ?? event.statusCode),
    description: event.publicDescription || event.description || event.label,
    location: event.location ?? undefined,
    timestamp: event.eventTime,
  }));
}

export async function getShipmentByTracking(trackingNumber: string) {
  await requireUser();

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, normalizedTrackingNumber),
        eq(shipments.internalTrackingNo, normalizedTrackingNumber),
      ),
    )
    .limit(1);

  if (!shipment) {
    return {
      shipment: null,
      liveData: {
        trackingNumber: normalizedTrackingNumber,
        status: "pending" as TrackingEvent["status"],
        carrier: "Ambara Globaltrans",
        events: [],
        lastSyncAt: new Date(),
      },
      customer: null,
      parcels: [],
    };
  }

  const [persistedEvents, shipmentParcels] = await Promise.all([
    getPersistedTrackingEvents(shipment.id),
    db
      .select({
        id: parcels.id,
        ambaraParcelId: parcels.ambaraParcelId,
        parcelNumber: parcels.parcelNumber,
        receiverName: parcels.receiverName,
        receiverPhone: parcels.receiverPhone,
        receiverAddress: parcels.receiverAddress,
        destinationCity: parcels.destinationCity,
        postalCode: parcels.postalCode,
        weight: parcels.weight,
        pieces: parcels.pieces,
        serviceType: parcels.serviceType,
        commodity: parcels.commodity,
        deliveryInstruction: parcels.deliveryInstruction,
        codAmount: parcels.codAmount,
        currentStatus: parcels.currentStatus,
      })
      .from(parcels)
      .where(eq(parcels.shipmentId, shipment.id))
      .orderBy(asc(parcels.parcelNumber)),
  ]);
  const events = persistedEvents.length
    ? persistedEvents
    : [
        fallbackTrackingEvent({
          location: shipment.origin,
          status: shipment.status,
          timestamp: shipment.updatedAt ?? shipment.createdAt,
        }),
      ];

  const [customer] = shipment.customerId
    ? await db.select().from(customers).where(eq(customers.id, shipment.customerId))
    : [null];

  const status = normalizeStoredStatus(shipment.status);
  const lastSyncAt = events[0]?.timestamp ?? shipment.updatedAt ?? new Date();

  return {
    shipment: {
      ...shipment,
      status,
    },
    liveData: {
      trackingNumber: shipment.trackingNumber,
      status,
      carrier: "Ambara Globaltrans",
      events,
      lastSyncAt,
    },
    customer,
    parcels: shipmentParcels,
  };
}

export async function linkTrackingToCustomer(customerId: number, formData: FormData) {
  await requireUser();

  const trackingNumber = normalizeTrackingNumber(formData.get("trackingNumber"));

  if (!trackingNumber) {
    throw new Error("Tracking number is required");
  }

  const [existingShipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber));

  if (!existingShipment) {
    throw new Error("Shipment not found. Create it manually or use bulk shipment import.");
  }

  await db
    .update(shipments)
    .set({
      customerId,
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, existingShipment.id));

  revalidatePath("/dashboard");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/shipments/${trackingNumber}`);
}

export async function unlinkTrackingFromCustomer(customerId: number, shipmentId: number) {
  await requireUser();

  const [shipment] = await db
    .update(shipments)
    .set({
      customerId: null,
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipmentId))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

  if (shipment?.trackingNumber) {
    revalidatePath(`/shipments/${shipment.trackingNumber}`);
  }
}

export async function searchShipmentByTracking(formData: FormData) {
  await requireUser();

  const trackingNumber = normalizeTrackingNumber(formData.get("trackingNumber"));

  if (!trackingNumber) {
    redirect("/shipments");
  }

  redirect(`/shipments/${trackingNumber}`);
}

export async function updateShipmentTrackingFromForm(
  trackingNumber: string,
  formData: FormData,
) {
  const user = await requireUser();

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
  const status = normalizeManualStatus(formData.get("status"));
  const location = normalizeOptionalText(formData.get("location"));
  const internalNote = normalizeOptionalText(formData.get("description"));
  const timestamp = parseTrackingTimestamp(formData.get("timestamp"));
  const publicEvent = buildCustomerVisibleTrackingEvent(status);

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, normalizedTrackingNumber),
        eq(shipments.internalTrackingNo, normalizedTrackingNumber),
      ),
    );

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  await db.insert(trackingUpdates).values({
    shipmentId: shipment.id,
    status: publicEvent.status,
    description: publicEvent.publicDescription || defaultTrackingDescription(status),
    location: location || null,
    timestamp,
  });
  await createCustomerVisibleTrackingEvent({
    createdBy: user.id,
    eventTime: timestamp,
    internalNote,
    location,
    shipmentId: shipment.id,
    source: "manual_portal_update",
    status,
  });

  await db
    .update(shipments)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipment.id));

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${normalizedTrackingNumber}`);

  if (shipment.customerId) {
    revalidatePath(`/customers/${shipment.customerId}`);
  }

  redirect(`/shipments/${normalizedTrackingNumber}`);
}

export async function getShipments(search?: string) {
  await requireUser();

  const trimmedSearch = search?.trim();
  const selectedFields = {
    id: shipments.id,
    trackingNumber: shipments.trackingNumber,
    internalTrackingNo: shipments.internalTrackingNo,
    title: shipments.title,
    origin: shipments.origin,
    destination: shipments.destination,
    status: shipments.status,
    customerId: shipments.customerId,
    customerName: shipments.customerName,
    customerEmail: shipments.customerEmail,
    customerFullName: customers.fullName,
    customerCompanyName: customers.companyName,
    updatedAt: shipments.updatedAt,
    createdAt: shipments.createdAt,
  };

  const query = db
    .select(selectedFields)
    .from(shipments)
    .leftJoin(customers, eq(shipments.customerId, customers.id));

  if (!trimmedSearch) {
    return query.orderBy(desc(shipments.updatedAt));
  }

  return query
    .where(
      or(
        ilike(shipments.trackingNumber, `%${trimmedSearch}%`),
        ilike(shipments.internalTrackingNo, `%${trimmedSearch}%`),
        ilike(shipments.title, `%${trimmedSearch}%`),
        ilike(shipments.origin, `%${trimmedSearch}%`),
        ilike(shipments.destination, `%${trimmedSearch}%`),
        ilike(shipments.customerName, `%${trimmedSearch}%`),
        ilike(customers.fullName, `%${trimmedSearch}%`),
        ilike(customers.companyName, `%${trimmedSearch}%`),
      ),
    )
    .orderBy(desc(shipments.updatedAt));
}

export async function getDashboardStats() {
  await requireUser();

  const allCustomers = await db.select().from(customers);
  const allShipments = await db.select().from(shipments);

  return {
    totalCustomers: allCustomers.length,
    activeShipments: allShipments.filter((shipment) =>
      ["arrived_destination", "customs", "departed", "departed_origin", "in_transit"].includes(
        shipment.status.toLowerCase(),
      ),
    ).length,
    deliveredShipments: allShipments.filter(
      (shipment) => shipment.status.toLowerCase() === "delivered",
    ).length,
    exceptionShipments: allShipments.filter(
      (shipment) => shipment.status.toLowerCase() === "exception",
    ).length,
  };
}

export async function createShipmentFromForm(formData: FormData) {
  const user = await requireUser();
  let input: ManualShipmentFormValues;

  try {
    input = parseManualShipmentForm(formData);
  } catch (error) {
    if (error instanceof ManualShipmentFormError) {
      redirectWithCreateError(error.message);
    }

    throw error;
  }

  const createdAt = input.shipmentDate ?? new Date();
  let trackingNumber = "";

  try {
    const resolvedTracking = await resolveAmbaraTrackingNumber(
      input.trackingNumberInput,
      shipmentTrackingNumberExists,
    );
    trackingNumber = resolvedTracking.trackingNumber;
  } catch (error) {
    redirectWithCreateError(
      error instanceof Error ? error.message : "Tracking number could not be generated.",
    );
  }

  const ambaraParcelId = `${trackingNumber}-001`;

  const [newShipment] = await db
    .insert(shipments)
    .values({
      trackingNumber,
      mawb: input.mawb,
      internalTrackingNo: trackingNumber,
      customerReference: input.customerReference,
      title: input.title,
      origin: input.origin,
      destination: input.destination,
      serviceType: input.serviceType,
      shipperName: input.shipperName,
      shipperAddress: input.shipperAddress,
      shipperPhone: input.shipperPhone,
      consigneeName: input.receiverName,
      consigneeAddress: input.receiverAddress,
      consigneePhone: input.receiverPhone,
      customerName: input.customerName,
      goodsDescription: input.goodsDescription,
      totalPcs: input.pieces,
      weightKg: input.weightKg,
      chargeableWeight: input.chargeableWeight,
      cargoType: input.cargoType,
      commodity: input.commodity,
      customerId: input.customerId,
      status: input.status,
      createdByStaff: user.id,
      updatedByStaff: user.id,
      createdBy: user.email,
      createdAt,
      updatedAt: new Date(),
    })
    .returning();

  // Manual shipment creation stores one parcel row as the shipment package group.
  // Pieces > 1 stay on this row until true per-piece parcel entry is implemented.
  await db.insert(parcels).values({
    shipmentId: newShipment.id,
    ambaraParcelId,
    parcelNumber: 1,
    receiverName: input.receiverName,
    receiverPhone: input.receiverPhone,
    receiverAddress: input.receiverAddress,
    destinationCity: input.destinationCity,
    postalCode: input.postalCode,
    weight: input.weightKg,
    pieces: input.pieces,
    serviceType: input.serviceType,
    commodity: input.commodity,
    deliveryInstruction: input.deliveryInstruction,
    codAmount: input.codAmount,
    currentStatus: "DRAFT",
    createdAt,
    updatedAt: new Date(),
  });

  const { publicEvent } = await createCustomerVisibleTrackingEvent({
    createdBy: user.id,
    internalNote: input.internalNote ?? undefined,
    location: input.origin,
    shipmentId: newShipment.id,
    source: "manual",
    status: "SHIPMENT_CREATED",
  });
  await db.insert(trackingUpdates).values({
    shipmentId: newShipment.id,
    status: publicEvent.status,
    description: publicEvent.publicDescription,
    location: input.origin,
    timestamp: new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${trackingNumber}`);

  if (input.customerId) {
    revalidatePath(`/customers/${input.customerId}`);
  }

  redirect(`/shipments/${trackingNumber}`);
}

export async function getCustomersForSelect() {
  await requireUser();

  return db
    .select({
      id: customers.id,
      fullName: customers.fullName,
      companyName: customers.companyName,
    })
    .from(customers)
    .orderBy(customers.fullName);
}
