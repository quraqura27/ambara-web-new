import Link from "next/link";
import { Activity, Archive, ArrowRight, ExternalLink, ListTodo, MapPin, RotateCcw, Target } from "lucide-react";
import { notFound } from "next/navigation";

import { createCrmActivityAction, createCrmTaskAction, updateCrmTaskStatusForRecordAction } from "@/actions/crm-activities";
import { archiveCrmLeadAction, restoreCrmLeadAction, updateCrmLeadAction } from "@/actions/crm-leads";
import { CrmActivityForm, CrmLeadForm, CrmTaskForm } from "@/components/crm/crm-forms";
import { CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import {
  getCrmActivities,
  getCrmCompanies,
  getCrmContactOptions,
  getCrmLead,
  getCrmStaffOptions,
  getCrmTasks,
  getCrmTeamOptions,
} from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canArchiveCrm, canManageCrm, canManageCrmStage, canRestoreCrm } from "@/lib/portal-roles";
import { formatWibDate, formatWibDateTime } from "@/lib/time/wib";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function CrmLeadDetailPage({ params, searchParams }: LeadDetailPageProps) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const query = await searchParams;
  const [lead, companies, contacts, activities, tasks, staff, teams, user] = await Promise.all([
    getCrmLead(id),
    getCrmCompanies({ limit: 200 }),
    getCrmContactOptions(),
    getCrmActivities({ entityId: String(id), entityType: "lead", limit: 50 }),
    getCrmTasks({ entityId: String(id), entityType: "lead", limit: 50 }),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    getPortalUser(),
  ]);
  if (!lead) notFound();

  const canEdit = canManageCrm(user);
  const returnTo = `/crm/leads/${id}`;
  const updateAction = updateCrmLeadAction.bind(null, id);
  const archiveAction = archiveCrmLeadAction.bind(null, id);
  const restoreAction = restoreCrmLeadAction.bind(null, id);
  const terminal = ["converted", "disqualified", "dormant"].includes(lead.status);
  const overdue = Boolean(lead.actionDueAt && lead.actionDueAt < new Date() && !terminal);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader actionHref="/crm/leads" actionLabel="Back to leads" description={`${lead.ownerName}${lead.ownerTeamName ? ` · ${lead.ownerTeamName}` : ""} · Updated ${formatWibDateTime(lead.updatedAt)}`} icon={Target} title={lead.title} />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={lead.status} /><CrmStatusBadge status={lead.priority} />{lead.archivedAt ? <CrmStatusBadge status="archived" /> : null}{overdue ? <CrmStatusBadge status="overdue" /> : null}</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Company / contact</p><p className="mt-2 text-sm text-slate-300">{lead.companyId ? <Link className="text-blue-300 hover:text-blue-200" href={`/crm/companies/${lead.companyId}`}>{lead.companyName || `Company #${lead.companyId}`}</Link> : "Company not linked"}</p><p className="mt-1 text-xs text-slate-500">{lead.contactId ? <Link className="text-blue-300 hover:text-blue-200" href={`/crm/contacts/${lead.contactId}`}>{lead.contactName || `Contact #${lead.contactId}`}</Link> : "Contact not linked"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Source</p><p className="mt-2 text-sm text-slate-300">{lead.source.replace(/_/g, " ")}</p>{lead.sourceQuoteRequestId ? <Link className="mt-1 inline-flex items-center gap-1 text-xs text-blue-300" href={`/quotes/${lead.sourceQuoteRequestId}`}>Website request #{lead.sourceQuoteRequestId}<ExternalLink className="h-3 w-3" /></Link> : null}</div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Freight route</p><p className="mt-2 flex items-center gap-2 text-sm text-slate-300"><MapPin className="h-4 w-4 text-slate-600" />{lead.origin || "Origin TBD"} → {lead.destination || "Destination TBD"}</p><p className="mt-1 text-xs text-slate-500">{lead.freightType || "Service TBD"} · {lead.incoterm || "Incoterm TBD"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Cargo</p><p className="mt-2 text-sm text-slate-300">{lead.commodity || lead.cargoDescription || "Cargo details not set"}</p><p className="mt-1 text-xs text-slate-500">{lead.numPackages ?? "—"} pkg · {lead.weightKg ?? "—"} kg · {lead.volumeCbm ?? "—"} CBM</p></div>
          </div>
          {lead.notes ? <div className="mt-5 border-t border-white/5 pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Internal notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{lead.notes}</p></div> : null}
          {lead.disqualificationReason ? <div className="mt-5 border-t border-white/5 pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Disqualification reason</p><p className="mt-2 text-sm text-slate-400">{lead.disqualificationReason}</p></div> : null}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-white">Next action summary</h2>
          <p className={`mt-3 text-sm leading-6 ${overdue ? "text-rose-300" : "text-slate-300"}`}>{lead.nextAction || (terminal ? "No follow-up required for this status." : "No next action set.")}</p>
          <p className="mt-2 text-xs text-slate-500">{formatWibDateTime(lead.actionDueAt, "No due date")}</p>
          <p className="mt-2 text-xs text-slate-600">Creating, completing, or reopening linked tasks updates this summary.</p>
          {lead.readyDate ? <p className="mt-5 border-t border-white/5 pt-5 text-xs text-slate-500">Target shipment: {formatWibDate(`${lead.readyDate}T00:00:00+07:00`)}</p> : null}
          {lead.status === "qualified" && canManageCrmStage(user) ? <Link className="mt-5 block" href={`/crm/opportunities/new?leadId=${id}`}><Button className="w-full gap-2" type="button"><ArrowRight className="h-4 w-4" />Create opportunity</Button></Link> : null}
          {lead.archivedAt && canRestoreCrm(user) ? <form action={restoreAction} className="mt-5"><Button className="w-full gap-2" type="submit" variant="secondary"><RotateCcw className="h-4 w-4" />Restore lead</Button></form> : !lead.archivedAt && canArchiveCrm(user) ? <form action={archiveAction} className="mt-5 space-y-3 border-t border-white/5 pt-5"><input className={crmFieldClassName} maxLength={500} name="reason" placeholder="Archive reason" required /><Button className="w-full gap-2" type="submit" variant="danger"><Archive className="h-4 w-4" />Archive lead</Button></form> : null}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Activity timeline</h2></div>
          <div className="mt-5 space-y-4">{activities.rows.map((item) => <div className="border-l border-blue-500/20 pl-4" key={item.id}><div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={item.activityType} /><p className="text-sm font-semibold text-white">{item.subject}</p></div>{item.details ? <p className="mt-2 text-sm leading-6 text-slate-400">{item.details}</p> : null}<p className="mt-2 text-xs text-slate-500">{formatWibDateTime(item.occurredAt)} · {item.ownerName}</p></div>)}{activities.rows.length === 0 ? <p className="text-sm text-slate-500">No logged activity.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Log activity</summary><div className="mt-5"><CrmActivityForm action={createCrmActivityAction} entityId={id} entityType="lead" staff={staff} teams={teams} /></div></details> : null}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Tasks</h2></div>
          <div className="mt-5 space-y-3">{tasks.rows.map((task) => { const statusAction = updateCrmTaskStatusForRecordAction.bind(null, task.id, returnTo); return <div className="rounded-lg border border-white/5 p-4" key={task.id}><div className="flex flex-wrap gap-2"><CrmStatusBadge status={task.status} /><CrmStatusBadge status={task.priority} /></div><Link className="mt-3 block text-sm font-semibold text-white hover:text-blue-300" href={`/crm/tasks/${task.id}`}>{task.subject}</Link><p className="mt-2 text-xs text-slate-500">{formatWibDateTime(task.dueAt, "No due date")} · {task.ownerName}</p>{canEdit && ["open", "in_progress"].includes(task.status) ? <form action={statusAction} className="mt-3"><input name="status" type="hidden" value="completed" /><Button type="submit" variant="secondary">Mark complete</Button></form> : null}</div>; })}{tasks.rows.length === 0 ? <p className="text-sm text-slate-500">No linked tasks.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Create task</summary><div className="mt-5"><CrmTaskForm action={createCrmTaskAction} entityId={id} entityType="lead" staff={staff} teams={teams} /></div></details> : null}
        </Card>
      </section>
      {canEdit && !lead.archivedAt ? <details><summary className="cursor-pointer text-sm font-semibold text-blue-300">Edit lead</summary><div className="mt-6"><CrmLeadForm action={updateAction} companies={companies.rows} contacts={contacts} lead={lead} staff={staff} submitLabel="Save lead" teams={teams} /></div></details> : null}
    </div>
  );
}
