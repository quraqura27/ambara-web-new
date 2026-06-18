"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";

import {
  commitVendorTrackingImport,
  previewVendorTrackingImport,
  type VendorImportPreviewState,
} from "@/actions/vendor-tracking";
import { Button, Card, Input, cn } from "@/components/ui/core";
import { ConfirmSubmitButton } from "@/components/portal/confirm-submit-button";

const initialState: VendorImportPreviewState = {};

function matchClassName(status: string) {
  if (status === "auto_confirm") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "review_required") return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-rose-500/20 bg-rose-500/10 text-rose-300";
}

export function VendorTrackingImportForm({ batchId }: { batchId: number }) {
  const [state, action, pending] = useActionState(previewVendorTrackingImport, initialState);
  const result = state.result;
  const autoRows = result?.matches.filter((match) => match.matchStatus === "auto_confirm").length ?? 0;
  const reviewRows = result?.matches.filter((match) => match.matchStatus === "review_required").length ?? 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form action={action} className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <input name="batchId" type="hidden" value={batchId} />
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Vendor CSV / TSV
              </span>
              <Input accept=".csv,.txt,.tsv" name="file" type="file" />
            </label>
            <Button className="w-full gap-2" disabled={pending} type="submit">
              <Upload className="h-4 w-4" />
              {pending ? "Previewing..." : "Preview Tracking"}
            </Button>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Paste Vendor Result
            </span>
            <textarea
              className="min-h-[180px] w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 font-mono text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
              name="pastedTable"
              placeholder="ambara_parcel_id,export_row_id,vendor_tracking_number,vendor_status,vendor_created_at"
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

      {result ? (
        <Card className="p-0">
          <div className="grid gap-4 border-b border-white/5 p-6 md:grid-cols-4">
            {[
              ["Rows", result.summary.totalRows],
              ["Matched", result.summary.matchedRows],
              ["Review", result.summary.mediumConfidenceRows],
              ["Rejected", result.summary.unmatchedRows + result.summary.duplicateRows],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <form action={commitVendorTrackingImport}>
            <input name="payload" type="hidden" value={state.payload ?? ""} />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-4">Review</th>
                    <th className="px-6 py-4">Row</th>
                    <th className="px-6 py-4">Vendor Tracking</th>
                    <th className="px-6 py-4">Ambara Parcel</th>
                    <th className="px-6 py-4">Match</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.matches.map((match) => (
                    <tr key={match.row.rowNumber} className="align-top">
                      <td className="px-6 py-4">
                        {match.matchStatus === "review_required" ? (
                          <input
                            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                            name="reviewRows"
                            type="checkbox"
                            value={match.row.rowNumber}
                          />
                        ) : (
                          <span className="text-xs text-slate-700">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{match.row.rowNumber}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {match.row.vendorTrackingNumber || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-white">
                          {match.parcel?.ambaraParcelId ?? match.row.ambaraParcelId ?? "-"}
                        </p>
                        <p className="text-xs text-slate-500">{match.row.exportRowId || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {match.matchMethod} / {match.matchConfidence}%
                      </td>
                      <td className="max-w-sm px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight",
                            matchClassName(match.matchStatus),
                          )}
                        >
                          {match.matchStatus.replace(/_/g, " ")}
                        </span>
                        {match.errors.length ? (
                          <p className="mt-2 text-xs text-rose-300">{match.errors.join("; ")}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 p-6">
              <p className="text-xs text-slate-500">
                Auto: {autoRows} / Review: {reviewRows}
              </p>
              <ConfirmSubmitButton
                description={`Import ${autoRows} high-confidence matches plus any review rows you explicitly selected.`}
                title="Confirm vendor tracking import?"
                variant="primary"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Tracking
              </ConfirmSubmitButton>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
