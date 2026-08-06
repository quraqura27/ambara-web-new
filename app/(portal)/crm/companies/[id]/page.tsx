import Link from "next/link";
import { Activity, Archive, Building2, ListTodo, Mail, MapPin, Phone, RotateCcw, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";

import {
  createCrmActivityAction,
  createCrmTaskAction,
  updateCrmTaskStatusForRecordAction,
} from "@/actions/crm-activities";
import {
  archiveCrmCompanyAction,
  createCrmContactAction,
  restoreCrmCompanyAction,
  updateCrmCompanyAction,
} from "@/actions/crm-companies";
import { CrmActivityForm, CrmCompanyForm, CrmContactForm, CrmTaskForm } from "@/components/crm/crm-forms";
import { CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import {
  getCrmActivities,
  getCrmCompany,
  getCrmLeads,
  getCrmLegacyCustomerOptions,
  getCrmOpportunities,
  getCrmStaffOptions,
  getCrmTasks,
  getCrmTeamOptions,
} from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canArchiveCrm, canManageCrm, canRestoreCrm, canViewCrmCompliance } from "@/lib/portal-roles";
import { formatWibDateTime } from "@/lib/time/wib";

type CompanyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function CrmCompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const query = await searchParams;
  const [company, leads, opportunities, activities, tasks, staff, teams, legacyCustomers, user] = await Promise.all([
    getCrmCompany(id),
    getCrmLeads({ companyId: id, limit: 50 }),
    getCrmOpportunities({ companyId: id, limit: 50 }),
    getCrmActivities({ entityId: String(id), entityType: "company", limit: 50 }),
    getCrmTasks({ entityId: String(id), entityType: "company", limit: 50 }),
    getCrmStaffOptions(),
    getCrmTeamOptions(),
    getCrmLegacyCustomerOptions(),
    getPortalUser(),
  ]);
  if (!company) notFound();

  const canEdit = canManageCrm(user);
  const returnTo = `/crm/companies/${id}`;
  const updateAction = updateCrmCompanyAction.bind(null, id);
  const archiveAction = archiveCrmCompanyAction.bind(null, id);
  const restoreAction = restoreCrmCompanyAction.bind(null, id);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader
        actionHref="/crm/companies"
        actionLabel="Back to companies"
        description={`${company.ownerName}${company.ownerTeamName ? ` · ${company.ownerTeamName}` : ""} · Updated ${formatWibDateTime(company.updatedAt)}`}
        icon={Building2}
        title={company.displayName || company.legalName}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">{company.roles.map((role) => <CrmStatusBadge key={role} status={role} />)}{company.archivedAt ? <CrmStatusBadge status="archived" /> : null}</div>
          {company.displayName ? <p className="mt-4 text-sm text-slate-300">Legal name: {company.legalName}</p> : null}
          <div className="mt-5 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-600" />{company.email || "No general email"}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-600" />{company.phone || "No general phone"}</p>
            <p className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-600" />{[company.addressLine1, company.addressLine2, company.city, company.province, company.postalCode, company.countryCode].filter(Boolean).join(", ") || "Address not set"}</p>
          </div>
          {company.industry || company.taxId || company.nib ? <div className="mt-5 grid gap-3 border-t border-white/5 pt-5 text-xs text-slate-500 sm:grid-cols-3"><p>Industry<br /><span className="text-sm text-slate-300">{company.industry || "—"}</span></p>{canViewCrmCompliance(user) ? <><p>Tax / NPWP<br /><span className="text-sm text-slate-300">{company.taxId || "—"}</span></p><p>NIB<br /><span className="text-sm text-slate-300">{company.nib || "—"}</span></p></> : null}</div> : null}
          {company.notes ? <p className="mt-5 whitespace-pre-wrap border-t border-white/5 pt-5 text-sm leading-6 text-slate-400">{company.notes}</p> : null}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-white">Record controls</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Archive is reversible and preserves related commercial history.</p>
          {company.archivedAt && canRestoreCrm(user) ? <form action={restoreAction} className="mt-5"><Button className="w-full gap-2" type="submit" variant="secondary"><RotateCcw className="h-4 w-4" />Restore company</Button></form> : !company.archivedAt && canArchiveCrm(user) ? <form action={archiveAction} className="mt-5 space-y-3"><input className={crmFieldClassName} maxLength={500} name="reason" placeholder="Archive reason" required /><Button className="w-full gap-2" type="submit" variant="danger"><Archive className="h-4 w-4" />Archive company</Button></form> : <p className="mt-5 text-sm text-slate-600">No archive action is available for your role.</p>}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Contacts</h2></div>
          <div className="mt-5 space-y-3">{company.contacts.map((contact) => <Link className="block rounded-lg border border-white/5 p-4 hover:border-blue-500/30" href={`/crm/contacts/${contact.id}`} key={contact.id}><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{contact.fullName}</p>{contact.isPrimary ? <CrmStatusBadge status="primary" /> : null}</div><p className="mt-1 text-xs text-slate-500">{contact.jobTitle || "Title not set"}</p><p className="mt-3 text-xs text-slate-400">{contact.email || contact.whatsapp || contact.phone || "No contact channel"}</p></Link>)}{company.contacts.length === 0 ? <p className="text-sm text-slate-500">No contacts yet.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Add contact</summary><div className="mt-5"><CrmContactForm action={createCrmContactAction} companyId={id} staff={staff} teams={teams} /></div></details> : null}
        </Card>
        <Card className="p-5 sm:p-6"><h2 className="font-semibold text-white">Leads</h2><div className="mt-5 space-y-3">{leads.rows.map((lead) => <Link className="block rounded-lg border border-white/5 p-4 hover:border-blue-500/30" href={`/crm/leads/${lead.id}`} key={lead.id}><div className="flex items-start justify-between gap-3"><p className="font-semibold text-white">{lead.title}</p><CrmStatusBadge status={lead.status} /></div><p className="mt-2 text-xs text-slate-500">{lead.ownerName}</p></Link>)}{leads.rows.length === 0 ? <p className="text-sm text-slate-500">No linked leads.</p> : null}</div></Card>
        <Card className="p-5 sm:p-6"><h2 className="font-semibold text-white">Opportunities</h2><div className="mt-5 space-y-3">{opportunities.rows.map((opportunity) => <Link className="block rounded-lg border border-white/5 p-4 hover:border-blue-500/30" href={`/crm/opportunities/${opportunity.id}`} key={opportunity.id}><div className="flex items-start justify-between gap-3"><p className="font-semibold text-white">{opportunity.title}</p><CrmStatusBadge status={opportunity.stage} /></div><p className="mt-2 text-xs text-slate-500">{opportunity.ownerName}</p></Link>)}{opportunities.rows.length === 0 ? <p className="text-sm text-slate-500">No linked opportunities.</p> : null}</div></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Activity timeline</h2></div>
          <div className="mt-5 space-y-4">{activities.rows.map((item) => <div className="border-l border-blue-500/20 pl-4" key={item.id}><div className="flex flex-wrap items-center gap-2"><CrmStatusBadge status={item.activityType} /><p className="text-sm font-semibold text-white">{item.subject}</p></div>{item.details ? <p className="mt-2 text-sm leading-6 text-slate-400">{item.details}</p> : null}<p className="mt-2 text-xs text-slate-500">{formatWibDateTime(item.occurredAt)} · {item.ownerName}</p></div>)}{activities.rows.length === 0 ? <p className="text-sm text-slate-500">No logged activity.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Log activity</summary><div className="mt-5"><CrmActivityForm action={createCrmActivityAction} entityId={id} entityType="company" staff={staff} teams={teams} /></div></details> : null}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-blue-300" /><h2 className="font-semibold text-white">Tasks</h2></div>
          <div className="mt-5 space-y-3">{tasks.rows.map((task) => { const statusAction = updateCrmTaskStatusForRecordAction.bind(null, task.id, returnTo); return <div className="rounded-lg border border-white/5 p-4" key={task.id}><div className="flex flex-wrap gap-2"><CrmStatusBadge status={task.status} /><CrmStatusBadge status={task.priority} /></div><Link className="mt-3 block text-sm font-semibold text-white hover:text-blue-300" href={`/crm/tasks/${task.id}`}>{task.subject}</Link><p className="mt-2 text-xs text-slate-500">{formatWibDateTime(task.dueAt, "No due date")} · {task.ownerName}</p>{canEdit && ["open", "in_progress"].includes(task.status) ? <form action={statusAction} className="mt-3"><input name="status" type="hidden" value="completed" /><Button type="submit" variant="secondary">Mark complete</Button></form> : null}</div>; })}{tasks.rows.length === 0 ? <p className="text-sm text-slate-500">No linked tasks.</p> : null}</div>
          {canEdit ? <details className="mt-5 border-t border-white/5 pt-5"><summary className="cursor-pointer text-sm font-semibold text-blue-300">Create task</summary><div className="mt-5"><CrmTaskForm action={createCrmTaskAction} entityId={id} entityType="company" staff={staff} teams={teams} /></div></details> : null}
        </Card>
      </section>

      {canEdit && !company.archivedAt ? <details><summary className="cursor-pointer text-sm font-semibold text-blue-300">Edit company record</summary><div className="mt-6"><CrmCompanyForm action={updateAction} canEditCompliance={canViewCrmCompliance(user)} company={company} legacyCustomers={legacyCustomers} staff={staff} submitLabel="Save company" teams={teams} /></div></details> : null}
      <p className="text-xs text-slate-600">Created {formatWibDateTime(company.createdAt)}{company.legacyCustomerId ? <> · Linked to legacy customer <Link className="text-blue-300" href={`/customers/${company.legacyCustomerId}`}>#{company.legacyCustomerId}</Link></> : null}</p>
    </div>
  );
}
