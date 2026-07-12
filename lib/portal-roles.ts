import capabilityConfig from "./portal-capabilities.json" with { type: "json" };

export const portalRoles = ["superadmin", "admin", "operations", "finance", "viewer"] as const;

export type PortalRole = (typeof portalRoles)[number];

export type PortalRoleUser = {
  role?: string | null;
};

export const staffAssignableRoles = ["superadmin", "admin", "operations", "finance", "viewer"] as const;

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
] as const;

export type PortalCapability = (typeof portalCapabilities)[number];

export const portalRoleLabels: Record<PortalRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
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
export const canVoidShipment = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:void");
export const canOverrideShipmentVoidSafeguards = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:void:override");
export const canRestoreShipment = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:restore");
export const canPrintShipmentDocuments = (user: PortalRoleUser | null | undefined) => hasPortalCapability(user, "shipment:print");
