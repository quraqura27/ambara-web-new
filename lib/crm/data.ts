import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  crmActivities,
  crmActivityLinks,
  crmCompanies,
  crmCompanyRoles,
  crmContacts,
  crmLeads,
  crmOpportunities,
  crmTasks,
  crmTeamMembers,
  crmTeams,
  customers,
  portalAuditLogs,
  quoteRequests,
  staffAccounts,
} from "@/lib/db/schema";
import {
  canAccessCrmOwnedRecord,
  assertOpportunityCommercialCompleteness,
  assertOpportunityInitialStage,
  assertOpportunityStagePrerequisites,
  assertOpportunityStageTransition,
  deriveOpportunityLifecycle,
  getCrmReadScope,
  getCrmWriteScope,
  normalizeCrmCompanyName,
  type CrmActivityInput,
  type CrmCompanyInput,
  type CrmContactInput,
  type CrmEntityType,
  type CrmExternalQuotationStatus,
  type CrmLeadInput,
  type CrmOpportunityInput,
  type CrmOpportunityStage,
  type CrmTaskInput,
  type CrmTaskStatus,
} from "@/lib/crm/core";
import { requirePortalUser, type PortalUser } from "@/lib/portal-auth";
import {
  canArchiveCrm,
  canAssignCrm,
  canConvertQuoteRequestToCrmLead,
  canManageCrm,
  canManageCrmStage,
  canRestoreCrm,
  canViewCrm,
  canViewCrmCompliance,
  hasPortalCapability,
} from "@/lib/portal-roles";

export type CrmCompanyListItem = {
  id: number;
  legalName: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  countryCode: string;
  ownerId: number;
  ownerName: string;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  legacyCustomerId: number | null;
  archivedAt: Date | null;
  updatedAt: Date;
};

export type CrmCompanyDetail = CrmCompanyListItem & {
  normalizedName: string;
  website: string | null;
  taxId: string | null;
  nib: string | null;
  industry: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  province: string | null;
  postalCode: string | null;
  complianceNotes: string | null;
  notes: string | null;
  archiveReason: string | null;
  createdAt: Date;
  roles: string[];
  contacts: Array<{
    id: number;
    fullName: string;
    jobTitle: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    isPrimary: boolean;
    notes: string | null;
  }>;
};

export type CrmLeadListItem = {
  id: number;
  title: string;
  source: string;
  status: string;
  priority: string;
  companyId: number | null;
  companyName: string | null;
  contactId: number | null;
  contactName: string | null;
  freightType: string | null;
  origin: string | null;
  destination: string | null;
  ownerId: number;
  ownerName: string;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  nextAction: string | null;
  actionDueAt: Date | null;
  sourceQuoteRequestId: number | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CrmLeadDetail = CrmLeadListItem & {
  readyDate: string | null;
  cargoDescription: string | null;
  commodity: string | null;
  incoterm: string | null;
  numPackages: number | null;
  weightKg: string | null;
  volumeCbm: string | null;
  notes: string | null;
  qualifiedAt: Date | null;
  disqualifiedAt: Date | null;
  disqualificationReason: string | null;
  archiveReason: string | null;
};

export type CrmOpportunityListItem = {
  id: number;
  title: string;
  status: string;
  stage: string;
  probability: number;
  estimatedValue: string | null;
  currency: string;
  expectedCloseDate: string | null;
  companyId: number | null;
  companyName: string | null;
  primaryContactId: number | null;
  primaryContactName: string | null;
  ownerId: number;
  ownerName: string;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  nextAction: string | null;
  actionDueAt: Date | null;
  externalQuotationReference: string | null;
  externalQuotationStatus: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CrmOpportunityDetail = CrmOpportunityListItem & {
  leadId: number | null;
  freightType: string | null;
  origin: string | null;
  destination: string | null;
  cargoDescription: string | null;
  commodity: string | null;
  incoterm: string | null;
  weightKg: string | null;
  volumeCbm: string | null;
  externalQuotationUrl: string | null;
  notes: string | null;
  wonAt: Date | null;
  lostAt: Date | null;
  lostReason: string | null;
  archiveReason: string | null;
};

export type CrmActivityListItem = {
  id: number;
  activityType: string;
  subject: string;
  details: string | null;
  occurredAt: Date;
  ownerId: number;
  ownerName: string;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
};

export type CrmContactListItem = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  isPrimary: boolean;
  notes: string | null;
  ownerId: number;
  ownerName: string;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  archivedAt: Date | null;
  archiveReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CrmTaskListItem = {
  id: number;
  subject: string;
  details: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  completedAt: Date | null;
  ownerId: number;
  ownerName: string;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OwnedRow = { ownerId: number; ownerTeamId: number | null };
type ScopeMode = "read" | "write";

async function requireCrmReader() {
  const user = await requirePortalUser();
  if (!canViewCrm(user)) redirect("/dashboard?error=forbidden");
  return user;
}

async function requireCrmWriter() {
  const user = await requirePortalUser();
  if (!canManageCrm(user)) redirect("/dashboard?error=forbidden");
  return user;
}

async function getActiveMembershipTeamIds(userId: number) {
  const rows = await db
    .select({ teamId: crmTeamMembers.teamId })
    .from(crmTeamMembers)
    .innerJoin(crmTeams, and(eq(crmTeamMembers.teamId, crmTeams.id), isNull(crmTeams.archivedAt)))
    .where(and(eq(crmTeamMembers.staffAccountId, userId), isNull(crmTeamMembers.archivedAt)))
    .orderBy(asc(crmTeamMembers.teamId));
  return rows.map((row) => row.teamId);
}

async function getUserTeamIds(userId: number) {
  const [managedRows, membershipRows] = await Promise.all([
    db.select({ teamId: crmTeams.id }).from(crmTeams)
      .where(and(eq(crmTeams.managerId, userId), isNull(crmTeams.archivedAt))),
    db.select({ teamId: crmTeamMembers.teamId }).from(crmTeamMembers)
      .innerJoin(crmTeams, and(eq(crmTeamMembers.teamId, crmTeams.id), isNull(crmTeams.archivedAt)))
      .where(and(
        eq(crmTeamMembers.staffAccountId, userId),
        eq(crmTeamMembers.membershipRole, "manager"),
        isNull(crmTeamMembers.archivedAt),
      )),
  ]);
  return Array.from(new Set([...managedRows, ...membershipRows].map((row) => row.teamId)));
}

function scopedCondition(
  user: PortalUser,
  teamIds: readonly number[],
  ownerColumn: AnyColumn,
  teamColumn: AnyColumn,
  mode: ScopeMode,
): SQL {
  const scope = mode === "read" ? getCrmReadScope(user) : getCrmWriteScope(user);
  if (scope === "all") return sql`true`;
  if (scope === "team" && teamIds.length) {
    return or(eq(ownerColumn, user.id), inArray(teamColumn, [...teamIds]))!;
  }
  if (scope === "own" || scope === "team") return eq(ownerColumn, user.id);
  return sql`false`;
}

async function assertOwnedAccess(user: PortalUser, record: OwnedRow | undefined, mode: ScopeMode) {
  if (!record) throw new Error("CRM record was not found.");
  const teamIds = await getUserTeamIds(user.id);
  if (!canAccessCrmOwnedRecord(user, record, teamIds, mode)) {
    throw new Error("You do not have access to this CRM record.");
  }
}

async function allocateCrmId(table: "crm_companies" | "crm_contacts" | "crm_leads" | "crm_opportunities" | "crm_activities" | "crm_tasks") {
  const result = await db.execute<{ id: number }>(sql.raw(
    `select nextval(pg_get_serial_sequence('${table}', 'id'))::int as id`,
  ));
  const id = result.rows[0]?.id;
  if (!id) throw new Error("CRM identifier could not be allocated.");
  return id;
}

async function resolveAssignment(
  user: PortalUser,
  requestedOwnerId: number | null,
  requestedTeamId: number | null,
  current?: OwnedRow,
) {
  const ownerId = requestedOwnerId ?? current?.ownerId ?? user.id;
  let ownerTeamId = requestedTeamId;
  if (!current && ownerId === user.id && ownerTeamId === null) {
    ownerTeamId = (await getActiveMembershipTeamIds(user.id))[0] ?? null;
  }
  const assignmentChanged = current
    ? ownerId !== current.ownerId || ownerTeamId !== current.ownerTeamId
    : ownerId !== user.id || requestedTeamId !== null;
  if (assignmentChanged && !canAssignCrm(user)) {
    throw new Error("CRM assignment access is required to change the owner or team.");
  }
  if (assignmentChanged && getCrmWriteScope(user) === "team") {
    const managedTeamIds = await getUserTeamIds(user.id);
    if (ownerTeamId === null || !managedTeamIds.includes(ownerTeamId)) {
      throw new Error("You can assign CRM records only within a team you manage.");
    }
  }
  const [owner] = await db
    .select({ id: staffAccounts.id, isActive: staffAccounts.isActive, role: staffAccounts.role })
    .from(staffAccounts)
    .where(eq(staffAccounts.id, ownerId))
    .limit(1);
  if (!owner?.isActive || !hasPortalCapability({ role: owner.role }, "crm:view")) {
    throw new Error("Select an active staff member with CRM access.");
  }
  if (ownerTeamId !== null) {
    const [membership] = await db
      .select({ id: crmTeamMembers.id })
      .from(crmTeamMembers)
      .innerJoin(crmTeams, and(eq(crmTeamMembers.teamId, crmTeams.id), isNull(crmTeams.archivedAt)))
      .where(and(
        eq(crmTeamMembers.teamId, ownerTeamId),
        eq(crmTeamMembers.staffAccountId, ownerId),
        isNull(crmTeamMembers.archivedAt),
      ))
      .limit(1);
    if (!membership) throw new Error("The selected owner is not an active member of that CRM team.");
  }
  return { ownerId, ownerTeamId };
}

function auditValues(user: PortalUser, action: string, entityType: string, entityId: number, metadata?: Record<string, unknown>, reason?: string | null) {
  return {
    action,
    entityId: String(entityId),
    entityType,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    performedBy: user.id,
    reason: reason?.trim() || null,
  };
}

function activeFilter(includeArchived: boolean, archivedColumn: AnyColumn) {
  return includeArchived ? sql`true` : isNull(archivedColumn);
}

export async function getCrmStaffOptions() {
  const user = await requireCrmReader();
  if (!canAssignCrm(user)) return [{ id: user.id, fullName: user.name, role: user.role }];
  const writeScope = getCrmWriteScope(user);
  const teamIds = await getUserTeamIds(user.id);
  const conditions: SQL[] = [eq(staffAccounts.isActive, true)];
  if (writeScope !== "all") {
    if (!teamIds.length) return [{ id: user.id, fullName: user.name, role: user.role }];
    const memberRows = await db
      .select({ staffId: crmTeamMembers.staffAccountId })
      .from(crmTeamMembers)
      .where(and(inArray(crmTeamMembers.teamId, teamIds), isNull(crmTeamMembers.archivedAt)));
    conditions.push(inArray(staffAccounts.id, Array.from(new Set([user.id, ...memberRows.map((row) => row.staffId)]))));
  }
  const rows = await db
    .select({ id: staffAccounts.id, fullName: staffAccounts.fullName, role: staffAccounts.role })
    .from(staffAccounts)
    .where(and(...conditions))
    .orderBy(
      sql`case when ${staffAccounts.id} = ${user.id} then 0 else 1 end`,
      asc(staffAccounts.fullName),
    );
  return rows.filter((row) => hasPortalCapability({ role: row.role }, "crm:view"));
}

export async function getCrmTeamOptions() {
  const user = await requireCrmReader();
  const scope = getCrmReadScope(user);
  const teamIds = await getUserTeamIds(user.id);
  if (scope === "own") return [];
  return db
    .select({ id: crmTeams.id, name: crmTeams.name })
    .from(crmTeams)
    .where(and(
      isNull(crmTeams.archivedAt),
      scope === "all" ? undefined : (teamIds.length ? inArray(crmTeams.id, teamIds) : sql`false`),
    ))
    .orderBy(asc(crmTeams.name));
}

export async function getCrmLegacyCustomerOptions(limit = 200) {
  const user = await requireCrmReader();
  if (!hasPortalCapability(user, "customer:view")) return [];
  return db
    .select({
      id: customers.id,
      customerId: customers.customerId,
      companyName: customers.companyName,
      fullName: customers.fullName,
      email: customers.email,
    })
    .from(customers)
    .where(isNull(customers.archivedAt))
    .orderBy(asc(customers.companyName), asc(customers.fullName))
    .limit(Math.min(500, Math.max(1, limit)));
}

export async function getCrmContacts(options: {
  id?: number;
  search?: string;
  companyId?: number;
  includeArchived?: boolean;
  limit?: number;
} = {}) {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const includeArchived = Boolean(options.includeArchived && canRestoreCrm(user));
  const conditions: SQL[] = [
    scopedCondition(user, teamIds, crmContacts.ownerId, crmContacts.ownerTeamId, "read"),
    activeFilter(includeArchived, crmContacts.archivedAt),
  ];
  if (options.id) conditions.push(eq(crmContacts.id, options.id));
  if (options.companyId) conditions.push(eq(crmContacts.companyId, options.companyId));
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(crmContacts.fullName, pattern),
      ilike(crmContacts.email, pattern),
      ilike(crmContacts.phone, pattern),
      ilike(crmContacts.whatsapp, pattern),
      ilike(crmCompanies.legalName, pattern),
    )!);
  }
  const rows: CrmContactListItem[] = await db.select({
    id: crmContacts.id,
    companyId: crmContacts.companyId,
    companyName: crmCompanies.legalName,
    fullName: crmContacts.fullName,
    jobTitle: crmContacts.jobTitle,
    email: crmContacts.email,
    phone: crmContacts.phone,
    whatsapp: crmContacts.whatsapp,
    isPrimary: crmContacts.isPrimary,
    notes: crmContacts.notes,
    ownerId: crmContacts.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmContacts.ownerTeamId,
    ownerTeamName: crmTeams.name,
    archivedAt: crmContacts.archivedAt,
    archiveReason: crmContacts.archiveReason,
    createdAt: crmContacts.createdAt,
    updatedAt: crmContacts.updatedAt,
  }).from(crmContacts)
    .innerJoin(staffAccounts, eq(crmContacts.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmContacts.ownerTeamId, crmTeams.id))
    .leftJoin(crmCompanies, eq(crmContacts.companyId, crmCompanies.id))
    .where(and(...conditions))
    .orderBy(desc(crmContacts.isPrimary), asc(crmContacts.fullName))
    .limit(Math.min(200, Math.max(1, options.limit ?? 100)));
  return { rows, scope: getCrmReadScope(user) };
}

