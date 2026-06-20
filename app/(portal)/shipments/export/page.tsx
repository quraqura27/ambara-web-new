import { Download, FileSpreadsheet, ShieldAlert } from "lucide-react";

import { Button, Card, Input } from "@/components/ui/core";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  buildShipmentExportFilename,
  canExportShipments,
  isXlsxExportEnabled,
  parseShipmentExportFilters,
  shipmentExportDateBases,
  shipmentExportMaxRows,
  shipmentExportScopes,
  shipmentExportStatuses,
  xlsxExportUnavailableMessage,
  type ShipmentExportDateBasis,
  type ShipmentExportScope,
  type ShipmentExportStatus,
} from "@/lib/shipment-export/core";
import { getShipmentExportPreview, type ShipmentExportPreview } from "@/lib/shipment-export/database";

type ShipmentExportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50";

const scopeLabels: Record<ShipmentExportScope, string> = {
  summary: "Shipment summary only",
  parcels: "Shipment + delivery detail",
  vendor_tracking: "Shipment + vendor tracking detail",
  tracking_events: "Shipment + tracking event detail",
};

const dateBasisLabels: Record<ShipmentExportDateBasis, string> = {
  created_at: "Created at",
  updated_at: "Updated at",
  delivered_at: "Delivered at",
  event_time: "Tracking event time",
};

function statusLabel(status: ShipmentExportStatus) {
  return status === "all" ? "All statuses" : status.replace(/_/g, " ");
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
  preview: ShipmentExportPreview | null;
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
            : `Exports are capped at ${shipmentExportMaxRows.toLocaleString()} rows to avoid request timeouts.`}
        </div>
      </div>
    </Card>
  );
}

export default async function ShipmentExportPage({ searchParams }: ShipmentExportPageProps) {
  const user = await requirePortalUser();
  const resolvedSearchParams = await searchParams;
  const parsedSearchParams = toSearchParams(resolvedSearchParams);
  const { errors, filters } = parseShipmentExportFilters(parsedSearchParams);
  const xlsxEnabled = isXlsxExportEnabled();
  const filename = buildShipmentExportFilename({ ...filters, format: "csv" });
  let preview: ShipmentExportPreview | null = null;
  let previewError = "";

  if (!canExportShipments(user)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Export Shipments</h2>
          <p className="mt-1 text-slate-500">Admin access is required for shipment exports.</p>
        </div>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-white">Admin-only export</h3>
              <p className="mt-2 text-sm text-slate-400">
                Shipment exports can contain operational reporting data and are limited to admin
                users.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (errors.length === 0) {
    try {
      preview = await getShipmentExportPreview(filters);
    } catch {
      previewError = "The export preview could not be calculated. Check the filters and try again.";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Export Shipments</h2>
          <p className="mt-1 text-slate-500">
            Export shipment reporting data as CSV / Excel-compatible CSV.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
      </div>

      <form className="space-y-8" method="get">
        <Card className="p-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Date basis
              </span>
              <select className={fieldClassName} defaultValue={filters.dateBasis} name="date_basis">
                {shipmentExportDateBases.map((basis) => (
                  <option key={basis} value={basis}>
                    {dateBasisLabels[basis]}
                  </option>
                ))}
              </select>
            </label>

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
                {shipmentExportStatuses.map((status) => (
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
              <Input defaultValue={filters.customer} name="customer" placeholder="Name, company, email, reference" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Origin city
              </span>
              <Input defaultValue={filters.origin} name="origin" placeholder="Jakarta" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Destination city
              </span>
              <Input defaultValue={filters.destination} name="destination" placeholder="Singapore" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Service type
              </span>
              <Input defaultValue={filters.serviceType} name="service_type" placeholder="DTD, DTP, cargo" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Vendor
              </span>
              <Input defaultValue={filters.vendor} name="vendor" placeholder="Vendor name" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Delivery batch
              </span>
              <Input defaultValue={filters.deliveryBatch} name="delivery_batch" placeholder="Batch code or ID" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Export scope
              </span>
              <select className={fieldClassName} defaultValue={filters.scope} name="scope">
                {shipmentExportScopes.map((scope) => (
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
                <option disabled value="xlsx">
                  XLSX not enabled
                </option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-300">
              <input
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                defaultChecked={filters.includeInternalEvents}
                name="include_internal_events"
                type="checkbox"
                value="true"
              />
              <span>
                <span className="block font-semibold text-white">
                  Include internal/private tracking events
                </span>
                <span className="mt-1 block text-slate-500">
                  Default exports only include customer-visible tracking events.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="secondary">
                Preview Count
              </Button>
              <Button
                className="gap-2"
                formAction="/shipments/export/download"
                name="format"
                type="submit"
                value="csv"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button disabled title={xlsxExportUnavailableMessage} type="button" variant="secondary">
                Export XLSX
              </Button>
            </div>
          </div>

          {!xlsxEnabled ? (
            <p className="mt-4 text-xs text-amber-300">{xlsxExportUnavailableMessage}</p>
          ) : null}
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
          <DetailItem label="Date basis" value={dateBasisLabels[filters.dateBasis]} />
          <DetailItem label="Status" value={statusLabel(filters.status)} />
          <DetailItem label="Customer" value={filters.customer} />
          <DetailItem label="Destination" value={filters.destination} />
          <DetailItem label="Vendor" value={filters.vendor} />
          <DetailItem label="Delivery batch" value={filters.deliveryBatch} />
        </div>
      </form>
    </div>
  );
}
