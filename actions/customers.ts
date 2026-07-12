"use server";

import bcrypt from "bcryptjs";
import { and, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { customers, portalAuditLogs, shipments } from "@/lib/db/schema";
import {
  customerDuplicateSignals,
  normalizeCustomerPhone,
} from "@/lib/customers/duplicates";
import { normalizeCustomerCode } from "@/lib/invoices/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { canManageCustomers, hasPortalCapability } from "@/lib/portal-roles";

const customerTypeValues = ["b2b", "retail"] as const;

export type CustomerType = (typeof customerTypeValues)[number];

export type CustomerFormValues = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  invoiceCode: string;
  type: CustomerType;
};

export type CustomerActionState = {
  formError?: string;
  values?: Partial<CustomerFormValues>;
};

export type CustomerCredentialActionState = {
  formError?: string;
  success?: string;
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
  const invoiceCode = normalizeCustomerCode(normalizeText(formData.get("invoiceCode")));

  if (!fullName && !companyName) {
    throw new Error("Customer name is required");
  }
  if (!invoiceCode) {
    throw new Error("Invoice code must be exactly 3 letters.");
  }
  const email = normalizeText(formData.get("email"));
  const phone = normalizeText(formData.get("phone"));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    throw new Error("Phone number must contain 7 to 15 digits.");
  }

  return {
    fullName,
    companyName,
    email,
    phone,
    address: normalizeText(formData.get("address")),
    invoiceCode,
    type: parseCustomerType(normalizeText(formData.get("type"))),
  };
}

async function requireUser() {
  return requirePortalUser();
}

async function requireCustomerManager() {
  const user = await requirePortalUser();
  if (!canManageCustomers(user)) redirect("/customers?error=forbidden");
  return user;
}

async function generateCustomerId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `ID-${Math.floor(10000 + Math.random() * 90000)}`;
    const [existingCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.customerId, candidate));

    if (!existingCustomer) {
      return candidate;
    }
  }

  return `ID-${Date.now().toString().slice(-8)}`;
}

async function assertInvoiceCodeAvailable(invoiceCode: string, currentCustomerId?: number) {
  const [existingCustomer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.invoiceCode, invoiceCode))
    .limit(1);

  if (existingCustomer && existingCustomer.id !== currentCustomerId) {
    throw new Error(`Invoice code ${invoiceCode} is already used by another customer.`);
  }
}

async function findDuplicateCustomers(values: CustomerFormValues, currentCustomerId?: number) {
  const conditions = [];
  if (values.email) conditions.push(sql`lower(btrim(${customers.email})) = ${values.email.trim().toLowerCase()}`);
  if (values.phone) {
    const normalizedPhone = normalizeCustomerPhone(values.phone);
    conditions.push(sql`
      case
        when regexp_replace(coalesce(${customers.phone}, ''), '\\D', '', 'g') like '0%'
          then '62' || substr(regexp_replace(coalesce(${customers.phone}, ''), '\\D', '', 'g'), 2)
        else regexp_replace(coalesce(${customers.phone}, ''), '\\D', '', 'g')
      end = ${normalizedPhone}
    `);
  }
  if (values.companyName) conditions.push(sql`lower(regexp_replace(btrim(coalesce(${customers.companyName}, '')), '[^a-zA-Z0-9]+', ' ', 'g')) = ${values.companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")}`);
  if (!conditions.length) return [];
  const matches = await db
    .select({ companyName: customers.companyName, email: customers.email, fullName: customers.fullName, id: customers.id, phone: customers.phone })
    .from(customers)
    .where(and(isNull(customers.archivedAt), currentCustomerId ? ne(customers.id, currentCustomerId) : undefined, or(...conditions)))
    .limit(5);
  return matches.map((candidate) => ({ ...candidate, signals: customerDuplicateSignals(values, candidate) })).filter((candidate) => candidate.signals.length > 0);
}

export async function getCustomers(search?: string) {
  await requireUser();

  const trimmedSearch = search?.trim();

  if (!trimmedSearch) {
    return db.select().from(customers).where(isNull(customers.archivedAt)).orderBy(desc(customers.createdAt));
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
    ilike(customers.invoiceCode, `%${trimmedSearch}%`),
  ];

  if (matchedCustomerIds.length > 0) {
    filters.push(inArray(customers.id, matchedCustomerIds));
  }

  return db
    .select()
    .from(customers)
    .where(and(isNull(customers.archivedAt), or(...filters)))
    .orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  await requireUser();

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), isNull(customers.archivedAt)));

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

