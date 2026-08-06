import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { createCrmCompanyAction } from "@/actions/crm-companies";
import { CrmCompanyForm } from "@/components/crm/crm-forms";
import { CrmPageHeader } from "@/components/crm/crm-ui";
import { getCrmLegacyCustomerOptions, getCrmStaffOptions, getCrmTeamOptions } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm, canViewCrmCompliance } from "@/lib/portal-roles";

export default async function NewCrmCompanyPage() {
  const [staff, teams, legacyCustomers, user] = await Promise.all([getCrmStaffOptions(), getCrmTeamOptions(), getCrmLegacyCustomerOptions(), getPortalUser()]);
  if (!canManageCrm(user)) redirect("/crm/companies?error=forbidden");

  return (
    <div className="space-y-8">
      <CrmPageHeader
        actionHref="/crm/companies"
        actionLabel="Back to companies"
        description="Create one neutral organization record, then assign its prospect, customer, agent, carrier, or supplier roles."
        icon={Building2}
        title="New company"
      />
      <CrmCompanyForm action={createCrmCompanyAction} canEditCompliance={canViewCrmCompliance(user)} legacyCustomers={legacyCustomers} staff={staff} submitLabel="Create company" teams={teams} />
    </div>
  );
}
