import Link from "next/link";
import { Building2, CircleDollarSign, ClipboardList, FileText, Package, Search, Target, UserRound, Users } from "lucide-react";

import { searchPortal } from "@/actions/portal-search";
import { Button, Card } from "@/components/ui/core";
import { CrmStatusBadge } from "@/components/crm/crm-ui";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (await searchParams).q?.trim() ?? "";
  const results = await searchPortal(query);
  const total = results.shipments.length + results.customers.length + results.batches.length + results.mawbs.length
    + results.crmLeads.length + results.crmCompanies.length + results.crmContacts.length + results.crmOpportunities.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portal Search</h1>
        <p className="mt-1 text-slate-500">
          {query ? `${total} result${total === 1 ? "" : "s"} for “${query}”` : "Enter a search in the portal header."}
        </p>
      </div>

      {query && total === 0 ? (
        <Card className="p-10 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-700" />
          <p className="mt-4 font-semibold">No matching portal records</p>
          <p className="mt-1 text-sm text-slate-500">Check the tracking number, CRM company or contact, reference, name, AWB, or batch code.</p>
        </Card>
      ) : null}

      {results.shipments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <Package className="h-4 w-4" /> Shipments
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.shipments.map((shipment) => (
              <Card className="h-full p-5 transition hover:border-blue-500/30" key={shipment.trackingNumber}>
                <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}>
                  <p className="font-mono text-sm font-bold text-white">{shipment.trackingNumber}</p>
                  <p className="mt-2 text-sm text-slate-300">{shipment.customerName || shipment.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{shipment.origin} → {shipment.destination} / {shipment.voidedAt ? "voided" : shipment.status.replace(/_/g, " ")}</p>
                </Link>
                {results.canUseMawbs && !shipment.voidedAt ? (
                  <Link className="mt-4 block" href={`/mawbs/new?shipment=${encodeURIComponent(shipment.trackingNumber)}`}>
                    <Button className="w-full gap-2" variant="secondary">
                      <FileText className="h-4 w-4" />
                      MAWB
                    </Button>
                  </Link>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {results.crmLeads.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <Target className="h-4 w-4" /> CRM Leads
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.crmLeads.map((lead) => (
              <Link href={`/crm/leads/${lead.id}`} key={lead.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <div className="flex items-start justify-between gap-3"><p className="font-semibold text-white">{lead.title}</p><CrmStatusBadge status={lead.status} /></div>
                  <p className="mt-2 text-sm text-slate-300">{lead.companyName || lead.contactName || lead.source.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-xs text-slate-500">{lead.origin || "Origin TBD"} → {lead.destination || "Destination TBD"} / {lead.ownerName}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.crmOpportunities.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <CircleDollarSign className="h-4 w-4" /> CRM Opportunities
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.crmOpportunities.map((opportunity) => (
              <Link href={`/crm/opportunities/${opportunity.id}`} key={opportunity.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <div className="flex items-start justify-between gap-3"><p className="font-semibold text-white">{opportunity.title}</p><CrmStatusBadge status={opportunity.stage} /></div>
                  <p className="mt-2 text-sm text-slate-300">{opportunity.companyName || "Company not linked"}</p>
                  <p className="mt-1 text-xs text-slate-500">{opportunity.currency} {opportunity.estimatedValue || "value TBD"} / {opportunity.ownerName}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.crmCompanies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <Building2 className="h-4 w-4" /> CRM Companies
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.crmCompanies.map((company) => (
              <Link href={`/crm/companies/${company.id}`} key={company.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <p className="font-semibold text-white">{company.displayName || company.legalName}</p>
                  <p className="mt-1 text-xs text-slate-500">{company.email || "No email"} / {[company.city, company.countryCode].filter(Boolean).join(", ")}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.crmContacts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <UserRound className="h-4 w-4" /> CRM Contacts
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.crmContacts.map((contact) => (
              <Link href={`/crm/contacts/${contact.id}`} key={contact.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <p className="font-semibold text-white">{contact.fullName}</p>
                  <p className="mt-2 text-sm text-slate-300">{contact.companyName || "Company not linked"}</p>
                  <p className="mt-1 text-xs text-slate-500">{contact.email || contact.whatsapp || contact.phone || "No contact channel"} / {contact.ownerName}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.mawbs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <FileText className="h-4 w-4" /> MAWB Documents
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.mawbs.map((mawb) => (
              <Link href={`/mawbs/${mawb.id}`} key={mawb.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <p className="font-mono text-sm font-bold text-white">{mawb.mawbNumber}</p>
                  <p className="mt-2 text-sm text-slate-300">{mawb.carrierCode} / {mawb.carrierName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {mawb.originIata} → {mawb.destinationIata} / {mawb.shipperName} to {mawb.consigneeName}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.customers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <Users className="h-4 w-4" /> Customers
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.customers.map((customer) => (
              <Link href={`/customers/${customer.id}`} key={customer.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <p className="font-semibold text-white">{customer.fullName || customer.companyName}</p>
                  <p className="mt-1 text-xs text-slate-500">{customer.email || "No email"} / {customer.phone || "No phone"}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.batches.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            <ClipboardList className="h-4 w-4" /> Delivery Batches
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.batches.map((batch) => (
              <Link href={`/delivery-batches/${batch.id}`} key={batch.id}>
                <Card className="h-full p-5 transition hover:border-blue-500/30">
                  <p className="font-mono text-sm font-bold text-white">{batch.batchCode}</p>
                  <p className="mt-1 text-sm text-slate-300">{batch.vendorName}</p>
                  <p className="mt-1 text-xs text-slate-500">{batch.totalParcels} delivery records / {batch.batchStatus.replace(/_/g, " ")}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
