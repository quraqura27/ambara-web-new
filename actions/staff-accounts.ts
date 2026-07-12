"use server";

import bcrypt from "bcryptjs";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { portalAuditLogs, staffAccounts } from "@/lib/db/schema";
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

function requireConfirmation(formData: FormData, label: string) {
  if (normalizeText(formData.get("confirmed")) !== "yes") {
    redirectWithAccountError(`${label} confirmation is required.`);
  }
}

async function getStaffAccount(id: number) {
  const [account] = await db
    .select({ id: staffAccounts.id, isActive: staffAccounts.isActive, role: staffAccounts.role })
    .from(staffAccounts)
    .where(eq(staffAccounts.id, id))
    .limit(1);
  if (!account) redirectWithAccountError("Staff account not found.");
  return account;
}

async function assertAnotherActiveSuperadmin(targetId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffAccounts)
    .where(sql`${staffAccounts.isActive} = true and ${staffAccounts.role} = 'superadmin' and ${staffAccounts.id} <> ${targetId}`);
  if ((row?.count ?? 0) < 1) {
    redirectWithAccountError("At least one other active superadmin is required for this change.");
  }
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
      sessionVersion: staffAccounts.sessionVersion,
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

  const idResult = await db.execute<{ id: number }>(sql`
    select nextval(pg_get_serial_sequence('staff_accounts', 'id'))::int as id
  `);
  const id = idResult.rows[0]?.id;
  if (!id) redirectWithAccountError("Staff account identifier could not be allocated.");
  await db.batch([
    db.insert(staffAccounts).values({
      id,
      fullName,
      email,
      passwordHash,
      role,
      isActive: true,
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(portalAuditLogs).values({
      action: "staff_account.created",
      createdAt: now,
      entityId: String(id),
      entityType: "staff_account",
      metadataJson: JSON.stringify({ role }),
      performedBy: currentUser.id,
    }),
  ]);

  revalidatePath("/accounts");
  redirectWithAccountNotice("Staff account created.");
}

export async function updateStaffAccountFromForm(id: number, formData: FormData) {
  const currentUser = await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);
  const fullName = normalizeText(formData.get("fullName"));
  const role = parseStaffRole(formData.get("role"));

  if (!fullName) {
    redirectWithAccountError("Full name is required.");
  }
  requireConfirmation(formData, "Staff account update");
  const target = await getStaffAccount(staffAccountId);
  const previousRole = normalizePortalRole(target.role);
  if (staffAccountId === currentUser.id && role !== previousRole) {
    redirectWithAccountError("You cannot change your own role.");
  }
  if (target.isActive && previousRole === "superadmin" && role !== "superadmin") {
    await assertAnotherActiveSuperadmin(staffAccountId);
  }

  const now = new Date();
  await db.batch([
    db.update(staffAccounts).set({
      fullName,
      role,
      sessionVersion: sql`${staffAccounts.sessionVersion} + 1`,
      updatedAt: now,
    }).where(eq(staffAccounts.id, staffAccountId)),
    db.insert(portalAuditLogs).values({
      action: "staff_account.updated",
      createdAt: now,
      entityId: String(staffAccountId),
      entityType: "staff_account",
      metadataJson: JSON.stringify({ fromRole: previousRole, sessionsRevoked: true, toRole: role }),
      performedBy: currentUser.id,
    }),
  ]);

  revalidatePath("/accounts");
  redirectWithAccountNotice("Staff account updated.");
}

export async function setStaffAccountActive(id: number, isActive: boolean, formData: FormData) {
  const currentUser = await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);
  requireConfirmation(formData, isActive ? "Account activation" : "Account deactivation");

  if (staffAccountId === currentUser.id && !isActive) {
    redirectWithAccountError("You cannot deactivate your own account.");
  }
  const target = await getStaffAccount(staffAccountId);
  if (!isActive && target.isActive && normalizePortalRole(target.role) === "superadmin") {
    await assertAnotherActiveSuperadmin(staffAccountId);
  }

  const now = new Date();
  await db.batch([
    db.update(staffAccounts).set({
      isActive,
      sessionVersion: sql`${staffAccounts.sessionVersion} + 1`,
      updatedAt: now,
    }).where(eq(staffAccounts.id, staffAccountId)),
    db.insert(portalAuditLogs).values({
      action: isActive ? "staff_account.activated" : "staff_account.deactivated",
      createdAt: now,
      entityId: String(staffAccountId),
      entityType: "staff_account",
      metadataJson: JSON.stringify({ sessionsRevoked: true }),
      performedBy: currentUser.id,
    }),
  ]);

  revalidatePath("/accounts");
  redirectWithAccountNotice(isActive ? "Staff account activated." : "Staff account deactivated.");
}

export async function resetStaffPasswordFromForm(id: number, formData: FormData) {
  const currentUser = await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);
  const password = parsePassword(formData.get("password"));
  requireConfirmation(formData, "Password reset");
  await getStaffAccount(staffAccountId);
  const passwordHash = await bcrypt.hash(password, 12);

  const now = new Date();
  await db.batch([
    db.update(staffAccounts).set({
      passwordHash,
      sessionVersion: sql`${staffAccounts.sessionVersion} + 1`,
      updatedAt: now,
    }).where(eq(staffAccounts.id, staffAccountId)),
    db.insert(portalAuditLogs).values({
      action: "staff_account.password_reset",
      createdAt: now,
      entityId: String(staffAccountId),
      entityType: "staff_account",
      metadataJson: JSON.stringify({ sessionsRevoked: true }),
      performedBy: currentUser.id,
    }),
  ]);

  revalidatePath("/accounts");
  redirectWithAccountNotice("Staff password reset.");
}

export async function revokeStaffSessions(id: number, formData: FormData) {
  const currentUser = await requireStaffAccountManager();
  const staffAccountId = parseStaffAccountId(id);
  if (staffAccountId === currentUser.id) {
    redirectWithAccountError("Use Sign Out to end your own current session.");
  }
  if (normalizeText(formData.get("confirmed")) !== "yes") {
    redirectWithAccountError("Session revocation confirmation is required.");
  }

  await getStaffAccount(staffAccountId);
  const now = new Date();
  await db.batch([
    db.update(staffAccounts).set({
      sessionVersion: sql`${staffAccounts.sessionVersion} + 1`,
      updatedAt: now,
    }).where(eq(staffAccounts.id, staffAccountId)),
    db.insert(portalAuditLogs).values({
      action: "staff_account.sessions_revoked",
      createdAt: now,
      entityId: String(staffAccountId),
      entityType: "staff_account",
      performedBy: currentUser.id,
    }),
  ]);
  revalidatePath("/accounts");
  redirectWithAccountNotice("All existing sessions for that account were revoked.");
}
