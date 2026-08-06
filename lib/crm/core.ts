import {
  hasPortalCapability,
  type PortalRoleUser,
} from "../portal-roles.ts";
import { parseWibDateTime } from "../shipments/readiness.ts";
import {
  crmActivityTypeValues,
  crmCompanyRoleValues,
  crmEntityTypeValues,
  crmExternalQuotationStatusValues,
  crmLeadPriorityValues,
  crmLeadStatusValues,
  crmOpportunityStageValues,
  crmTaskPriorityValues,
  crmTaskStatusValues,
  type CrmAccessScope,
  type CrmActivityType,
  type CrmCompanyRole,
  type CrmEntityType,
  type CrmExternalQuotationStatus,
  type CrmLeadPriority,
  type CrmLeadStatus,
  type CrmOpportunityStage,
  type CrmTaskPriority,
  type CrmTaskStatus,
} from "./constants.ts";

export * from "./constants.ts";

export type CrmOwnedRecord = {
  ownerId: number;
  ownerTeamId: number | null;
};

export type CrmCompanyInput = {
  legacyCustomerId: number | null;
  legalName: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  nib: string | null;
  industry: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  countryCode: string;
  complianceNotes: string | null;
  notes: string | null;
  ownerId: number | null;
  ownerTeamId: number | null;
  roles: CrmCompanyRole[];
};

export type CrmContactInput = {
  companyId: number | null;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  isPrimary: boolean;
  notes: string | null;
  ownerId: number | null;
  ownerTeamId: number | null;
};

export type CrmLeadInput = {
  companyId: number | null;
  contactId: number | null;
  title: string;
  source: string;
  status: CrmLeadStatus;
  priority: CrmLeadPriority;
  freightType: string | null;
  origin: string | null;
  destination: string | null;
  readyDate: string | null;
  cargoDescription: string | null;
  commodity: string | null;
  incoterm: string | null;
  numPackages: number | null;
  weightKg: string | null;
  volumeCbm: string | null;
  notes: string | null;
  ownerId: number | null;
  ownerTeamId: number | null;
  nextAction: string | null;
  actionDueAt: Date | null;
  disqualificationReason: string | null;
};

export type CrmOpportunityInput = {
  leadId: number | null;
  companyId: number | null;
  primaryContactId: number | null;
  title: string;
  stage: CrmOpportunityStage;
  probability: number;
  estimatedValue: string | null;
  currency: string;
  expectedCloseDate: string | null;
  freightType: string | null;
  origin: string | null;
  destination: string | null;
  cargoDescription: string | null;
  commodity: string | null;
  incoterm: string | null;
  weightKg: string | null;
  volumeCbm: string | null;
  externalQuotationReference: string | null;
  externalQuotationUrl: string | null;
  externalQuotationStatus: CrmExternalQuotationStatus;
  notes: string | null;
  ownerId: number | null;
  ownerTeamId: number | null;
  nextAction: string | null;
  actionDueAt: Date | null;
  lostReason: string | null;
};

export type CrmActivityInput = {
  activityType: CrmActivityType;
  subject: string;
  details: string | null;
  occurredAt: Date;
  ownerId: number | null;
  ownerTeamId: number | null;
  entityType: CrmEntityType;
  entityId: string;
};

export type CrmTaskInput = {
  subject: string;
  details: string | null;
  status: CrmTaskStatus;
  priority: CrmTaskPriority;
  dueAt: Date | null;
  ownerId: number | null;
  ownerTeamId: number | null;
  entityType: CrmEntityType | null;
  entityId: string | null;
};

type StringRecord = Record<string, string | undefined>;

function text(input: StringRecord, key: string, maxLength = 5_000) {
  const value = input[key]?.trim() ?? "";
  if (value.length > maxLength) throw new Error(`${key} is too long.`);
  return value;
}

