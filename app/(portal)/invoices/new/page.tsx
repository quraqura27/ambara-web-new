import Link from "next/link";

import { getInvoiceableSources, getInvoiceCustomerOptions } from "@/actions/invoices";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import { Button } from "@/components/ui/core";
import { mockInvoiceCustomers, mockInvoiceSourcesByCustomerId } from "@/lib/invoices/mock-data";
import { isLocalPortalDevAccessEnabled } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

type NewInvoicePageProps = {
  searchParams: Promise<{ mock?: string }>;
};

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const localDevAccess = isLocalPortalDevAccessEnabled();
  const params = await searchParams;
  const forceMockData = localDevAccess && params.mock === "1";
  const dbCustomers = forceMockData ? [] : await getInvoiceCustomerOptions();
  const usingMockData = forceMockData || (localDevAccess && dbCustomers.length === 0);
  const customers = usingMockData ? mockInvoiceCustomers : dbCustomers;
  const initialCustomer = customers.find((customer) => customer.invoiceableCount > 0) ?? customers[0];
  const initialSources = usingMockData
    ? mockInvoiceSourcesByCustomerId[initialCustomer?.id ?? 0] ?? []
    : initialCustomer?.id ? await getInvoiceableSources(initialCustomer.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
          <p className="mt-1 text-slate-500">Create a customer invoice from shipment-linked or manual service charges, deductions, VAT, and PPh treatment.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {localDevAccess ? (
            <Link href={usingMockData ? "/invoices/new" : "/invoices/new?mock=1"}>
              <Button variant="secondary">{usingMockData ? "Use database data" : "Use mock data"}</Button>
            </Link>
          ) : null}
          <Link href="/invoices"><Button variant="secondary">Back to invoices</Button></Link>
        </div>
      </div>

      {customers.length > 0 || localDevAccess ? (
        <InvoiceBuilder
          customers={customers}
          initialSources={initialSources}
          mockData={usingMockData}
          mockSourcesByCustomerId={usingMockData ? mockInvoiceSourcesByCustomerId : undefined}
        />
      ) : (
        <div className="rounded-lg border border-white/5 bg-[#12121a]/80 p-10 text-center text-slate-500">
          Add a customer before creating an invoice.
        </div>
      )}
    </div>
  );
}
