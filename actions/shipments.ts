"use server";

import { desc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { customers, shipments, trackingUpdates } from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import { TrackingEvent } from "@/lib/tracking/interface";
import { trackingProvider } from "@/lib/tracking/mock";

const trackingStatusValues = [
  "pending",
  "received",
  "departed_origin",
  "in_transit",
  "customs",
  "arrived_destination",
  "delivered",
  "exception",
  "cancelled",
] as const;

type TrackingStatusValue = (typeof trackingStatusValues)[number];

function normalizeTrackingNumber(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
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
  await requirePortalUser();
}

async function getPersistedTrackingEvents(shipmentId: number) {
  const persistedUpdates = await db
    .select()
    .from(trackingUpdates)
    .where(eq(trackingUpdates.shipmentId, shipmentId))
    .orderBy(desc(trackingUpdates.timestamp));

  return persistedUpdates.map((update) => ({
    status: normalizeStoredStatus(update.status),
    description: update.description,
    location: update.location ?? undefined,
    timestamp: update.timestamp,
  }));
}

async function syncTrackingUpdates(shipmentId: number, events: TrackingEvent[]) {
  const existingUpdates = await db
    .select()
    .from(trackingUpdates)
    .where(eq(trackingUpdates.shipmentId, shipmentId))
    .orderBy(desc(trackingUpdates.timestamp));

  if (existingUpdates.length === 0 && events.length > 0) {
    await db.insert(trackingUpdates).values(
      events.map((event) => ({
        shipmentId,
        status: event.status as string,
        description: event.description,
        location: event.location ?? null,
        timestamp: event.timestamp,
      })),
    );
  }

  const persistedUpdates = existingUpdates.length
    ? existingUpdates
    : await db
        .select()
        .from(trackingUpdates)
        .where(eq(trackingUpdates.shipmentId, shipmentId))
        .orderBy(desc(trackingUpdates.timestamp));

  return persistedUpdates.map((update) => ({
    status: normalizeStoredStatus(update.status),
    description: update.description,
    location: update.location ?? undefined,
    timestamp: update.timestamp,
  }));
}

export async function getShipmentByTracking(trackingNumber: string) {
  await requireUser();

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, normalizedTrackingNumber));

  if (!shipment) {
    const liveData = await trackingProvider.getTrackingInfo(normalizedTrackingNumber);

    return { shipment: null, liveData, customer: null };
  }

  let events = await getPersistedTrackingEvents(shipment.id);

  if (events.length === 0) {
    const providerData = await trackingProvider.getTrackingInfo(normalizedTrackingNumber);
    events = await syncTrackingUpdates(shipment.id, providerData.events);
  }

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
  };
}

export async function linkTrackingToCustomer(customerId: number, formData: FormData) {
  await requireUser();

  const trackingNumber = normalizeTrackingNumber(formData.get("trackingNumber"));

  if (!trackingNumber) {
    throw new Error("Tracking number is required");
  }

  const liveData = await trackingProvider.getTrackingInfo(trackingNumber);
  const [existingShipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber));

  const [savedShipment] = existingShipment
    ? await db
        .update(shipments)
        .set({
          customerId,
          status: liveData.status,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, existingShipment.id))
        .returning()
    : await db
        .insert(shipments)
        .values({
          trackingNumber,
          title: `Shipment ${trackingNumber}`,
          customerId,
          status: liveData.status,
          origin: "Unknown",
          destination: "Unknown",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

  await syncTrackingUpdates(savedShipment.id, liveData.events);

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
  await requireUser();

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
  const status = normalizeManualStatus(formData.get("status"));
  const location = normalizeOptionalText(formData.get("location"));
  const description =
    normalizeOptionalText(formData.get("description")) || defaultTrackingDescription(status);
  const timestamp = parseTrackingTimestamp(formData.get("timestamp"));

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, normalizedTrackingNumber));

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  await db.insert(trackingUpdates).values({
    shipmentId: shipment.id,
    status,
    description,
    location: location || null,
    timestamp,
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
  await requireUser();

  const trackingNumber = normalizeTrackingNumber(formData.get("trackingNumber"));
  const title = (formData.get("title") as string | null)?.trim() || "";
  const origin = (formData.get("origin") as string | null)?.trim() || "";
  const destination = (formData.get("destination") as string | null)?.trim() || "";
  const customerIdRaw = formData.get("customerId") as string | null;
  const customerId = customerIdRaw ? Number.parseInt(customerIdRaw, 10) : null;

  if (!trackingNumber) {
    throw new Error("Tracking number is required");
  }

  if (!title) {
    throw new Error("Shipment title is required");
  }

  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }

  const liveData = await trackingProvider.getTrackingInfo(trackingNumber);
  const [existingShipment] = await db
    .select({ trackingNumber: shipments.trackingNumber })
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber));

  if (existingShipment) {
    redirect(`/shipments/${existingShipment.trackingNumber}`);
  }

  const [newShipment] = await db
    .insert(shipments)
    .values({
      trackingNumber,
      title,
      origin,
      destination,
      customerId: Number.isNaN(customerId ?? NaN) ? null : customerId,
      status: liveData.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await syncTrackingUpdates(newShipment.id, liveData.events);

  revalidatePath("/dashboard");
  revalidatePath("/shipments");

  if (customerId && !Number.isNaN(customerId)) {
    revalidatePath(`/customers/${customerId}`);
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

