import Link from "next/link";
import { Activity, Archive, CircleDollarSign, ExternalLink, ListTodo, RotateCcw } from "lucide-react";
import { notFound } from "next/navigation";

import { createCrmActivityAction, createCrmTaskAction, updateCrmTaskStatusForRecordAction } from "@/actions/crm-activities";
import { archiveCrmOpportunityAction, changeCrmOpportunityStageAction, restoreCrmOpportunityAction, updateCrmOpportunityAction } from "@/actions/crm-opportunities";
import { CrmActivityForm, CrmOpportunityForm, CrmTaskForm } from "@/components/crm/crm-forms";
import { CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { crmOpportunityStageValues } from "@/lib/crm/constants";
import {
  getCrmActivities,
  getCrmCompanies,
  getCrmContactOptions,
  getCrmLead,
  getCrmLeads,
  getCrmOpportunity,
  getCrmStaffOptions,
  getCrmTasks,
  getCrmTeamOptions,
} from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canArchiveCrm, canManageCrm, canManageCrmStage, canRestoreCrm } from "@/lib/portal-roles";
import { formatWibDate, formatWibDateTime } from "@/lib/time/wib";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

function label(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function money(value: string | null, currency: string) { return value ? new Intl.NumberFormat("en-US", { currency, maximumFractionDigits: 0, style: "currency" }).format(Number(value)) : "Value not set"; }

function stageChoices(current: string) {
  const active = crmOpportunityStageValues.slice(0, 8);
  if (current === "won" || current === "lost") return [current];
  if (current === "on_hold") return ["on_hold", "qualification", "lost"];
  const index = active.indexOf(current as (typeof active)[number]);
  const choices = new Set<string>([current, "on_hold", "lost"]);
  if (index > 0) choices.add(active[index - 1]!);
  if (index >= 0 && index < active.length - 1) choices.add(active[index + 1]!);
  if (["quotation_sent", "negotiation", "verbal_confirmation"].includes(current)) choices.add("won");
  return crmOpportunityStageValues.filter((stage) => choices.has(stage));
}

export default async function CrmOpportunityDetailPage({ params, searchParams }: OpportunityDetailPageProps) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const query = await searchParams;
  const opportunity = await getCrmOpportunity(id);
  if (!opportunity) notFound();
  const [companies, contacts, qualifiedLeads, sourceLead, activities, tasks, staff, teams, user] = await Promise.all([
    getCrmCompanies({ limit: 200 }),
    getCrmContactOptions(),
    getCrmLeads({ limit: 200, status: "qualified" }),
    opportunity.leadId ? getCrmLead(opportunity.leadId) : Promise.resolve(null),
    getCrmActivities({ entityId: String(id), entityType: "opportunity", limit: 50 }),
    getCrmTasks({ entityId: String(id), entityType: "opportunity", limit: 50 }),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    getPortalUser(),
  ]);
  const leadOptions = sourceLead
    ? [{ id: sourceLead.id, title: sourceLead.title }, ...qualifiedLeads.rows.filter((lead) => lead.id !== sourceLead.id)]
    : qualifiedLeads.rows;
  const canEdit = canManageCrm(user);
  const returnTo = `/crm/opportunities/${id}`;
  const updateAction = updateCrmOpportunityAction.bind(null, id);
  const stageAction = changeCrmOpportunityStageAction.bind(null, id);
  const archiveAction = archiveCrmOpportunityAction.bind(null, id);
  const restoreAction = restoreCrmOpportunityAction.bind(null, id);
  const overdue = Boolean(opportunity.actionDueAt && opportunity.actionDueAt < new Date() && opportunity.status === "open");

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader actionHref="/crm/pipeline" actionLabel="Back to pipeline" description={`${opportunity.ownerName}${opportunity.ownerTeamName ? ` · ${opportunity.ownerTeamName}` : ""} · Updated ${formatWibDateTime(opportunity.updatedAt)}`} icon={CircleDollarSign} title={opportunity.title} />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={opportunity.stage} /><CrmStatusBadge status={opportunity.status} />{opportunity.archivedAt ? <CrmStatusBadge status="archived" /> : null}{overdue ? <CrmStatusBadge status="overdue" /> : null}</div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Company / contact</p><p className="mt-2 text-sm text-slate-300">{opportunity.companyId ? <Link className="text-blue-300 hover:text-blue-200" href={`/crm/companies/${opportunity.companyId}`}>{opportunity.companyName || `Company #${opportunity.companyId}`}</Link> : "Company not linked"}</p><p className="mt-1 text-xs text-slate-500">{opportunity.primaryContactId ? <Link className="text-blue-300 hover:text-blue-200" href={`/crm/contacts/${opportunity.primaryContactId}`}>{opportunity.primaryContactName || `Contact #${opportunity.primaryContactId}`}</Link> : "Contact not linked"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Source lead</p><p className="mt-2 text-sm text-slate-300">{sourceLead ? <Link className="text-blue-300 hover:text-blue-200" href={`/crm/leads/${sourceLead.id}`}>{sourceLead.title}</Link> : "Direct opportunity"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Forecast</p><p className="mt-2 text-lg font-semibold text-white">{money(opportunity.estimatedValue, opportunity.currency)}</p><p className="mt-1 text-xs text-slate-500">{opportunity.probability}% probability · {opportunity.expectedCloseDate ? formatWibDate(`${opportunity.expectedCloseDate}T00:00:00+07:00`) : "No close date"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Route / service</p><p className="mt-2 text-sm text-slate-300">{opportunity.origin || "Origin TBD"} → {opportunity.destination || "Destination TBD"}</p><p className="mt-1 text-xs text-slate-500">{opportunity.freightType || "Service TBD"} · {opportunity.incoterm || "Incoterm TBD"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Cargo</p><p className="mt-2 text-sm text-slate-300">{opportunity.commodity || opportunity.cargoDescription || "Not set"}</p><p className="mt-1 text-xs text-slate-500">{opportunity.weightKg || "—"} kg · {opportunity.volumeCbm || "—"} CBM</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Quotation bridge</p><p className="mt-2 text-sm text-slate-300">{opportunity.externalQuotationReference || "No reference"}</p><div className="mt-1 flex items-center gap-2"><CrmStatusBadge status={opportunity.externalQuotationStatus} />{opportunity.externalQuotationUrl ? <a className="inline-flex items-center gap-1 text-xs text-blue-300" href={opportunity.externalQuotationUrl} rel="noreferrer" target="_blank">Open<ExternalLink className="h-3 w-3" /></a> : null}</div></div>
          </div>
          {opportunity.notes ? <div className="mt-6 border-t border-white/5 pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Internal notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{opportunity.notes}</p></div> : null}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-white">Next action summary</h2><p className={`mt-3 text-sm leading-6 ${overdue ? "text-rose-300" : "text-slate-300"}`}>{opportunity.nextAction || "No next action set."}</p><p className="mt-2 text-xs text-slate-500">{formatWibDateTime(opportunity.actionDueAt, "No due date")}</p><p className="mt-2 text-xs text-slate-600">Linked task changes keep this summary synchronized.</p>
          {canManageCrmStage(user) && !opportunity.archivedAt ? <form action={stageAction} className="mt-5 space-y-3 border-t border-white/5 pt-5"><label className="space-y-2"><span className="text-xs text-slate-500">Move stage</span><select className={crmFieldClassName} defaultValue={opportunity.stage} name="stage">{stageChoices(opportunity.stage).map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</select></label><label className="space-y-2"><span className="text-xs text-slate-500">Lost reason (required when lost)</span><input className={crmFieldClassName} defaultValue={opportunity.lostReason ?? ""} maxLength={1000} name="lostReason" /></label><Button className="w-full" type="submit" variant="secondary">Update stage</Button></form> : null}
          {opportunity.archivedAt && canRestoreCrm(user) ? <form action={restoreAction} className="mt-5"><Button className="w-full gap-2" type="submit" variant="secondary"><RotateCcw className="h-4 w-4" />Restore opportunity</Button></form> : !opportunity.archivedAt && canArchiveCrm(user) ? <form action={archiveAction} className="mt-5 space-y-3 border-t border-white/5 pt-5"><input className={crmFieldClassName} maxLength={500} name="reason" placeholder="Archive reason" required /><Button className="w-full gap-2" type="submit" variant="danger"><Archive className="h-4 w-4" />Archive opportunity</Button></form> : null}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Activity timeline</h2></div>
          <div className="mt-5 space-y-4">{activities.rows.map((item) => <div className="border-l border-blue-500/20 pl-4" key={item.id}><div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={item.activityType} /><p className="text-sm font-semibold text-white">{item.subject}</p></div>{item.details ? <p className="mt-2 text-sm leading-6 text-slate-400">{item.details}</p> : null}<p className="mt-2 text-xs text-slate-500">{formatWibDateTime(item.occurredAt)} · {item.ownerName}</p></div>)}{activities.rows.length === 0 ? <p className="text-sm text-slate-500">No logged activity.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Log activity</summary><div className="mt-5"><CrmActivityForm action={createCrmActivityAction} entityId={id} entityType="opportunity" staff={staff} teams={teams} /></div></details> : null}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Tasks</h2></div>
          <div className="mt-5 space-y-3">{tasks.rows.map((task) => { const statusAction = updateCrmTaskStatusForRecordAction.bind(null, task.id, returnTo); return <div className="rounded-lg border border-white/5 p-4" key={task.id}><div className="flex flex-wrap gap-2"><CrmStatusBadge status={task.status} /><CrmStatusBadge status={task.priority} /></div><Link className="mt-3 block text-sm font-semibold text-white hover:text-blue-300" href={`/crm/tasks/${task.id}`}>{task.subject}</Link><p className="mt-2 text-xs text-slate-500">{formatWibDateTime(task.dueAt, "No due date")} · {task.ownerName}</p>{canEdit && ["open", "in_progress"].includes(task.status) ? <form action={statusAction} className="mt-3"><input name="status" type="hidden" value="completed" /><Button type="submit" variant="secondary">Mark complete</Button></form> : null}</div>; })}{tasks.rows.length === 0 ? <p className="text-sm text-slate-500">No linked tasks.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Create task</summary><div className="mt-5"><CrmTaskForm action={createCrmTaskAction} entityId={id} entityType="opportunity" staff={staff} teams={teams} /></div></details> : null}
        </Card>
      </section>
      {canEdit && !opportunity.archivedAt ? <details><summary className="cursor-pointer text-sm font-semibold text-blue-300">Edit opportunity</summary><div className="mt-6"><CrmOpportunityForm action={updateAction} companies={companies.rows} contacts={contacts} leads={leadOptions} opportunity={opportunity} sourceLeadLocked staff={staff} submitLabel="Save opportunity" teams={teams} /></div></details> : null}
    </div>
  );
}
