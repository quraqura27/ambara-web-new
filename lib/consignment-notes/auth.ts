import { redirect } from "next/navigation";

import { requirePortalUser } from "@/lib/portal-auth";

const consignmentNoteRoles = new Set(["admin", "superadmin", "operations"]);

export async function requireConsignmentNoteUser() {
  const user = await requirePortalUser();

  if (!consignmentNoteRoles.has(user.role.trim().toLowerCase())) {
    redirect("/dashboard");
  }

  return user;
}
