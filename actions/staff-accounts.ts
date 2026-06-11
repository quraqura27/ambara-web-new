"use server";

import bcrypt from "bcryptjs";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { staffAccounts } from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  canManageStaffAccounts,
  isAssignableStaffRole,
  normalizePortalRole,
  portalRoleLabels,
} from "@/lib/portal-roles";

const passwordMinLength = 8;

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithAccountError(message: string): never {
  redirect(`/accounts?error=${encodeURIComponent(message)}`);
}

function redirectWithAccountNotice(message: string): never {
  redirect(`/accounts?notice=${encodeURIComponent(message)}`);
}

function parseStaffAccountId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithAccountError("Invalid staff account.");
  }

  return id;
}

function parseStaffRole(value: FormDataEntryValue | null) {
  const role = normalizePortalRole(normalizeText(value));

  if (!isAssignableStaffRole(role)) {
    redirectWithAccountError("Select a valid staff role.");
  }

  return role;
}

function parsePassword(value: FormDataEntryValue | null) {
  const password = normalizeText(value);

  if (password.length < passwordMinLength) {
    redirectWithAccountError(`Password must be at least ${passwordMinLength} characters.`);
  }

  return password;
}

function parseEmail(value: FormDataEntryValue | null) {
  const email = normalizeText(value).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectWithAccountError("Enter a valid email address.");
  }

  return email;
}

async function requireStaffAccountManager() {
  const user = await requirePortalUser();

  if (!canManageStaffAccounts(user)) {
    redirect("/dashboard");
  }

  return user;
}

export async function getStaffAccounts() {
  await requireStaffAccountManager();

  const rows = await db
    .select({
      id: staffAccounts.id,
      fullName: staffAccounts.fullName,
      email: staffAccounts.email,
      role: staffAccounts.role,
      isActive: staffAccounts.isActive,
      lastLogin: staffAccounts.lastLogin,
      createdAt: staffAccounts.createdAt,
      updatedAt: staffAccounts.updatedAt,
    })
    .from(staffAccounts)
    .orderBy(desc(staffAccounts.createdAt));

  return rows.map((account) => ({
    ...account,
    role: normalizePortalRole(account.role),
    roleLabel: portalRoleLabels[normalizePortalRole(account.role)],
  }));
}

export async function createStaffAccountFromForm(formData: FormData) {
  const currentUser = await requireStaffAccountManager();
  const fullName = normalizeText(formData.get("fullName"));
  const email = parseEmail(formData.get("email"));
  const password = parsePassword(formData.get("password"));
  const role = parseStaffRole(formData.get("role"));

  if (!fullName) {
    redirectWithAccountError("Full name is required.");
  }

  const [existingAccount] = await db
    .select({ id: staffAccounts.id })
    .from(staffAccounts)
    .where(sql`lower(${staffAccounts.email}) = ${email}`)
    .limit(1);

  if (existingAccount) {
    redirectWithAccountError("A staff account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  await db.insert(staffAccounts).values({
    fullName,
    email,
    passwordHash,
    role,
    isActive: true,
    createdBy: currentUser.id,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/accounts");
  redirectWithAccountNotice("Staff account created.");
}

export async function updateStaffAccountFromForm(id: number, formData: FormData) {
  await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);
  const fullName = normalizeText(formData.get("fullName"));
  const role = parseStaffRole(formData.get("role"));

  if (!fullName) {
    redirectWithAccountError("Full name is required.");
  }

  const [updatedAccount] = await db
    .update(staffAccounts)
    .set({
      fullName,
      role,
      updatedAt: new Date(),
    })
    .where(eq(staffAccounts.id, staffAccountId))
    .returning({ id: staffAccounts.id });

  if (!updatedAccount) {
    redirectWithAccountError("Staff account not found.");
  }

  revalidatePath("/accounts");
  redirectWithAccountNotice("Staff account updated.");
}

export async function setStaffAccountActive(id: number, isActive: boolean) {
  const currentUser = await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);

  if (staffAccountId === currentUser.id && !isActive) {
    redirectWithAccountError("You cannot deactivate your own account.");
  }

  const [updatedAccount] = await db
    .update(staffAccounts)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(staffAccounts.id, staffAccountId))
    .returning({ id: staffAccounts.id });

  if (!updatedAccount) {
    redirectWithAccountError("Staff account not found.");
  }

  revalidatePath("/accounts");
  redirectWithAccountNotice(isActive ? "Staff account activated." : "Staff account deactivated.");
}

export async function resetStaffPasswordFromForm(id: number, formData: FormData) {
  await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);
  const password = parsePassword(formData.get("password"));
  const passwordHash = await bcrypt.hash(password, 12);

  const [updatedAccount] = await db
    .update(staffAccounts)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(staffAccounts.id, staffAccountId))
    .returning({ id: staffAccounts.id });

  if (!updatedAccount) {
    redirectWithAccountError("Staff account not found.");
  }

  revalidatePath("/accounts");
  redirectWithAccountNotice("Staff password reset.");
}
