import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Plane,
  Printer,
  Truck,
  User,
} from "lucide-react";

import { getShipmentByTracking } from "@/actions/shipments";
import { Button, Card } from "@/components/ui/core";
import { getPortalUser } from "@/lib/portal-auth";
import { canEditShipmentDetails, isSuperadmin } from "@/lib/portal-roles";
import { getShipmentStatusDefinition } from "@/lib/shipments/status-model";
import type { TrackingEvent } from "@/lib/tracking/interface";
import { TrackingUpdateForm } from "@/components/portal/tracking-update-form";
import { TrackingCorrectionForm } from "@/components/portal/tracking-correction-form";
import { canUseMawbWorkflow } from "@/lib/mawbs/core";

type TrackingDetailPageProps = {
  params: Promise<{ number: string }>;
  searchParams?: Promise<{ error?: string; notice?: string }>;
};

type StatusStepProps = {
  event: TrackingEvent;
  isFirst?: boolean;
  isLast?: boolean;
};

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

function displayValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="break-words text-sm font-medium text-slate-200">{displayValue(value)}</p>
    </div>
  );
}

function MessageBanner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;

  return (
    <div
      className={
        error
          ? "rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          : "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
      }
    >
      {error || notice}
    </div>
  );
}

export default async function TrackingDetailPage({
  params,
  searchParams,
}: TrackingDetailPageProps) {
  const { number } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await getPortalUser();
  const { shipment, liveData, customer, parcels, flightLegs } =
    await getShipmentByTracking(number);
  const consignmentNoteTrackingNo = shipment?.internalTrackingNo ?? "";
  const primaryParcel = parcels[0];
  const canEditShipment = shipment && canEditShipmentDetails(user);
  const canUseMawbs = canUseMawbWorkflow(user);
  const statusLabel = shipment
    ? getShipmentStatusDefinition(liveData.status, shipment.serviceType).label
    : formatStatus(liveData.status);

  return (
    <div className="space-y-8">
      <MessageBanner error={resolvedSearchParams?.error} notice={resolvedSearchParams?.notice} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/shipments">
            <Button aria-label="Back to shipments" className="h-auto shrink-0 rounded-full p-2" variant="ghost">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="break-all font-mono text-2xl font-bold tracking-tight sm:text-3xl">{number}</h1>
            <p className="mt-1 text-sm text-slate-500">Carrier: {liveData.carrier}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto sm:justify-end">
          {consignmentNoteTrackingNo ? (
            <Link href={`/shipments/${encodeURIComponent(consignmentNoteTrackingNo)}/consignment-note`}>
              <Button className="gap-2" variant="secondary">
                <Printer className="h-4 w-4" />
                Print CN
              </Button>
            </Link>
          ) : null}
          {shipment && canUseMawbs ? (
            <Link href={`/shipments/new?copyFrom=${encodeURIComponent(shipment.trackingNumber)}`}>
              <Button className="gap-2" variant="secondary">
                <Copy className="h-4 w-4" />
                Copy Shipment
              </Button>
            </Link>
          ) : null}
          {shipment && canUseMawbs ? (
            <Link href={`/mawbs/new?shipment=${encodeURIComponent(shipment.trackingNumber)}`}>
              <Button className="gap-2" variant="secondary">
                <FileText className="h-4 w-4" />
                MAWB
              </Button>
            </Link>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${statusBadgeClassName(
              liveData.status,
            )}`}
          >
            <div className={`mr-2 h-2 w-2 rounded-full ${statusDotClassName(liveData.status)}`} />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {canEditShipment ? (
            <div className="flex justify-end">
              <Link href={`/shipments/${encodeURIComponent(number)}/edit`}>
                <Button className="gap-2" variant="secondary">
                  <Pencil className="h-4 w-4" />
                  Edit Shipment
                </Button>
              </Link>
            </div>
          ) : null}

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

          {shipment ? (
            <Card className="p-8">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                Shipment Details
              </h3>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Customer and service
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Customer reference" value={shipment.customerReference} />
                    <DetailItem label="AWB number" value={shipment.mawb} />
                    <DetailItem label="AWB airline" value={shipment.awbAirlineName} />
                    <DetailItem label="Customer name" value={shipment.customerName} />
                    <DetailItem label="Service type" value={shipment.serviceType} />
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Flight routing
                  </p>
                  <div className="space-y-3">
                    {flightLegs.length > 0 ? (
                      flightLegs.map((leg) => (
                        <div
                          className="rounded-lg border border-white/5 bg-slate-950/30 p-3"
                          key={leg.id}
                        >
                          <p className="font-mono text-sm font-semibold text-white">
                            {leg.airlineDesignator}
                            {leg.flightNumber}
                            {leg.operationalSuffix ?? ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{leg.airlineName}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No flight legs recorded.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Cargo
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Commodity"
                      value={shipment.commodity ?? primaryParcel?.commodity}
                    />
                    <DetailItem label="Cargo type" value={shipment.cargoType} />
                    <DetailItem label="Pieces" value={shipment.totalPcs ?? primaryParcel?.pieces} />
                    <DetailItem
                      label="Gross weight"
                      value={shipment.weightKg ?? primaryParcel?.weight}
                    />
                    <DetailItem label="Chargeable weight" value={shipment.chargeableWeight} />
                    <DetailItem label="Description" value={shipment.goodsDescription} />
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Shipper
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Name" value={shipment.shipperName} />
                    <DetailItem label="Phone" value={shipment.shipperPhone} />
                    <DetailItem label="Address" value={shipment.shipperAddress} />
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Receiver / consignee
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Name"
                      value={shipment.consigneeName ?? primaryParcel?.receiverName}
                    />
                    <DetailItem
                      label="Phone"
                      value={shipment.consigneePhone ?? primaryParcel?.receiverPhone}
                    />
                    <DetailItem label="Destination city" value={primaryParcel?.destinationCity} />
                    <DetailItem label="Postal code" value={primaryParcel?.postalCode} />
                    <DetailItem
                      label="Address"
                      value={shipment.consigneeAddress ?? primaryParcel?.receiverAddress}
                    />
                    <DetailItem
                      label="Delivery instruction"
                      value={primaryParcel?.deliveryInstruction}
                    />
                  </div>
                </div>
              </div>

              {primaryParcel ? (
                <div className="mt-8 border-t border-white/5 pt-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailItem label="Delivery Record ID" value={primaryParcel.ambaraParcelId} />
                    <DetailItem label="Delivery status" value={primaryParcel.currentStatus} />
                    <DetailItem label="COD amount" value={primaryParcel.codAmount} />
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-1">
          {shipment ? (
            <div id="tracking-update">
              <Card className="p-6">
                <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Update Tracking
                </h3>
                <TrackingUpdateForm
                  canOverride={isSuperadmin(user)}
                  currentStatus={shipment.status}
                  expectedUpdatedAt={shipment.updatedAt?.toISOString() ?? ""}
                  latestEventTime={liveData.events[0]?.timestamp.toISOString() ?? new Date().toISOString()}
                  serviceType={shipment.serviceType}
                  trackingNumber={shipment.trackingNumber}
                />
              </Card>
            </div>
          ) : null}

          {shipment && isSuperadmin(user) ? (
            <Card className="p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                Tracking Correction
              </h3>
              <TrackingCorrectionForm
                events={liveData.events
                  .filter((event): event is TrackingEvent & { id: number } => typeof event.id === "number")
                  .map((event) => ({
                    id: event.id,
                    label: event.label || event.description,
                    timestamp: event.timestamp.toISOString(),
                  }))}
                serviceType={shipment.serviceType}
                trackingNumber={shipment.trackingNumber}
              />
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
