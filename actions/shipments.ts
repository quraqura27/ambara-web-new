"use server";

import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { customers, shipments, trackingUpdates } from "@/lib/db/schema";
import { TrackingEvent } from "@/lib/tracking/interface";
import { trackingProvider } from "@/lib/tracking/mock";

function normalizeTrackingNumber(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
}

async function requireUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

async function syncTrackingUpdates(shipmentId: number, events: TrackingEvent[]) {
  const existingUpdates = await db
    .select()
    .from(trackingUpdates)
    .where(eq(trackingUpdates.shipmentId, shipmentId))
    .orderBy(desc(trackingUpdates.timestamp));

  if (existingUpdates.length === 0) {
    await db.insert(trackingUpdates).values(
      events.map((event) => ({
        shipmentId,
        status: event.status,
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
    status: update.status as TrackingEvent["status"],
    description: update.description,
    location: update.location ?? undefined,
    timestamp: update.timestamp,
  }));
}

export async function getShipmentByTracking(trackingNumber: string) {
  await requireUser();

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
  const liveData = await trackingProvider.getTrackingInfo(normalizedTrackingNumber);

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, normalizedTrackingNumber));

  if (!shipment) {
    return { shipment: null, liveData, customer: null };
  }

  await db
    .update(shipments)
    .set({
      status: liveData.status,
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipment.id));

  const events = await syncTrackingUpdates(shipment.id, liveData.events);

  const [customer] = shipment.customerId
    ? await db.select().from(customers).where(eq(customers.id, shipment.customerId))
    : [null];

  return {
    shipment: {
      ...shipment,
      status: liveData.status,
      updatedAt: new Date(),
    },
    liveData: {
      ...liveData,
      events,
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

export async function getDashboardStats() {
  await requireUser();

  const allCustomers = await db.select().from(customers);
  const allShipments = await db.select().from(shipments);

  return {
    totalCustomers: allCustomers.length,
    activeShipments: allShipments.filter((shipment) => shipment.status === "in_transit").length,
    deliveredShipments: allShipments.filter((shipment) => shipment.status === "delivered").length,
    exceptionShipments: allShipments.filter((shipment) => shipment.status === "exception").length,
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

