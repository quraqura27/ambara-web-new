import { redirect } from "next/navigation";

import { requirePortalUser, type PortalUser } from "@/lib/portal-auth";

export type PortalRole = "superadmin" | "admin" | "operations" | "finance" | "staff" | "viewer";

export const portalRoleOptions: PortalRole[] = [
  "superadmin",
  "admin",
  "operations",
  "finance",
  "staff",
  "viewer",
];

export function normalizePortalRole(role