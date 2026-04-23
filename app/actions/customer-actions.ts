"use server";

import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

/**
 * GET B2B CUSTOMERS
 * Used for the billing customer dropdown in manifest ingestion.
 */
export async function getB2BCustomers() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select({
    id: customers.id,
    fullName: customers.fullName,
    companyName: customers.companyName,
    countryCode: customers.countryCode,
  })
  .from(customers)
  .where(eq(customers.type, "b2b"));
}

/**
 * QUICK ADD CUSTOMER
 * In-process creation of a billing customer during ingestion.
 */
export async function quickAddCustomer(name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [newCustomer] = await db.insert(customers).values({
    fullName: name,
    companyName: name, // Default company name to full name if unknown
    type: "b2b",
    countryCode: "ID", // Default to ID for quick-add
  }).returning();

  return newCustomer;
}

/**
 * GET ALL CUSTOMERS
 * Retrieves all CRM profiles (Billing, Shipper, Consignee)
 */
export async function getAllCustomers() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.select().from(customers).orderBy(customers.fullName);
}

/**
 * UPDATE CUSTOMER PROFILE
 * Allows refining auto-provisioned manifest identities.
 */
export async function updateCustomer(id: number, data: Partial<typeof customers.$inferInsert>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await db.update(customers)
    .set({
      ...data,
      // Ensure we don't accidentally update internal IDs or timestamps here
    })
    .where(eq(customers.id, id));
}