export async function getCrmContact(id: number): Promise<CrmContactListItem | null> {
  const result = await getCrmContacts({ id, includeArchived: true, limit: 1 });
  return result.rows[0] ?? null;
}

export async function getCrmContactOptions(companyId?: number) {
  const result = await getCrmContacts({ companyId, limit: 200 });
  return result.rows.map((contact) => ({
    id: contact.id,
    companyId: contact.companyId,
    companyName: contact.companyName,
    fullName: contact.fullName,
    email: contact.email,
  }));
}

export async function getCrmCompanies(options: {
  search?: string;
  role?: string;
  includeArchived?: boolean;
  limit?: number;
} = {}) {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const includeArchived = Boolean(options.includeArchived && canRestoreCrm(user));
  const limit = Math.min(200, Math.max(1, options.limit ?? 100));
  const conditions: SQL[] = [
    scopedCondition(user, teamIds, crmCompanies.ownerId, crmCompanies.ownerTeamId, "read"),
    activeFilter(includeArchived, crmCompanies.archivedAt),
  ];
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    const searchConditions: SQL[] = [
      ilike(crmCompanies.legalName, pattern),
      ilike(crmCompanies.displayName, pattern),
      ilike(crmCompanies.email, pattern),
      ilike(crmCompanies.phone, pattern),
    ];
    if (canViewCrmCompliance(user)) {
      searchConditions.push(ilike(crmCompanies.nib, pattern), ilike(crmCompanies.taxId, pattern));
    }
    conditions.push(or(...searchConditions)!);
  }
  if (options.role) {
    conditions.push(sql`exists (
      select 1 from crm_company_roles role_filter
      where role_filter.company_id = ${crmCompanies.id}
        and role_filter.role = ${options.role}
        and role_filter.archived_at is null
    )`);
  }
  const rows: CrmCompanyListItem[] = await db
    .select({
      id: crmCompanies.id,
      legalName: crmCompanies.legalName,
      displayName: crmCompanies.displayName,
      email: crmCompanies.email,
      phone: crmCompanies.phone,
      city: crmCompanies.city,
      countryCode: crmCompanies.countryCode,
      ownerId: crmCompanies.ownerId,
      ownerName: staffAccounts.fullName,
      ownerTeamId: crmCompanies.ownerTeamId,
      ownerTeamName: crmTeams.name,
      legacyCustomerId: crmCompanies.legacyCustomerId,
      archivedAt: crmCompanies.archivedAt,
      updatedAt: crmCompanies.updatedAt,
    })
    .from(crmCompanies)
    .innerJoin(staffAccounts, eq(crmCompanies.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmCompanies.ownerTeamId, crmTeams.id))
    .where(and(...conditions))
    .orderBy(desc(crmCompanies.updatedAt))
    .limit(limit);
  return { rows, scope: getCrmReadScope(user) };
}

export async function getCrmCompany(id: number): Promise<CrmCompanyDetail | null> {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const [company] = await db
    .select({
      id: crmCompanies.id,
      legalName: crmCompanies.legalName,
      displayName: crmCompanies.displayName,
      normalizedName: crmCompanies.normalizedName,
      email: crmCompanies.email,
      phone: crmCompanies.phone,
      website: crmCompanies.website,
      taxId: crmCompanies.taxId,
      nib: crmCompanies.nib,
      industry: crmCompanies.industry,
      addressLine1: crmCompanies.addressLine1,
      addressLine2: crmCompanies.addressLine2,
      city: crmCompanies.city,
      province: crmCompanies.province,
      postalCode: crmCompanies.postalCode,
      countryCode: crmCompanies.countryCode,
      complianceNotes: crmCompanies.complianceNotes,
      notes: crmCompanies.notes,
      ownerId: crmCompanies.ownerId,
      ownerName: staffAccounts.fullName,
      ownerTeamId: crmCompanies.ownerTeamId,
      ownerTeamName: crmTeams.name,
      legacyCustomerId: crmCompanies.legacyCustomerId,
      archivedAt: crmCompanies.archivedAt,
      archiveReason: crmCompanies.archiveReason,
      createdAt: crmCompanies.createdAt,
      updatedAt: crmCompanies.updatedAt,
    })
    .from(crmCompanies)
    .innerJoin(staffAccounts, eq(crmCompanies.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmCompanies.ownerTeamId, crmTeams.id))
    .where(and(
      eq(crmCompanies.id, id),
      scopedCondition(user, teamIds, crmCompanies.ownerId, crmCompanies.ownerTeamId, "read"),
      canRestoreCrm(user) ? undefined : isNull(crmCompanies.archivedAt),
    ))
    .limit(1);
  if (!company) return null;
  const [roleRows, contactRows] = await Promise.all([
    db.select({ role: crmCompanyRoles.role }).from(crmCompanyRoles)
      .where(and(eq(crmCompanyRoles.companyId, id), isNull(crmCompanyRoles.archivedAt)))
      .orderBy(asc(crmCompanyRoles.role)),
    db.select({
      id: crmContacts.id,
      fullName: crmContacts.fullName,
      jobTitle: crmContacts.jobTitle,
      email: crmContacts.email,
      phone: crmContacts.phone,
      whatsapp: crmContacts.whatsapp,
      isPrimary: crmContacts.isPrimary,
      notes: crmContacts.notes,
    }).from(crmContacts)
      .where(and(eq(crmContacts.companyId, id), isNull(crmContacts.archivedAt)))
      .orderBy(desc(crmContacts.isPrimary), asc(crmContacts.fullName)),
  ]);
  return {
    ...company,
    taxId: canViewCrmCompliance(user) ? company.taxId : null,
    nib: canViewCrmCompliance(user) ? company.nib : null,
    complianceNotes: canViewCrmCompliance(user) ? company.complianceNotes : null,
    roles: roleRows.map((row) => row.role),
    contacts: contactRows,
  };
}