function requiredText(input: StringRecord, key: string, maxLength = 240) {
  const value = text(input, key, maxLength);
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function optionalText(input: StringRecord, key: string, maxLength = 5_000) {
  return text(input, key, maxLength) || null;
}

export function normalizeCrmCompanyName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("und")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseCrmId(value: unknown, label = "record") {
  const raw = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) throw new Error(`Select a valid ${label}.`);
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Select a valid ${label}.`);
  return parsed;
}

function optionalId(input: StringRecord, key: string) {
  const value = text(input, key, 20);
  return value ? parseCrmId(value, key) : null;
}

function optionalInteger(input: StringRecord, key: string, minimum = 0) {
  const value = text(input, key, 20);
  if (!value) return null;
  if (!/^\d+$/.test(value)) throw new Error(`${key} must be a whole number.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) throw new Error(`${key} must be a whole number.`);
  return parsed;
}

function optionalDecimal(input: StringRecord, key: string, integerDigits = 11, scale = 3) {
  const value = text(input, key, 40);
  if (!value) return null;
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new Error(`${key} must be a non-negative decimal number.`);
  const whole = match[1]!.replace(/^0+(?=\d)/, "");
  const fraction = match[2] ?? "";
  if (whole.length > integerDigits || fraction.length > scale) {
    throw new Error(`${key} supports up to ${integerDigits} whole digits and ${scale} decimal places.`);
  }
  return fraction ? `${whole}.${fraction}` : whole;
}

