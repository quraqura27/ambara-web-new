import Link from "next/link";
import { CircleDollarSign, Columns3, Plus, Search } from "lucide-react";

import { CrmEmptyState, CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { crmOpportunityStageValues, crmOpportunityStatusValues } from "@/lib/crm/constants";
import { getCrmOpportunities } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrmStage, canRestoreCrm } from "@/lib/portal-roles";
import { formatWibDate } from "@/lib/time/wib";

type OpportunitiesPageProps = { searchParams: Promise<{ archived?: string; error?: string; notice?: string; search?: string; stage?: string; status?: string }> };
function label(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function money(value: string | null, currency: string) { return value ? new Intl.NumberFormat("en-US", { currency, maximumFractionDigits: 0, style: "currency" }).format(Number(value)) : "Value TBD"; }

export default async function CrmOpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const query = await searchParams;
  const [result, user] = await Promise.all([
    getCrmOpportunities({ includeArchived: query.archived === "yes", search: query.search || undefined, stage: query.stage || undefined, status: query.status || undefined }),
    getPortalUser(),
  ]);
  const canCreate = canManageCrmStage(user);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader actionHref={canCreate ? "/crm/opportunities/new" : undefined} actionLabel={canCreate ? "New opportunity" : undefined} description="Search, filter, and compare forecastable freight opportunities; use Pipeline for the stage board." icon={Plus} title="Opportunities" />
      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto_auto] lg:items-end">
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Search</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input className={`${crmFieldClassName} pl-10`} defaultValue={query.search ?? ""} name="search" placeholder="Opportunity, company, route, quote reference" /></span></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Stage</span><select className={crmFieldClassName} defaultValue={query.stage ?? ""} name="stage"><option value="">All stages</option>{crmOpportunityStageValues.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</select></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-500">Status</span><select className={crmFieldClassName} defaultValue={query.status ?? ""} name="status"><option value="">All statuses</option>{crmOpportunityStatusValues.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
          {canRestoreCrm(user) ? <label className="flex h-10 items-center gap-2 text-sm text-slate-400"><input defaultChecked={query.archived === "yes"} name="archived" type="checkbox" value="yes" />Include archived</label> : null}
          <Button type="submit" variant="secondary">Apply filters</Button>
        </form>
        <div className="mt-4 flex justify-end"><Link href="/crm/pipeline"><Button className="gap-2" type="button" variant="ghost"><Columns3 className="h-4 w-4" />Pipeline board</Button></Link></div>
      </Card>
      {result.rows.length === 0 ? <CrmEmptyState actionHref={canCreate ? "/crm/opportunities/new" : undefined} actionLabel={canCreate ? "Create opportunity" : undefined} description="No opportunities match this authorized scope and filter." icon={CircleDollarSign} title="No opportunities found" /> : (
        <Card className="p-0">
          <div className="divide-y divide-white/5 md:hidden">
            {result.rows.map((opportunity) => <Link className="block space-y-4 p-5 transition hover:bg-white/[0.02]" href={`/crm/opportunities/${opportunity.id}`} key={opportunity.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-white">{opportunity.title}</h2><p className="mt-1 truncate text-xs text-slate-500">{opportunity.companyName || "Company not linked"}</p></div><CrmStatusBadge status={opportunity.stage} /></div><div className="grid grid-cols-2 gap-3 text-xs text-slate-400"><p><span className="block text-slate-600">Value</span>{money(opportunity.estimatedValue, opportunity.currency)}</p><p><span className="block text-slate-600">Probability</span>{opportunity.probability}%</p><p><span className="block text-slate-600">Close</span>{opportunity.expectedCloseDate ? formatWibDate(`${opportunity.expectedCloseDate}T00:00:00+07:00`) : "Not set"}</p><p><span className="block text-slate-600">Owner</span>{opportunity.ownerName}</p></div><div className="flex items-center gap-2"><CrmStatusBadge status={opportunity.externalQuotationStatus} /><span className="truncate text-xs text-slate-600">{opportunity.externalQuotationReference || "No quotation reference"}</span></div></Link>)}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1120px] text-left"><thead><tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500"><th className="px-5 py-4">Opportunity</th><th className="px-5 py-4">Stage</th><th className="px-5 py-4">Value</th><th className="px-5 py-4">Probability</th><th className="px-5 py-4">Expected close</th><th className="px-5 py-4">Quotation</th><th className="px-5 py-4">Owner</th></tr></thead><tbody className="divide-y divide-white/5">{result.rows.map((opportunity) => <tr className="hover:bg-white/[0.02]" key={opportunity.id}><td className="px-5 py-4"><Link className="font-semibold text-white hover:text-blue-300" href={`/crm/opportunities/${opportunity.id}`}>{opportunity.title}</Link><p className="mt-1 text-xs text-slate-500">{opportunity.companyName || "Company not linked"}</p></td><td className="px-5 py-4"><CrmStatusBadge status={opportunity.stage} /></td><td className="px-5 py-4 text-sm text-slate-300">{money(opportunity.estimatedValue, opportunity.currency)}</td><td className="px-5 py-4 text-sm text-slate-300">{opportunity.probability}%</td><td className="px-5 py-4 text-xs text-slate-500">{opportunity.expectedCloseDate ? formatWibDate(`${opportunity.expectedCloseDate}T00:00:00+07:00`) : "Not set"}</td><td className="px-5 py-4"><CrmStatusBadge status={opportunity.externalQuotationStatus} /><p className="mt-1 max-w-40 truncate text-xs text-slate-600">{opportunity.externalQuotationReference || "No reference"}</p></td><td className="px-5 py-4 text-sm text-slate-300">{opportunity.ownerName}</td></tr>)}</tbody></table>
          </div>
        </Card>
      )}
    </div>
  );
}