export async function getCrmLeads(options: {
  search?: string;
  status?: string;
  ownerId?: number;
  companyId?: number;
  contactId?: number;
  includeArchived?: boolean;
  limit?: number;
} = {}) {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const includeArchived = Boolean(options.includeArchived && canRestoreCrm(user));
  const conditions: SQL[] = [
    scopedCondition(user, teamIds, crmLeads.ownerId, crmLeads.ownerTeamId, "read"),
    activeFilter(includeArchived, crmLeads.archivedAt),
  ];
  if (options.status) conditions.push(eq(crmLeads.status, options.status));
  if (options.ownerId) conditions.push(eq(crmLeads.ownerId, options.ownerId));
  if (options.companyId) conditions.push(eq(crmLeads.companyId, options.companyId));
  if (options.contactId) conditions.push(eq(crmLeads.contactId, options.contactId));
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(crmLeads.title, pattern),
      ilike(crmLeads.origin, pattern),
      ilike(crmLeads.destination, pattern),
      ilike(crmLeads.commodity, pattern),
      ilike(crmCompanies.legalName, pattern),
      ilike(crmContacts.fullName, pattern),
    )!);
  }
  const rows: CrmLeadListItem[] = await db.select({
    id: crmLeads.id,
    title: crmLeads.title,
    source: crmLeads.source,
    status: crmLeads.status,
    priority: crmLeads.priority,
    companyId: crmLeads.companyId,
    companyName: crmCompanies.legalName,
    contactId: crmLeads.contactId,
    contactName: crmContacts.fullName,
    freightType: crmLeads.freightType,
    origin: crmLeads.origin,
    destination: crmLeads.destination,
    ownerId: crmLeads.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmLeads.ownerTeamId,
    ownerTeamName: crmTeams.name,
    nextAction: crmLeads.nextAction,
    actionDueAt: crmLeads.actionDueAt,
    sourceQuoteRequestId: crmLeads.sourceQuoteRequestId,
    archivedAt: crmLeads.archivedAt,
    createdAt: crmLeads.createdAt,
    updatedAt: crmLeads.updatedAt,
  }).from(crmLeads)
    .innerJoin(staffAccounts, eq(crmLeads.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmLeads.ownerTeamId, crmTeams.id))
    .leftJoin(crmCompanies, eq(crmLeads.companyId, crmCompanies.id))
    .leftJoin(crmContacts, eq(crmLeads.contactId, crmContacts.id))
    .where(and(...conditions))
    .orderBy(sql`case ${crmLeads.priority} when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end`, asc(crmLeads.actionDueAt), desc(crmLeads.updatedAt))
    .limit(Math.min(200, Math.max(1, options.limit ?? 100)));
  return { rows, scope: getCrmReadScope(user) };
}

export async function getCrmLead(id: number): Promise<CrmLeadDetail | null> {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const [row] = await db.select({
    id: crmLeads.id,
    title: crmLeads.title,
    source: crmLeads.source,
    status: crmLeads.status,
    priority: crmLeads.priority,
    companyId: crmLeads.companyId,
    companyName: crmCompanies.legalName,
    contactId: crmLeads.contactId,
    contactName: crmContacts.fullName,
    freightType: crmLeads.freightType,
    origin: crmLeads.origin,
    destination: crmLeads.destination,
    readyDate: crmLeads.readyDate,
    cargoDescription: crmLeads.cargoDescription,
    commodity: crmLeads.commodity,
    incoterm: crmLeads.incoterm,
    numPackages: crmLeads.numPackages,
    weightKg: crmLeads.weightKg,
    volumeCbm: crmLeads.volumeCbm,
    notes: crmLeads.notes,
    ownerId: crmLeads.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmLeads.ownerTeamId,
    ownerTeamName: crmTeams.name,
    nextAction: crmLeads.nextAction,
    actionDueAt: crmLeads.actionDueAt,
    sourceQuoteRequestId: crmLeads.sourceQuoteRequestId,
    qualifiedAt: crmLeads.qualifiedAt,
    disqualifiedAt: crmLeads.disqualifiedAt,
    disqualificationReason: crmLeads.disqualificationReason,
    archivedAt: crmLeads.archivedAt,
    archiveReason: crmLeads.archiveReason,
    createdAt: crmLeads.createdAt,
    updatedAt: crmLeads.updatedAt,
  }).from(crmLeads)
    .innerJoin(staffAccounts, eq(crmLeads.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmLeads.ownerTeamId, crmTeams.id))
    .leftJoin(crmCompanies, eq(crmLeads.companyId, crmCompanies.id))
    .leftJoin(crmContacts, eq(crmLeads.contactId, crmContacts.id))
    .where(and(
      eq(crmLeads.id, id),
      scopedCondition(user, teamIds, crmLeads.ownerId, crmLeads.ownerTeamId, "read"),
      canRestoreCrm(user) ? undefined : isNull(crmLeads.archivedAt),
    )).limit(1);
  return row ?? null;
}

export async function getCrmOpportunities(options: {
  search?: string;
  status?: string;
  stage?: string;
  companyId?: number;
  contactId?: number;
  includeArchived?: boolean;
  limit?: number;
} = {}) {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const includeArchived = Boolean(options.includeArchived && canRestoreCrm(user));
  const conditions: SQL[] = [
    scopedCondition(user, teamIds, crmOpportunities.ownerId, crmOpportunities.ownerTeamId, "read"),
    activeFilter(includeArchived, crmOpportunities.archivedAt),
  ];
  if (options.status) conditions.push(eq(crmOpportunities.status, options.status));
  if (options.stage) conditions.push(eq(crmOpportunities.stage, options.stage));
  if (options.companyId) conditions.push(eq(crmOpportunities.companyId, options.companyId));
  if (options.contactId) conditions.push(eq(crmOpportunities.primaryContactId, options.contactId));
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(crmOpportunities.title, pattern),
      ilike(crmOpportunities.origin, pattern),
      ilike(crmOpportunities.destination, pattern),
      ilike(crmOpportunities.externalQuotationReference, pattern),
      ilike(crmCompanies.legalName, pattern),
    )!);
  }
  const rows: CrmOpportunityListItem[] = await db.select({
    id: crmOpportunities.id,
    title: crmOpportunities.title,
    status: crmOpportunities.status,
    stage: crmOpportunities.stage,
    probability: crmOpportunities.probability,
    estimatedValue: crmOpportunities.estimatedValue,
    currency: crmOpportunities.currency,
    expectedCloseDate: crmOpportunities.expectedCloseDate,
    companyId: crmOpportunities.companyId,
    companyName: crmCompanies.legalName,
    primaryContactId: crmOpportunities.primaryContactId,
    primaryContactName: crmContacts.fullName,
    ownerId: crmOpportunities.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmOpportunities.ownerTeamId,
    ownerTeamName: crmTeams.name,
    nextAction: crmOpportunities.nextAction,
    actionDueAt: crmOpportunities.actionDueAt,
    externalQuotationReference: crmOpportunities.externalQuotationReference,
    externalQuotationStatus: crmOpportunities.externalQuotationStatus,
    archivedAt: crmOpportunities.archivedAt,
    createdAt: crmOpportunities.createdAt,
    updatedAt: crmOpportunities.updatedAt,
  }).from(crmOpportunities)
    .innerJoin(staffAccounts, eq(crmOpportunities.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmOpportunities.ownerTeamId, crmTeams.id))
    .leftJoin(crmCompanies, eq(crmOpportunities.companyId, crmCompanies.id))
    .leftJoin(crmContacts, eq(crmOpportunities.primaryContactId, crmContacts.id))
    .where(and(...conditions))
    .orderBy(sql`case ${crmOpportunities.status} when 'open' then 0 when 'on_hold' then 1 else 2 end`, asc(crmOpportunities.expectedCloseDate), desc(crmOpportunities.updatedAt))
    .limit(Math.min(200, Math.max(1, options.limit ?? 100)));
  return { rows, scope: getCrmReadScope(user) };
}

export async function getCrmOpportunity(id: number): Promise<CrmOpportunityDetail | null> {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const [row] = await db.select({
    id: crmOpportunities.id,
    leadId: crmOpportunities.leadId,
    title: crmOpportunities.title,
    status: crmOpportunities.status,
    stage: crmOpportunities.stage,
    probability: crmOpportunities.probability,
    estimatedValue: crmOpportunities.estimatedValue,
    currency: crmOpportunities.currency,
    expectedCloseDate: crmOpportunities.expectedCloseDate,
    companyId: crmOpportunities.companyId,
    companyName: crmCompanies.legalName,
    primaryContactId: crmOpportunities.primaryContactId,
    primaryContactName: crmContacts.fullName,
    freightType: crmOpportunities.freightType,
    origin: crmOpportunities.origin,
    destination: crmOpportunities.destination,
    cargoDescription: crmOpportunities.cargoDescription,
    commodity: crmOpportunities.commodity,
    incoterm: crmOpportunities.incoterm,
    weightKg: crmOpportunities.weightKg,
    volumeCbm: crmOpportunities.volumeCbm,
    externalQuotationReference: crmOpportunities.externalQuotationReference,
    externalQuotationUrl: crmOpportunities.externalQuotationUrl,
    externalQuotationStatus: crmOpportunities.externalQuotationStatus,
    notes: crmOpportunities.notes,
    ownerId: crmOpportunities.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmOpportunities.ownerTeamId,
    ownerTeamName: crmTeams.name,
    nextAction: crmOpportunities.nextAction,
    actionDueAt: crmOpportunities.actionDueAt,
    wonAt: crmOpportunities.wonAt,
    lostAt: crmOpportunities.lostAt,
    lostReason: crmOpportunities.lostReason,
    archivedAt: crmOpportunities.archivedAt,
    archiveReason: crmOpportunities.archiveReason,
    createdAt: crmOpportunities.createdAt,
    updatedAt: crmOpportunities.updatedAt,
  }).from(crmOpportunities)
    .innerJoin(staffAccounts, eq(crmOpportunities.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmOpportunities.ownerTeamId, crmTeams.id))
    .leftJoin(crmCompanies, eq(crmOpportunities.companyId, crmCompanies.id))
    .leftJoin(crmContacts, eq(crmOpportunities.primaryContactId, crmContacts.id))
    .where(and(
      eq(crmOpportunities.id, id),
      scopedCondition(user, teamIds, crmOpportunities.ownerId, crmOpportunities.ownerTeamId, "read"),
      canRestoreCrm(user) ? undefined : isNull(crmOpportunities.archivedAt),
    )).limit(1);
  return row ?? null;
}

