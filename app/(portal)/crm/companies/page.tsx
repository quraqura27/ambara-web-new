import Link from "next/link";
import { Building2, Mail, MapPin, Phone, Plus, Search } from "lucide-react";

import { CrmEmptyState, CrmMessageBanner, CrmPageHeader, CrmStatusBadge, crmFieldClassName } from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { crmCompanyRoleValues } from "@/lib/crm/core";
import { getCrmCompanies } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm, canRestoreCrm } from "@/lib/portal-roles";
import { formatWibDate } from "@/lib/time/wib";

type CompaniesPageProps = {
  searchParams: Promise<{ archived?: string; error?: string; notice?: string; role?: string; search?: string }>;
};

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function CrmCompaniesPage({ searchParams }: CompaniesPageProps) {
  const query = await searchParams;
  const [result, user] = await Promise.all([
    getCrmCompanies({
      includeArchived: query.archived === "yes",
      role: query.role || undefined,
      search: query.search || undefined,
    }),
    getPortalUser(),
  ]);
  const canCreate = canManageCrm(user);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader
        actionHref={canCreate ? "/crm/companies/new" : undefined}
        actionLabel={canCreate ? "New company" : undefined}
        description="Shared organization records for prospects, customers, overseas agents, airlines, shipping lines, truckers, and customs partners."
        icon={Plus}
        title="Companies"
      />

      <Card className="p-5">
        <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px_auto_auto] sm:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input className={`${crmFieldClassName} pl-10`} defaultValue={query.search ?? ""} name="search" placeholder="Name, email, phone, NIB, or tax ID" />
            </span>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">Company role</span>
            <select className={crmFieldClassName} defaultValue={query.role ?? ""} name="role">
              <option value="">All roles</option>
              {crmCompanyRoleValues.map((role) => <option key={role} value={role}>{label(role)}</option>)}
            </select>
          </label>
          {canRestoreCrm(user) ? <label className="flex h-10 items-center gap-2 text-sm text-slate-400"><input defaultChecked={query.archived === "yes"} name="archived" type="checkbox" value="yes" />Include archived</label> : null}
          <Button type="submit" variant="secondary">Apply filters</Button>
        </form>
      </Card>

      {result.rows.length === 0 ? (
        <CrmEmptyState
          actionHref={canCreate ? "/crm/companies/new" : undefined}
          actionLabel={canCreate ? "Create company" : undefined}
          description="No company records match this authorized scope and filter."
          icon={Building2}
          title="No companies found"
        />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-white/5 md:hidden">
            {result.rows.map((company) => (
              <Link className="block space-y-4 p-5 transition hover:bg-white/[0.02]" href={`/crm/companies/${company.id}`} key={company.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h2 className="truncate font-semibold text-white">{company.displayName || company.legalName}</h2>{company.displayName ? <p className="mt-1 truncate text-xs text-slate-500">{company.legalName}</p> : null}</div>
                  {company.archivedAt ? <CrmStatusBadge status="archived" /> : <CrmStatusBadge status="active" />}
                </div>
                <div className="grid gap-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{[company.city, company.countryCode].filter(Boolean).join(", ") || "Location not set"}</p>
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{company.email || "No email"}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{company.phone || "No phone"}</p>
                </div>
                <p className="text-xs text-slate-500">Owner: {company.ownerName} · Updated {formatWibDate(company.updatedAt)}</p>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500"><th className="px-5 py-4">Company</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4">State</th></tr></thead>
              <tbody className="divide-y divide-white/5">{result.rows.map((company) => <tr className="hover:bg-white/[0.02]" key={company.id}><td className="px-5 py-4"><Link className="font-semibold text-white hover:text-blue-300" href={`/crm/companies/${company.id}`}>{company.displayName || company.legalName}</Link>{company.displayName ? <p className="mt-1 text-xs text-slate-500">{company.legalName}</p> : null}</td><td className="px-5 py-4 text-xs text-slate-400"><p>{company.email || "No email"}</p><p className="mt-1">{company.phone || "No phone"}</p></td><td className="px-5 py-4 text-sm text-slate-400">{[company.city, company.countryCode].filter(Boolean).join(", ") || "—"}</td><td className="px-5 py-4 text-sm text-slate-300">{company.ownerName}</td><td className="px-5 py-4 text-xs text-slate-500">{formatWibDate(company.updatedAt)}</td><td className="px-5 py-4">{company.archivedAt ? <CrmStatusBadge status="archived" /> : <CrmStatusBadge status="active" />}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
