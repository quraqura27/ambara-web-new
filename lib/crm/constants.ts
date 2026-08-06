/**
 * CRM wire-format constants and types shared by server and client components.
 * Keep this module free of authorization, database, and server-only imports.
 */
export const crmCompanyRoleValues = [
  "prospect",
  "customer",
  "vendor",
  "overseas_agent",
  "airline",
  "shipping_line",
  "trucker",
  "customs_broker",
  "other",
] as const;

export const crmLeadStatusValues = [
  "new",
  "contacted",
  "awaiting_information",
  "qualified",
  "disqualified",
  "converted",
  "dormant",
] as const;

export const crmLeadPriorityValues = ["low", "normal", "high", "urgent"] as const;
export const crmOpportunityStatusValues = ["open", "won", "lost", "on_hold"] as const;
export const crmOpportunityStageValues = [
  "inquiry_received",
  "qualification",
  "rate_sourcing",
  "costing",
  "quotation_draft",
  "quotation_sent",
  "negotiation",
  "verbal_confirmation",
  "won",
  "lost",
  "on_hold",
] as const;
export const crmExternalQuotationStatusValues = [
  "not_started",
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;
export const crmActivityTypeValues = ["note", "call", "email", "meeting", "whatsapp", "status_change"] as const;
export const crmTaskStatusValues = ["open", "in_progress", "completed", "cancelled"] as const;
export const crmTaskPriorityValues = ["low", "normal", "high", "urgent"] as const;
export const crmEntityTypeValues = ["company", "contact", "lead", "opportunity", "quote_request", "shipment"] as const;

export type CrmCompanyRole = (typeof crmCompanyRoleValues)[number];
export type CrmLeadStatus = (typeof crmLeadStatusValues)[number];
export type CrmLeadPriority = (typeof crmLeadPriorityValues)[number];
export type CrmOpportunityStatus = (typeof crmOpportunityStatusValues)[number];
export type CrmOpportunityStage = (typeof crmOpportunityStageValues)[number];
export type CrmExternalQuotationStatus = (typeof crmExternalQuotationStatusValues)[number];
export type CrmActivityType = (typeof crmActivityTypeValues)[number];
export type CrmTaskStatus = (typeof crmTaskStatusValues)[number];
export type CrmTaskPriority = (typeof crmTaskPriorityValues)[number];
export type CrmEntityType = (typeof crmEntityTypeValues)[number];
export type CrmAccessScope = "none" | "own" | "team" | "all";