export async function getCrmActivities(options: {
  entityType?: CrmEntityType;
  entityId?: string;
  limit?: number;
} = {}) {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const linkedRecord = Boolean(options.entityType && options.entityId);
  if (linkedRecord) {
    await assertEntityAccess(user, options.entityType!, options.entityId!, "read");
  }
  const conditions: SQL[] = [
    linkedRecord
      ? sql`true`
      : scopedCondition(user, teamIds, crmActivities.ownerId, crmActivities.ownerTeamId, "read"),
    isNull(crmActivities.archivedAt),
    isNull(crmActivityLinks.archivedAt),
  ];
  if (options.entityType) conditions.push(eq(crmActivityLinks.entityType, options.entityType));
  if (options.entityId) conditions.push(eq(crmActivityLinks.entityId, options.entityId));
  const limit = Math.min(200, Math.max(1, options.limit ?? 100));
  const candidateRows: CrmActivityListItem[] = await db.select({
    id: crmActivities.id,
    activityType: crmActivities.activityType,
    subject: crmActivities.subject,
    details: crmActivities.details,
    occurredAt: crmActivities.occurredAt,
    ownerId: crmActivities.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmActivities.ownerTeamId,
    ownerTeamName: crmTeams.name,
    entityType: crmActivityLinks.entityType,
    entityId: crmActivityLinks.entityId,
    createdAt: crmActivities.createdAt,
  }).from(crmActivities)
    .innerJoin(staffAccounts, eq(crmActivities.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmActivities.ownerTeamId, crmTeams.id))
    .leftJoin(crmActivityLinks, eq(crmActivities.id, crmActivityLinks.activityId))
    .where(and(...conditions))
    .orderBy(desc(crmActivities.occurredAt))
    .limit(Math.min(400, limit * 3));
  const access = linkedRecord ? candidateRows.map(() => true) : await Promise.all(candidateRows.map(async (row) => {
    if (!row.entityType || !row.entityId) return false;
    try {
      await assertEntityAccess(user, row.entityType as CrmEntityType, row.entityId, "read");
      return true;
    } catch {
      return false;
    }
  }));
  const rows = candidateRows.filter((_row, index) => access[index]).slice(0, limit);
  return { rows, scope: getCrmReadScope(user) };
}

export async function getCrmTasks(options: {
  id?: number;
  status?: string;
  ownerId?: number;
  entityType?: CrmEntityType;
  entityId?: string;
  limit?: number;
} = {}) {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const linkedRecord = Boolean(options.entityType && options.entityId);
  if (linkedRecord) {
    await assertEntityAccess(user, options.entityType!, options.entityId!, "read");
  }
  const conditions: SQL[] = [
    linkedRecord
      ? sql`true`
      : scopedCondition(user, teamIds, crmTasks.ownerId, crmTasks.ownerTeamId, "read"),
    isNull(crmTasks.archivedAt),
  ];
  if (options.id) conditions.push(eq(crmTasks.id, options.id));
  if (options.status) conditions.push(eq(crmTasks.status, options.status));
  if (options.ownerId) conditions.push(eq(crmTasks.ownerId, options.ownerId));
  if (options.entityType) conditions.push(eq(crmTasks.entityType, options.entityType));
  if (options.entityId) conditions.push(eq(crmTasks.entityId, options.entityId));
  const limit = Math.min(200, Math.max(1, options.limit ?? 100));
  const candidateRows: CrmTaskListItem[] = await db.select({
    id: crmTasks.id,
    subject: crmTasks.subject,
    details: crmTasks.details,
    status: crmTasks.status,
    priority: crmTasks.priority,
    dueAt: crmTasks.dueAt,
    completedAt: crmTasks.completedAt,
    ownerId: crmTasks.ownerId,
    ownerName: staffAccounts.fullName,
    ownerTeamId: crmTasks.ownerTeamId,
    ownerTeamName: crmTeams.name,
    entityType: crmTasks.entityType,
    entityId: crmTasks.entityId,
    createdAt: crmTasks.createdAt,
    updatedAt: crmTasks.updatedAt,
  }).from(crmTasks)
    .innerJoin(staffAccounts, eq(crmTasks.ownerId, staffAccounts.id))
    .leftJoin(crmTeams, eq(crmTasks.ownerTeamId, crmTeams.id))
    .where(and(...conditions))
    .orderBy(sql`case ${crmTasks.priority} when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end`, asc(crmTasks.dueAt), desc(crmTasks.updatedAt))
    .limit(Math.min(400, limit * 3));
  const access = linkedRecord ? candidateRows.map(() => true) : await Promise.all(candidateRows.map(async (row) => {
    if (!row.entityType || !row.entityId) return true;
    try {
      await assertEntityAccess(user, row.entityType as CrmEntityType, row.entityId, "read");
      return true;
    } catch {
      return false;
    }
  }));
  const rows = candidateRows.filter((_row, index) => access[index]).slice(0, limit);
  return { rows, scope: getCrmReadScope(user) };
}

export async function getCrmTask(id: number): Promise<CrmTaskListItem | null> {
  const user = await requireCrmReader();
  const [taskLink] = await db.select({
    ownerId: crmTasks.ownerId,
    ownerTeamId: crmTasks.ownerTeamId,
    entityType: crmTasks.entityType,
    entityId: crmTasks.entityId,
    archivedAt: crmTasks.archivedAt,
  }).from(crmTasks).where(eq(crmTasks.id, id)).limit(1);
  if (!taskLink || taskLink.archivedAt) return null;
  if (taskLink.entityType && taskLink.entityId) {
    await assertEntityAccess(user, taskLink.entityType as CrmEntityType, taskLink.entityId, "read");
  } else {
    await assertOwnedAccess(user, taskLink, "read");
  }
  const result = await getCrmTasks({
    id,
    entityType: taskLink.entityType as CrmEntityType | undefined,
    entityId: taskLink.entityId ?? undefined,
    limit: 1,
  });
  return result.rows[0] ?? null;
}

export async function getCrmDashboard() {
  const user = await requireCrmReader();
  const teamIds = await getUserTeamIds(user.id);
  const leadScope = scopedCondition(user, teamIds, crmLeads.ownerId, crmLeads.ownerTeamId, "read");
  const opportunityScope = scopedCondition(user, teamIds, crmOpportunities.ownerId, crmOpportunities.ownerTeamId, "read");
  const taskScope = scopedCondition(user, teamIds, crmTasks.ownerId, crmTasks.ownerTeamId, "read");
  const openTask = inArray(crmTasks.status, ["open", "in_progress"]);
  const [leadCount, opportunityCount, overdueCount, dueTodayCount, recentLeads, recentOpportunities, overdueTasks] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(crmLeads).where(and(leadScope, isNull(crmLeads.archivedAt), inArray(crmLeads.status, ["new", "contacted", "awaiting_information", "qualified"]))),
    db.select({ count: sql<number>`count(*)::int` }).from(crmOpportunities).where(and(opportunityScope, isNull(crmOpportunities.archivedAt), eq(crmOpportunities.status, "open"))),
    db.select({ count: sql<number>`count(*)::int` }).from(crmTasks).where(and(taskScope, isNull(crmTasks.archivedAt), openTask, lt(crmTasks.dueAt, new Date()))),
    db.select({ count: sql<number>`count(*)::int` }).from(crmTasks).where(and(taskScope, isNull(crmTasks.archivedAt), openTask, sql`(${crmTasks.dueAt} at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date`)),
    getCrmLeads({ limit: 5 }),
    getCrmOpportunities({ status: "open", limit: 5 }),
    getCrmTasks({ limit: 5 }),
  ]);
  return {
    scope: getCrmReadScope(user),
    metrics: {
      activeLeads: leadCount[0]?.count ?? 0,
      openOpportunities: opportunityCount[0]?.count ?? 0,
      overdueTasks: overdueCount[0]?.count ?? 0,
      dueToday: dueTodayCount[0]?.count ?? 0,
    },
    recentLeads: recentLeads.rows,
    recentOpportunities: recentOpportunities.rows,
    overdueTasks: overdueTasks.rows.filter((task) => task.dueAt && task.dueAt < new Date() && ["open", "in_progress"].includes(task.status)),
  };
}

async function findCompanyOwnedRow(id: number) {
  const [row] = await db.select({
    ownerId: crmCompanies.ownerId,
    ownerTeamId: crmCompanies.ownerTeamId,
    archivedAt: crmCompanies.archivedAt,
    legacyCustomerId: crmCompanies.legacyCustomerId,
    taxId: crmCompanies.taxId,
    nib: crmCompanies.nib,
    complianceNotes: crmCompanies.complianceNotes,
  }).from(crmCompanies).where(eq(crmCompanies.id, id)).limit(1);
  return row;
}

async function findContactOwnedRow(id: number) {
  const [row] = await db.select({
    ownerId: crmContacts.ownerId,
    ownerTeamId: crmContacts.ownerTeamId,
    companyId: crmContacts.companyId,
    archivedAt: crmContacts.archivedAt,
  }).from(crmContacts).where(eq(crmContacts.id, id)).limit(1);
  return row;
}

async function findLeadOwnedRow(id: number) {
  const [row] = await db.select({ ownerId: crmLeads.ownerId, ownerTeamId: crmLeads.ownerTeamId, archivedAt: crmLeads.archivedAt }).from(crmLeads).where(eq(crmLeads.id, id)).limit(1);
  return row;
}

