import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Plane,
  Truck,
  User,
} from "lucide-react";

import { getShipmentByTracking, updateShipmentTrackingFromForm } from "@/actions/shipments";
import { Button, Card, Input } from "@/components/ui/core";
import type { TrackingEvent } from "@/lib/tracking/interface";

type TrackingDetailPageProps = {
  params: Promise<{ number: string }>;
};

type StatusStepProps = {
  event: TrackingEvent;
  isFirst?: boolean;
  isLast?: boolean;
};

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "departed_origin", label: "Departed Origin" },
  { value: "in_transit", label: "In Transit" },
  { value: "customs", label: "Customs" },
  { value: "arrived_destination", label: "Arrived Destination" },
  { value: "delivered", label: "Delivered" },
  { value: "exception", label: "Exception" },
  { value: "cancelled", label: "Cancelled" },
];

function normalizeStatusKey(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "departed") {
    return "departed_origin";
  }

  return normalized;
}

function formatStatus(status: string) {
  return normalizeStatusKey(status).replace(/_/g, " ");
}

function statusBadgeClassName(status: string) {
  const normalized = normalizeStatusKey(status);

  if (normalized === "delivered") {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (normalized === "exception" || normalized === "cancelled") {
    return "border border-rose-500/20 bg-rose-500/10 text-rose-400";
  }

  if (
    normalized === "arrived_destination" ||
    normalized === "customs" ||
    normalized === "departed_origin" ||
    normalized === "in_transit"
  ) {
    return "border border-amber-500/20 bg-amber-500/10 text-amber-500";
  }

  return "border border-blue-500/20 bg-blue-500/10 text-blue-500";
}

function statusDotClassName(status: string) {
  const normalized = normalizeStatusKey(status);

  if (normalized === "delivered") {
    return "bg-emerald-500";
  }

  if (normalized === "exception" || normalized === "cancelled") {
    return "bg-rose-400";
  }

  if (
    normalized === "arrived_destination" ||
    normalized === "customs" ||
    normalized === "departed_origin" ||
    normalized === "in_transit"
  ) {
    return "bg-amber-500";
  }

  return "bg-blue-500";
}

function StatusStep({ event, isFirst, isLast }: StatusStepProps) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div
          className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#0d0d14] ${
            isFirst
              ? "border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              : "border-white/10 text-slate-500"
          }`}
        >
          {isFirst ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>
        {!isLast && <div className="my-1 w-0.5 flex-1 bg-white/5" />}
      </div>
      <div className={isLast ? "" : "pb-10"}>
        <p className={`text-sm font-bold ${isFirst ? "text-white" : "text-slate-400"}`}>
          {event.description}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight text-slate-500">
            <MapPin className="h-3 w-3" /> {event.location || "Unknown Location"}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight text-slate-500">
            <Calendar className="h-3 w-3" /> {new Date(event.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function TrackingDetailPage({ params }: TrackingDetailPageProps) {
  const { number } = await params;
  const { shipment, liveData, customer } = await getShipmentByTracking(number);
  const trackingUpdateAction = updateShipmentTrackingFromForm.bind(null, number);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button className="h-auto rounded-full p-2" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{number}</h2>
          <p className="mt-1 text-sm text-slate-500">Carrier: {liveData.carrier}</p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${statusBadgeClassName(
              liveData.status,
            )}`}
          >
            <div className={`mr-2 h-2 w-2 rounded-full ${statusDotClassName(liveData.status)}`} />
            {formatStatus(liveData.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-8">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Tracking Timeline
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Last Synced: {new Date(liveData.lastSyncAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="relative">
              {liveData.events.map((event, index) => (
                <StatusStep
                  key={`${event.status}-${event.timestamp.toString()}`}
                  event={event}
                  isFirst={index === 0}
                  isLast={index === liveData.events.length - 1}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          {shipment ? (
            <Card className="p-6">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                Update Tracking
              </h3>
              <form action={trackingUpdateAction} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Status
                  </span>
                  <select
                    className={fieldClassName}
                    defaultValue={normalizeStatusKey(shipment.status)}
                    name="status"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Location
                  </span>
                  <Input name="location" placeholder="e.g. CGK Cargo Terminal" />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Description
                  </span>
                  <textarea
                    className={fieldClassName}
                    name="description"
                    placeholder="e.g. Cargo departed CGK"
                    rows={3}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Timestamp
                  </span>
                  <Input name="timestamp" type="datetime-local" />
                </label>

                <Button className="w-full gap-2" type="submit">
                  <CheckCircle2 className="h-4 w-4" />
                  Save Tracking Update
                </Button>
              </form>
            </Card>
          ) : null}

          <Card className="p-6">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
              Owner Information
            </h3>
            {customer ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-600/20 bg-blue-600/10 text-blue-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold">
                      {customer.fullName || customer.companyName}
                    </p>
                    <p className="text-xs text-slate-500">Linked to this shipment</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium">{customer.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium">{customer.phone || "N/A"}</span>
                  </div>
                </div>

                <Link className="block" href={`/customers/${customer.id}`}>
                  <Button className="w-full gap-2" variant="secondary">
                    View Full Profile <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-800" />
                <p className="text-sm font-medium text-slate-500">Unlinked Shipment</p>
                <p className="mt-1 text-xs text-slate-700">
                  This tracking number is not yet assigned to a customer.
                </p>
              </div>
            )}
          </Card>

          <Card className="border-blue-600/10 bg-blue-600/5 p-6">
            <div className="flex gap-4">
              <Truck className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-sm font-bold text-blue-400">Shipment Snapshot</p>
                <div className="mt-2 space-y-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2">
                    <Plane className="h-3.5 w-3.5 text-slate-500" />
                    Origin: {shipment?.origin || "Unknown"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    Destination: {shipment?.destination || "Unknown"}
                  </p>
                  <p>
                    Stored status:{" "}
                    <span className="font-semibold text-slate-200">
                      {shipment ? formatStatus(shipment.status) : formatStatus(liveData.status)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
