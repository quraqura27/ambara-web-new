import { CircleDollarSign } from "lucide-react";
import { redirect } from "next/navigation";

import { createCrmOpportunityAction } from "@/actions/crm-opportunities";
import { CrmOpportunityForm } from "@/components/crm/crm-forms";
import { CrmPageHeader } from "@/components/crm/crm-ui";
import {
  getCrmCompanies,
  getCrmContactOptions,
  getCrmLead,
  getCrmLeads,
  getCrmStaffOptions,
  getCrmTeamOptions,
} from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrmStage } from "@/lib/portal-roles";

type NewCrmOpportunityPageProps = { searchParams: Promise<{ leadId?: string }> };

export default async function NewCrmOpportunityPage({ searchParams }: NewCrmOpportunityPageProps) {
  const requestedLeadId = Number.parseInt((await searchParams).leadId ?? "", 10);
  const [companies, contacts, leads, staff, teams, sourceLead, user] = await Promise.all([
    getCrmCompanies({ limit: 200 }),
    getCrmContactOptions(),
    getCrmLeads({ limit: 200, status: "qualified" }),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    Number.isInteger(requestedLeadId) && requestedLeadId > 0 ? getCrmLead(requestedLeadId) : Promise.resolve(null),
    getPortalUser(),
  ]);
  if (!canManageCrmStage(user)) redirect("/crm/pipeline?error=forbidden");
  const defaults = sourceLead?.status === "qualified" ? {
    cargoDescription: sourceLead.cargoDescription,
    commodity: sourceLead.commodity,
    companyId: sourceLead.companyId,
    destination: sourceLead.destination,
    freightType: sourceLead.freightType,
    incoterm: sourceLead.incoterm,
    leadId: sourceLead.id,
    nextAction: sourceLead.nextAction,
    origin: sourceLead.origin,
    ownerId: sourceLead.ownerId,
    ownerTeamId: sourceLead.ownerTeamId,
    primaryContactId: sourceLead.contactId,
    title: sourceLead.title,
    volumeCbm: sourceLead.volumeCbm,
    weightKg: sourceLead.weightKg,
  } : null;

  return (
    <div className="space-y-8">
      <CrmPageHeader
        actionHref="/crm/pipeline"
        actionLabel="Back to pipeline"
        description="Create a forecastable freight opportunity with one owner, stage, probability, closing date, and next action."
        icon={CircleDollarSign}
        title="New opportunity"
      />
      <CrmOpportunityForm
        action={createCrmOpportunityAction}
        companies={companies.rows}
        contacts={contacts}
        leads={leads.rows}
        opportunity={defaults}
        staff={staff}
        submitLabel="Create opportunity"
        teams={teams}
      />
    </div>
  );
}
