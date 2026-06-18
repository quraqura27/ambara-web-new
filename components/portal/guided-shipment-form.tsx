"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, PackageCheck } from "lucide-react";

import {
  createGuidedShipment,
  type GuidedShipmentActionState,
} from "@/actions/guided-shipment";
import { Button, Card, Input, cn } from "@/components/ui/core";
import {
  getShipmentServiceDefinition,
  shipmentServiceDefinitions,
  shipmentServiceValues,
} from "@/lib/shipments/service-model";

type CustomerOption = {
  companyName: string | null;
  fullName: string | null;
  id: number;
};

type GuidedShipmentFormProps = {
  customers: CustomerOption[];
  idempotencyKey: string;
  locations: {
    destinations: string[];
    origins: string[];
  };
};

const specialCargo = new Set(["dangerous_goods", "battery", "fragile", "perishable"]);

const initialValues: Record<string, string> = {
  cargoType: "general",
  chargeableWeight: "",
  codAmount: "",
  commodity: "",
  confirmCustomerDuplicate: "",
  confirmDuplicates: "",
  customerId: "",
  customerMode: "existing",
  customerName: "",
  customerReference: "",
  deliveryInstruction: "",
  destination: "",
  destinationCity: "",
  goodsDescription: "",
  handlingConfirmed: "",
  idempotencyKey: "",
  internalNote: "",
  mawb: "",
  origin: "",
  pieces: "1",
  postalCode: "",
  quickAddress: "",
  quickCompanyName: "",
  quickEmail: "",
  quickFullName: "",
  quickPhone: "",
  receiverAddress: "",
  receiverName: "",
  receiverPhone: "",
  reviewConfirmed: "",
  serviceType: "DTD",
  shipperAddress: "",
  shipperName: "",
  shipperPhone: "",
  title: "",
  trackingNumber: "",
  unlinkedReason: "",
  weightKg: "",
};

const initialActionState: GuidedShipmentActionState = {};
const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

function FieldError({ error }: { error?: string }) {
  return error ? (
    <span className="block text-xs font-medium text-rose-300" role="alert">
      {error}
    </span>
  ) : null;
}

function Field({
  children,
  error,
  helper,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  helper?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      {children}
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
      <FieldError error={error} />
    </label>
  );
}

