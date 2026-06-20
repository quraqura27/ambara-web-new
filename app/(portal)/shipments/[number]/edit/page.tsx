import Link from "next/link";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { ArrowLeft, LockKeyhole, Save } from "lucide-react";
import { notFound } from "next/navigation";

import {
  getCustomersForSelect,
  getShipmentByTracking,
  updateShipmentDetails,
} from "@/actions/shipments";
import { AwbInput } from "@/components/portal/awb-input";
import { FlightLegsEditor } from "@/components/portal/flight-legs-editor";
import { Button, Card, Input, cn } from "@/components/ui/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { canEditShipmentDetails } from "@/lib/portal-roles";

type EditShipmentPageProps = {
  params: Promise<{ number: string }>;
  searchParams?: Promise<{ error?: string }>;
};

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70";

const labelClassName = "text-xs font-bold uppercase tracking-widest text-slate-500";

const serviceTypes = ["DTD", "DTP", "PTD", "PTP"] as const;

const cargoTypes = [
  { value: "general", label: "General cargo" },
  { value: "document", label: "Document" },
  { value: "fragile", label: "Fragile" },
  { value: "perishable", label: "Perishable" },
  { value: "dangerous_goods", label: "Dangerous goods" },
  { value: "battery", label: "Battery" },
] as const;

function MessageBanner({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        "border-rose-500/20 bg-rose-500/10 text-rose-300",
      )}
    >
      {error}
    </div>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card className="p-6">
      <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      {children}
    </Card>
  );
}