export async function createCustomer(values: CustomerFormValues, allowDuplicate = false) {
  const user = await requireCustomerManager();
  await assertInvoiceCodeAvailable(values.invoiceCode);
  const duplicates = await findDuplicateCustomers(values);
  if (duplicates.length && !allowDuplicate) {
    const first = duplicates[0]!;
    throw new Error(`Possible duplicate customer #${first.id} matched by ${first.signals.join(", ")}. Review that record or confirm an intentional duplicate.`);
  }

  const idResult = await db.execute<{ id: number }>(sql`
    select nextval(pg_get_serial_sequence('customers', 'id'))::int as id
  `);
  const id = idResult.rows[0]?.id;
  if (!id) throw new Error("Customer identifier could not be allocated.");
  const now = new Date();
  await db.batch([
    db.insert(customers).values({
      ...values,
      id,
      customerId: await generateCustomerId(),
      country: "Indonesia",
      countryCode: "ID",
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(portalAuditLogs).values({
      action: "customer.created",
      createdAt: now,
      entityId: String(id),
      entityType: "customer",
      performedBy: user.id,
    }),
  ]);

  revalidatePath("/customers");

  return { id };
}

export async function updateCustomer(id: number, values: CustomerFormValues) {
  const user = await requireCustomerManager();
  await assertInvoiceCodeAvailable(values.invoiceCode, id);
  const duplicates = await findDuplicateCustomers(values, id);
  if (duplicates.length) throw new Error(`Another customer record matches by ${duplicates[0]!.signals.join(", ")}. Merge or review the records before saving.`);

  const now = new Date();
  await db.batch([
    db.update(customers).set({
      ...values,
      updatedAt: now,
    }).where(and(eq(customers.id, id), isNull(customers.archivedAt))),
    db.insert(portalAuditLogs).values({
      action: "customer.updated",
      createdAt: now,
      entityId: String(id),
      entityType: "customer",
      performedBy: user.id,
    }),
  ]);

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);

  return { id };
}

export async function createCustomerFromForm(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  let values: CustomerFormValues;
  try {
    values = readCustomerForm(formData);
  } catch (error) {
    return {
      formError: error instanceof Error ? error.message : "Customer details are invalid.",
      values: Object.fromEntries(formData) as Partial<CustomerFormValues>,
    };
  }
  let newCustomer;
  try {
    newCustomer = await createCustomer(
      values,
      normalizeText(formData.get("confirmDuplicate")) === "yes",
    );
  } catch (error) {
    return {
      formError: error instanceof Error ? error.message : "Customer could not be created.",
      values,
    };
  }
  redirect(`/customers/${newCustomer.id}`);
}

export async function updateCustomerFromForm(
  id: number,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  let values: CustomerFormValues;
  try {
    values = readCustomerForm(formData);
    await updateCustomer(id, values);
  } catch (error) {
    return {
      formError: error instanceof Error ? error.message : "Customer could not be updated.",
      values: Object.fromEntries(formData) as Partial<CustomerFormValues>,
    };
  }
  redirect(`/customers/${id}`);
}

export async function archiveCustomerAndRedirect(id: number, formData: FormData) {
  const user = await requireCustomerManager();
  const [customer] = await db.select({ companyName: customers.companyName, fullName: customers.fullName, id: customers.id }).from(customers).where(and(eq(customers.id, id), isNull(customers.archivedAt))).limit(1);
  if (!customer) throw new Error("Customer was not found.");
  const identifier = customer.companyName || customer.fullName || `CUSTOMER-${id}`;
  const reason = normalizeText(formData.get("reason"));
  if (normalizeText(formData.get("confirmed")) !== "yes" || normalizeText(formData.get("confirmationCode")) !== identifier) throw new Error("Type the exact customer name to archive the record.");
  if (!reason) throw new Error("Archive reason is required.");
  const now = new Date();
  await db.batch([
    db.update(customers).set({ archivedAt: now, archivedBy: user.id, sessionVersion: sql`${customers.sessionVersion} + 1`, updatedAt: now }).where(eq(customers.id, id)),
    db.insert(portalAuditLogs).values({ action: "customer.archived", createdAt: now, entityId: String(id), entityType: "customer", performedBy: user.id, reason }),
  ]);
  revalidatePath("/customers");
  redirect("/customers");
}

export async function resetCustomerPortalPassword(
  id: number,
  _previousState: CustomerCredentialActionState,
  formData: FormData,
): Promise<CustomerCredentialActionState> {
  const user = await requirePortalUser();
  if (!hasPortalCapability(user, "customer:credentials")) {
    return { formError: "Customer credential access is required." };
  }
  if (normalizeText(formData.get("confirmed")) !== "yes") {
    return { formError: "Confirm the customer password reset." };
  }

  const password = normalizeText(formData.get("password"));
  const passwordConfirmation = normalizeText(formData.get("passwordConfirmation"));
  if (password.length < 8 || password.length > 128) {
    return { formError: "Password must contain 8 to 128 characters." };
  }
  if (password !== passwordConfirmation) {
    return { formError: "Password confirmation does not match." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const result = await db.execute<{ updated: boolean }>(sql`
    with updated_customer as (
      update customers
      set
        password_hash = ${passwordHash},
        session_version = ${customers.sessionVersion} + 1,
        updated_at = ${now}
      where id = ${id}
        and archived_at is null
        and nullif(btrim(email), '') is not null
      returning id
    ), inserted_audit as (
      insert into portal_audit_logs (
        action, entity_type, entity_id, performed_by, metadata_json, created_at
      )
      select
        'customer.credentials_reset', 'customer', id::text, ${user.id},
        ${JSON.stringify({ sessionsRevoked: true })}, ${now}
      from updated_customer
      returning id
    )
    select exists(select 1 from updated_customer) as updated
  `);

  if (!result.rows[0]?.updated) {
    return { formError: "Customer was not found, is archived, or has no sign-in email." };
  }

  revalidatePath(`/customers/${id}`);
  return { success: "Client password updated and existing client sessions revoked." };
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
