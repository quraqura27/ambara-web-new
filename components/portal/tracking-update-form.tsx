"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { updateTrackingSafely, type TrackingUpdateState } from "@/actions/tracking-safety";
import { Button, Input } from "@/components/ui/core";
import {
  getAllowedShipmentTransitions,
  getShipmentStatusDefinition,
  normalizeShipmentStatus,
  shipmentStatusValues,
} from "@/lib/shipments/status-model";
import { isShipmentStatusAllowedForService } from "@/lib/shipments/service-model";

const initialState: TrackingUpdateState = {};

function jakartaDateTimeInput() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function TrackingUpdateForm({
  canOverride,
  currentStatus,
  expectedUpdatedAt,
  latestEventTime,
  serviceType,
  trackingNumber,
}: {
  canOverride: boolean;
  currentStatus: string;
  expectedUpdatedAt: string;
  latestEventTime: string;
  serviceType: string | null;
  trackingNumber: string;
}) {
  const safeAction = updateTrackingSafely.bind(null, trackingNumber);
  const [state, action, pending] = useActionState(safeAction, initialState);
  const normalizedCurrent = normalizeShipmentStatus(currentStatus);
  const allowed = getAllowedShipmentTransitions(normalizedCurrent, serviceType);
  const [override, setOverride] = useState(false);
  const [status, setStatus] = useState<string>(allowed[0]?.status ?? "");
  const [timestamp, setTimestamp] = useState(jakartaDateTimeInput);
  const [location, setLocation] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [confirmOlderTimestamp, setConfirmOlderTimestamp] = useState(false);
  const selected = status ? getShipmentStatusDefinition(status, serviceType) : null;
  const olderThanLatest = useMemo(() => {
    if (!timestamp || !latestEventTime) return false;
    return new Date(`${timestamp}:00+07:00`).getTime() < new Date(latestEventTime).getTime();
  }, [latestEventTime, timestamp]);
  const errors = state.fieldErrors ?? {};
  const options = override
    ? shipmentStatusValues
        .filter(
          (value) =>
            value !== normalizedCurrent &&
            isShipmentStatusAllowedForService(value, serviceType),
        )
        .map((value) => ({
          status: value,
          ...getShipmentStatusDefinition(value, serviceType),
        }))
    : allowed;

  return (
    <form action={action} className="space-y-4">
      <input name="expectedUpdatedAt" type="hidden" value={expectedUpdatedAt} />
      {state.formError ? <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{state.formError}</p> : null}
      <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current status</p>
        <p className="mt-2 font-semibold">
          {getShipmentStatusDefinition(normalizedCurrent, serviceType).label}
        </p>
      </div>
      {options.length > 0 ? (
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Next action</span>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm" name="status" onChange={(event) => setStatus(event.target.value)} value={status}>
            {options.map((option) => <option key={option.status} value={option.status}>Mark as {option.label}</option>)}
          </select>
          {errors.status ? <span className="text-xs text-rose-300">{errors.status}</span> : null}
        </label>
      ) : (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          This shipment is in a terminal status. A superadmin override is required for another update.
        </p>
      )}

      {canOverride ? (
        <label className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100">
          <input checked={override} name="override" onChange={(event) => {
            setOverride(event.target.checked);
            const nextOptions = event.target.checked
              ? shipmentStatusValues.filter(
                  (value) =>
                    value !== normalizedCurrent &&
                    isShipmentStatusAllowedForService(value, serviceType),
                )
              : getAllowedShipmentTransitions(normalizedCurrent, serviceType).map(
                  (item) => item.status,
                );
            setStatus(nextOptions[0] ?? "");
          }} type="checkbox" value="yes" />
          Override the normal status sequence
        </label>
      ) : null}
      {override ? (
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Override reason *</span>
          <textarea className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm" name="overrideReason" onChange={(event) => setOverrideReason(event.target.value)} rows={3} value={overrideReason} />
          {errors.overrideReason ? <span className="text-xs text-rose-300">{errors.overrideReason}</span> : null}
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Location *</span>
        <Input name="location" onChange={(event) => setLocation(event.target.value)} placeholder="e.g. CGK Cargo Terminal" value={location} />
        {errors.location ? <span className="text-xs text-rose-300">{errors.location}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Time (Asia/Jakarta) *</span>
        <Input name="timestamp" onChange={(event) => setTimestamp(event.target.value)} type="datetime-local" value={timestamp} />
        {errors.timestamp ? <span className="text-xs text-rose-300">{errors.timestamp}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Internal note</span>
        <textarea className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm" name="internalNote" onChange={(event) => setInternalNote(event.target.value)} placeholder="Not shown to customers" rows={3} value={internalNote} />
      </label>

      {selected ? (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Customer will see</p>
          <p className="mt-2 font-semibold text-white">{selected.publicLabel}</p>
          <p className="mt-1 text-blue-100/80">{selected.publicDescription}</p>
        </div>
      ) : null}

      {olderThanLatest ? (
        <label className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <input checked={confirmOlderTimestamp} name="confirmOlderTimestamp" onChange={(event) => setConfirmOlderTimestamp(event.target.checked)} type="checkbox" value="yes" />
          <span>This timestamp is older than the latest event. I intend to add it out of sequence.</span>
        </label>
      ) : null}
      {errors.confirmOlderTimestamp ? <p className="text-xs text-rose-300">{errors.confirmOlderTimestamp}</p> : null}

      <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-300">
        <input checked={reviewConfirmed} name="reviewConfirmed" onChange={(event) => setReviewConfirmed(event.target.checked)} type="checkbox" value="yes" />
        <span>I reviewed the status, time, location, and exact customer-visible message.</span>
      </label>
      {errors.reviewConfirmed ? <p className="text-xs text-rose-300">{errors.reviewConfirmed}</p> : null}

      <Button className="w-full gap-2" disabled={pending || !status} type="submit">
        <CheckCircle2 className="h-4 w-4" />
        {pending ? "Saving..." : "Save Tracking Update"}
      </Button>
    </form>
  );
}