function optionalDate(input: StringRecord, key: string) {
  const value = text(input, key, 10);
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`${key} must be a valid date.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`${key} must be a valid date.`);
  }
  return value;
}

function optionalDateTime(input: StringRecord, key: string) {
  const value = text(input, key, 50);
  if (!value) return null;
  try {
    return parseWibDateTime(value);
  } catch {
    throw new Error(`${key} must be a valid WIB date and time.`);
  }
}

function optionalEmail(input: StringRecord, key: string) {
  const value = text(input, key, 320).toLowerCase();
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`Enter a valid ${key}.`);
  return value;
}

function optionalUrl(input: StringRecord, key: string) {
  const value = text(input, key, 2_048);
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }
  if (!(["http:", "https:"] as string[]).includes(parsed.protocol)) throw new Error(`${key} must use http or https.`);
  return parsed.toString();
}

function enumValue<T extends readonly string[]>(input: StringRecord, key: string, values: T, fallback: T[number]): T[number] {
  const value = text(input, key, 80) || fallback;
  if (!values.includes(value as T[number])) throw new Error(`Select a valid ${key}.`);
  return value as T[number];
}

function parseRoles(value: string | undefined): CrmCompanyRole[] {
  const values = (value ?? "prospect").split(",").map((role) => role.trim()).filter(Boolean);
  const roles = Array.from(new Set(values));
  if (!roles.length || roles.some((role) => !crmCompanyRoleValues.includes(role as CrmCompanyRole))) {
    throw new Error("Select at least one valid company role.");
  }
  return roles as CrmCompanyRole[];
}

export function validateCrmCompanyInput(input: StringRecord): CrmCompanyInput {
  const legalName = requiredText(input, "legalName", 240);
  if (!normalizeCrmCompanyName(legalName)) throw new Error("legalName must contain letters or numbers.");
  const countryCode = (text(input, "countryCode", 2) || "ID").toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error("countryCode must contain two letters.");
  return {
    legacyCustomerId: optionalId(input, "legacyCustomerId"),
    legalName,
    displayName: optionalText(input, "displayName", 240),
    email: optionalEmail(input, "email"),
    phone: optionalText(input, "phone", 50),
    website: optionalUrl(input, "website"),
    taxId: optionalText(input, "taxId", 100),
    nib: optionalText(input, "nib", 100),
    industry: optionalText(input, "industry", 160),
    addressLine1: optionalText(input, "addressLine1", 500),
    addressLine2: optionalText(input, "addressLine2", 500),
    city: optionalText(input, "city", 160),
    province: optionalText(input, "province", 160),
    postalCode: optionalText(input, "postalCode", 30),
    countryCode,
    complianceNotes: optionalText(input, "complianceNotes"),
    notes: optionalText(input, "notes"),
    ownerId: optionalId(input, "ownerId"),
    ownerTeamId: optionalId(input, "ownerTeamId"),
    roles: parseRoles(input.roles),
  };
}

export function validateCrmContactInput(input: StringRecord): CrmContactInput {
  const result: CrmContactInput = {
    companyId: optionalId(input, "companyId"),
    fullName: requiredText(input, "fullName", 240),
    jobTitle: optionalText(input, "jobTitle", 160),
    email: optionalEmail(input, "email"),
    phone: optionalText(input, "phone", 50),
    whatsapp: optionalText(input, "whatsapp", 50),
    isPrimary: text(input, "isPrimary", 10) === "yes" || text(input, "isPrimary", 10) === "true",
    notes: optionalText(input, "notes"),
    ownerId: optionalId(input, "ownerId"),
    ownerTeamId: optionalId(input, "ownerTeamId"),
  };
  if (!result.email && !result.phone && !result.whatsapp) {
    throw new Error("A contact requires an email, phone number, or WhatsApp number.");
  }
  if (result.isPrimary && result.companyId === null) {
    throw new Error("A primary contact must be linked to a company.");
  }
  return result;
}

export function validateCrmLeadInput(input: StringRecord): CrmLeadInput {
  const status = enumValue(input, "status", crmLeadStatusValues, "new");
  const disqualificationReason = optionalText(input, "disqualificationReason", 1_000);
  if (status === "disqualified" && !disqualificationReason) throw new Error("A disqualification reason is required.");
  const nextAction = optionalText(input, "nextAction", 500);
  const actionDueAt = optionalDateTime(input, "actionDueAt");
  if (nextAction && !actionDueAt && !["disqualified", "converted", "dormant"].includes(status)) {
    throw new Error("Set a due date for the next action.");
  }
  const result: CrmLeadInput = {
    companyId: optionalId(input, "companyId"),
    contactId: optionalId(input, "contactId"),
    title: requiredText(input, "title", 240),
    source: text(input, "source", 100) || "manual",
    status,
    priority: enumValue(input, "priority", crmLeadPriorityValues, "normal"),
    freightType: optionalText(input, "freightType", 100),
    origin: optionalText(input, "origin", 240),
    destination: optionalText(input, "destination", 240),
    readyDate: optionalDate(input, "readyDate"),
    cargoDescription: optionalText(input, "cargoDescription"),
    commodity: optionalText(input, "commodity", 500),
    incoterm: optionalText(input, "incoterm", 30),
    numPackages: optionalInteger(input, "numPackages", 1),
    weightKg: optionalDecimal(input, "weightKg"),
    volumeCbm: optionalDecimal(input, "volumeCbm"),
    notes: optionalText(input, "notes"),
    ownerId: optionalId(input, "ownerId"),
    ownerTeamId: optionalId(input, "ownerTeamId"),
    nextAction,
    actionDueAt,
    disqualificationReason,
  };
  if (result.status === "qualified") {
    if (
      result.companyId === null
      || result.contactId === null
      || !result.freightType
      || !result.origin
      || !result.destination
      || (!result.cargoDescription && !result.commodity)
    ) {
      throw new Error("A qualified lead requires a company, contact, freight type, route, and cargo details.");
    }
  }
  return result;
}

export function validateCrmOpportunityInput(input: StringRecord): CrmOpportunityInput {
  const probabilityText = text(input, "probability", 3) || "20";
  if (!/^\d{1,3}$/.test(probabilityText)) throw new Error("probability must be a whole number between 0 and 100.");
  const probability = Number(probabilityText);
  if (!Number.isInteger(probability) || probability < 0 || probability > 100) throw new Error("probability must be between 0 and 100.");
  const currency = (text(input, "currency", 3) || "IDR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("currency must contain three letters.");
  const stage = enumValue(input, "stage", crmOpportunityStageValues, "qualification");
  const lostReason = optionalText(input, "lostReason", 1_000);
  if (stage === "lost" && !lostReason) throw new Error("A lost reason is required.");
  const result: CrmOpportunityInput = {
    leadId: optionalId(input, "leadId"),
    companyId: optionalId(input, "companyId"),
    primaryContactId: optionalId(input, "primaryContactId"),
    title: requiredText(input, "title", 240),
    stage,
    probability,
    estimatedValue: optionalDecimal(input, "estimatedValue", 16, 2),
    currency,
    expectedCloseDate: optionalDate(input, "expectedCloseDate"),
    freightType: optionalText(input, "freightType", 100),
    origin: optionalText(input, "origin", 240),
    destination: optionalText(input, "destination", 240),
    cargoDescription: optionalText(input, "cargoDescription"),
    commodity: optionalText(input, "commodity", 500),
    incoterm: optionalText(input, "incoterm", 30),
    weightKg: optionalDecimal(input, "weightKg"),
    volumeCbm: optionalDecimal(input, "volumeCbm"),
    externalQuotationReference: optionalText(input, "externalQuotationReference", 240),
    externalQuotationUrl: optionalUrl(input, "externalQuotationUrl"),
    externalQuotationStatus: enumValue(input, "externalQuotationStatus", crmExternalQuotationStatusValues, "not_started"),
    notes: optionalText(input, "notes"),
    ownerId: optionalId(input, "ownerId"),
    ownerTeamId: optionalId(input, "ownerTeamId"),
    nextAction: optionalText(input, "nextAction", 500),
    actionDueAt: optionalDateTime(input, "actionDueAt"),
    lostReason,
  };
  assertOpportunityStagePrerequisites(
    result.stage,
    result.externalQuotationReference,
    result.externalQuotationStatus,
  );
  assertOpportunityCommercialCompleteness(result.stage, result);
  if (result.leadId === null && !result.notes) {
    throw new Error("A direct opportunity requires an explanation in internal notes.");
  }
  return result;
}

export function validateCrmActivityInput(input: StringRecord): CrmActivityInput {
  const entityId = String(parseCrmId(requiredText(input, "entityId", 100), "linked record"));
  return {
    activityType: enumValue(input, "activityType", crmActivityTypeValues, "note"),
    subject: requiredText(input, "subject", 240),
    details: optionalText(input, "details"),
    occurredAt: optionalDateTime(input, "occurredAt") ?? new Date(),
    ownerId: optionalId(input, "ownerId"),
    ownerTeamId: optionalId(input, "ownerTeamId"),
    entityType: enumValue(input, "entityType", crmEntityTypeValues, "lead"),
    entityId,
  };
}

export function validateCrmTaskInput(input: StringRecord): CrmTaskInput {
  const entityTypeText = text(input, "entityType", 80);
  const entityIdText = optionalText(input, "entityId", 100);
  const entityId = entityIdText ? String(parseCrmId(entityIdText, "linked record")) : null;
  if (!!entityTypeText !== !!entityId) throw new Error("Task link type and record are both required when linking a task.");
  const entityType = entityTypeText
    ? enumValue(input, "entityType", crmEntityTypeValues, "lead")
    : null;
  return {
    subject: requiredText(input, "subject", 240),
    details: optionalText(input, "details"),
    status: enumValue(input, "status", crmTaskStatusValues, "open"),
    priority: enumValue(input, "priority", crmTaskPriorityValues, "normal"),
    dueAt: optionalDateTime(input, "dueAt"),
    ownerId: optionalId(input, "ownerId"),
    ownerTeamId: optionalId(input, "ownerTeamId"),
    entityType,
    entityId,
  };
}

export function deriveOpportunityLifecycle(stage: CrmOpportunityStage, lostReason: string | null, now = new Date()) {
  if (stage === "won") {
    return { status: "won" as const, wonAt: now, lostAt: null, lostReason: null };
  }
  if (stage === "lost") {
    if (!lostReason?.trim()) throw new Error("A lost reason is required.");
    return { status: "lost" as const, wonAt: null, lostAt: now, lostReason: lostReason.trim() };
  }
  if (stage === "on_hold") {
    return { status: "on_hold" as const, wonAt: null, lostAt: null, lostReason: null };
  }
  return { status: "open" as const, wonAt: null, lostAt: null, lostReason: null };
}

export function assertOpportunityStagePrerequisites(
  stage: CrmOpportunityStage,
  quotationReference: string | null,
  quotationStatus: CrmExternalQuotationStatus,
) {
  const sentStages: CrmOpportunityStage[] = [
    "quotation_sent",
    "negotiation",
    "verbal_confirmation",
  ];
  if (sentStages.includes(stage)) {
    if (!quotationReference?.trim() || !(["sent", "accepted"] as CrmExternalQuotationStatus[]).includes(quotationStatus)) {
      throw new Error("This stage requires a quotation reference with sent or accepted status.");
    }
  }
  if (stage === "won" && (!quotationReference?.trim() || quotationStatus !== "accepted")) {
    throw new Error("A won opportunity requires an accepted quotation reference.");
  }
}

const activeOpportunityStages: readonly CrmOpportunityStage[] = [
  "inquiry_received",
  "qualification",
  "rate_sourcing",
  "costing",
  "quotation_draft",
  "quotation_sent",
  "negotiation",
  "verbal_confirmation",
];

export function assertOpportunityInitialStage(stage: CrmOpportunityStage) {
  if (!(stage === "inquiry_received" || stage === "qualification")) {
    throw new Error("A new opportunity must start at Inquiry Received or Qualification.");
  }
}

export function assertOpportunityStageTransition(
  fromStage: CrmOpportunityStage,
  toStage: CrmOpportunityStage,
) {
  if (fromStage === toStage) return;
  if (fromStage === "won" || fromStage === "lost") {
    throw new Error("Won and lost opportunities are terminal in this release.");
  }
  if (toStage === "lost" || toStage === "on_hold") return;
  if (fromStage === "on_hold") {
    if (toStage === "qualification") return;
    throw new Error("An on-hold opportunity must return to Qualification before progressing.");
  }
  const fromIndex = activeOpportunityStages.indexOf(fromStage);
  const toIndex = activeOpportunityStages.indexOf(toStage);
  if (toStage === "won") {
    if (["quotation_sent", "negotiation", "verbal_confirmation"].includes(fromStage)) return;
    throw new Error("An opportunity can be won only after a quotation has been sent.");
  }
  if (fromIndex >= 0 && toIndex >= 0 && Math.abs(fromIndex - toIndex) === 1) return;
  throw new Error("Move an opportunity one pipeline stage at a time.");
}

export function assertOpportunityCommercialCompleteness(
  stage: CrmOpportunityStage,
  input: Pick<CrmOpportunityInput, "companyId" | "freightType" | "origin" | "destination" | "cargoDescription" | "commodity">,
) {
  if (!["quotation_sent", "negotiation", "verbal_confirmation", "won"].includes(stage)) return;
  if (
    input.companyId === null
    || !input.freightType
    || !input.origin
    || !input.destination
    || (!input.cargoDescription && !input.commodity)
  ) {
    throw new Error("This stage requires a company, freight type, route, and cargo details.");
  }
}

export function getCrmReadScope(user: PortalRoleUser | null | undefined): CrmAccessScope {
  if (!hasPortalCapability(user, "crm:view")) return "none";
  if (hasPortalCapability(user, "crm:all:view")) return "all";
  if (hasPortalCapability(user, "crm:team:view")) return "team";
  return "own";
}

export function getCrmWriteScope(user: PortalRoleUser | null | undefined): CrmAccessScope {
  if (!hasPortalCapability(user, "crm:manage")) return "none";
  if (hasPortalCapability(user, "crm:all:manage")) return "all";
  if (hasPortalCapability(user, "crm:team:manage")) return "team";
  return "own";
}

export function canAccessCrmOwnedRecord(
  user: PortalRoleUser & { id: number },
  record: CrmOwnedRecord,
  teamIds: readonly number[],
  mode: "read" | "write",
) {
  const scope = mode === "read" ? getCrmReadScope(user) : getCrmWriteScope(user);
  if (scope === "all") return true;
  if (record.ownerId === user.id) return scope === "own" || scope === "team";
  return scope === "team" && record.ownerTeamId !== null && teamIds.includes(record.ownerTeamId);
}