async function findOpportunityOwnedRow(id: number) {
  const [row] = await db.select({ ownerId: crmOpportunities.ownerId, ownerTeamId: crmOpportunities.ownerTeamId, archivedAt: crmOpportunities.archivedAt }).from(crmOpportunities).where(eq(crmOpportunities.id, id)).limit(1);
  return row;
}

async function assertEntityAccess(user: PortalUser, entityType: CrmEntityType, entityId: string, mode: ScopeMode) {
  const numericId = Number.parseInt(entityId, 10);
  if (!Number.isInteger(numericId) || numericId <= 0) throw new Error("Linked CRM record is invalid.");
  if (["company", "contact", "lead", "opportunity"].includes(entityType)) {
    const record = entityType === "company"
      ? await findCompanyOwnedRow(numericId)
      : entityType === "contact"
        ? await findContactOwnedRow(numericId)
        : entityType === "lead"
          ? await findLeadOwnedRow(numericId)
          : await findOpportunityOwnedRow(numericId);
    await assertOwnedAccess(user, record, mode);
    if (record?.archivedAt) throw new Error("Restore the linked CRM record before adding activity or tasks.");
    return;
  }
  if (entityType === "quote_request") {
    if (!hasPortalCapability(user, "quote:view")) throw new Error("Quote request access is required.");
    const [row] = await db.select({ id: quoteRequests.id }).from(quoteRequests).where(eq(quoteRequests.id, numericId)).limit(1);
    if (!row) throw new Error("Quote request was not found.");
    return;
  }
  if (!hasPortalCapability(user, "shipment:view")) throw new Error("Shipment access is required.");
}

async function assertNoCompanyDuplicate(input: CrmCompanyInput, currentId?: number) {
  if (input.legacyCustomerId !== null) {
    const [linked] = await db.select({ id: crmCompanies.id })
      .from(crmCompanies)
      .where(and(
        eq(crmCompanies.legacyCustomerId, input.legacyCustomerId),
        currentId ? ne(crmCompanies.id, currentId) : undefined,
      ))
      .limit(1);
    if (linked) throw new Error("This legacy customer is already linked to another CRM company.");
  }
  const duplicateSignals: SQL[] = [and(
    eq(crmCompanies.normalizedName, normalizeCrmCompanyName(input.legalName)),
    eq(crmCompanies.countryCode, input.countryCode),
  )!];
  if (input.email) duplicateSignals.push(sql`lower(btrim(${crmCompanies.email})) = ${input.email.trim().toLowerCase()}`);
  if (input.taxId) duplicateSignals.push(and(
    eq(crmCompanies.countryCode, input.countryCode),
    sql`lower(btrim(${crmCompanies.taxId})) = ${input.taxId.trim().toLowerCase()}`,
  )!);
  if (input.nib) duplicateSignals.push(and(
    eq(crmCompanies.countryCode, input.countryCode),
    sql`lower(btrim(${crmCompanies.nib})) = ${input.nib.trim().toLowerCase()}`,
  )!);
  const [duplicate] = await db
    .select({ id: crmCompanies.id })
    .from(crmCompanies)
    .where(and(
      isNull(crmCompanies.archivedAt),
      currentId ? ne(crmCompanies.id, currentId) : undefined,
      or(...duplicateSignals),
    ))
    .limit(1);
  if (duplicate) {
    throw new Error("A matching active company already exists. Review or merge that record before continuing.");
  }
}

async function assertNoContactDuplicate(input: CrmContactInput, currentId?: number) {
  if (input.companyId === null) return;
  const duplicateSignals: SQL[] = [];
  if (input.email) duplicateSignals.push(sql`lower(btrim(${crmContacts.email})) = ${input.email.trim().toLowerCase()}`);
  if (input.phone) duplicateSignals.push(sql`btrim(${crmContacts.phone}) = ${input.phone.trim()}`);
  if (input.whatsapp) duplicateSignals.push(sql`btrim(${crmContacts.whatsapp}) = ${input.whatsapp.trim()}`);
  if (!duplicateSignals.length) return;
  const [duplicate] = await db
    .select({ id: crmContacts.id })
    .from(crmContacts)
    .where(and(
      eq(crmContacts.companyId, input.companyId),
      currentId ? ne(crmContacts.id, currentId) : undefined,
      or(...duplicateSignals),
      isNull(crmContacts.archivedAt),
    ))
    .limit(1);
  if (duplicate) {
    throw new Error("A contact with the same email, phone, or WhatsApp already exists at the selected company.");
  }
}

async function assertLeadRelationships(user: PortalUser, input: CrmLeadInput) {
  if (input.companyId !== null) {
    await assertOwnedAccess(user, await findCompanyOwnedRow(input.companyId), "read");
  }
  if (input.contactId === null) return;
  const [contact] = await db.select({
    ownerId: crmContacts.ownerId,
    ownerTeamId: crmContacts.ownerTeamId,
    companyId: crmContacts.companyId,
  }).from(crmContacts).where(and(eq(crmContacts.id, input.contactId), isNull(crmContacts.archivedAt))).limit(1);
  await assertOwnedAccess(user, contact, "read");
  if ((contact?.companyId ?? null) !== input.companyId) {
    throw new Error("The selected contact must belong to the selected company.");
  }
}

async function assertOpportunityRelationships(user: PortalUser, input: CrmOpportunityInput, leadMode: ScopeMode) {
  let leadCompanyId: number | null = null;
  if (input.leadId !== null) {
    const [lead] = await db.select({
      ownerId: crmLeads.ownerId,
      ownerTeamId: crmLeads.ownerTeamId,
      companyId: crmLeads.companyId,
      status: crmLeads.status,
    }).from(crmLeads).where(and(eq(crmLeads.id, input.leadId), isNull(crmLeads.archivedAt))).limit(1);
    await assertOwnedAccess(user, lead, leadMode);
    if (leadMode === "write" && lead?.status !== "qualified") {
      throw new Error("Only a qualified lead can be converted into an opportunity.");
    }
    leadCompanyId = lead?.companyId ?? null;
  }
  if (input.companyId !== null) {
    await assertOwnedAccess(user, await findCompanyOwnedRow(input.companyId), "read");
  }
  if (input.leadId !== null && leadCompanyId !== input.companyId) {
    throw new Error("The selected opportunity company must match the source lead company.");
  }
  if (input.primaryContactId !== null) {
    const [contact] = await db.select({
      ownerId: crmContacts.ownerId,
      ownerTeamId: crmContacts.ownerTeamId,
      companyId: crmContacts.companyId,
    }).from(crmContacts).where(and(eq(crmContacts.id, input.primaryContactId), isNull(crmContacts.archivedAt))).limit(1);
    await assertOwnedAccess(user, contact, "read");
    if ((contact?.companyId ?? null) !== input.companyId) {
      throw new Error("The primary contact must belong to the selected opportunity company.");
    }
  }
}