function Field({
  children,
  helper,
  label,
}: {
  children: ReactNode;
  helper?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className={labelClassName}>{label}</span>
      {children}
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={fieldClassName} rows={3} {...props} />;
}

function readOnlyValue(value: number | string | Date | null | undefined) {
  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function ImmutableItem({
  label,
  value,
}: {
  label: string;
  value: number | string | Date | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-slate-200">
        {readOnlyValue(value)}
      </p>
    </div>
  );
}

export default async function EditShipmentPage({ params, searchParams }: EditShipmentPageProps) {
  const { number } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requirePortalUser();

  if (!canEditShipmentDetails(user)) {
    notFound();
  }

  const [{ shipment, parcels, flightLegs }, customers] = await Promise.all([
    getShipmentByTracking(number),
    getCustomersForSelect(),
  ]);

  if (!shipment) {
    notFound();
  }

  const primaryParcel = parcels[0];
  const updateAction = updateShipmentDetails.bind(null, shipment.trackingNumber);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}>
          <Button className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Shipment</h2>
          <p className="mt-1 text-slate-500">
            Correct shipment, receiver, cargo, and service details.
          </p>
        </div>
      </div>

      <MessageBanner error={resolvedSearchParams?.error} />

      <Section title="Immutable shipment fields">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ImmutableItem label="Ambara tracking number" value={shipment.trackingNumber} />
          <ImmutableItem
            label="Delivery Record ID"
            value={primaryParcel?.ambaraParcelId ?? "No Delivery Record"}
          />
          <ImmutableItem label="Created at" value={shipment.createdAt} />
          <ImmutableItem label="Current status" value={shipment.status} />
        </div>
        <div className="mt-5 flex gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Tracking number, Delivery Record ID, creation metadata, vendor tracking, and tracking event
            history are not editable here. Use the shipment status update action to change tracking
            status.
          </p>
        </div>
      </Section>

      {parcels.length === 0 ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          This legacy shipment has no Delivery Record. Shipment-level details can be edited, but
          delivery export and batch features require a Delivery Record.
        </div>
      ) : null}

      {parcels.length > 1 ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          This shipment has multiple Delivery Records. This form updates shipment-level fields
          only; record-specific rows are left unchanged to avoid overwriting multiple records.
        </div>
      ) : null}

      <form action={updateAction} className="space-y-6">
        <Section title="Basic shipment information">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Customer name *">
              <Input
                defaultValue={shipment.customerName ?? ""}
                name="customerName"
                placeholder="Customer or company name"
                required
              />
            </Field>

            <Field label="Linked portal customer">
              <select className={fieldClassName} defaultValue={shipment.customerId ?? ""} name="customerId">
                <option value="">No customer linked</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.companyName || `Customer #${c.id}`}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Customer reference">
              <Input
                defaultValue={shipment.customerReference ?? ""}
                name="customerReference"
                placeholder="Customer PO, order, or reference"
              />
            </Field>

            <div className="space-y-2">
              <span className={labelClassName}>AWB number</span>
              <AwbInput
                defaultAirlineName={shipment.awbAirlineName}
                defaultValue={shipment.mawb}
                required={false}
              />
            </div>

            <Field label="Service type *">
              <select className={fieldClassName} defaultValue={shipment.serviceType ?? ""} name="serviceType" required>
                <option value="">Select service</option>
                {serviceTypes.map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {serviceType}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Origin city *">
              <Input defaultValue={shipment.origin} name="origin" placeholder="Jakarta" required />
            </Field>

            <Field label="Destination city *">
              <Input
                defaultValue={shipment.destination}
                name="destination"
                placeholder="Jakarta Selatan"
                required
              />
            </Field>

            <Field label="Shipment title">
              <Input
                defaultValue={shipment.title}
                name="title"
                placeholder="Optional internal shipment title"
              />
            </Field>
          </div>
        </Section>

        <Section title="Flight routing">
          <FlightLegsEditor
            defaultValue={JSON.stringify(
              flightLegs.map((leg) => ({
                airlineName: leg.airlineName,
                flightNumber: `${leg.airlineDesignator}${leg.flightNumber}${leg.operationalSuffix ?? ""}`,
                id: String(leg.id),
              })),
            )}
          />
        </Section>

        <Section title="Shipper details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Shipper name">
              <Input defaultValue={shipment.shipperName ?? ""} name="shipperName" placeholder="Origin shipper" />
            </Field>

            <Field label="Shipper phone">
              <Input defaultValue={shipment.shipperPhone ?? ""} name="shipperPhone" placeholder="Phone number" />
            </Field>

            <Field label="Shipper address">
              <TextArea
                defaultValue={shipment.shipperAddress ?? ""}
                name="shipperAddress"
                placeholder="Pickup or origin address"
              />
            </Field>
          </div>
        </Section>

        <Section title="Receiver / consignee details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Receiver name *">
              <Input
                defaultValue={primaryParcel?.receiverName ?? shipment.consigneeName ?? ""}
                name="receiverName"
                placeholder="Receiver or consignee"
                required
              />
            </Field>

            <Field label="Receiver phone *">
              <Input
                defaultValue={primaryParcel?.receiverPhone ?? shipment.consigneePhone ?? ""}
                name="receiverPhone"
                placeholder="Receiver phone number"
                required
              />
            </Field>

            <Field label="Destination city *">
              <Input
                defaultValue={primaryParcel?.destinationCity ?? shipment.destination}
                name="destinationCity"
                placeholder="Jakarta Selatan"
                required
              />
            </Field>

            <Field label="Postal code">
              <Input defaultValue={primaryParcel?.postalCode ?? ""} name="postalCode" placeholder="Postal code" />
            </Field>

            <Field label="Receiver address *">
              <TextArea
                defaultValue={primaryParcel?.receiverAddress ?? shipment.consigneeAddress ?? ""}
                name="receiverAddress"
                placeholder="Full delivery address"
                required
              />
            </Field>
          </div>
        </Section>

        <Section title="Cargo details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Commodity *">
              <Input
                defaultValue={shipment.commodity ?? primaryParcel?.commodity ?? ""}
                name="commodity"
                placeholder="General cargo"
                required
              />
            </Field>

            <Field label="Special handling">
              <select className={fieldClassName} defaultValue={shipment.cargoType ?? "general"} name="cargoType">
                {cargoTypes.map((cargoType) => (
                  <option key={cargoType.value} value={cargoType.value}>
                    {cargoType.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              helper="Physical cargo quantity, such as cartons, boxes, bags, or pallets. Pieces do not create additional shipments or Delivery Records; one CN can print one label per piece."
              label="Pieces *"
            >
              <Input
                defaultValue={shipment.totalPcs ?? primaryParcel?.pieces ?? 1}
                min="1"
                name="pieces"
                placeholder="1"
                required
                type="number"
              />
            </Field>

            <Field label="Gross weight (kg) *">
              <Input
                defaultValue={shipment.weightKg ?? primaryParcel?.weight ?? ""}
                min="0.01"
                name="weightKg"
                placeholder="1.5"
                required
                step="0.01"
                type="number"
              />
            </Field>

            <Field label="Chargeable weight (kg)">
              <Input
                defaultValue={shipment.chargeableWeight ?? ""}
                min="0.01"
                name="chargeableWeight"
                placeholder="Optional"
                step="0.01"
                type="number"
              />
            </Field>

            <Field label="Commodity description">
              <TextArea
                defaultValue={shipment.goodsDescription ?? ""}
                name="goodsDescription"
                placeholder="Optional cargo description"
              />
            </Field>
          </div>
        </Section>

        <Section title="Delivery / service details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Delivery instruction">
              <TextArea
                defaultValue={primaryParcel?.deliveryInstruction ?? ""}
                name="deliveryInstruction"
                placeholder="Delivery notes for operations or vendor handover"
              />
            </Field>

            <Field label="COD amount">
              <Input
                defaultValue={primaryParcel?.codAmount ?? ""}
                min="0"
                name="codAmount"
                placeholder="Optional"
                step="0.01"
                type="number"
              />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              helper="Shipment-level internal notes are not stored in the current schema. Tracking-event internal notes are intentionally not edited here."
              label="Internal note"
            >
              <TextArea disabled placeholder="Not supported for shipment detail edits" />
            </Field>
          </div>
        </Section>

        <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-6 sm:flex-row sm:justify-end">
          <Link href={`/shipments/${encodeURIComponent(shipment.trackingNumber)}`}>
            <Button className="w-full sm:w-auto" type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button className="w-full gap-2 sm:w-auto" type="submit">
            <Save className="h-4 w-4" />
            Save Shipment Details
          </Button>
        </div>
      </form>
    </div>
  );
}
