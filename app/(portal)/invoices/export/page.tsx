import { Download, FileSpreadsheet, ShieldAlert } from "lucide-react";

import { Button, Card, Input } from "@/components/ui/core";
import {
  buildInvoiceExportFilename,
  canExportInvoices,
  invoiceExportCurrencies,
  invoiceExportMaxRows,
  invoiceExportPaymentFilters,
  invoiceExportPphFilters,
  invoiceExportScopes,
  invoiceExportStatuses,
  invoiceExportVatFilters,
  parseInvoiceExportFilters,
  type InvoiceExportCurrency,
  type InvoiceExportPaymentFilter,
  type InvoiceExportPphFilter,
  type InvoiceExportPreview,
  type InvoiceExportScope,
  type InvoiceExportStatus,
  type InvoiceExportVatFilter,
} from "@/lib/invoices/export";
import { getInvoiceExportPreview } from "@/lib/invoices/export-database";
import { invoiceStatusLabel } from "@/lib/invoices/core";
import { requirePortalUser } from "@/lib/portal-auth";

type InvoiceExportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50";

const scopeLabels: Record<InvoiceExportScope, string> = {
  lines: "Invoice line detail",
  summary: "Invoice summary",
};

const pphLabels: Record<InvoiceExportPphFilter, string> = {
  all: "All PPh",
  with_pph: "With PPh 23",
  without_pph: "Without PPh 23",
};

const vatLabels: Record<InvoiceExportVatFilter, string> = {
  all: "All VAT",
  with_vat: "With VAT",
  without_vat: "Without VAT",
};

const paymentLabels: Record<InvoiceExportPaymentFilter, string> = {
  all: "Paid and unpaid",
  partial: "Partially paid only",
  paid: "Paid only",
  unpaid: "Outstanding (unpaid + partial)",
};

function statusLabel(status: InvoiceExportStatus) {
  return status === "all" ? "All statuses" : invoiceStatusLabel(status);
}

function currencyLabel(currency: InvoiceExportCurrency) {
  return currency === "all" ? "All currencies" : currency;
}

function toSearchParams(params?: Record<string, string | string[] | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-slate-200">{value || "All"}</p>
    </div>
  );
}

function PreviewSummary({
  errors,
  filename,
  preview,
  previewError,
}: {
  errors: string[];
  filename: string;
  preview: InvoiceExportPreview | null;
  previewError: string;
}) {
  if (errors.length > 0) {
    return (
      <Card className="p-6">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-400" />
          <div>
            <h3 className="font-semibold text-white">Fix export filters</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-200">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  if (previewError) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-white">Preview unavailable</h3>
        <p className="mt-2 text-sm text-slate-400">{previewError}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Preview Count
          </p>
          <p className="mt-2 text-4xl font-bold text-white">
            {preview ? preview.rowCount.toLocaleString() : "-"}
          </p>
          <p className="mt-2 text-sm text-slate-400">{filename}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          {preview?.isTooLarge
            ? `Export is above ${preview.maxRows.toLocaleString()} rows. Narrow the filters before downloading.`
            : `Exports are capped at ${invoiceExportMaxRows.toLocaleString()} rows to avoid request timeouts.`}
        </div>
      </div>
    </Card>
  );
}

export default async function InvoiceExportPage({ searchParams }: InvoiceExportPageProps) {
  const user = await requirePortalUser();
  const resolvedSearchParams = await searchParams;
  const parsedSearchParams = toSearchParams(resolvedSearchParams);
  const { errors, filters } = parseInvoiceExportFilters(parsedSearchParams);
  const filename = buildInvoiceExportFilename(filters);
  let preview: InvoiceExportPreview | null = null;
  let previewError = "";

  if (!canExportInvoices(user)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Export Invoices</h2>
          <p className="mt-1 text-slate-500">Finance access is required for invoice exports.</p>
        </div>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-white">Finance-only export</h3>
              <p className="mt-2 text-sm text-slate-400">
                Invoice exports can contain AR, billing, and payment reference data and are limited
                to finance and superadmin users.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (errors.length === 0) {
    try {
      preview = await getInvoiceExportPreview(filters);
    } catch {
      previewError = "The invoice export preview could not be calculated. Check the filters and try again.";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Export Invoices</h2>
          <p className="mt-1 text-slate-500">
            Export invoice summary or line data as CSV for finance analysis.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
      </div>

      <form className="space-y-8" method="get">
        <Card className="p-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                From date
              </span>
              <Input defaultValue={filters.fromDate} name="from_date" type="date" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                To date
              </span>
              <Input defaultValue={filters.toDate} name="to_date" type="date" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Status
              </span>
              <select className={fieldClassName} defaultValue={filters.status} name="status">
                {invoiceExportStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Customer
              </span>
              <Input defaultValue={filters.customer} name="customer" placeholder="Code, name, invoice no" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Currency
              </span>
              <select className={fieldClassName} defaultValue={filters.currency} name="currency">
                {invoiceExportCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currencyLabel(currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                PPh 23
              </span>
              <select className={fieldClassName} defaultValue={filters.pph} name="pph">
                {invoiceExportPphFilters.map((pph) => (
                  <option key={pph} value={pph}>
                    {pphLabels[pph]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                VAT
              </span>
              <select className={fieldClassName} defaultValue={filters.vat} name="vat">
                {invoiceExportVatFilters.map((vat) => (
                  <option key={vat} value={vat}>
                    {vatLabels[vat]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Payment
              </span>
              <select className={fieldClassName} defaultValue={filters.payment} name="payment">
                {invoiceExportPaymentFilters.map((payment) => (
                  <option key={payment} value={payment}>
                    {paymentLabels[payment]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Export scope
              </span>
              <select className={fieldClassName} defaultValue={filters.scope} name="scope">
                {invoiceExportScopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scopeLabels[scope]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Format
              </span>
              <select className={fieldClassName} defaultValue="csv" name="format">
                <option value="csv">CSV / Excel-compatible CSV</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              CSV only in v1. Public QR verification data is not included beyond generated metadata.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="secondary">
                Preview Count
              </Button>
              <Button
                className="gap-2"
                formAction="/invoices/export/download"
                name="format"
                type="submit"
                value="csv"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </Card>

        <PreviewSummary
          errors={errors}
          filename={filename}
          preview={preview}
          previewError={previewError}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Scope" value={scopeLabels[filters.scope]} />
          <DetailItem label="Date range" value={`${filters.fromDate} to ${filters.toDate}`} />
          <DetailItem label="Status" value={statusLabel(filters.status)} />
          <DetailItem label="Customer" value={filters.customer} />
          <DetailItem label="Currency" value={currencyLabel(filters.currency)} />
          <DetailItem label="PPh 23" value={pphLabels[filters.pph]} />
          <DetailItem label="VAT" value={vatLabels[filters.vat]} />
          <DetailItem label="Payment" value={paymentLabels[filters.payment]} />
        </div>
      </form>
    </div>
  );
}
