import Link from "next/link";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { ArrowLeft, Save } from "lucide-react";

import { createShipmentFromForm, getCustomersForSelect } from "@/actions/shipments";
import { Button, Card, Input, cn } from "@/components/ui/core";

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30";

const labelClassName = "text-xs font-bold uppercase tracking-widest text-slate-500";

const serviceTypes = ["DTD", "DTP", "PTD", "PTP"] as const;

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "processed", label: "Processed" },
  { value: "departed_origin", label: "Departed Origin" },
  { value: "in_transit", label: "In Transit" },
  { value: "customs", label: "Customs" },
  { value: "arrived_destination", label: "Arrived Destination" },
  { value: "out_for_delivery", label: "Out For Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delivery_issue", label: "Delivery Issue" },
  { value: "on_hold", label: "On Hold" },
  { value: "exception", label: "Exception" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const cargoTypes = [
  { value: "general", label: "General cargo" },
  { value: "document", label: "Document" },
  { value: "fragile", label: "Fragile" },
  { value: "perishable", label: "Perishable" },
  { value: "dangerous_goods", label: "Dangerous goods" },
  { value: "battery", label: "Battery" },
] as const;

type NewShipmentPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

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

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
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

export default async function NewShipmentPage({ searchParams }: NewShipmentPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const customers = await getCustomersForSelect();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Shipment</h2>
          <p className="mt-1 text-slate-500">
            Register a portal shipment with cargo, receiver, and delivery details.
          </p>
        </div>
      </div>

      <MessageBanner error={resolvedSearchParams?.error} />

      <form action={createShipmentFromForm} className="space-y-6">
        <Section title="Basic shipment information">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Customer name *">
              <Input name="customerName" placeholder="Customer or company name" required />
            </Field>

            <Field label="Linked portal customer">
              <select className={fieldClassName} name="customerId">
                <option value="">No customer linked</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.companyName || `Customer #${c.id}`}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Customer reference">
              <Input name="customerReference" placeholder="Customer PO, order, or reference" />
            </Field>

            <Field label="AWB number">
              <Input name="mawb" placeholder="Air waybill or MAWB number" />
            </Field>

            <Field label="Service type *">
              <select className={fieldClassName} name="serviceType" required>
                <option value="">Select service</option>
                {serviceTypes.map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {serviceType}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Shipment date">
              <Input name="shipmentDate" type="date" />
            </Field>

            <Field label="Origin city *">
              <Input name="origin" placeholder="Jakarta" required />
            </Field>

            <Field label="Destination city *">
              <Input name="destination" placeholder="Jakarta Selatan" required />
            </Field>

            <Field label="Current status">
              <select className={fieldClassName} defaultValue="pending" name="status">
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              helper="Tracking number will be auto-generated on save."
              label="Tracking number"
            >
              <Input name="trackingNumber" placeholder="Optional manual override" />
            </Field>

            <Field label="Shipment title">
              <Input name="title" placeholder="Optional internal shipment title" />
            </Field>
          </div>
        </Section>

        <Section title="Shipper details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Shipper name">
              <Input name="shipperName" placeholder="Origin shipper" />
            </Field>

            <Field label="Shipper phone">
              <Input name="shipperPhone" placeholder="Phone number" />
            </Field>

            <Field label="Shipper address">
              <TextArea name="shipperAddress" placeholder="Pickup or origin address" />
            </Field>
          </div>
        </Section>

        <Section title="Receiver / consignee details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Receiver name *">
              <Input name="receiverName" placeholder="Receiver or consignee" required />
            </Field>

            <Field label="Receiver phone *">
              <Input name="receiverPhone" placeholder="Receiver phone number" required />
            </Field>

            <Field label="Destination city *">
              <Input name="destinationCity" placeholder="Jakarta Selatan" required />
            </Field>

            <Field label="Postal code">
              <Input name="postalCode" placeholder="Postal code" />
            </Field>

            <Field label="Receiver address *">
              <TextArea name="receiverAddress" placeholder="Full delivery address" required />
            </Field>
          </div>
        </Section>

        <Section title="Cargo details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Commodity *">
              <Input name="commodity" placeholder="General cargo" required />
            </Field>

            <Field label="Special handling">
              <select className={fieldClassName} defaultValue="general" name="cargoType">
                {cargoTypes.map((cargoType) => (
                  <option key={cargoType.value} value={cargoType.value}>
                    {cargoType.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pieces *">
              <Input min="1" name="pieces" placeholder="1" required type="number" />
            </Field>

            <Field label="Gross weight (kg) *">
              <Input min="0.01" name="weightKg" placeholder="1.5" required step="0.01" type="number" />
            </Field>

            <Field label="Chargeable weight (kg)">
              <Input min="0.01" name="chargeableWeight" placeholder="Optional" step="0.01" type="number" />
            </Field>

            <Field label="Commodity description">
              <TextArea name="goodsDescription" placeholder="Optional cargo description" />
            </Field>
          </div>
        </Section>

        <Section title="Delivery / service details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Delivery instruction">
              <TextArea name="deliveryInstruction" placeholder="Delivery notes for operations or vendor handover" />
            </Field>

            <Field label="COD amount">
              <Input min="0" name="codAmount" placeholder="Optional" step="0.01" type="number" />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Internal note">
              <TextArea name="internalNote" placeholder="Admin-only note for the initial tracking event" />
            </Field>
          </div>
        </Section>

        <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-6 sm:flex-row sm:justify-end">
          <Link href="/shipments">
            <Button className="w-full sm:w-auto" type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button className="w-full gap-2 sm:w-auto" type="submit">
            <Save className="h-4 w-4" />
            Create Shipment
          </Button>
        </div>
      </form>
    </div>
  );
}
