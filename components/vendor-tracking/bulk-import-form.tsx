"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";

import {
  commitBulkShipmentImport,
  previewBulkShipmentImport,
  type BulkShipmentPreviewState,
} from "@/actions/vendor-tracking";
import { Button, Card, Input, cn } from "@/components/ui/core";
import { ConfirmSubmitButton } from "@/components/portal/confirm-submit-button";

const initialState: BulkShipmentPreviewState = {};

function statusClassName(status: string) {
  if (status === "error") return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  if (status === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

export function BulkImportForm() {
  const [state, action, pending] = useActionState(previewBulkShipmentImport, initialState);
  const preview = state.preview;
  const [approvedWarnings, setApprovedWarnings] = useState<number[]>([]);
  const canCommit = Boolean(state.payload && preview && preview.summary.errorRows === 0);
  const errorCsv = useMemo(() => {
    if (!preview) return "";
    const rows = preview.rows.filter((row) => row.errors.length > 0);
    return [
      "row,errors",
      ...rows.map((row) => `${row.rowNumber},"${row.errors.join("; ").replace(/"/g, '""')}"`),
    ].join("\n");
  }, [preview]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form action={action} className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                CSV / TSV File
              </span>
              <Input accept=".csv,.txt,.tsv" name="file" type="file" />
            </label>

            <Button className="w-full gap-2" disabled={pending} type="submit">
              <Upload className="h-4 w-4" />
              {pending ? "Previewing..." : "Preview Import"}
            </Button>
            <p className="text-xs leading-relaxed text-slate-500">
              Every accepted row creates one independent shipment, tracking number, CN, and internal delivery record.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Paste Table
            </span>
            <textarea
              className="min-h-[220px] w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 font-mono text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
              name="pastedTable"
              placeholder="customer_name,customer_reference,origin_city,receiver_name,receiver_phone,receiver_address,destination_city,postal_code,commodity,weight,pieces,service_type"
            />
          </label>
        </form>
      </Card>

      {state.error ? (
        <div className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4" />
          {state.error}
        </div>
      ) : null}

      {preview ? (
        <Card className="p-0">
          <div className="grid gap-4 border-b border-white/5 p-6 md:grid-cols-4">
            {[
              ["Rows", preview.summary.totalRows],
              ["Valid", preview.summary.validRows],
              ["Warnings", preview.summary.warningRows],
              ["Errors", preview.summary.errorRows],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Row</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Receiver</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Load</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Messages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="align-top">
                    <td className="px-6 py-4 text-xs text-slate-500">{row.rowNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {row.data.customerReference || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">{row.data.receiverName || "-"}</p>
                      <p className="text-xs text-slate-500">{row.data.receiverPhone || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {row.data.destinationCity || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                      {row.data.serviceType || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {Number.isFinite(row.data.weight) ? `${row.data.weight} kg` : "-"} /{" "}
                      {Number.isFinite(row.data.pieces) ? `${row.data.pieces} pcs` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight",
                          statusClassName(row.validationStatus),
                        )}
                      >
                        {row.validationStatus}
                      </span>
                      {row.warnings.length > 0 && row.errors.length === 0 ? (
                        <label className="mt-3 flex items-start gap-2 text-xs text-amber-200">
                          <input
                            checked={approvedWarnings.includes(row.rowNumber)}
                            name="warningRows"
                            onChange={(event) =>
                              setApprovedWarnings((current) =>
                                event.target.checked
                                  ? [...current, row.rowNumber]
                                  : current.filter((value) => value !== row.rowNumber),
                              )
                            }
                            type="checkbox"
                            value={row.rowNumber}
                          />
                          Include this warning row
                        </label>
                      ) : null}
                    </td>
                    <td className="max-w-sm px-6 py-4 text-xs text-slate-400">
                      {[...row.errors, ...row.warnings].join("; ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileSpreadsheet className="h-4 w-4" />
              {state.filename} / Excel-compatible CSV
            </div>
            <form action={commitBulkShipmentImport}>
              <input name="payload" type="hidden" value={state.payload ?? ""} />
              {approvedWarnings.map((row) => <input key={row} name="warningRows" type="hidden" value={row} />)}
              <div className="flex flex-wrap gap-3">
                {errorCsv ? (
                  <Button
                    className="gap-2"
                    onClick={() => {
                      const url = URL.createObjectURL(new Blob([errorCsv], { type: "text/csv" }));
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "ambara-import-errors.csv";
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4" /> Download Errors
                  </Button>
                ) : null}
                <ConfirmSubmitButton
                  description={`Create one independent shipment for every clean row plus ${approvedWarnings.length} explicitly approved warning rows. The import is all-or-nothing.`}
                  disabled={!canCommit}
                  title="Confirm shipment import?"
                  variant="primary"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Import
                </ConfirmSubmitButton>
              </div>
            </form>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
