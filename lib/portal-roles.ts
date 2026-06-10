export type PortalRole = "superadmin" | "admin" | "operations" | "finance" | "staff" | "viewer";

export const portalRoleOptions: PortalRole[] = ["superadmin", "admin", "operations", "finance", "staff", "viewer"];

export function normalizePortalRole(role: string | null | undefined): PortalRole {
  const normalized = String(role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (["superadmin