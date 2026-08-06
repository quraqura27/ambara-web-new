import { Target } from "lucide-react";
import { redirect } from "next/navigation";

import { createCrmLeadAction } from "@/actions/crm-leads";
import { CrmLeadForm } from "@/components/crm/crm-forms";
import { CrmPageHeader } from "@/components/crm/crm-ui";
import {
  getCrmCompanies,
  getCrmContactOptions,
  getCrmStaffOptions,
  getCrmTeamOptions,
} from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm } from "@/lib/portal-roles";

export default async function NewCrmLeadPage() {
  const [companies, contacts, staff, teams, user] = await Promise.all([
    getCrmCompanies({ limit: 200 }),
    getCrmContactOptions(),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    getPortalUser(),
  ]);
  if (!canManageCrm(user)) redirect("/crm/leads?error=forbidden");

  return (
    <div className="space-y-8">
      <CrmPageHeader
        actionHref="/crm/leads"
        actionLabel="Back to leads"
        description="Capture a WhatsApp, email, referral, partner, existing-customer, outreach, or other freight inquiry."
        icon={Target}
        title="New lead"
      />
      <CrmLeadForm
        action={createCrmLeadAction}
        companies={companies.rows}
        contacts={contacts}
        staff={staff}
        submitLabel="Create lead"
        teams={teams}
      />
    </div>
  );
}
