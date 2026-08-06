import Link from "next/link";
import { AlertTriangle, MapPin, Plus, Search, Target } from "lucide-react";

import { CrmEmptyState, CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { crmLeadStatusValues } from "@/lib/crm/core";
import { getCrmLeads } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm, canRestoreCrm } from "@/lib/portal-roles";
import { formatWibDateTime } from "@/lib/time/wib";

type LeadsPageProps = { searchParams: Promise<{ archived?: string; error?: string; notice?: string; search?: string; status?: string }> };

function label(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }

function isOverdue(value: Date | null, status: string) {
  return Boolean(value && value < new Date() && !["converted", "disqualified", "dormant"].includes(status));
}

export default async function CrmLeadsPage({ searchParams }: LeadsPageProps) {
  const query = await searchParams;
  const [result, user] = await Promise.all([
    getCrmLeads({ includeArchived: query.archived === "yes", search: query.search || undefined, status: query.status || undefined }),
    getPortalUser(),
  ]);
  const canCreate = canManageCrm(user);
  return <div className="space-y-8">
    <CrmMessageBanner error={query.error} notice={query.notice} />
    <CrmPageHeader actionHref={canCreate ? "/crm/leads/new" : undefined} actionLabel={canCreate ? "New lead" : undefined} description="Qualify freight inquiries and keep every open lead tied to an owner and next action." icon={Plus} title="Leads" />
    <Card className="p-5"><form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px_auto_auto] sm:items-end"><label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Search</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input className={`${crmFieldClassName} pl-10`} defaultValue={query.search ?? ""} name="search" placeholder="Lead, company, contact, route, commodity" /></span></label><label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Status</span><select className={crmFieldClassName} defaultValue={query.status ?? ""} name="status"><option value="">All statuses</option>{crmLeadStatusValues.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>{canRestoreCrm(user) ? <label className="flex h-10 items-center gap-2 text-sm text-slate-400"><input defaultChecked={query.archived === "yes"} name="archived" type="checkbox" value="yes" />Include archived</label> : null}<Button type="submit" variant="secondary">Apply filters</Button></form></Card>
    {result.rows.length === 0 ? <CrmEmptyState actionHref={canCreate ? "/crm/leads/new" : undefined} actionLabel={canCreate ? "Create lead" : undefined} description="No leads match this authorized scope and filter." icon={Target} title="No leads found" /> : <Card className="p-0">
      <div className="divide-y divide-white/5 md:hidden">{result.rows.map((lead) => { const overdue = isOverdue(lead.actionDueAt, lead.status); return <Link className="block space-y-4 p-5 hover:bg-white/[0.02]" href={`/crm/leads/${lead.id}`} key={lead.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-white">{lead.title}</h2><p className="mt-1 truncate text-xs text-slate-500">{lead.companyName || lead.contactName || label(lead.source)}</p></div><CrmStatusBadge status={lead.status} /></div><p className="flex items-center gap-2 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />{lead.origin || "Origin TBD"} → {lead.destination || "Destination TBD"}</p><div className="flex items-center justify-between gap-3 text-xs"><span className={overdue ? "flex items-center gap-1 text-rose-300" : "text-slate-500"}>{overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : null}{lead.nextAction || "No next action"}{lead.actionDueAt ? ` · ${formatWibDateTime(lead.actionDueAt)}` : ""}</span><span className="text-slate-500">{lead.ownerName}</span></div></Link>; })}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1050px] text-left"><thead><tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500"><th className="px-5 py-4">Lead</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Route / service</th><th className="px-5 py-4">Next action</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Priority</th></tr></thead><tbody className="divide-y divide-white/5">{result.rows.map((lead) => { const overdue = isOverdue(lead.actionDueAt, lead.status); return <tr className="hover:bg-white/[0.02]" key={lead.id}><td className="px-5 py-4"><Link className="font-semibold text-white hover:text-blue-300" href={`/crm/leads/${lead.id}`}>{lead.title}</Link><p className="mt-1 text-xs text-slate-500">{lead.companyName || lead.contactName || label(lead.source)}</p></td><td className="px-5 py-4"><CrmStatusBadge status={lead.status} /></td><td className="px-5 py-4 text-sm text-slate-400">{lead.origin || "TBD"} → {lead.destination || "TBD"}<p className="mt-1 text-xs text-slate-600">{lead.freightType ? label(lead.freightType) : "Service TBD"}</p></td><td className={`px-5 py-4 text-xs ${overdue ? "text-rose-300" : "text-slate-400"}`}>{lead.nextAction || "No next action"}<p className="mt-1">{formatWibDateTime(lead.actionDueAt)}</p></td><td className="px-5 py-4 text-sm text-slate-300">{lead.ownerName}</td><td className="px-5 py-4"><CrmStatusBadge status={lead.priority} /></td></tr>; })}</tbody></table></div>
    </Card>}
  </div>;
}