export async function createCrmCompany(input: CrmCompanyInput) {
  const user = await requireCrmWriter();
  await assertNoCompanyDuplicate(input);
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId);
  if (input.legacyCustomerId !== null) {
    const [legacy] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, input.legacyCustomerId)).limit(1);
    if (!legacy) throw new Error("Legacy customer was not found.");
  }
  const id = await allocateCrmId("crm_companies");
  const now = new Date();
  const { roles, ...companyValues } = input;
  const safeCompanyValues = canViewCrmCompliance(user)
    ? companyValues
    : { ...companyValues, taxId: null, nib: null, complianceNotes: null };
  const queries: BatchItem<"pg">[] = [
    db.insert(crmCompanies).values({
      ...safeCompanyValues,
      ...assignment,
      id,
      normalizedName: normalizeCrmCompanyName(input.legalName),
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(crmCompanyRoles).values(roles.map((role) => ({ companyId: id, role, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.company.created", "crm_company", id, { roles })),
  ];
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function updateCrmCompany(id: number, input: CrmCompanyInput) {
  const user = await requireCrmWriter();
  const current = await findCompanyOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the company before updating it.");
  await assertNoCompanyDuplicate(input, id);
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId, current);
  const now = new Date();
  const { roles, ...companyValues } = input;
  if (input.legacyCustomerId !== null) {
    const [legacy] = await db.select({ id: customers.id }).from(customers).where(and(
      eq(customers.id, input.legacyCustomerId),
      isNull(customers.archivedAt),
    )).limit(1);
    if (!legacy) throw new Error("Legacy customer was not found.");
  }
  const safeCompanyValues = canViewCrmCompliance(user)
    ? companyValues
    : {
        ...companyValues,
        taxId: current?.taxId ?? null,
        nib: current?.nib ?? null,
        complianceNotes: current?.complianceNotes ?? null,
      };
  const queries: BatchItem<"pg">[] = [
    db.update(crmCompanies).set({
      ...safeCompanyValues,
      ...assignment,
      normalizedName: normalizeCrmCompanyName(input.legalName),
      updatedBy: user.id,
      updatedAt: now,
    }).where(and(eq(crmCompanies.id, id), isNull(crmCompanies.archivedAt))),
    db.update(crmCompanyRoles).set({ archivedAt: now, archivedBy: user.id, archiveReason: "Company roles replaced", updatedBy: user.id, updatedAt: now })
      .where(and(eq(crmCompanyRoles.companyId, id), isNull(crmCompanyRoles.archivedAt))),
    db.insert(crmCompanyRoles).values(roles.map((role) => ({ companyId: id, role, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.company.updated", "crm_company", id, { roles })),
  ];
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function archiveCrmCompany(id: number, reason: string) {
  const user = await requireCrmWriter();
  if (!canArchiveCrm(user)) throw new Error("CRM archive access is required.");
  const current = await findCompanyOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Company is already archived.");
  if (!reason.trim()) throw new Error("Archive reason is required.");
  const now = new Date();
  await db.batch([
    db.update(crmCompanies).set({ archivedAt: now, archivedBy: user.id, archiveReason: reason.trim(), updatedBy: user.id, updatedAt: now }).where(and(eq(crmCompanies.id, id), isNull(crmCompanies.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.company.archived", "crm_company", id, undefined, reason)),
  ]);
}

export async function restoreCrmCompany(id: number) {
  const user = await requireCrmWriter();
  if (!canRestoreCrm(user)) throw new Error("CRM restore access is required.");
  const current = await findCompanyOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (!current?.archivedAt) throw new Error("Company is not archived.");
  const now = new Date();
  await db.batch([
    db.update(crmCompanies).set({ archivedAt: null, archivedBy: null, archiveReason: null, updatedBy: user.id, updatedAt: now }).where(eq(crmCompanies.id, id)),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.company.restored", "crm_company", id)),
  ]);
}

export async function createCrmContact(input: CrmContactInput) {
  const user = await requireCrmWriter();
  if (input.companyId !== null) await assertOwnedAccess(user, await findCompanyOwnedRow(input.companyId), "write");
  await assertNoContactDuplicate(input);
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId);
  const id = await allocateCrmId("crm_contacts");
  const now = new Date();
  const queries: BatchItem<"pg">[] = [];
  if (input.isPrimary && input.companyId !== null) {
    queries.push(db.update(crmContacts).set({ isPrimary: false, updatedBy: user.id, updatedAt: now }).where(and(
      eq(crmContacts.companyId, input.companyId),
      eq(crmContacts.isPrimary, true),
      isNull(crmContacts.archivedAt),
    )));
  }
  queries.push(
    db.insert(crmContacts).values({ ...input, ...assignment, id, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.contact.created", "crm_contact", id, { companyId: input.companyId })),
  );
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function updateCrmContact(id: number, input: CrmContactInput) {
  const user = await requireCrmWriter();
  const current = await findContactOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the contact before updating it.");
  if (input.companyId !== null) {
    await assertOwnedAccess(user, await findCompanyOwnedRow(input.companyId), "write");
  }
  if (input.companyId !== current?.companyId) {
    const [linkedLead, linkedOpportunity] = await Promise.all([
      db.select({ id: crmLeads.id }).from(crmLeads).where(and(eq(crmLeads.contactId, id), isNull(crmLeads.archivedAt))).limit(1),
      db.select({ id: crmOpportunities.id }).from(crmOpportunities).where(and(eq(crmOpportunities.primaryContactId, id), isNull(crmOpportunities.archivedAt))).limit(1),
    ]);
    if (linkedLead[0] || linkedOpportunity[0]) {
      throw new Error("A contact linked to an active Lead or Opportunity cannot move to another company.");
    }
  }
  await assertNoContactDuplicate(input, id);
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId, current);
  const now = new Date();
  const queries: BatchItem<"pg">[] = [];
  if (input.isPrimary && input.companyId !== null) {
    queries.push(db.update(crmContacts).set({ isPrimary: false, updatedBy: user.id, updatedAt: now }).where(and(
      eq(crmContacts.companyId, input.companyId),
      ne(crmContacts.id, id),
      eq(crmContacts.isPrimary, true),
      isNull(crmContacts.archivedAt),
    )));
  }
  queries.push(
    db.update(crmContacts).set({ ...input, ...assignment, updatedBy: user.id, updatedAt: now }).where(and(eq(crmContacts.id, id), isNull(crmContacts.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.contact.updated", "crm_contact", id, { companyId: input.companyId })),
  );
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function archiveCrmContact(id: number, reason: string) {
  const user = await requireCrmWriter();
  if (!canArchiveCrm(user)) throw new Error("CRM archive access is required.");
  const current = await findContactOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Contact is already archived.");
  if (!reason.trim()) throw new Error("Archive reason is required.");
  const now = new Date();
  await db.batch([
    db.update(crmContacts).set({ archivedAt: now, archivedBy: user.id, archiveReason: reason.trim(), updatedBy: user.id, updatedAt: now }).where(and(eq(crmContacts.id, id), isNull(crmContacts.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.contact.archived", "crm_contact", id, undefined, reason)),
  ]);
}

export async function restoreCrmContact(id: number) {
  const user = await requireCrmWriter();
  if (!canRestoreCrm(user)) throw new Error("CRM restore access is required.");
  const [current] = await db.select().from(crmContacts).where(eq(crmContacts.id, id)).limit(1);
  await assertOwnedAccess(user, current, "write");
  if (!current?.archivedAt) throw new Error("Contact is not archived.");
  await assertNoContactDuplicate({
    companyId: current.companyId,
    fullName: current.fullName,
    jobTitle: current.jobTitle,
    email: current.email,
    phone: current.phone,
    whatsapp: current.whatsapp,
    isPrimary: false,
    notes: current.notes,
    ownerId: current.ownerId,
    ownerTeamId: current.ownerTeamId,
  }, id);
  const now = new Date();
  await db.batch([
    db.update(crmContacts).set({ isPrimary: false, archivedAt: null, archivedBy: null, archiveReason: null, updatedBy: user.id, updatedAt: now }).where(eq(crmContacts.id, id)),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.contact.restored", "crm_contact", id)),
  ]);
}

export async function createCrmLead(input: CrmLeadInput) {
  const user = await requireCrmWriter();
  if (input.status === "converted") throw new Error("Lead conversion is created only through a qualified Opportunity.");
  await assertLeadRelationships(user, input);
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId);
  const id = await allocateCrmId("crm_leads");
  const now = new Date();
  await db.batch([
    db.insert(crmLeads).values({
      ...input,
      ...assignment,
      id,
      qualifiedAt: input.status === "qualified" ? now : null,
      disqualifiedAt: input.status === "disqualified" ? now : null,
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.lead.created", "crm_lead", id, { source: input.source, status: input.status })),
  ]);
  return { id };
}

export async function updateCrmLead(id: number, input: CrmLeadInput) {
  const user = await requireCrmWriter();
  const [current] = await db.select({
    ownerId: crmLeads.ownerId,
    ownerTeamId: crmLeads.ownerTeamId,
    status: crmLeads.status,
    qualifiedAt: crmLeads.qualifiedAt,
    disqualifiedAt: crmLeads.disqualifiedAt,
    archivedAt: crmLeads.archivedAt,
  }).from(crmLeads).where(eq(crmLeads.id, id)).limit(1);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the lead before updating it.");
  if (input.status === "converted" && current?.status !== "converted") {
    throw new Error("Lead conversion is created only through a qualified Opportunity.");
  }
  if (current?.status === "converted" && input.status !== "converted") {
    throw new Error("A converted lead is terminal and cannot be reopened in this release.");
  }
  await assertLeadRelationships(user, input);
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId, current);
  const now = new Date();
  const queries: BatchItem<"pg">[] = [
    db.update(crmLeads).set({
      ...input,
      ...assignment,
      qualifiedAt: input.status === current?.status
        ? current?.qualifiedAt
        : (input.status === "qualified" ? now : null),
      disqualifiedAt: input.status === current?.status
        ? current?.disqualifiedAt
        : (input.status === "disqualified" ? now : null),
      disqualificationReason: input.status === "disqualified" ? input.disqualificationReason : null,
      updatedBy: user.id,
      updatedAt: now,
    }).where(and(eq(crmLeads.id, id), isNull(crmLeads.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.lead.updated", "crm_lead", id, { status: input.status, priority: input.priority })),
  ];
  if (input.status !== current?.status) {
    const activityId = await allocateCrmId("crm_activities");
    queries.push(
      db.insert(crmActivities).values({
        id: activityId,
        activityType: "status_change",
        subject: `Lead status changed from ${current?.status} to ${input.status}`,
        ownerId: user.id,
        ownerTeamId: assignment.ownerTeamId,
        createdBy: user.id,
        updatedBy: user.id,
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(crmActivityLinks).values({ activityId, entityType: "lead", entityId: String(id), createdBy: user.id, createdAt: now }),
    );
  }
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function archiveCrmLead(id: number, reason: string) {
  const user = await requireCrmWriter();
  if (!canArchiveCrm(user)) throw new Error("CRM archive access is required.");
  const current = await findLeadOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Lead is already archived.");
  if (!reason.trim()) throw new Error("Archive reason is required.");
  const now = new Date();
  await db.batch([
    db.update(crmLeads).set({ archivedAt: now, archivedBy: user.id, archiveReason: reason.trim(), updatedBy: user.id, updatedAt: now }).where(and(eq(crmLeads.id, id), isNull(crmLeads.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.lead.archived", "crm_lead", id, undefined, reason)),
  ]);
}

export async function restoreCrmLead(id: number) {
  const user = await requireCrmWriter();
  if (!canRestoreCrm(user)) throw new Error("CRM restore access is required.");
  const current = await findLeadOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (!current?.archivedAt) throw new Error("Lead is not archived.");
  const now = new Date();
  await db.batch([
    db.update(crmLeads).set({ archivedAt: null, archivedBy: null, archiveReason: null, updatedBy: user.id, updatedAt: now }).where(eq(crmLeads.id, id)),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.lead.restored", "crm_lead", id)),
  ]);
}

export async function convertQuoteRequestToCrmLead(quoteRequestId: number) {
  const user = await requireCrmWriter();
  if (!canConvertQuoteRequestToCrmLead(user)) throw new Error("Quote-request conversion access is required.");
  const [existing] = await db.select({ id: crmLeads.id, ownerId: crmLeads.ownerId, ownerTeamId: crmLeads.ownerTeamId }).from(crmLeads).where(eq(crmLeads.sourceQuoteRequestId, quoteRequestId)).limit(1);
  if (existing) {
    await assertOwnedAccess(user, existing, "read");
    return { id: existing.id, alreadyConverted: true };
  }
  const [quote] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, quoteRequestId)).limit(1);
  if (!quote) throw new Error("Quote request was not found.");
  const ownerId = quote.assignedTo ?? user.id;
  const [requestedOwner] = await db.select({ id: staffAccounts.id, isActive: staffAccounts.isActive, role: staffAccounts.role }).from(staffAccounts).where(eq(staffAccounts.id, ownerId)).limit(1);
  if (!requestedOwner?.isActive || !hasPortalCapability({ role: requestedOwner.role }, "crm:view")) {
    throw new Error("The quote request assignee does not have active CRM access. Ask a manager to reassign it before conversion.");
  }
  if (ownerId !== user.id && !canAssignCrm(user)) {
    throw new Error("This quote request is assigned to another CRM owner. Ask a manager to convert or reassign it.");
  }
  let ownerTeamId: number | null = null;
  const ownerMemberships = await getActiveMembershipTeamIds(ownerId);
  if (ownerId === user.id) {
    ownerTeamId = ownerMemberships[0] ?? null;
  } else if (getCrmWriteScope(user) === "all") {
    ownerTeamId = ownerMemberships[0] ?? null;
  } else {
    const managedTeamIds = await getUserTeamIds(user.id);
    ownerTeamId = ownerMemberships.find((teamId) => managedTeamIds.includes(teamId)) ?? null;
    if (ownerTeamId === null) {
      throw new Error("The quote request assignee is outside the CRM teams you manage.");
    }
  }
  const normalizedCompanyName = normalizeCrmCompanyName(quote.companyName || quote.contactName);
  const [existingCompany] = await db.select({
    id: crmCompanies.id,
    ownerId: crmCompanies.ownerId,
    ownerTeamId: crmCompanies.ownerTeamId,
  }).from(crmCompanies).where(and(
    eq(crmCompanies.normalizedName, normalizedCompanyName),
    eq(crmCompanies.countryCode, "ID"),
    isNull(crmCompanies.archivedAt),
  )).limit(1);
  const userTeamIds = await getUserTeamIds(user.id);
  if (existingCompany && !canAccessCrmOwnedRecord(user, existingCompany, userTeamIds, "read")) {
    throw new Error("A matching company exists outside your CRM scope. Ask a manager to review ownership before converting this request.");
  }
  const companyId = existingCompany?.id ?? await allocateCrmId("crm_companies");
  const normalizedEmail = quote.email.trim().toLowerCase();
  const [existingContact] = await db.select({
    id: crmContacts.id,
    ownerId: crmContacts.ownerId,
    ownerTeamId: crmContacts.ownerTeamId,
  }).from(crmContacts).where(and(eq(crmContacts.companyId, companyId), sql`lower(btrim(${crmContacts.email})) = ${normalizedEmail}`, isNull(crmContacts.archivedAt))).limit(1);
  if (existingContact && !canAccessCrmOwnedRecord(user, existingContact, userTeamIds, "read")) {
    throw new Error("A matching contact exists outside your CRM scope. Ask a manager to review ownership before converting this request.");
  }
  const contactId = existingContact?.id ?? await allocateCrmId("crm_contacts");
  const leadId = await allocateCrmId("crm_leads");
  const now = new Date();
  const queries: BatchItem<"pg">[] = [];
  if (!existingCompany) {
    queries.push(
      db.insert(crmCompanies).values({ id: companyId, legalName: quote.companyName || quote.contactName, normalizedName: normalizedCompanyName, email: normalizedEmail, phone: quote.phone, ownerId, ownerTeamId, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }),
      db.insert(crmCompanyRoles).values({ companyId, role: "prospect", createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }),
    );
  }
  if (!existingContact) {
    queries.push(db.insert(crmContacts).values({ id: contactId, companyId, fullName: quote.contactName, email: normalizedEmail, phone: quote.phone, isPrimary: !existingCompany, ownerId, ownerTeamId, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }));
  }
  queries.push(
    db.insert(crmLeads).values({
      id: leadId,
      sourceQuoteRequestId: quote.id,
      companyId,
      contactId,
      title: `${quote.companyName || quote.contactName}: ${quote.origin} to ${quote.destination}`,
      source: "website_quote_request",
      status: "new",
      priority: "normal",
      freightType: quote.freightType,
      origin: quote.origin,
      destination: quote.destination,
      readyDate: quote.readyDate,
      cargoDescription: quote.cargoDescription,
      incoterm: quote.incoterms,
      numPackages: quote.numPackages,
      weightKg: quote.weightKg,
      volumeCbm: quote.volumeCbm,
      notes: quote.notes || quote.specialRequirements,
      ownerId,
      ownerTeamId,
      nextAction: quote.nextAction,
      actionDueAt: quote.dueAt,
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.lead.converted_from_quote_request", "crm_lead", leadId, { quoteRequestId: quote.id, referenceNumber: quote.referenceNumber })),
  );
  if (quote.nextAction) {
    const taskId = await allocateCrmId("crm_tasks");
    queries.push(db.insert(crmTasks).values({
      id: taskId,
      subject: quote.nextAction,
      status: "open",
      priority: "normal",
      dueAt: quote.dueAt,
      ownerId,
      ownerTeamId,
      entityType: "lead",
      entityId: String(leadId),
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: now,
      updatedAt: now,
    }));
  }
  try {
    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  } catch (error) {
    const [raced] = await db.select({ id: crmLeads.id, ownerId: crmLeads.ownerId, ownerTeamId: crmLeads.ownerTeamId }).from(crmLeads).where(eq(crmLeads.sourceQuoteRequestId, quoteRequestId)).limit(1);
    if (raced) {
      await assertOwnedAccess(user, raced, "read");
      return { id: raced.id, alreadyConverted: true };
    }
    throw error;
  }
  return { id: leadId, alreadyConverted: false };
}

export async function createCrmOpportunity(input: CrmOpportunityInput) {
  const user = await requireCrmWriter();
  if (!canManageCrmStage(user)) throw new Error("CRM opportunity-stage access is required.");
  assertOpportunityInitialStage(input.stage);
  assertOpportunityStagePrerequisites(input.stage, input.externalQuotationReference, input.externalQuotationStatus);
  await assertOpportunityRelationships(user, input, "write");
  if (input.leadId !== null) {
    const [existingOpportunity] = await db.select({ id: crmOpportunities.id })
      .from(crmOpportunities)
      .where(eq(crmOpportunities.leadId, input.leadId))
      .limit(1);
    if (existingOpportunity) throw new Error("This lead is already linked to an opportunity.");
  }
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId);
  const id = await allocateCrmId("crm_opportunities");
  const now = new Date();
  const lifecycle = deriveOpportunityLifecycle(input.stage, input.lostReason, now);
  const queries: BatchItem<"pg">[] = [
    db.insert(crmOpportunities).values({ ...input, ...assignment, ...lifecycle, id, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.opportunity.created", "crm_opportunity", id, { stage: input.stage, status: lifecycle.status })),
  ];
  if (input.leadId !== null) {
    const activityId = await allocateCrmId("crm_activities");
    queries.push(
      db.update(crmLeads).set({ status: "converted", updatedBy: user.id, updatedAt: now }).where(and(
        eq(crmLeads.id, input.leadId),
        eq(crmLeads.status, "qualified"),
      )),
      db.insert(crmActivities).values({
        id: activityId,
        activityType: "status_change",
        subject: `Qualified lead converted to opportunity #${id}`,
        ownerId: user.id,
        ownerTeamId: assignment.ownerTeamId,
        createdBy: user.id,
        updatedBy: user.id,
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(crmActivityLinks).values({ activityId, entityType: "lead", entityId: String(input.leadId), createdBy: user.id, createdAt: now }),
      db.insert(portalAuditLogs).values(auditValues(user, "crm.lead.converted_to_opportunity", "crm_lead", input.leadId, { opportunityId: id })),
    );
  }
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function updateCrmOpportunity(id: number, input: CrmOpportunityInput) {
  const user = await requireCrmWriter();
  assertOpportunityStagePrerequisites(input.stage, input.externalQuotationReference, input.externalQuotationStatus);
  const [current] = await db.select({
    ownerId: crmOpportunities.ownerId,
    ownerTeamId: crmOpportunities.ownerTeamId,
    stage: crmOpportunities.stage,
    status: crmOpportunities.status,
    leadId: crmOpportunities.leadId,
    wonAt: crmOpportunities.wonAt,
    lostAt: crmOpportunities.lostAt,
    lostReason: crmOpportunities.lostReason,
    archivedAt: crmOpportunities.archivedAt,
  }).from(crmOpportunities).where(eq(crmOpportunities.id, id)).limit(1);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the opportunity before updating it.");
  if (input.leadId !== current?.leadId) {
    throw new Error("The source lead cannot be changed after an opportunity is created.");
  }
  await assertOpportunityRelationships(user, input, "read");
  if (input.stage !== current?.stage && !canManageCrmStage(user)) throw new Error("CRM opportunity-stage access is required.");
  if (input.stage !== current?.stage) {
    assertOpportunityStageTransition(current!.stage as CrmOpportunityStage, input.stage);
  }
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId, current);
  const now = new Date();
  const lifecycle = input.stage === current?.stage
    ? {
        status: current.status,
        wonAt: current.wonAt,
        lostAt: current.lostAt,
        lostReason: input.stage === "lost" ? input.lostReason : current.lostReason,
      }
    : deriveOpportunityLifecycle(input.stage, input.lostReason, now);
  const queries: BatchItem<"pg">[] = [
    db.update(crmOpportunities).set({ ...input, ...assignment, ...lifecycle, updatedBy: user.id, updatedAt: now }).where(and(eq(crmOpportunities.id, id), isNull(crmOpportunities.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.opportunity.updated", "crm_opportunity", id, { fromStage: current?.stage, stage: input.stage, status: lifecycle.status })),
  ];
  if (input.stage !== current?.stage) {
    const activityId = await allocateCrmId("crm_activities");
    queries.push(
      db.insert(crmActivities).values({
        id: activityId,
        activityType: "status_change",
        subject: `Stage changed from ${current?.stage} to ${input.stage}`,
        ownerId: user.id,
        ownerTeamId: assignment.ownerTeamId,
        createdBy: user.id,
        updatedBy: user.id,
        occurredAt: now,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(crmActivityLinks).values({ activityId, entityType: "opportunity", entityId: String(id), createdBy: user.id, createdAt: now }),
    );
  }
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function changeCrmOpportunityStage(id: number, stage: CrmOpportunityStage, lostReason: string | null) {
  const user = await requireCrmWriter();
  if (!canManageCrmStage(user)) throw new Error("CRM opportunity-stage access is required.");
  const [current] = await db.select({
    ownerId: crmOpportunities.ownerId,
    ownerTeamId: crmOpportunities.ownerTeamId,
    stage: crmOpportunities.stage,
    externalQuotationReference: crmOpportunities.externalQuotationReference,
    externalQuotationStatus: crmOpportunities.externalQuotationStatus,
    companyId: crmOpportunities.companyId,
    freightType: crmOpportunities.freightType,
    origin: crmOpportunities.origin,
    destination: crmOpportunities.destination,
    cargoDescription: crmOpportunities.cargoDescription,
    commodity: crmOpportunities.commodity,
    archivedAt: crmOpportunities.archivedAt,
  }).from(crmOpportunities).where(eq(crmOpportunities.id, id)).limit(1);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the opportunity before changing its stage.");
  if (stage === current?.stage) return { id };
  assertOpportunityStageTransition(current!.stage as CrmOpportunityStage, stage);
  assertOpportunityStagePrerequisites(
    stage,
    current?.externalQuotationReference ?? null,
    (current?.externalQuotationStatus ?? "not_started") as CrmExternalQuotationStatus,
  );
  assertOpportunityCommercialCompleteness(stage, {
    companyId: current?.companyId ?? null,
    freightType: current?.freightType ?? null,
    origin: current?.origin ?? null,
    destination: current?.destination ?? null,
    cargoDescription: current?.cargoDescription ?? null,
    commodity: current?.commodity ?? null,
  });
  const now = new Date();
  const lifecycle = deriveOpportunityLifecycle(stage, lostReason, now);
  const activityId = await allocateCrmId("crm_activities");
  await db.batch([
    db.update(crmOpportunities).set({ stage, ...lifecycle, updatedBy: user.id, updatedAt: now }).where(and(eq(crmOpportunities.id, id), isNull(crmOpportunities.archivedAt))),
    db.insert(crmActivities).values({ id: activityId, activityType: "status_change", subject: `Stage changed from ${current?.stage} to ${stage}`, ownerId: user.id, ownerTeamId: current?.ownerTeamId ?? null, createdBy: user.id, updatedBy: user.id, occurredAt: now, createdAt: now, updatedAt: now }),
    db.insert(crmActivityLinks).values({ activityId, entityType: "opportunity", entityId: String(id), createdBy: user.id, createdAt: now }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.opportunity.stage_changed", "crm_opportunity", id, { fromStage: current?.stage, stage, status: lifecycle.status }, lostReason)),
  ]);
  return { id };
}

export async function archiveCrmOpportunity(id: number, reason: string) {
  const user = await requireCrmWriter();
  if (!canArchiveCrm(user)) throw new Error("CRM archive access is required.");
  const current = await findOpportunityOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Opportunity is already archived.");
  if (!reason.trim()) throw new Error("Archive reason is required.");
  const now = new Date();
  await db.batch([
    db.update(crmOpportunities).set({ archivedAt: now, archivedBy: user.id, archiveReason: reason.trim(), updatedBy: user.id, updatedAt: now }).where(and(eq(crmOpportunities.id, id), isNull(crmOpportunities.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.opportunity.archived", "crm_opportunity", id, undefined, reason)),
  ]);
}

export async function restoreCrmOpportunity(id: number) {
  const user = await requireCrmWriter();
  if (!canRestoreCrm(user)) throw new Error("CRM restore access is required.");
  const current = await findOpportunityOwnedRow(id);
  await assertOwnedAccess(user, current, "write");
  if (!current?.archivedAt) throw new Error("Opportunity is not archived.");
  const now = new Date();
  await db.batch([
    db.update(crmOpportunities).set({ archivedAt: null, archivedBy: null, archiveReason: null, updatedBy: user.id, updatedAt: now }).where(eq(crmOpportunities.id, id)),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.opportunity.restored", "crm_opportunity", id)),
  ]);
}

export async function createCrmActivity(input: CrmActivityInput) {
  const user = await requireCrmWriter();
  if (input.activityType === "status_change") {
    throw new Error("Status-change activities are created only by CRM lifecycle actions.");
  }
  await assertEntityAccess(user, input.entityType, input.entityId, "read");
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId);
  const id = await allocateCrmId("crm_activities");
  const now = new Date();
  const { entityType, entityId, ...activityValues } = input;
  await db.batch([
    db.insert(crmActivities).values({ ...activityValues, ...assignment, id, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }),
    db.insert(crmActivityLinks).values({ activityId: id, entityType, entityId, createdBy: user.id, createdAt: now }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.activity.created", "crm_activity", id, { entityType, entityId })),
  ]);
  return { id };
}

export async function createCrmTask(input: CrmTaskInput) {
  const user = await requireCrmWriter();
  if (input.entityType && input.entityId) await assertEntityAccess(user, input.entityType, input.entityId, "read");
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId);
  const id = await allocateCrmId("crm_tasks");
  const now = new Date();
  const queries: BatchItem<"pg">[] = [
    db.insert(crmTasks).values({ ...input, ...assignment, id, completedAt: input.status === "completed" ? now : null, completedBy: input.status === "completed" ? user.id : null, createdBy: user.id, updatedBy: user.id, createdAt: now, updatedAt: now }),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.task.created", "crm_task", id, { entityType: input.entityType, entityId: input.entityId, status: input.status })),
  ];
  if (["open", "in_progress"].includes(input.status) && input.entityId) {
    const entityId = Number.parseInt(input.entityId, 10);
    if (input.entityType === "lead") {
      queries.push(db.update(crmLeads).set({ nextAction: input.subject, actionDueAt: input.dueAt, updatedBy: user.id, updatedAt: now }).where(eq(crmLeads.id, entityId)));
    } else if (input.entityType === "opportunity") {
      queries.push(db.update(crmOpportunities).set({ nextAction: input.subject, actionDueAt: input.dueAt, updatedBy: user.id, updatedAt: now }).where(eq(crmOpportunities.id, entityId)));
    }
  }
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

async function getNextLinkedTask(entityType: string | null, entityId: string | null, excludeId: number) {
  if (!entityType || !entityId) return null;
  const [nextTask] = await db.select({ subject: crmTasks.subject, dueAt: crmTasks.dueAt })
    .from(crmTasks)
    .where(and(
      eq(crmTasks.entityType, entityType),
      eq(crmTasks.entityId, entityId),
      ne(crmTasks.id, excludeId),
      inArray(crmTasks.status, ["open", "in_progress"]),
      isNull(crmTasks.archivedAt),
    ))
    .orderBy(sql`${crmTasks.dueAt} asc nulls last`, desc(crmTasks.updatedAt))
    .limit(1);
  return nextTask ?? null;
}

function appendNextActionSync(
  queries: BatchItem<"pg">[],
  userId: number,
  entityType: string | null,
  entityId: string | null,
  nextAction: { subject: string; dueAt: Date | null } | null,
  now: Date,
) {
  if (!entityId) return;
  const numericId = Number.parseInt(entityId, 10);
  if (entityType === "lead") {
    queries.push(db.update(crmLeads).set({ nextAction: nextAction?.subject ?? null, actionDueAt: nextAction?.dueAt ?? null, updatedBy: userId, updatedAt: now }).where(eq(crmLeads.id, numericId)));
  } else if (entityType === "opportunity") {
    queries.push(db.update(crmOpportunities).set({ nextAction: nextAction?.subject ?? null, actionDueAt: nextAction?.dueAt ?? null, updatedBy: userId, updatedAt: now }).where(eq(crmOpportunities.id, numericId)));
  }
}

export async function updateCrmTask(id: number, input: CrmTaskInput) {
  const user = await requireCrmWriter();
  const [current] = await db.select().from(crmTasks).where(eq(crmTasks.id, id)).limit(1);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the task before updating it.");
  if (input.entityType !== current?.entityType || input.entityId !== current?.entityId) {
    throw new Error("The linked CRM record cannot be changed after a task is created.");
  }
  if (input.entityType && input.entityId) await assertEntityAccess(user, input.entityType, input.entityId, "read");
  const assignment = await resolveAssignment(user, input.ownerId, input.ownerTeamId, current);
  const now = new Date();
  const queries: BatchItem<"pg">[] = [
    db.update(crmTasks).set({
      ...input,
      ...assignment,
      completedAt: input.status === "completed" ? (current?.completedAt ?? now) : null,
      completedBy: input.status === "completed" ? (current?.completedBy ?? user.id) : null,
      updatedBy: user.id,
      updatedAt: now,
    }).where(and(eq(crmTasks.id, id), isNull(crmTasks.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.task.updated", "crm_task", id, { fromStatus: current?.status, status: input.status })),
  ];
  const nextAction = ["open", "in_progress"].includes(input.status)
    ? { subject: input.subject, dueAt: input.dueAt }
    : await getNextLinkedTask(input.entityType, input.entityId, id);
  appendNextActionSync(queries, user.id, input.entityType, input.entityId, nextAction, now);
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}

export async function updateCrmTaskStatus(id: number, status: CrmTaskStatus) {
  const user = await requireCrmWriter();
  const [current] = await db.select({
    ownerId: crmTasks.ownerId,
    ownerTeamId: crmTasks.ownerTeamId,
    status: crmTasks.status,
    subject: crmTasks.subject,
    dueAt: crmTasks.dueAt,
    completedAt: crmTasks.completedAt,
    entityType: crmTasks.entityType,
    entityId: crmTasks.entityId,
    archivedAt: crmTasks.archivedAt,
  }).from(crmTasks).where(eq(crmTasks.id, id)).limit(1);
  await assertOwnedAccess(user, current, "write");
  if (current?.archivedAt) throw new Error("Restore the task before updating it.");
  const now = new Date();
  const queries: BatchItem<"pg">[] = [
    db.update(crmTasks).set({ status, completedAt: status === "completed" ? (current?.completedAt ?? now) : null, completedBy: status === "completed" ? user.id : null, updatedBy: user.id, updatedAt: now }).where(and(eq(crmTasks.id, id), isNull(crmTasks.archivedAt))),
    db.insert(portalAuditLogs).values(auditValues(user, "crm.task.status_changed", "crm_task", id, { fromStatus: current?.status, status })),
  ];
  const nextAction = ["open", "in_progress"].includes(status)
    ? { subject: current!.subject, dueAt: current!.dueAt }
    : await getNextLinkedTask(current!.entityType, current!.entityId, id);
  appendNextActionSync(queries, user.id, current!.entityType, current!.entityId, nextAction, now);
  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  return { id };
}
