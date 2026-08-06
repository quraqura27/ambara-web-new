import capabilityConfig from "./portal-capabilities.json" with { type: "json" };

export const portalRoles = [
  "superadmin",
  "admin",
  "director",
  "sales_manager",
  "sales",
  "customer_service",
  "operations",
  "finance",
  "viewer",
] as const;

export type PortalRole = (typeof portalRoles)[number];

export type PortalRoleUser = {
  role?: string | null;
};

export const staffAssignableRoles = portalRoles;

export type StaffAssignableRole = (typeof staffAssignableRoles)[number];

export const portalCapabilities = [
  "portal:view",
  "dashboard:view",
  "shipment:view",
  "shipment:create",
  "shipment:edit",
  "shipment:status",
  "shipment:void",
  "shipment:void:override",
  "shipment:restore",
  "shipment:export",
  "shipment:print",
  "tracking:manage",
  "customer:view",
  "customer:manage",
  "customer:credentials",
  "mawb:view",
  "mawb:manage",
  "mawb:overwrite",
  "delivery:view",
  "delivery:manage",
  "operations:manage",
  "invoice:view",
  "invoice:manage",
  "invoice:export",
  "quote:view",
  "quote:manage",
  "document:view",
  "document:manage",
  "staff:manage",
  "session:revoke",
  "crm:view",
  "crm:manage",
  "crm:assign",
  "crm:archive",
  "crm:restore",
  "crm:team:view",
  "crm:team:manage",
  "crm:all:view",
  "crm:all:manage",
  "crm:cost:view",
  "crm:margin:view",
  "crm:compliance:view",
  "crm:quote-request:convert",
  "crm:stage:manage",
] as const;

export type PortalCapability = (typeof portalCapabilities)[number];

export const portalRoleLabels: Record<PortalRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  director: "Director",
  sales_manager: "Sales Manager",
  sales: "Sales",
  customer_service: "Customer Service",
  operations: "Operations",
  finance: "Finance",
  viewer: "Viewer",
};

const roleCapabilities = Object.fromEntries(
  portalRoles.map((role) => [role, new Set(capabilityConfig[role] as PortalCapability[])]),
) as Record<PortalRole, Set<PortalCapability>>;

export function isPortalRole(value: unknown): value is PortalRole {
  return typeof value === "string" && portalRoles.includes(value as PortalRole);
}

export function normalizePortalRole(value: unknown): PortalRole {
  if (typeof value !== "string") return "viewer";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "superadmin" || normalized === "super_admin") return "superadmin";
  if (normalized === "admin" || normalized === "administrator") return "admin";
  if (normalized === "director") return "director";
  if (normalized === "sales_manager" || normalized === "salesmanager") return "sales_manager";
  if (normalized === "sales" || normalized === "salesperson") return "sales";
  if (normalized === "customer_service" || normalized === "customerservice" || normalized === "cs") return "customer_service";
  if (normalized === "operations" || normalized === "operation" || normalized === "ops") return "operations";
  if (normalized === "finance") return "finance";
  if (normalized === "viewer" || normalized === "view_only" || normalized === "readonly") return "viewer";
  return "viewer";
}

export function isAssignableStaffRole(role: PortalRole): role is StaffAssignableRole {
  return staffAssignableRoles.includes(role as StaffAssignableRole);
}

export function getPortalCapabilities(user: PortalRoleUser | null | undefined) {
  return [...roleCapabilities[normalizePortalRole(user?.role)]];
}

export function hasPortalCapability(
  user: PortalRoleUser | null | undefined,
  capability: PortalCapability,
) {
  return roleCapabilities[normalizePortalRole(user?.role)].has(capability);
}

export function isSuperadmin(user: PortalRoleUser | null | undefined) {
  return normalizePortalRole(user?.role) === "superadmin";
}

export const canAccessPortal = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "portal:view");
export const canManageStaffAccounts = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "staff:manage");
export const canCreateShipments = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:create");
export const canEditShipmentDetails = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:edit");
export const canManageShipmentStatus = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:status");
export const canManageTracking = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "tracking:manage");
export const canManageCustomers = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "customer:manage");
export const canManageDeliveryBatches = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "delivery:manage");
export const canManageOperations = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "operations:manage");
export const canManageInvoices = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "invoice:manage");
export const canViewQuotes = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "quote:view");
export const canManageQuotes = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "quote:manage");
export const canViewDocuments = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "document:view");
export const canManageDocuments = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "document:manage");
export const canViewCrm = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:view");
export const canManageCrm = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:manage");
export const canAssignCrm = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:assign");
export const canArchiveCrm = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:archive");
export const canRestoreCrm = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:restore");
export const canViewCrmCost = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:cost:view");
export const canViewCrmMargin = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:margin:view");
export const canViewCrmCompliance = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:compliance:view");
export const canConvertQuoteRequestToCrmLead = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:quote-request:convert");
export const canManageCrmStage = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "crm:stage:manage");
export const canVoidShipment = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:void");
export const canOverrideShipmentVoidSafeguards = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:void:override");
export const canRestoreShipment = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:restore");
export const canPrintShipmentDocuments = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:print");
