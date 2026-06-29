"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CirclePlus, Plane, Trash2 } from "lucide-react";

import {
  createMawbShipments,
  type MawbShipmentActionState,
} from "@/actions/mawb-shipments";
import { Button, Card, Input, cn } from "@/components/ui/core";
import { airportReferenceOptions, resolveMawbDepartureAirport, resolveMawbDestinationDisplay } from "@/lib/airports/core";
import { createBlankMawbChargeLine, normalizeMawbNumber, type MawbChargeLine } from "@/lib/mawbs/core";
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

type ShipmentLine = {
  chargeableWeight: string;
  commodity: string;
  customerReference: string;
  destinationCity: string;
  goodsDescription: string;
  id: string;
  pieces: string;
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  title: string;
  weightKg: string;
};

type EditableChargeLine = MawbChargeLine & {
  rowId: string;
};

type MawbShipmentFormProps = {
  customers: CustomerOption[];
  idempotencyKey: string;
};

const initialActionState: MawbShipmentActionState = {};
const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

function newShipmentLine(): ShipmentLine {
  return {
    chargeableWeight: "",
    commodity: "",
    customerReference: "",
    destinationCity: "",
    goodsDescription: "",
    id: crypto.randomUUID(),
    pieces: "1",
    receiverAddress: "",
    receiverName: "",
    receiverPhone: "",
    title: "",
    weightKg: "",
  };
}

let chargeLineRowSequence = 0;

function nextChargeLineRowId() {
  chargeLineRowSequence += 1;
  return `mawb-shipment-charge-${chargeLineRowSequence}`;
}

function editableChargeLine(line: MawbChargeLine = createBlankMawbChargeLine()): EditableChargeLine {
  return { ...line, rowId: nextChargeLineRowId() };
}

function numeric(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClassName, "min-h-24", props.className)} />;
}

