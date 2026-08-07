"use client";

import { AlertCircle, Loader2, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import {
  updateInvoiceDraftChargesFromForm,
  type InvoiceActionState,
  type InvoiceDraftChargeEditorData,
} from "@/actions/invoices";
import { Button, Card, Input, cn } from "@/components/ui/core";
import {
  formatCurrencyAmount,
  lineTotal,
  type InvoiceBillingBasis,
} from "@/lib/invoices/core";

const initialState: InvoiceActionState = {};

export function InvoiceDraftChargeEditor({ editor }: { editor: InvoiceDraftChargeEditorData }) {
  const action = useMemo(
    () => updateInvoiceDraftChargesFromForm.bind(null, editor.id),
    [editor.id],
  );
  const [state, formAction, pending] = useActionState(action, initialState);
  const [lines, setLines] = useState(editor.lines);
  const hasSendBlocker = lines.some((line) => {
    if (Number(line.unitRate || 0) <= 0) return true;
    return line.billingBasis === "per_kg" && Number(line.chargeableWeight || 0) <= 0;
  });

  function updateLine(id: string, patch: Partial<(typeof lines)[number]>) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="chargeLines" type="hidden" value={JSON.stringify(lines)} />

      {state.formError ? (
        <div aria-live="polite" className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.formError}</span>
        </div>
      ) : null}

      <Card className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Draft service charges</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Edit descriptions and rates, plus billing basis and quantity for manual lines. The customer, linked shipment references, and linked quantities stay fixed.
          </p>
        </div>

        <div className="space-y-4">
          {lines.map((line, index) => {
            const amount = lineTotal({
              billingBasis: line.billingBasis,
              chargeableWeight: line.chargeableWeight,
              type: "charge",
              unitRate: line.unitRate,
            });
            const rateInvalid = Number(line.unitRate || 0) <= 0;
            const quantityInvalid = line.billingBasis === "per_kg"
              && Number(line.chargeableWeight || 0) <= 0;

            return (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4" key={line.id}>
                <div className="mb-4">
                  <p className="font-semibold">Charge {index + 1}</p>
                  <p className="mt-1 font-mono text-xs text-blue-200">{line.reference}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Service</span>
                    <Input
                      onChange={(event) => updateLine(line.id, { description: event.target.value })}
                      required
                      value={line.description}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Billing basis</span>
                    {line.linkedSource ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-300">
                        {line.billingBasis === "per_kg" ? "Per kg" : "Flat"}
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                        onChange={(event) => updateLine(line.id, { billingBasis: event.target.value as InvoiceBillingBasis })}
                        value={line.billingBasis}
                      >
                        <option value="per_kg">Per kg</option>
                        <option value="flat">Flat</option>
                      </select>
                    )}
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Quantity</span>
                    {line.billingBasis === "flat" ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-300">1 service</div>
                    ) : line.linkedSource ? (
                      <div className={cn(
                        "rounded-lg border bg-slate-950/60 px-4 py-2 text-sm",
                        quantityInvalid ? "border-rose-400/30 text-rose-200" : "border-slate-700 text-slate-300",
                      )}>
                        {line.chargeableWeight ? `${line.chargeableWeight} kg` : "Missing shipment weight"}
                      </div>
                    ) : (
                      <Input
                        aria-invalid={quantityInvalid}
                        min="0.01"
                        onChange={(event) => updateLine(line.id, { chargeableWeight: event.target.value })}
                        required
                        step="0.01"
                        type="number"
                        value={line.chargeableWeight}
                      />
                    )}
                    {quantityInvalid ? <span className="mt-1 block text-xs text-rose-300">Quantity must be greater than zero before Mark Sent.</span> : null}
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                      {line.billingBasis === "per_kg" ? "Rate / kg" : "Flat amount"}
                    </span>
                    <Input
                      aria-invalid={rateInvalid}
                      min="0"
                      onChange={(event) => updateLine(line.id, { unitRate: event.target.value })}
                      required
                      step="0.01"
                      type="number"
                      value={line.unitRate}
                    />
                    {rateInvalid ? <span className="mt-1 block text-xs text-rose-300">Enter an amount greater than zero before Mark Sent.</span> : null}
                    <span className="mt-2 block text-right text-xs text-blue-200">
                      {editor.currency} {formatCurrencyAmount(amount, editor.currency)}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn("text-sm", hasSendBlocker ? "text-amber-200" : "text-emerald-200")}>
          {hasSendBlocker
            ? "You can save the draft, but every quantity and rate must be positive before Mark Sent."
            : "All charge quantities and rates are ready for Mark Sent."}
        </p>
        <Button className="gap-2" disabled={pending} type="submit" variant="secondary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save draft changes
        </Button>
      </div>
    </form>
  );
}
