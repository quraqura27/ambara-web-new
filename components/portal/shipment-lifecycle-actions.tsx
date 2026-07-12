"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Ban, RotateCcw, X } from "lucide-react";

import {
  restoreShipment,
  type ShipmentVoidActionState,
  voidShipment,
} from "@/actions/shipment-void";
import { Button, Input } from "@/components/ui/core";
import {
  shipmentVoidReasonLabels,
  shipmentVoidReasonValues,
} from "@/lib/shipments/voiding";

const initialState: ShipmentVoidActionState = {};

function ErrorSummary({ state }: { state: ShipmentVoidActionState }) {
  const errors = state.fieldErrors ?? {};
  const messages = [state.formError, ...Object.values(errors)].filter(Boolean);
  if (messages.length === 0) return null;

  return (
    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
      {messages.map((message) => <p key={message}>{message}</p>)}
    </div>
  );
}

function VoidForm({
  blockedBySafeguard,
  previewMode,
  requiresElevatedOverride,
  trackingNumber,
  warnings,
}: {
  blockedBySafeguard: boolean;
  previewMode: boolean;
  requiresElevatedOverride: boolean;
  trackingNumber: string;
  warnings: string[];
}) {
  const boundAction = voidShipment.bind(null, trackingNumber);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={previewMode ? undefined : action} className="space-y-4">
      <ErrorSummary state={state} />
      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Related records found
          </div>
          <ul className="mt-2 space-y-1 text-xs text-amber-100/80">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
      {blockedBySafeguard ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          A superadmin must perform this void because the shipment is linked to an invoice or MAWB.
        </p>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500">Reason *</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm"
              defaultValue={state.values?.reason ?? ""}
              name="reason"
              required
            >
              <option disabled value="">Select reason</option>
              {shipmentVoidReasonValues.map((reason) => (
                <option key={reason} value={reason}>{shipmentVoidReasonLabels[reason]}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500">Internal note</span>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm"
              defaultValue={state.values?.note}
              maxLength={500}
              name="note"
              placeholder="Required when reason is Other"
              rows={3}
            />
          </label>
          {requiresElevatedOverride ? (
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase text-slate-500">
                Confirm tracking number *
              </span>
              <Input
                autoComplete="off"
                defaultValue={state.values?.confirmTrackingNumber}
                name="confirmTrackingNumber"
                placeholder={trackingNumber}
                required
              />
            </label>
          ) : null}
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm text-slate-300">
            <input name="confirmed" required type="checkbox" value="yes" />
            <span>I confirm this shipment should be voided and its operational history preserved.</span>
          </label>
          <Button className="w-full gap-2" disabled={pending || previewMode} type="submit" variant="danger">
            <Ban className="h-4 w-4" />
            {previewMode ? "Preview Only" : pending ? "Voiding..." : "Confirm Void Shipment"}
          </Button>
        </>
      )}
    </form>
  );
}

function RestoreForm({ previewMode, trackingNumber }: { previewMode: boolean; trackingNumber: string }) {
  const boundAction = restoreShipment.bind(null, trackingNumber);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={previewMode ? undefined : action} className="space-y-4">
      <ErrorSummary state={state} />
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase text-slate-500">Restore reason *</span>
        <textarea
          className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm"
          defaultValue={state.values?.restoreReason}
          maxLength={500}
          name="restoreReason"
          required
          rows={3}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase text-slate-500">
          Confirm tracking number *
        </span>
        <Input
          autoComplete="off"
          defaultValue={state.values?.confirmTrackingNumber}
          name="confirmTrackingNumber"
          placeholder={trackingNumber}
          required
        />
      </label>
      <Button className="w-full gap-2" disabled={pending || previewMode} type="submit" variant="secondary">
        <RotateCcw className="h-4 w-4" />
        {previewMode ? "Preview Only" : pending ? "Restoring..." : "Confirm Restore Shipment"}
      </Button>
    </form>
  );
}

export function ShipmentLifecycleActions({
  blockedBySafeguard,
  canRestore,
  defaultOpen = false,
  isVoided,
  previewMode = false,
  requiresElevatedOverride,
  trackingNumber,
  warnings,
}: {
  blockedBySafeguard: boolean;
  canRestore: boolean;
  defaultOpen?: boolean;
  isVoided: boolean;
  previewMode?: boolean;
  requiresElevatedOverride: boolean;
  trackingNumber: string;
  warnings: string[];
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (isVoided && !canRestore) return null;
  if (!open) {
    return (
      <Button
        className="w-full gap-2"
        onClick={() => setOpen(true)}
        type="button"
        variant={isVoided ? "secondary" : "danger"}
      >
        {isVoided ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        {isVoided ? "Restore Shipment" : "Void Shipment"}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">
          {isVoided ? "Restore Shipment" : "Void Shipment"}
        </h3>
        <Button aria-label="Close shipment action" className="h-8 w-8 p-0" onClick={() => setOpen(false)} type="button" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>
      {isVoided ? (
        <RestoreForm previewMode={previewMode} trackingNumber={trackingNumber} />
      ) : (
        <VoidForm
          blockedBySafeguard={blockedBySafeguard}
          previewMode={previewMode}
          requiresElevatedOverride={requiresElevatedOverride}
          trackingNumber={trackingNumber}
          warnings={warnings}
        />
      )}
    </div>
  );
}
