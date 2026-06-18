"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { correctTrackingEvent, type TrackingUpdateState } from "@/actions/tracking-safety";
import { Button, Input } from "@/components/ui/core";
import {
  getShipmentStatusDefinition,
  shipmentStatusValues,
} from "@/lib/shipments/status-model";
import { isShipmentStatusAllowedForService } from "@/lib/shipments/service-model";

const initialState: TrackingUpdateState = {};

export function TrackingCorrectionForm({
  events,
  serviceType,
  trackingNumber,
}: {
  events: Array<{ id: number; label: string; timestamp: string }>;
  serviceType: string | null;
  trackingNumber: string;
}) {
  const correctionAction = correctTrackingEvent.bind(null, trackingNumber);
  const [state, action, pending] = useActionState(correctionAction, initialState);
  const [open, setOpen] = useState(false);
  const errors = state.fieldErrors ?? {};

  if (!open) {
    return <Button onClick={() => setOpen(true)} type="button" variant="ghost">Append correction</Button>;
  }

  return (
    <form action={action} className="space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-300" />
        <div>
          <h4 className="font-semibold text-amber-100">Append an audited correction</h4>
          <p className="mt-1 text-xs text-amber-200/70">The original event remains in history. This adds a new customer-visible event.</p>
        </div>
      </div>
      {state.formError ? <p className="text-sm text-rose-300">{state.formError}</p> : null}
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Incorrect event</span>
        <select className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm" name="eventId">
          <option value="">Select event</option>
          {events.map((event) => <option key={event.id} value={event.id}>{event.label} / {new Date(event.timestamp).toLocaleString()}</option>)}
        </select>
        {errors.eventId ? <span className="text-xs text-rose-300">{errors.eventId}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Corrected status</span>
        <select className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm" name="status">
          {shipmentStatusValues
            .filter((status) => isShipmentStatusAllowedForService(status, serviceType))
            .map((status) => (
              <option key={status} value={status}>
                {getShipmentStatusDefinition(status, serviceType).label}
              </option>
            ))}
        </select>
        {errors.status ? <span className="text-xs text-rose-300">{errors.status}</span> : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Location *</span>
          <Input name="location" />
          {errors.location ? <span className="text-xs text-rose-300">{errors.location}</span> : null}
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Corrected time (Jakarta) *</span>
          <Input name="timestamp" type="datetime-local" />
          {errors.timestamp ? <span className="text-xs text-rose-300">{errors.timestamp}</span> : null}
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Correction reason *</span>
        <textarea className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm" name="reason" rows={3} />
        {errors.reason ? <span className="text-xs text-rose-300">{errors.reason}</span> : null}
      </label>
      <label className="flex items-start gap-3 text-sm text-amber-100">
        <input name="reviewConfirmed" type="checkbox" value="yes" />
        I understand this appends a customer-visible correction and does not erase the original event.
      </label>
      {errors.reviewConfirmed ? <p className="text-xs text-rose-300">{errors.reviewConfirmed}</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={() => setOpen(false)} type="button" variant="ghost">Cancel</Button>
        <Button disabled={pending} type="submit" variant="danger">{pending ? "Appending..." : "Append Correction"}</Button>
      </div>
    </form>
  );
}
