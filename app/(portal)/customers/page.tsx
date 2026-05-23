import Link from "next/link";
import { ArrowRight, Mail, Phone, Plus, Search, Users } from "lucide-react";

import { getCustomers } from "@/actions/customers";
import { Button, Card, Input } from "@/components/ui/core";

type CustomersPageProps = {
  searchParams?: Promise<{ search?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = resolvedSearchParams?.search?.trim() ?? "";
  const customers = await getCustomers(search);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Directory</h2>
          <p className="mt-1 text-slate-500">
            Search by customer name, contact details, or tracking number.
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="gap-2" type="button">
            <Plus className="h-4 w-4" /> Add New Customer
          </Button>
        </Link>
      </div>

      <Card className="overflow-visible p-0">
        <div className="flex flex-col gap-4 border-b border-white/5 p-6 md:flex-row md:items-center md:justify-between">
          <form className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-10"
              defaultValue={search}
              name="search"
              placeholder="Search name, email, phone, or tracking number..."
            />
          </form>

          <p className="mr-2 text-xs font-bold uppercase tracking-widest text-slate-600">
            Results: {customers.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((customer) => (
                <tr key={customer.id} className="group transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-600/20 bg-blue-600/10 font-bold text-blue-400">
                        {customer.fullName?.charAt(0) || customer.companyName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white transition-colors group-hover:text-blue-400">
                          {customer.fullName || customer.companyName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customer.companyName && customer.fullName
                            ? customer.companyName
                            : "Internal directory record"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Mail className="h-3 w-3" /> {customer.email || "No email"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="h-3 w-3" /> {customer.phone || "No phone"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-emerald-500">
                      {customer.type || "b2b"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/customers/${customer.id}`}>
                      <Button className="h-auto p-2" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={5}>
                    <div className="flex flex-col items-center">
                      <Users className="mb-4 h-12 w-12 text-slate-800" />
                      <p className="text-lg font-medium">No customers found</p>
                      <p className="text-sm">
                        Try adjusting your search criteria or create a new record.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