export function MawbShipmentForm({ customers, idempotencyKey }: MawbShipmentFormProps) {
  const [state, action, pending] = useActionState(createMawbShipments, initialActionState);
  const [customerMode, setCustomerMode] = useState("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [serviceType, setServiceType] = useState("PTP");
  const [mawbNumber, setMawbNumber] = useState("");
  const [originIata, setOriginIata] = useState("CGK");
  const [destinationIata, setDestinationIata] = useState("");
  const [chargeLines, setChargeLines] = useState<EditableChargeLine[]>(() => [editableChargeLine()]);
  const [lines, setLines] = useState<ShipmentLine[]>(() => [newShipmentLine()]);
  const fieldErrors = useMemo(() => state.fieldErrors ?? {}, [state.fieldErrors]);
  const service = getShipmentServiceDefinition(serviceType);
  const mawb = normalizeMawbNumber(mawbNumber);
  const departureAirport = resolveMawbDepartureAirport(originIata) ?? "";
  const destinationAirport = resolveMawbDestinationDisplay(destinationIata) ?? "";
  const airportOptions = airportReferenceOptions();
  const totals = useMemo(
    () =>
      lines.reduce(
        (sum, line) => ({
          chargeableWeight: sum.chargeableWeight + (numeric(line.chargeableWeight) || numeric(line.weightKg)),
          pieces: sum.pieces + numeric(line.pieces),
          weightKg: sum.weightKg + numeric(line.weightKg),
        }),
        { chargeableWeight: 0, pieces: 0, weightKg: 0 },
      ),
    [lines],
  );

  function updateChargeLine(index: number, patch: Partial<MawbChargeLine>) {
    setChargeLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    );
  }

  useEffect(() => {
    const firstError = Object.keys(fieldErrors)[0];
    if (!firstError) return;
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
    });
  }, [fieldErrors]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      `${customer.fullName ?? ""} ${customer.companyName ?? ""}`.toLowerCase().includes(query),
    );
  }, [customerSearch, customers]);

  function updateLine(index: number, field: keyof ShipmentLine, value: string) {
    setLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        const next = { ...line, [field]: value };
        if (field === "weightKg" && !line.chargeableWeight) next.chargeableWeight = value;
        if (field === "commodity" && !line.goodsDescription) next.goodsDescription = value;
        return next;
      }),
    );
  }

  function addLine() {
    setLines((current) => [...current, newShipmentLine()]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  }

  return (
    <form action={action} className="space-y-6">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <input name="shipmentLineCount" type="hidden" value={lines.length} />

      {state.formError ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">
          {state.formError}
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Customer and service</h2>
          <p className="mt-1 text-sm text-slate-500">
            These settings apply to every shipment line created under this MAWB.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shipmentServiceValues.map((value) => {
            const definition = shipmentServiceDefinitions[value];
            return (
              <label
                className={cn(
                  "cursor-pointer rounded-lg border p-4",
                  serviceType === value
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/5 bg-white/[0.02]",
                )}
                key={value}
              >
                <input
                  checked={serviceType === value}
                  className="sr-only"
                  name="serviceType"
                  onChange={() => setServiceType(value)}
                  type="radio"
                  value={value}
                />
                <span className="font-bold text-white">{value}</span>
                <span className="mt-1 block text-sm text-slate-300">{definition.label}</span>
              </label>
            );
          })}
        </div>
        <FieldError error={fieldErrors.serviceType} />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["existing", "Existing customer"],
            ["quick", "Create customer"],
            ["unlinked", "No customer link"],
          ].map(([value, label]) => (
            <label
              className={cn(
                "cursor-pointer rounded-lg border px-4 py-3 text-sm font-semibold",
                customerMode === value
                  ? "border-blue-500/50 bg-blue-500/10 text-white"
                  : "border-white/5 bg-white/[0.02] text-slate-300",
              )}
              key={value}
            >
              <input
                checked={customerMode === value}
                className="sr-only"
                name="customerMode"
                onChange={() => setCustomerMode(value)}
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>

        {customerMode === "existing" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Field error={fieldErrors.customerId} label="Customer search">
              <Input
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Search existing customers"
                value={customerSearch}
              />
            </Field>
            <Field error={fieldErrors.customerId} label="Customer">
              <select
                className={inputClassName}
                name="customerId"
                onChange={(event) => setCustomerId(event.target.value)}
                value={customerId}
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

        {customerMode === "quick" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={fieldErrors.quickFullName} label="New customer name">
              <Input name="quickFullName" placeholder="Contact name" />
            </Field>
            <Field label="Company">
              <Input name="quickCompanyName" placeholder="Company name" />
            </Field>
            <Field error={fieldErrors.quickEmail} label="Email">
              <Input name="quickEmail" placeholder="customer@example.com" type="email" />
            </Field>
            <Field error={fieldErrors.quickPhone} label="Phone">
              <Input name="quickPhone" placeholder="+62..." />
            </Field>
            <Field label="Address">
              <TextArea className="md:col-span-2" name="quickAddress" placeholder="Customer address" />
            </Field>
          </div>
        ) : null}

        {customerMode === "unlinked" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={fieldErrors.customerName} label="Customer name">
              <Input name="customerName" />
            </Field>
            <Field error={fieldErrors.unlinkedReason} label="Operational reason">
              <Input name="unlinkedReason" />
            </Field>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">MAWB header</h2>
            <p className="mt-1 text-sm text-slate-500">
              The header is saved once and linked to every shipment line below.
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
            <Plane className="mr-2 inline h-4 w-4 text-blue-300" />
            {mawb ? mawb.name : "Airline resolves from prefix"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field error={fieldErrors.mawbNumber} label="MAWB number">
            <Input name="mawbNumber" onChange={(event) => setMawbNumber(event.target.value)} placeholder="126-92586966" value={mawbNumber} />
          </Field>
          <Field error={fieldErrors.originIata} helper={departureAirport} label="Airport of departure IATA">
            <input list="airport-iata-options" name="originIata" onChange={(event) => setOriginIata(event.target.value.toUpperCase())} className={inputClassName} value={originIata} />
          </Field>
          <Field error={fieldErrors.destinationIata} helper={destinationAirport || "Enter destination IATA"} label="Airport of destination IATA">
            <input list="airport-iata-options" name="destinationIata" onChange={(event) => setDestinationIata(event.target.value.toUpperCase())} className={inputClassName} value={destinationIata} />
          </Field>
          <Field label="Agent name and city">
            <Input name="agentName" placeholder="PT PLI" />
          </Field>
        </div>

        <datalist id="airport-iata-options">
          {airportOptions.map((airport) => (
            <option key={airport.iata} value={airport.iata}>
              {airport.airportName}
            </option>
          ))}
        </datalist>

        <div className="grid gap-4 md:grid-cols-2">
          <Field error={fieldErrors.mawbShipperName} label="MAWB shipper name">
            <Input name="mawbShipperName" />
          </Field>
          <Field error={fieldErrors.mawbConsigneeName} label="MAWB consignee name">
            <Input name="mawbConsigneeName" />
          </Field>
          <Field error={fieldErrors.mawbShipperAddress} label="MAWB shipper address">
            <TextArea name="mawbShipperAddress" />
          </Field>
          <Field error={fieldErrors.mawbConsigneeAddress} label="MAWB consignee address">
            <TextArea name="mawbConsigneeAddress" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Flight number">
            <Input name="flightNumber" placeholder="TBA" />
          </Field>
          <Field error={fieldErrors.flightDate} label="Flight date">
            <Input name="flightDate" type="date" />
          </Field>
          <Field error={fieldErrors.executedDate} label="Executed date">
            <Input name="executedDate" type="date" />
          </Field>
          <Field label="Executed place">
            <Input name="executedPlace" placeholder="CGK" />
          </Field>
          <Field label="Currency">
            <Input name="currency" placeholder="IDR" />
          </Field>
          <Field error={fieldErrors.rate} label="Rate">
            <Input inputMode="decimal" name="rate" placeholder="0" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Routing to 1">
            <Input name="routingTo1" placeholder={destinationIata || "TPE"} />
          </Field>
          <Field label="Routing by 1">
            <Input name="routingBy1" placeholder={mawb?.code ?? "GA"} />
          </Field>
          <Field label="Routing to 2">
            <Input name="routingTo2" />
          </Field>
          <Field label="Routing by 2">
            <Input name="routingBy2" />
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Other charges</h3>
              <p className="mt-1 text-xs text-slate-500">
                Enter the airline-specific surcharge lines for this MAWB.
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={() => setChargeLines((current) => [...current, editableChargeLine()])}
              type="button"
              variant="secondary"
            >
              <CirclePlus className="h-4 w-4" />
              Add surcharge
            </Button>
          </div>
          <div className="space-y-3">
            {chargeLines.map((line, index) => (
              <div
                className="grid gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 md:grid-cols-[1fr_90px_1fr_130px_auto]"
                key={line.rowId}
              >
                <Input
                  aria-label={`Charge code ${index + 1}`}
                  name="chargeCode"
                  onChange={(event) => updateChargeLine(index, { code: event.target.value.toUpperCase() })}
                  placeholder="Code"
                  value={line.code}
                />
                <Input
                  aria-label={`Charge currency ${index + 1}`}
                  maxLength={3}
                  name="chargeCurrency"
                  onChange={(event) => updateChargeLine(index, { currency: event.target.value.toUpperCase() })}
                  value={line.currency}
                />
                <Input
                  aria-label={`Charge amount ${index + 1}`}
                  inputMode="decimal"
                  min="0"
                  name="chargeAmount"
                  onChange={(event) => updateChargeLine(index, { amount: event.target.value })}
                  placeholder="0"
                  step="0.01"
                  type="number"
                  value={line.amount}
                />
                <select
                  aria-label={`Charge basis ${index + 1}`}
                  className={inputClassName}
                  name="chargeBasis"
                  onChange={(event) => updateChargeLine(index, { basis: event.target.value === "fixed" ? "fixed" : "per_kg" })}
                  value={line.basis}
                >
                  <option value="fixed">Fixed</option>
                  <option value="per_kg">Per kg</option>
                </select>
                <Button
                  aria-label={`Remove charge row ${index + 1}`}
                  className="h-full px-3"
                  disabled={chargeLines.length === 1}
                  onClick={() => setChargeLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <FieldError error={fieldErrors.chargeCode || fieldErrors.chargeAmount} />

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Declared value carriage">
            <Input defaultValue="NVD" name="declaredValueForCarriage" />
          </Field>
          <Field label="Declared value customs">
            <Input defaultValue="NCV" name="declaredValueForCustoms" />
          </Field>
          <Field label="Insurance">
            <Input defaultValue="NIL" name="insuranceAmount" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Handling information">
            <TextArea name="handlingInformation" />
          </Field>
          <Field label="Nature and quantity override">
            <TextArea name="natureQuantity" />
          </Field>
        </div>
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Shipment lines</h2>
            <p className="mt-1 text-sm text-slate-500">
              Each line creates one Ambara tracking number, CN, Delivery Record, and MAWB link.
            </p>
          </div>
          <Button className="gap-2" onClick={addLine} type="button" variant="secondary">
            <CirclePlus className="h-4 w-4" /> Add line
          </Button>
        </div>

        <div className="space-y-4">
          {lines.map((line, index) => (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4" key={line.id}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">Shipment line {index + 1}</h3>
                <Button
                  aria-label={`Remove line ${index + 1}`}
                  className="h-auto p-2"
                  disabled={lines.length === 1}
                  onClick={() => removeLine(index)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field error={fieldErrors[`lineReceiverName_${index}`]} label="Receiver / consignee">
                  <Input name={`lineReceiverName_${index}`} onChange={(event) => updateLine(index, "receiverName", event.target.value)} value={line.receiverName} />
                </Field>
                <Field label="Receiver phone">
                  <Input name={`lineReceiverPhone_${index}`} onChange={(event) => updateLine(index, "receiverPhone", event.target.value)} value={line.receiverPhone} />
                </Field>
                <Field error={fieldErrors[`lineCommodity_${index}`]} label="Commodity">
                  <Input name={`lineCommodity_${index}`} onChange={(event) => updateLine(index, "commodity", event.target.value)} value={line.commodity} />
                </Field>
                <Field label="Customer reference">
                  <Input name={`lineCustomerReference_${index}`} onChange={(event) => updateLine(index, "customerReference", event.target.value)} value={line.customerReference} />
                </Field>
                <Field error={fieldErrors[`linePieces_${index}`]} label="Pieces">
                  <Input inputMode="numeric" name={`linePieces_${index}`} onChange={(event) => updateLine(index, "pieces", event.target.value)} value={line.pieces} />
                </Field>
                <Field error={fieldErrors[`lineWeightKg_${index}`]} label="Gross weight">
                  <Input inputMode="decimal" name={`lineWeightKg_${index}`} onChange={(event) => updateLine(index, "weightKg", event.target.value)} value={line.weightKg} />
                </Field>
                <Field error={fieldErrors[`lineChargeableWeight_${index}`]} label="Chargeable weight">
                  <Input inputMode="decimal" name={`lineChargeableWeight_${index}`} onChange={(event) => updateLine(index, "chargeableWeight", event.target.value)} value={line.chargeableWeight} />
                </Field>
                <Field label="Destination city">
                  <Input name={`lineDestinationCity_${index}`} onChange={(event) => updateLine(index, "destinationCity", event.target.value)} placeholder={destinationAirport || destinationIata} value={line.destinationCity} />
                </Field>
                <Field label="Shipment title">
                  <Input name={`lineTitle_${index}`} onChange={(event) => updateLine(index, "title", event.target.value)} value={line.title} />
                </Field>
                <Field label="Goods description">
                  <Input name={`lineGoodsDescription_${index}`} onChange={(event) => updateLine(index, "goodsDescription", event.target.value)} value={line.goodsDescription} />
                </Field>
                <Field error={fieldErrors[`lineReceiverAddress_${index}`]} helper={service?.doorDelivery ? "Required for DTD/PTD." : "Stored as destination-port shipment when service ends at port."} label="Receiver address">
                  <TextArea name={`lineReceiverAddress_${index}`} onChange={(event) => updateLine(index, "receiverAddress", event.target.value)} value={line.receiverAddress} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Shipments</p>
            <p className="mt-2 text-2xl font-bold text-white">{lines.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pieces</p>
            <p className="mt-2 text-2xl font-bold text-white">{totals.pieces || 0}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Gross weight</p>
            <p className="mt-2 text-2xl font-bold text-white">{totals.weightKg || 0}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Chargeable</p>
            <p className="mt-2 text-2xl font-bold text-white">{totals.chargeableWeight || 0}</p>
          </div>
        </div>

        {state.duplicateWarnings?.length ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div className="space-y-2">
                {state.duplicateWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input name="confirmDuplicates" type="checkbox" value="yes" />
                  Continue after reviewing possible duplicates
                </label>
              </div>
            </div>
          </div>
        ) : null}

        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input name="reviewConfirmed" type="checkbox" value="yes" />
          I reviewed the MAWB header and all shipment lines. Create one tracking/CN per line and link all lines to this MAWB.
        </label>
        <FieldError error={fieldErrors.reviewConfirmed || fieldErrors.confirmDuplicates} />

        <div className="flex justify-end">
          <Button className="gap-2 px-6" disabled={pending} type="submit">
            <CheckCircle2 className="h-4 w-4" />
            {pending ? "Creating..." : "Create Shipments + MAWB"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