export function GuidedShipmentForm({
  customers,
  idempotencyKey,
  locations,
}: GuidedShipmentFormProps) {
  const [state, action, pending] = useActionState(createGuidedShipment, initialActionState);
  const [values, setValues] = useState<Record<string, string>>({
    ...initialValues,
    idempotencyKey,
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fieldErrors = useMemo(() => state.fieldErrors ?? {}, [state.fieldErrors]);
  const service = getShipmentServiceDefinition(values.serviceType);
  const doorDelivery = service?.doorDelivery === true;

  useEffect(() => {
    const firstError = Object.keys(fieldErrors)[0];
    if (!firstError) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
    });
  }, [fieldErrors]);
  const advancedHasError = [
    "codAmount",
    "customerReference",
    "deliveryInstruction",
    "goodsDescription",
    "internalNote",
    "mawb",
    "shipperAddress",
    "shipperName",
    "shipperPhone",
    "title",
    "trackingNumber",
  ].some((field) => Boolean(fieldErrors[field]));
  const showAdvanced = advancedOpen || advancedHasError;

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      `${customer.fullName ?? ""} ${customer.companyName ?? ""}`.toLowerCase().includes(query),
    );
  }, [customerSearch, customers]);

  const selectedCustomer = customers.find((customer) => String(customer.id) === values.customerId);
  const customerDisplay =
    values.customerMode === "existing"
      ? selectedCustomer?.fullName || selectedCustomer?.companyName
      : values.customerMode === "quick"
        ? values.quickFullName || values.quickCompanyName
        : values.customerName;
  const chargeableWarning =
    Number(values.chargeableWeight) > 0 &&
    Number(values.weightKg) > 0 &&
    Number(values.chargeableWeight) < Number(values.weightKg);

  function update(name: string, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === "destination" && (!current.destinationCity || current.destinationCity === current.destination)) {
        next.destinationCity = value;
      }
      if (name === "serviceType") {
        const nextService = getShipmentServiceDefinition(value);
        if (!nextService?.doorDelivery) {
          next.destinationCity = current.destination;
          next.codAmount = "";
          next.deliveryInstruction = "";
          next.postalCode = "";
        }
      }
      return next;
    });
  }

  return (
    <form action={action} className="space-y-6">
      <input name="idempotencyKey" type="hidden" value={values.idempotencyKey} />

      {state.formError ? (
        <div
          className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {state.formError}
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Service and customer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Service type determines whether a delivery address and last-mile tracking are required.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shipmentServiceValues.map((value) => {
            const definition = shipmentServiceDefinitions[value];
            return (
              <label
                className={cn(
                  "cursor-pointer rounded-xl border p-4",
                  values.serviceType === value
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/5 bg-white/[0.02]",
                )}
                key={value}
              >
                <input
                  checked={values.serviceType === value}
                  className="sr-only"
                  name="serviceType"
                  onChange={() => update("serviceType", value)}
                  type="radio"
                  value={value}
                />
                <span className="font-bold text-white">{value}</span>
                <span className="mt-1 block text-sm text-slate-300">{definition.label}</span>
                <span className="mt-2 block text-xs text-slate-500">
                  {definition.doorDelivery
                    ? "Includes destination door delivery."
                    : "Completes at the destination port."}
                </span>
              </label>
            );
          })}
        </div>
        <FieldError error={fieldErrors.serviceType} />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["existing", "Existing customer", "Normal daily input"],
            ["quick", "Quick-create", "Add a new customer here"],
            ["unlinked", "Without customer", "Requires an operational reason"],
          ].map(([value, label, description]) => (
            <label
              className={cn(
                "cursor-pointer rounded-xl border p-4",
                values.customerMode === value
                  ? "border-blue-500/40 bg-blue-500/10"
                  : "border-white/5 bg-white/[0.02]",
              )}
              key={value}
            >
              <input
                checked={values.customerMode === value}
                className="mr-2"
                name="customerMode"
                onChange={() => update("customerMode", value)}
                type="radio"
                value={value}
              />
              <span className="font-semibold">{label}</span>
              <span className="mt-1 block text-xs text-slate-500">{description}</span>
            </label>
          ))}
        </div>
        <FieldError error={fieldErrors.customerMode} />

        {values.customerMode === "existing" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Find customer">
              <Input
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Search customer or company..."
                value={customerSearch}
              />
            </Field>
            <Field error={fieldErrors.customerId} label="Customer *">
              <select
                className={inputClassName}
                name="customerId"
                onChange={(event) => update("customerId", event.target.value)}
                value={values.customerId}
              >
                <option value="">Select customer</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName || customer.companyName || `Customer #${customer.id}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {values.customerMode === "quick" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={fieldErrors.quickFullName} label="Contact name">
              <Input
                name="quickFullName"
                onChange={(event) => update("quickFullName", event.target.value)}
                value={values.quickFullName}
              />
            </Field>
            <Field label="Company name">
              <Input
                name="quickCompanyName"
                onChange={(event) => update("quickCompanyName", event.target.value)}
                value={values.quickCompanyName}
              />
            </Field>
            <Field error={fieldErrors.quickEmail} label="Email">
              <Input
                name="quickEmail"
                onChange={(event) => update("quickEmail", event.target.value)}
                type="email"
                value={values.quickEmail}
              />
            </Field>
            <Field error={fieldErrors.quickPhone} label="Phone">
              <Input
                name="quickPhone"
                onChange={(event) => update("quickPhone", event.target.value)}
                placeholder="0812 3456 7890"
                value={values.quickPhone}
              />
            </Field>
            <Field label="Address">
              <textarea
                className={inputClassName}
                name="quickAddress"
                onChange={(event) => update("quickAddress", event.target.value)}
                rows={3}
                value={values.quickAddress}
              />
            </Field>
          </div>
        ) : null}

        {values.customerMode === "unlinked" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={fieldErrors.customerName} label="Customer name *">
              <Input
                name="customerName"
                onChange={(event) => update("customerName", event.target.value)}
                value={values.customerName}
              />
            </Field>
            <Field error={fieldErrors.unlinkedReason} label="Reason for no customer link *">
              <textarea
                className={inputClassName}
                name="unlinkedReason"
                onChange={(event) => update("unlinkedReason", event.target.value)}
                rows={3}
                value={values.unlinkedReason}
              />
            </Field>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">{doorDelivery ? "Route and receiver" : "Route and consignee"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {doorDelivery
              ? "Enter the final delivery details required for last-mile operations."
              : "No destination delivery address is needed for this port-complete service."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field error={fieldErrors.origin} label="Origin *">
            <Input
              list="common-origin-cities"
              name="origin"
              onChange={(event) => update("origin", event.target.value)}
              placeholder="Jakarta"
              value={values.origin}
            />
            <datalist id="common-origin-cities">
              {locations.origins.map((location) => <option key={location} value={location} />)}
            </datalist>
          </Field>
          <Field error={fieldErrors.destination} label="Route destination *">
            <Input
              list="common-destination-cities"
              name="destination"
              onChange={(event) => update("destination", event.target.value)}
              placeholder="Surabaya"
              value={values.destination}
            />
            <datalist id="common-destination-cities">
              {locations.destinations.map((location) => <option key={location} value={location} />)}
            </datalist>
          </Field>
          <Field error={fieldErrors.receiverName} label={`${doorDelivery ? "Receiver" : "Consignee"} name *`}>
            <Input
              name="receiverName"
              onChange={(event) => update("receiverName", event.target.value)}
              value={values.receiverName}
            />
          </Field>
          <Field
            error={fieldErrors.receiverPhone}
            helper="Indonesian numbers are normalized to +62."
            label={`${doorDelivery ? "Receiver phone" : "Consignee contact"} *`}
          >
            <Input
              name="receiverPhone"
              onChange={(event) => update("receiverPhone", event.target.value)}
              placeholder="0812 3456 7890"
              value={values.receiverPhone}
            />
          </Field>
          {doorDelivery ? (
            <>
              <Field error={fieldErrors.destinationCity} label="Final delivery city *">
                <Input
                  name="destinationCity"
                  onChange={(event) => update("destinationCity", event.target.value)}
                  value={values.destinationCity}
                />
              </Field>
              <Field error={fieldErrors.postalCode} label="Postal code">
                <Input
                  inputMode="numeric"
                  maxLength={5}
                  name="postalCode"
                  onChange={(event) => update("postalCode", event.target.value)}
                  value={values.postalCode}
                />
              </Field>
              <Field error={fieldErrors.receiverAddress} label="Delivery address *">
                <textarea
                  className={inputClassName}
                  name="receiverAddress"
                  onChange={(event) => update("receiverAddress", event.target.value)}
                  rows={4}
                  value={values.receiverAddress}
                />
              </Field>
            </>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Cargo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pieces is the cargo quantity within this one shipment. It does not create additional shipments.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field error={fieldErrors.commodity} label="Commodity *">
            <Input
              name="commodity"
              onChange={(event) => update("commodity", event.target.value)}
              value={values.commodity}
            />
          </Field>
          <Field error={fieldErrors.pieces} label="Pieces *">
            <Input
              min="1"
              name="pieces"
              onChange={(event) => update("pieces", event.target.value)}
              type="number"
              value={values.pieces}
            />
          </Field>
          <Field error={fieldErrors.weightKg} label="Gross weight (kg) *">
            <Input
              min="0.01"
              name="weightKg"
              onChange={(event) => update("weightKg", event.target.value)}
              step="0.01"
              type="number"
              value={values.weightKg}
            />
          </Field>
          <Field error={fieldErrors.chargeableWeight} label="Chargeable weight (kg)">
            <Input
              min="0"
              name="chargeableWeight"
              onChange={(event) => update("chargeableWeight", event.target.value)}
              step="0.01"
              type="number"
              value={values.chargeableWeight}
            />
            {chargeableWarning ? (
              <span className="text-xs text-amber-300">
                Chargeable weight is below gross weight. Verify before creating.
              </span>
            ) : null}
          </Field>
          <Field error={fieldErrors.cargoType} label="Cargo handling">
            <select
              className={inputClassName}
              name="cargoType"
              onChange={(event) => update("cargoType", event.target.value)}
              value={values.cargoType}
            >
              <option value="general">General cargo</option>
              <option value="document">Document</option>
              <option value="fragile">Fragile</option>
              <option value="perishable">Perishable</option>
              <option value="dangerous_goods">Dangerous goods</option>
              <option value="battery">Battery</option>
            </select>
          </Field>
        </div>

        {specialCargo.has(values.cargoType) ? (
          <label className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <input
              checked={values.handlingConfirmed === "yes"}
              name="handlingConfirmed"
              onChange={(event) => update("handlingConfirmed", event.target.checked ? "yes" : "")}
              type="checkbox"
              value="yes"
            />
            <span>
              I reviewed packaging, documentation, route, consignee readiness, and applicable handling requirements.
              <FieldError error={fieldErrors.handlingConfirmed} />
            </span>
          </label>
        ) : null}
      </Card>

      <Card className="p-0">
        <button
          aria-expanded={showAdvanced}
          className="flex w-full items-center justify-between p-5 text-left sm:p-6"
          onClick={() => setAdvancedOpen((open) => !open)}
          type="button"
        >
          <span>
            <span className="block font-semibold">Advanced details</span>
            <span className="mt-1 block text-xs text-slate-500">
              References, shipper information, notes, and manual tracking override.
            </span>
          </span>
          <ChevronDown className={cn("h-5 w-5 transition", showAdvanced && "rotate-180")} />
        </button>
        {showAdvanced ? (
          <div className="grid gap-4 border-t border-white/5 p-5 md:grid-cols-2 sm:p-6">
            <Field label="Customer reference">
              <Input name="customerReference" onChange={(event) => update("customerReference", event.target.value)} value={values.customerReference} />
            </Field>
            <Field label="AWB / MAWB">
              <Input name="mawb" onChange={(event) => update("mawb", event.target.value)} value={values.mawb} />
            </Field>
            <Field error={fieldErrors.trackingNumber} helper="Leave blank to generate automatically." label="Manual tracking number">
              <Input name="trackingNumber" onChange={(event) => update("trackingNumber", event.target.value)} value={values.trackingNumber} />
            </Field>
            <Field label="Internal shipment title">
              <Input name="title" onChange={(event) => update("title", event.target.value)} value={values.title} />
            </Field>
            <Field label="Shipper name">
              <Input name="shipperName" onChange={(event) => update("shipperName", event.target.value)} value={values.shipperName} />
            </Field>
            <Field label="Shipper phone">
              <Input name="shipperPhone" onChange={(event) => update("shipperPhone", event.target.value)} value={values.shipperPhone} />
            </Field>
            <Field label="Shipper / pickup address">
              <textarea className={inputClassName} name="shipperAddress" onChange={(event) => update("shipperAddress", event.target.value)} rows={3} value={values.shipperAddress} />
            </Field>
            <Field label="Goods description">
              <textarea className={inputClassName} name="goodsDescription" onChange={(event) => update("goodsDescription", event.target.value)} rows={3} value={values.goodsDescription} />
            </Field>
            {doorDelivery ? (
              <>
                <Field label="Delivery instruction">
                  <textarea className={inputClassName} name="deliveryInstruction" onChange={(event) => update("deliveryInstruction", event.target.value)} rows={3} value={values.deliveryInstruction} />
                </Field>
                <Field error={fieldErrors.codAmount} label="COD amount">
                  <Input min="0" name="codAmount" onChange={(event) => update("codAmount", event.target.value)} step="0.01" type="number" value={values.codAmount} />
                </Field>
              </>
            ) : null}
            <Field label="Internal note">
              <textarea className={inputClassName} name="internalNote" onChange={(event) => update("internalNote", event.target.value)} rows={3} value={values.internalNote} />
            </Field>
          </div>
        ) : null}
      </Card>

      {(state.duplicateWarnings?.length ?? 0) > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <h3 className="font-semibold text-amber-100">Possible duplicate found</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200/80">
                {state.duplicateWarnings?.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          </div>
          {fieldErrors.confirmCustomerDuplicate ? (
            <label className="mt-4 flex items-start gap-3 text-sm text-amber-100">
              <input
                checked={values.confirmCustomerDuplicate === "yes"}
                name="confirmCustomerDuplicate"
                onChange={(event) => update("confirmCustomerDuplicate", event.target.checked ? "yes" : "")}
                type="checkbox"
                value="yes"
              />
              I reviewed the possible customer duplicate and still need a new customer record.
            </label>
          ) : (
            <label className="mt-4 flex items-start gap-3 text-sm text-amber-100">
              <input
                checked={values.confirmDuplicates === "yes"}
                name="confirmDuplicates"
                onChange={(event) => update("confirmDuplicates", event.target.checked ? "yes" : "")}
                type="checkbox"
                value="yes"
              />
              I reviewed the possible duplicate and intend to create a separate shipment.
            </label>
          )}
          <FieldError error={fieldErrors.confirmCustomerDuplicate || fieldErrors.confirmDuplicates} />
        </Card>
      ) : null}

      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex gap-3">
          <PackageCheck className="h-6 w-6 shrink-0 text-blue-400" />
          <div>
            <h2 className="text-lg font-bold">Review and create</h2>
            <p className="mt-1 text-sm text-slate-500">
              This creates one shipment, one tracking number, one CN, and one internal delivery record.
            </p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Customer", customerDisplay || "Missing"],
            ["Service", `${values.serviceType} — ${service?.label ?? ""}`],
            ["Route", `${values.origin || "Missing"} → ${values.destination || "Missing"}`],
            [doorDelivery ? "Receiver" : "Consignee", values.receiverName || "Missing"],
            ["Cargo", values.commodity || "Missing"],
            ["Quantity", `${values.pieces || "0"} pieces`],
            ["Weight", `${values.weightKg || "0"} kg`],
            ["Completion", doorDelivery ? "Delivered" : "Arrived at Destination Port"],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4" key={label}>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</dt>
              <dd className="mt-2 text-sm font-semibold text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <label className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
          <input
            checked={values.reviewConfirmed === "yes"}
            name="reviewConfirmed"
            onChange={(event) => update("reviewConfirmed", event.target.checked ? "yes" : "")}
            type="checkbox"
            value="yes"
          />
          <span>
            I reviewed the customer, route, consignee or receiver, cargo quantity, weight, and service.
            <FieldError error={fieldErrors.reviewConfirmed} />
          </span>
        </label>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/10 bg-[#0a0a0f]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <Button
          className="w-full gap-2 sm:w-auto"
          disabled={pending || values.reviewConfirmed !== "yes" || !values.idempotencyKey}
          type="submit"
        >
          <CheckCircle2 className="h-4 w-4" />
          {pending ? "Creating one shipment..." : "Create One Shipment"}
        </Button>
      </div>
    </form>
  );
}
