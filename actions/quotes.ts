"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { portalAuditLogs, quoteRequests, staffAccounts } from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import { canManageQuotes, canViewQuotes } from "@/lib/portal-roles";
import { quoteStatusValues, type QuoteStatus } from "@/lib/quotes/core";
import { parseWibDateTime } from "@/lib/shipments/readiness";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireQuoteViewer() {
  const user = await requirePortalUser();
  if (!canViewQuotes(user)) redirect("/dashboard?error=forbidden");
  return user;
}

async function requireQuoteManager() {
  const user = await requirePortalUser();
  if (!canManageQuotes(user)) redirect("/quotes?error=forbidden");
  return user;
}

export async function getQuotesPage(options: { page?: number; search?: string; status?: string } = {}) {
  await requireQuoteViewer();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = 40;
  const conditions = [];
  if (options.status && quoteStatusValues.includes(options.status as QuoteStatus)) conditions.push(eq(quoteRequests.status, options.status));
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(quoteRequests.referenceNumber, pattern),
      ilike(quoteRequests.companyName, pattern),
      ilike(quoteRequests.contactName, pattern),
      ilike(quoteRequests.email, pattern),
      ilike(quoteRequests.origin, pattern),
      ilike(quoteRequests.destination, pattern),
    )!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, countRows] = await Promise.all([
    db
      .select({
        assignedTo: staffAccounts.fullName,
        companyName: quoteRequests.companyName,
        contactName: quoteRequests.contactName,
        createdAt: quoteRequests.createdAt,
        destination: quoteRequests.destination,
        dueAt: quoteRequests.dueAt,
        id: quoteRequests.id,
        nextAction: quoteRequests.nextAction,
        origin: quoteRequests.origin,
        readyDate: quoteRequests.readyDate,
        referenceNumber: quoteRequests.referenceNumber,
        status: quoteRequests.status,
        weightKg: quoteRequests.weightKg,
      })
      .from(quoteRequests)
      .leftJoin(staffAccounts, eq(quoteRequests.assignedTo, staffAccounts.id))
      .where(where)
      .orderBy(sql`case when ${quoteRequests.status} = 'new' then 0 else 1 end`, asc(quoteRequests.dueAt), desc(quoteRequests.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(quoteRequests).where(where),
  ]);
  const total = countRows[0]?.count ?? 0;
  return { page, pageSize, rows, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getQuoteDetail(id: number) {
  await requireQuoteViewer();
  if (!Number.isInteger(id) || id <= 0) return null;
  const [quote] = await db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);
  if (!quote) return null;
  const staff = await db
    .select({ fullName: staffAccounts.fullName, id: staffAccounts.id, role: staffAccounts.role })
    .from(staffAccounts)
    .where(eq(staffAccounts.isActive, true))
    .orderBy(asc(staffAccounts.fullName));
  return { quote, staff };
}

export async function updateQuoteFromForm(id: number, formData: FormData) {
  const user = await requireQuoteManager();
  const status = text(formData, "status") as QuoteStatus;
  const assignedToText = text(formData, "assignedTo");
  const assignedTo = assignedToText ? Number.parseInt(assignedToText, 10) : null;
  const nextAction = text(formData, "nextAction") || null;
  const dueAt = parseWibDateTime(text(formData, "dueAt"));
  const internalNotes = text(formData, "internalNotes") || null;
  const closeReason = text(formData, "closeReason");
  if (!quoteStatusValues.includes(status)) throw new Error("Select a valid quote status.");
  if (assignedTo !== null && (!Number.isInteger(assignedTo) || assignedTo <= 0)) throw new Error("Select a valid owner.");
  if (nextAction && !dueAt && !["won", "lost", "closed"].includes(status)) throw new Error("Set a due time for the next action.");
  if (["lost", "closed"].includes(status) && !closeReason) throw new Error("A close reason is required.");

  const [quote] = await db.select({ referenceNumber: quoteRequests.referenceNumber, status: quoteRequests.status }).from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  if (!quote) throw new Error("Quote request was not found.");
  if (assignedTo) {
    const [owner] = await db.select({ id: staffAccounts.id }).from(staffAccounts).where(and(eq(staffAccounts.id, assignedTo), eq(staffAccounts.isActive, true))).limit(1);
    if (!owner) throw new Error("The selected owner is not active.");
  }

  const now = new Date();
  const queries: BatchItem<"pg">[] = [
    db.update(quoteRequests).set({ assignedTo, dueAt, internalNotes, nextAction, status, updatedAt: now }).where(eq(quoteRequests.id, id)),
    db.insert(portalAuditLogs).values({
      action: "quote.updated",
      createdAt: now,
      entityId: String(id),
      entityType: "quote",
      metadataJson: JSON.stringify({ fromStatus: quote.status, referenceNumber: quote.referenceNumber, status }),
      performedBy: user.id,
      reason: closeReason || null,
    }),
  ];
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  revalidatePath("/dashboard");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}?notice=${encodeURIComponent("Quote workflow updated.")}`);
}
