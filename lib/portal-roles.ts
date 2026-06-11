export const portalRoles = ["superadmin", "admin", "operations", "finance", "viewer"] as const;

export type PortalRole = (typeof portalRoles)[number];

export type PortalRoleUser = {
  role?: string | null;
};

export const staffAssignableRoles = ["superadmin", "operations", "finance"] as const;

export type StaffAssignableRole = (typeof staffAssignableRoles)[number];

export const portalRoleLabels: Record<PortalRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  operations: "Operations",
  finance: "Finance",
  viewer: "Viewer",
};

const roleRank: Record<PortalRole, number> = {
  viewer: 0,
  operations: 1,
  finance: 1,
  admin: 2,
  superadmin: 3,
};

export function normalizePortalRole(value: unknown): PortalRole {
  if (typeof value !== "string") {
    return "viewer";
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "superadmin" || normalized === "super_admin") {
    return "superadmin";
  }

  if (normalized === "admin" || normalized === "administrator") {
    return "admin";
  }

  if (normalized === "operations" || normalized === "operation" || normalized === "ops") {
    return "operations";
  }

  if (normalized === "finance") {
    return "finance";
  }

  if (normalized === "viewer" || normalized === "view_only" || normalized === "readonly") {
    return "viewer";
  }

  return "viewer";
}

export function isAssignableStaffRole(role: PortalRole): role is StaffAssignableRole {
  return staffAssignableRoles.includes(role as StaffAssignableRole);
}

export function hasPortalRoleAtLeast(user: PortalRoleUser | null | undefined, role: PortalRole) {
  return roleRank[normalizePortalRole(user?.role)] >= roleRank[role];
}

export function isSuperadmin(user: PortalRoleUser | null | undefined) {
  return normalizePortalRole(user?.role) === "superadmin";
}

export function canManageStaffAccounts(user: PortalRoleUser | null | undefined) {
  return isSuperadmin(user);
}

export function canAccessPortal(user: PortalRoleUser | null | undefined) {
  return normalizePortalRole(user?.role) !== "viewer";
}
