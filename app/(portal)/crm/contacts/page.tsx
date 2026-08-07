import Link from "next/link";
import { Mail, Phone, Plus, Search, UserRound } from "lucide-react";

import {
  CrmEmptyState,
  CrmMessageBanner,
  CrmPageHeader,
  CrmStatusBadge,
  crmFieldClassName,
} from "@/components/crm/crm-ui";
import { Button, Card } from "@/components/ui/core";
import { getCrmContacts } from "@/lib/crm/data";
import { getPortalUser } from "@/lib/portal-auth";
import { canManageCrm, canRestoreCrm } from "@/lib/portal-roles";
import { formatWibDate } from "@/lib/time/wib";

type ContactsPageProps = {
  searchParams: Promise<{ archived?: string; error?: string; notice?: string; search?: string }>;
};

export default async function CrmContactsPage({ searchParams }: ContactsPageProps) {
  const query = await searchParams;
  const [result, user] = await Promise.all([
    getCrmContacts({
      includeArchived: query.archived === "yes",
      search: query.search || undefined,
      limit: 200,
    }),
    getPortalUser(),
  ]);
  const canCreate = canManageCrm(user);

  return (
    <div className="space-y-8">
      <CrmMessageBanner error={query.error} notice={query.notice} />
      <CrmPageHeader
        actionHref={canCreate ? "/crm/contacts/new" : undefined}
        actionLabel={canCreate ? "New contact" : undefined}
        description="People linked to commercial relationships, with scoped ownership and a validated company connection."
        icon={Plus}
        title="Contacts"
      />
      <Card className="p-5">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                className={`${crmFieldClassName} pl-10`}
                defaultValue={query.search ?? ""}
                name="search"
                placeholder="Name, company, email, phone, or WhatsApp"
              />
            </span>
          </label>
          {canRestoreCrm(user) ? (
            <label className="flex h-10 items-center gap-2 text-sm text-slate-400">
              <input defaultChecked={query.archived === "yes"} name="archived" type="checkbox" value="yes" />
              Include archived
            </label>
          ) : null}
          <Button type="submit" variant="secondary">Apply filters</Button>
        </form>
      </Card>

      {result.rows.length === 0 ? (
        <CrmEmptyState
          actionHref={canCreate ? "/crm/contacts/new" : undefined}
          actionLabel={canCreate ? "Create contact" : undefined}
          description="No contacts match this authorized scope and filter."
          icon={UserRound}
          title="No contacts found"
        />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-white/5 md:hidden">
            {result.rows.map((contact) => (
              <Link className="block p-5 transition hover:bg-white/[0.02]" href={`/crm/contacts/${contact.id}`} key={contact.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">{contact.fullName}</h2>
                    <p className="mt-1 truncate text-xs text-slate-500">{contact.jobTitle || contact.companyName || "Company not linked"}</p>
                  </div>
                  {contact.archivedAt ? <CrmStatusBadge status="archived" /> : contact.isPrimary ? <CrmStatusBadge status="primary" /> : null}
                </div>
                <div className="mt-4 grid gap-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{contact.email || "No email"}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{contact.whatsapp || contact.phone || "No phone"}</p>
                </div>
                <p className="mt-4 text-xs text-slate-500">Owner: {contact.ownerName} · Updated {formatWibDate(contact.updatedAt)}</p>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500"><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Company</th><th className="px-5 py-4">Reach</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4">State</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {result.rows.map((contact) => (
                  <tr className="hover:bg-white/[0.02]" key={contact.id}>
                    <td className="px-5 py-4"><Link className="font-semibold text-white hover:text-blue-300" href={`/crm/contacts/${contact.id}`}>{contact.fullName}</Link><p className="mt-1 text-xs text-slate-500">{contact.jobTitle || "Title not set"}</p></td>
                    <td className="px-5 py-4 text-sm text-slate-300">{contact.companyName || "Not linked"}</td>
                    <td className="px-5 py-4 text-xs text-slate-400"><p>{contact.email || "No email"}</p><p className="mt-1">{contact.whatsapp || contact.phone || "No phone"}</p></td>
                    <td className="px-5 py-4 text-sm text-slate-300">{contact.ownerName}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{formatWibDate(contact.updatedAt)}</td>
                    <td className="px-5 py-4">{contact.archivedAt ? <CrmStatusBadge status="archived" /> : contact.isPrimary ? <CrmStatusBadge status="primary" /> : <CrmStatusBadge status="active" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
