"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";

import {
  commitVendorStatusUpdate,
  previewVendorStatusUpdate,
  type VendorStatusPreviewState,
} from "@/actions/vendor-tracking";
import { Button, Card, Input, cn } from "@/components/ui/core";
import { ConfirmSubmitButton } from "@/components/portal/confirm-submit-button";

const initialState: VendorStatusPreviewState = {};

function matchClassName(status: string) {
  if (status === "matched") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "unmatched") return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-rose-500/20 bg-rose-500/10 text-rose-300";
}

export function VendorStatusUpdateForm({ batchId }: { batchId: number }) {
  const [state, action, pending] = useActionState(previewVendorStatusUpdate, initialState);
  const matches = state.matches ?? [];
  const matchedCount = matches.filter((match) => match.matchStatus === "matched").length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form action={action} className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <input name="batchId" type="hidden" value={batchId} />
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Status CSV / TSV
              </span>
              <Input accept=".csv,.txt,.tsv" name="file" type="file" />
            </label>
            <Button className="w-full gap-2" disabled={pending} type="submit">
              <Upload className="h-4 w-4" />
              {pending ? "Previewing..." : "Preview Status"}
            </Button>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Paste Vendor Status
            </span>
            <textarea
              className="min-h-[180px] w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 font-mono text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30"
              name="pastedTable"
              placeholder="vendor_tracking_number,status,event_time,receiver_name,pod_url,remarks"
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

      {matches.length > 0 ? (
        <Card className="p-0">
          <form action={commitVendorStatusUpdate}>
            <input name="payload" type="hidden" value={state.payload ?? ""} />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-4">Row</th>
                    <th className="px-6 py-4">Vendor Tracking</th>
                    <th className="px-6 py-4">Raw Status</th>
                    <th className="px-6 py-4">Ambara Status</th>
                    <th className="px-6 py-4">Delivery Record ID</th>
                    <th className="px-6 py-4">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matches.map((match) => (
                    <tr key={match.row.rowNumber} className="align-top">
                      <td className="px-6 py-4 text-xs text-slate-500">{match.row.rowNumber}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {match.row.vendorTrackingNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {match.row.vendorStatus || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-white">{match.newStatus ?? "-"}</p>
                        <p className="max-w-xs text-xs text-slate-500">{match.publicDescription}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {match.parcel?.ambaraParcelId ?? "-"}
                      </td>
                      <td className="max-w-sm px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-tight",
                            matchClassName(match.matchStatus),
                          )}
                        >
                          {match.matchStatus}
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
              <p className="text-xs text-slate-500">Matched rows: {matchedCount}</p>
              <ConfirmSubmitButton
                description={`Apply ${matchedCount} matched status updates and append customer-visible tracking events.`}
                disabled={matchedCount === 0}
                title="Confirm vendor status updates?"
                variant="primary"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Statuses
              </ConfirmSubmitButton>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
