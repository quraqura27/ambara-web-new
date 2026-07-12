import { redirect } from "next/navigation";

import { requirePortalUser } from "@/lib/portal-auth";
import { hasPortalCapability } from "@/lib/portal-roles";

export async function requireConsignmentNoteUser() {
  const user = await requirePortalUser();

  if (!hasPortalCapability(user, "shipment:print")) {
    redirect("/dashboard");
  }

  return user;
}
