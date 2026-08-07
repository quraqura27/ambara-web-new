import { UserRoundPlus } from "lucide-react";
import { redirect } from "next/navigation";

import { createCrmContactAction } from "@/actions/crm-companies";
import { CrmContactForm } from "@/components/crm/crm-forms";
import { CrmPageHeader } from "@/components/crm/crm-ui";
import { getCrmCompanies, getCrmStaffOptions, getCrmTeamOptions } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm } from "@/lib/portal-roles";

export default async function NewCrmContactPage() {
  const [companies, staff, teams, user] = await Promise.all([
    getCrmCompanies({ limit: 200 }),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    getPortalUser(),
  ]);
  if (!canManageCrm(user)) redirect("/crm/contacts?error=forbidden");

  return (
    <div className="space-y-8">
      <CrmPageHeader
        actionHref="/crm/contacts"
        actionLabel="Back to contacts"
        description="Create one person record and link it to a Company when the relationship is known."
        icon={UserRoundPlus}
        title="New contact"
      />
      <CrmContactForm action={createCrmContactAction} companies={companies.rows} staff={staff} submitLabel="Create contact" teams={teams} />
    </div>
  );
}
