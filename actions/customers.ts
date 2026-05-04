"use server";

import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { customers, shipments } from "@/lib/db/schema";

const customerTypeValues = ["b2b", "shipper", "consignee"] as const;

export type CustomerType = (typeof customerTypeValues)[number];

export type CustomerFormValues = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  type: CustomerType;
};

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCustomerType(value: string): CustomerType {
  return customerTypeValues.includes(value as CustomerType)
    ? (value as CustomerType)
    : "b2b";
}

function readCustomerForm(formData: FormData): CustomerFormValues {
  const fullName = normalizeText(formData.get("fullName"));
  const companyName = normalizeText(formData.get("companyName"));

  if (!fullName && !companyName) {
    throw new Error("Customer name is required");
  }

  return {
    fullName,
    companyName,
    email: normalizeText(formData.get("email")),
    phone: normalizeText(formData.get("phone")),
    address: normalizeText(formData.get("address")),
    type: parseCustomerType(normalizeText(formData.get("type"))),
  };
}

async function requireUser() {
  throw new Error("Unauthorized");
}

export async function getCustomers(search?: string) {
  await requireUser();

  const trimmedSearch = search?.trim();

  if (!trimmedSearch) {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  const trackingMatches = await db
    .select({ customerId: shipments.customerId })
    .from(shipments)
    .where(ilike(shipments.trackingNumber, `%${trimmedSearch}%`));

  const matchedCustomerIds = Array.from(
    new Set(
      trackingMatches
        .map((match) => match.customerId)
        .filter((value): value is number => typeof value === "number"),
    ),
  );

  const filters = [
    ilike(customers.fullName, `%${trimmedSearch}%`),
    ilike(customers.email, `%${trimmedSearch}%`),
    ilike(customers.phone, `%${trimmedSearch}%`),
    ilike(customers.companyName, `%${trimmedSearch}%`),
  ];

  if (matchedCustomerIds.length > 0) {
    filters.push(inArray(customers.id, matchedCustomerIds));
  }

  return db
    .select()
    .from(customers)
    .where(or(...filters))
    .orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  await requireUser();

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  if (!customer) {
    return null;
  }

  const linkedShipments = await db
    .select()
    .from(shipments)
    .where(eq(shipments.customerId, id))
    .orderBy(desc(shipments.updatedAt));

  return { ...customer, shipments: linkedShipments };
}

export async function createCustomer(values: CustomerFormValues) {
  await requireUser();

  const [newCustomer] = await db
    .insert(customers)
    .values({
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath("/customers");

  return newCustomer;
}

export async function updateCustomer(id: number, values: CustomerFormValues) {
  await requireUser();

  const [updatedCustomer] = await db
    .update(customers)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning();

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);

  return updatedCustomer;
}

export async function deleteCustomer(id: number) {
  await requireUser();

  await db
    .update(shipments)
    .set({
      customerId: null,
      updatedAt: new Date(),
    })
    .where(eq(shipments.customerId, id));

  await db.delete(customers).where(eq(customers.id, id));

  revalidatePath("/customers");

  return { success: true };
}

export async function createCustomerFromForm(formData: FormData) {
  const newCustomer = await createCustomer(readCustomerForm(formData));
  redirect(`/customers/${newCustomer.id}`);
}

export async function updateCustomerFromForm(id: number, formData: FormData) {
  await updateCustomer(id, readCustomerForm(formData));
  redirect(`/customers/${id}`);
}

export async function deleteCustomerAndRedirect(id: number) {
  await deleteCustomer(id);
  redirect("/customers");
}

export async function searchCustomersByTracking(customerId: number, trackingNumber: string) {
  await requireUser();

  const trimmedTrackingNumber = trackingNumber.trim();

  if (!trimmedTrackingNumber) {
    return [];
  }

  return db
    .select()
    .from(shipments)
    .where(
      and(
        eq(shipments.customerId, customerId),
        ilike(shipments.trackingNumber, `%${trimmedTrackingNumber}%`),
      ),
    )
    .orderBy(desc(shipments.updatedAt));
}
