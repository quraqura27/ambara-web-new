import Link from "next/link";
import { CircleDollarSign, Columns3, List, Plus, Search } from "lucide-react";

import { CrmEmptyState, CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { crmOpportunityStageValues, crmOpportunityStatusValues } from "@/lib/crm/constants";
import { getCrmOpportunities } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrmStage } from "@/lib/portal-roles";
import { formatWibDate } from "@/lib/time/wib";

type PipelinePageProps = { searchParams: Promise<{ error?: string; notice?: string; search?: string; stage?: string; status?: string; view?: string }> };
function label(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function money(value: string | null, currency: string) { return value ? new Intl.NumberFormat("en-US", { currency, maximumFractionDigits: 0, style: "currency" }).format(Number(value)) : "Value TBD"; }

export default async function CrmPipelinePage({ searchParams }: PipelinePageProps) {
  const query = await searchParams;
  const [result, user] = await Promise.all([
    getCrmOpportunities({ search: query.search || undefined, stage: query.stage || undefined, status: query.status || undefined }),
    getPortalUser(),
  ]);
  const tableView = query.view === "table";
  const canCreate = canManageCrmStage(user);
  const stages = query.stage ? crmOpportunityStageValues.filter((stage) => stage === query.stage) : crmOpportunityStageValues;

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader actionHref={canCreate ? "/crm/opportunities/new" : undefined} actionLabel={canCreate ? "New opportunity" : undefined} description="A freight-specific pipeline from inquiry and qualification through rate sourcing, quotation, negotiation, and outcome." icon={Plus} title="Sales pipeline" />
      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto] lg:items-end">
          <input name="view" type="hidden" value={tableView ? "table" : "board"} />
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Search</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input className={`${crmFieldClassName} pl-10`} defaultValue={query.search ?? ""} name="search" placeholder="Opportunity, company, route, quote reference" /></span></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Stage</span><select className={crmFieldClassName} defaultValue={query.stage ?? ""} name="stage"><option value="">All stages</option>{crmOpportunityStageValues.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</select></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Status</span><select className={crmFieldClassName} defaultValue={query.status ?? ""} name="status"><option value="">All statuses</option>{crmOpportunityStatusValues.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
          <Button type="submit" variant="secondary">Apply filters</Button>
        </form>
        <div className="mt-4 flex justify-end gap-2"><Link href={{ pathname: "/crm/pipeline", query: { ...query, view: "board" } }}><Button className="gap-2" type="button" variant={!tableView ? "primary" : "ghost"}><Columns3 className="h-4 w-4" />Board</Button></Link><Link href={{ pathname: "/crm/pipeline", query: { ...query, view: "table" } }}><Button className="gap-2" type="button" variant={tableView ? "primary" : "ghost"}><List className="h-4 w-4" />Table</Button></Link></div>
      </Card>
      {result.rows.length === 0 ? <CrmEmptyState actionHref={canCreate ? "/crm/opportunities/new" : undefined} actionLabel={canCreate ? "Create opportunity" : undefined} description="No opportunities match this authorized scope and filter." icon={CircleDollarSign} title="No opportunities found" /> : tableView ? (
        <Card className="p-0">
          <div className="divide-y divide-white/5 md:hidden">{result.rows.map((opportunity) => <Link className="block space-y-3 p-5 hover:bg-white/[0.02]" href={`/crm/opportunities/${opportunity.id}`} key={opportunity.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-white">{opportunity.title}</h2><p className="mt-1 truncate text-xs text-slate-500">{opportunity.companyName || "Company not linked"}</p></div><CrmStatusBadge status={opportunity.stage} /></div><div className="flex items-center justify-between text-xs text-slate-400"><span>{money(opportunity.estimatedValue, opportunity.currency)} · {opportunity.probability}%</span><span>{opportunity.expectedCloseDate ? formatWibDate(`${opportunity.expectedCloseDate}T00:00:00+07:00`) : "No close date"}</span></div><p className="text-xs text-slate-500">{opportunity.ownerName}</p></Link>)}</div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1100px] text-left"><thead><tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500"><th className="px-5 py-4">Opportunity</th><th className="px-5 py-4">Stage</th><th className="px-5 py-4">Value</th><th className="px-5 py-4">Probability</th><th className="px-5 py-4">Expected close</th><th className="px-5 py-4">Owner</th></tr></thead><tbody className="divide-y divide-white/5">{result.rows.map((opportunity) => <tr className="hover:bg-white/[0.02]" key={opportunity.id}><td className="px-5 py-4"><Link className="font-semibold text-white hover:text-blue-300" href={`/crm/opportunities/${opportunity.id}`}>{opportunity.title}</Link><p className="mt-1 text-xs text-slate-500">{opportunity.companyName || "Company not linked"}</p></td><td className="px-5 py-4"><CrmStatusBadge status={opportunity.stage} /></td><td className="px-5 py-4 text-sm text-slate-300">{money(opportunity.estimatedValue, opportunity.currency)}</td><td className="px-5 py-4 text-sm text-slate-300">{opportunity.probability}%</td><td className="px-5 py-4 text-xs text-slate-500">{opportunity.expectedCloseDate || "Not set"}</td><td className="px-5 py-4 text-sm text-slate-300">{opportunity.ownerName}</td></tr>)}</tbody></table></div>
        </Card>
      ) : (
        <div className="grid w-full gap-4 lg:flex lg:min-w-max lg:overflow-x-auto lg:pb-3">
          {stages.map((stage) => {
            const rows = result.rows.filter((item) => item.stage === stage);
            return <section className="w-full rounded-lg border border-white/5 bg-white/[0.015] p-3 lg:w-[290px] lg:shrink-0" key={stage}><div className="flex items-center justify-between gap-3 px-1 py-2"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{label(stage)}</h2><span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-500">{rows.length}</span></div><div className="mt-2 grid gap-3 sm:grid-cols-2 lg:block lg:space-y-3">{rows.map((opportunity) => <Link href={`/crm/opportunities/${opportunity.id}`} key={opportunity.id}><Card className="h-full p-4 transition hover:border-blue-500/30"><div className="flex items-start justify-between gap-2"><h3 className="line-clamp-2 text-sm font-semibold text-white">{opportunity.title}</h3><CrmStatusBadge status={opportunity.status} /></div><p className="mt-2 truncate text-xs text-slate-500">{opportunity.companyName || "Company not linked"}</p><p className="mt-4 text-sm font-semibold text-slate-200">{money(opportunity.estimatedValue, opportunity.currency)}</p><div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500"><span>{opportunity.probability}%</span><span>{opportunity.expectedCloseDate ? formatWibDate(`${opportunity.expectedCloseDate}T00:00:00+07:00`) : "No close date"}</span></div><p className="mt-3 truncate border-t border-white/5 pt-3 text-xs text-slate-500">{opportunity.ownerName}</p></Card></Link>)}{rows.length === 0 ? <p className="rounded-lg border border-dashed border-white/5 p-6 text-center text-xs text-slate-600 sm:col-span-2 lg:col-span-1">No records</p> : null}</div></section>;
          })}
        </div>
      )}
    </div>
  );
}
