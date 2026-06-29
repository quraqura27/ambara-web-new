"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, PackageCheck, Plus, Trash2 } from "lucide-react";

import {
  createGuidedShipment,
  type GuidedShipmentActionState,
} from "@/actions/guided-shipment";
import { AwbInput } from "@/components/portal/awb-input";
import { FlightLegsEditor } from "@/components/portal/flight-legs-editor";
import { Button, Card, Input, cn } from "@/components/ui/core";
import {
  airportReferenceOptions,
  needsManualDestinationAirport,
  resolveMawbDepartureAirport,
  resolveMawbDestinationDisplay,
} from "@/lib/airports/core";
import { createBlankMawbChargeLine, type MawbChargeLine } from "@/lib/mawbs/core";
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
  copyNotice?: string;
  customers: CustomerOption[];
  idempotencyKey: string;
  initialValues?: Partial<Record<string, string>>;
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
  createMawbDocument: "no",
  customerId: "",
  customerMode: "existing",
  customerName: "",
  customerReference: "",
  currency: "IDR",
  declaredValueForCarriage: "NVD",
  declaredValueForCustoms: "NCV",
  deliveryInstruction: "",
  destination: "",
  destinationAirport: "",
  destinationCityDifferent: "",
  destinationCity: "",
  destinationIata: "",
  departureIataDifferent: "",
  executedDate: "",
  executedPlace: "CGK",
  flightDate: "",
  flightNumber: "",
  goodsDescription: "",
  handlingConfirmed: "",
  handlingInformation: "",
  idempotencyKey: "",
  internalNote: "",
  mawb: "",
  agentName: "PT PLI",
  insuranceAmount: "NIL",
  awbAirlineName: "",
  flightLegsJson: "[]",
  mawbConsigneeAddress: "",
  mawbConsigneeName: "",
  mawbPartyOverride: "",
  mawbShipperAddress: "",
  mawbShipperName: "",
  natureQuantity: "",
  origin: "",
  originIata: "CGK",
  pieces: "1",
  postalCode: "",
  quickAddress: "",
  quickCompanyName: "",
  quickEmail: "",
  quickFullName: "",
  quickPhone: "",
  rate: "0",
  receiverAddress: "",
  receiverName: "",
  receiverPhone: "",
  reviewConfirmed: "",
  routingOverride: "",
  routingBy1: "",
  routingBy2: "",
  routingTo1: "",
  routingTo2: "",
  serviceType: "DTD",
  shipperAddress: "",
  shipperName: "",
  shipperPhone: "",
  title: "",
  trackingNumber: "",
  unlinkedReason: "",
  weightKg: "",
};

export type GuidedShipmentPrefillValues = Partial<Record<keyof typeof initialValues, string>>;

const initialActionState: GuidedShipmentActionState = {};
const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

type EditableChargeLine = MawbChargeLine & {
  rowId: string;
};

let chargeLineRowSequence = 0;

function nextChargeLineRowId() {
  chargeLineRowSequence += 1;
  return `guided-mawb-charge-${chargeLineRowSequence}`;
}

function editableChargeLine(line: MawbChargeLine = createBlankMawbChargeLine()): EditableChargeLine {
  return { ...line, rowId: nextChargeLineRowId() };
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

export function GuidedShipmentForm({
  copyNotice,
  customers,
  idempotencyKey,
  initialValues: providedInitialValues,
  locations,
}: GuidedShipmentFormProps) {
  const [state, action, pending] = useActionState(createGuidedShipment, initialActionState);
  const [values, setValues] = useState<Record<string, string>>({
    ...initialValues,
    ...providedInitialValues,
    idempotencyKey,
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [chargeLines, setChargeLines] = useState<EditableChargeLine[]>(() => [editableChargeLine()]);
  const fieldErrors = useMemo(() => state.fieldErrors ?? {}, [state.fieldErrors]);
  const service = getShipmentServiceDefinition(values.serviceType);
  const doorDelivery = service?.doorDelivery === true;
  const airportOptions = useMemo(() => airportReferenceOptions(), []);
  const hasAwb = values.mawb.trim().length > 0;
  const createMawbDocument = values.createMawbDocument === "yes";
  const departureAirport = resolveMawbDepartureAirport(values.originIata) ?? "";
  const resolvedDestinationAirport = resolveMawbDestinationDisplay(values.destinationIata) ?? "";
  const destinationNeedsManual = needsManualDestinationAirport(values.destinationIata);
  const showDepartureIata = values.departureIataDifferent === "yes" || Boolean(fieldErrors.originIata);
  const showDestinationCity =
    doorDelivery &&
    (values.destinationCityDifferent === "yes" ||
      Boolean(fieldErrors.destinationCity) ||
      (values.destinationCity !== "" && values.destinationCity !== values.destination));
  const showMawbPartyOverride =
    values.mawbPartyOverride === "yes" ||
    Boolean(
      values.mawbShipperName ||
        values.mawbShipperAddress ||
        values.mawbConsigneeName ||
        values.mawbConsigneeAddress ||
        fieldErrors.mawbShipperName ||
        fieldErrors.mawbShipperAddress ||
        fieldErrors.mawbConsigneeName ||
        fieldErrors.mawbConsigneeAddress,
    );
  const showRoutingOverride =
    values.routingOverride === "yes" ||
    Boolean(
      (values.routingTo1 && values.routingTo1 !== values.destinationIata) ||
        values.routingBy1 ||
        values.routingTo2 ||
        values.routingBy2,
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
  useEffect(() => {
    if (!state.values) return;
    const frame = window.requestAnimationFrame(() => {
      setValues({
        ...initialValues,
        ...state.values,
        idempotencyKey: state.values?.idempotencyKey || idempotencyKey,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [idempotencyKey, state.values]);
  useEffect(() => {
    const nextChargeLines = state.chargeLines;
    if (!nextChargeLines) return;
    const frame = window.requestAnimationFrame(() => {
      setChargeLines(
        nextChargeLines.length > 0
          ? nextChargeLines.map((line) => editableChargeLine(line))
          : [editableChargeLine()],
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.chargeLines]);
  const advancedHasError = [
    "codAmount",
    "customerReference",
    "deliveryInstruction",
    "goodsDescription",
    "originIata",
    "destinationIata",
    "destinationAirport",
    "agentName",
    "mawbShipperName",
    "mawbShipperAddress",
    "mawbConsigneeName",
    "mawbConsigneeAddress",
    "flightDate",
    "executedDate",
    "rate",
    "chargeCode",
    "chargeAmount",
    "internalNote",
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
      const nextValue =
        name === "originIata" ||
        name === "destinationIata" ||
        name === "executedPlace" ||
        name === "routingTo1" ||
        name === "routingTo2" ||
        name === "routingBy1" ||
        name === "routingBy2"
          ? value.toUpperCase()
          : value;
      const next = { ...current, [name]: nextValue };
      if (name === "destination" && (!current.destinationCity || current.destinationCity === current.destination)) {
        next.destinationCity = value;
      }
      if (name === "destinationCityDifferent" && value !== "yes") {
        next.destinationCity = current.destination;
      }
      if (name === "departureIataDifferent" && value !== "yes") {
        next.originIata = "CGK";
        next.executedPlace = "CGK";
      }
      if (name === "mawbPartyOverride" && value !== "yes") {
        next.mawbConsigneeAddress = "";
        next.mawbConsigneeName = "";
        next.mawbShipperAddress = "";
        next.mawbShipperName = "";
      }
      if (name === "routingOverride" && value !== "yes") {
        next.routingBy1 = "";
        next.routingBy2 = "";
        next.routingTo1 = current.destinationIata;
        next.routingTo2 = "";
      }
      if (name === "mawb") {
        const hadAwb = current.mawb.trim().length > 0;
        const hasNextAwb = value.trim().length > 0;
        if (!hadAwb && hasNextAwb) next.createMawbDocument = "yes";
        if (!hasNextAwb) next.createMawbDocument = "no";
      }
      if (name === "destinationIata") {
        const autoDisplay = resolveMawbDestinationDisplay(nextValue);
        if (autoDisplay) next.destinationAirport = autoDisplay;
        else next.destinationAirport = "";
        if (!current.routingTo1 || current.routingTo1 === current.destinationIata) {
          next.routingTo1 = nextValue;
        }
      }
      if (name === "serviceType") {
        const nextService = getShipmentServiceDefinition(value);
        if (!nextService?.doorDelivery) {
          next.destinationCity = current.destination;
          next.destinationCityDifferent = "";
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
      {copyNotice ? (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          {copyNotice}
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

        <div className="grid gap-4 border-t border-white/5 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Airline AWB / MAWB number
            </span>
            <AwbInput
              airlineName={values.awbAirlineName}
              error={fieldErrors.mawb || fieldErrors.awbAirlineName}
              onAirlineNameChange={(value) => update("awbAirlineName", value)}
              onValueChange={(value) => update("mawb", value)}
              value={values.mawb}
            />
            <span className="block text-xs text-slate-500">
              Leave blank when this shipment does not need a MAWB document yet. Unknown prefixes
              require a verified manual airline name.
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">MAWB document</h2>
            <p className="mt-1 text-sm text-slate-500">
              Uses the AWB above to create or link the MAWB workbook from this shipment.
            </p>
          </div>
          {hasAwb ? (
            <label className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-200">
              <input name="createMawbDocument" type="hidden" value="no" />
              <input
                checked={createMawbDocument}
                name="createMawbDocument"
                onChange={(event) => update("createMawbDocument", event.target.checked ? "yes" : "no")}
                type="checkbox"
                value="yes"
              />
              Create/link MAWB
            </label>
          ) : (
            <input name="createMawbDocument" type="hidden" value="no" />
          )}
        </div>

        {!hasAwb ? (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            Enter an airline AWB above when this shipment should create or link a MAWB workbook.
          </div>
        ) : createMawbDocument ? (
          <>
            <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Airport of departure
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {values.originIata || "CGK"} - {departureAirport || "Soekarno-Hatta International Airport"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    checked={values.departureIataDifferent === "yes"}
                    name="departureIataDifferent"
                    onChange={(event) => update("departureIataDifferent", event.target.checked ? "yes" : "")}
                    type="checkbox"
                    value="yes"
                  />
                  Change departure airport
                </label>
              </div>
              {!showDepartureIata ? <input name="originIata" type="hidden" value={values.originIata || "CGK"} /> : null}
              {showDepartureIata ? (
                <Field error={fieldErrors.originIata} helper={departureAirport || "Known 3-letter airport code required."} label="Departure IATA">
                  <Input
                    list="airport-iata-options"
                    maxLength={3}
                    name="originIata"
                    onChange={(event) => update("originIata", event.target.value)}
                    value={values.originIata}
                  />
                </Field>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                error={fieldErrors.destinationIata}
                helper={resolvedDestinationAirport || "Enter a 3-letter destination IATA"}
                label="Destination IATA"
              >
                <Input
                  list="airport-iata-options"
                  maxLength={3}
                  name="destinationIata"
                  onChange={(event) => update("destinationIata", event.target.value)}
                  value={values.destinationIata}
                />
              </Field>
              {destinationNeedsManual ? (
                <Field
                  error={fieldErrors.destinationAirport}
                  helper="Required because this destination IATA is not in the airport reference."
                  label="Destination airport/display"
                >
                  <Input
                    name="destinationAirport"
                    onChange={(event) => update("destinationAirport", event.target.value)}
                    placeholder="Type destination airport or city"
                    value={values.destinationAirport}
                  />
                </Field>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Destination airport/display
                  </span>
                  <input name="destinationAirport" type="hidden" value={values.destinationAirport || resolvedDestinationAirport} />
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100">
                    {values.destinationAirport || resolvedDestinationAirport || "Auto-filled after IATA"}
                  </div>
                  <span className="block text-xs text-slate-500">Auto-filled from destination IATA.</span>
                  <FieldError error={fieldErrors.destinationAirport} />
                </div>
              )}
              <Field label="Agent name and city">
                <Input name="agentName" onChange={(event) => update("agentName", event.target.value)} value={values.agentName} />
              </Field>
            </div>

            <datalist id="airport-iata-options">
              {airportOptions.map((airport) => (
                <option key={airport.iata} value={airport.iata}>
                  {airport.airportName}
                </option>
              ))}
            </datalist>

            <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <label className="flex items-start gap-3 text-sm text-slate-200">
                <input
                  checked={showMawbPartyOverride}
                  name="mawbPartyOverride"
                  onChange={(event) => update("mawbPartyOverride", event.target.checked ? "yes" : "")}
                  type="checkbox"
                  value="yes"
                />
                <span>
                  MAWB shipper or consignee is different from the shipment data.
                  <span className="mt-1 block text-xs text-slate-500">
                    Blank MAWB parties use customer/shipper and receiver details.
                  </span>
                </span>
              </label>
              {showMawbPartyOverride ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field helper="Blank uses shipment shipper/customer." label="MAWB shipper name">
                    <Input name="mawbShipperName" onChange={(event) => update("mawbShipperName", event.target.value)} value={values.mawbShipperName} />
                  </Field>
                  <Field helper="Blank uses receiver/consignee." label="MAWB consignee name">
                    <Input name="mawbConsigneeName" onChange={(event) => update("mawbConsigneeName", event.target.value)} value={values.mawbConsigneeName} />
                  </Field>
                  <Field helper="Blank uses shipper/pickup address." label="MAWB shipper address">
                    <textarea className={inputClassName} name="mawbShipperAddress" onChange={(event) => update("mawbShipperAddress", event.target.value)} rows={3} value={values.mawbShipperAddress} />
                  </Field>
                  <Field helper="Blank uses receiver address or destination." label="MAWB consignee address">
                    <textarea className={inputClassName} name="mawbConsigneeAddress" onChange={(event) => update("mawbConsigneeAddress", event.target.value)} rows={3} value={values.mawbConsigneeAddress} />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <Field label="Flight number">
                <Input name="flightNumber" onChange={(event) => update("flightNumber", event.target.value)} placeholder="TBA" value={values.flightNumber} />
              </Field>
              <Field error={fieldErrors.flightDate} label="Flight date">
                <Input name="flightDate" onChange={(event) => update("flightDate", event.target.value)} type="date" value={values.flightDate} />
              </Field>
              <Field error={fieldErrors.executedDate} label="Executed date">
                <Input name="executedDate" onChange={(event) => update("executedDate", event.target.value)} type="date" value={values.executedDate} />
              </Field>
              <Field label="Executed place">
                <Input maxLength={3} name="executedPlace" onChange={(event) => update("executedPlace", event.target.value)} value={values.executedPlace} />
              </Field>
              <Field label="Currency">
                <Input maxLength={3} name="currency" onChange={(event) => update("currency", event.target.value.toUpperCase())} value={values.currency} />
              </Field>
              <Field error={fieldErrors.rate} label="Rate">
                <Input inputMode="decimal" name="rate" onChange={(event) => update("rate", event.target.value)} value={values.rate} />
              </Field>
            </div>

            <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <label className="flex items-start gap-3 text-sm text-slate-200">
                <input
                  checked={showRoutingOverride}
                  name="routingOverride"
                  onChange={(event) => update("routingOverride", event.target.checked ? "yes" : "")}
                  type="checkbox"
                  value="yes"
                />
                <span>
                  Override MAWB routing cells.
                  <span className="mt-1 block text-xs text-slate-500">
                    Defaults use the destination IATA and resolved airline.
                  </span>
                </span>
              </label>
              {!showRoutingOverride ? (
                <>
                  <input name="routingTo1" type="hidden" value={values.routingTo1 || values.destinationIata} />
                  <input name="routingBy1" type="hidden" value={values.routingBy1} />
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="Routing to 1">
                    <Input maxLength={3} name="routingTo1" onChange={(event) => update("routingTo1", event.target.value)} placeholder={values.destinationIata || "TPE"} value={values.routingTo1} />
                  </Field>
                  <Field label="Routing by 1">
                    <Input name="routingBy1" onChange={(event) => update("routingBy1", event.target.value)} placeholder="Airline code" value={values.routingBy1} />
                  </Field>
                  <Field label="Routing to 2">
                    <Input maxLength={3} name="routingTo2" onChange={(event) => update("routingTo2", event.target.value)} value={values.routingTo2} />
                  </Field>
                  <Field label="Routing by 2">
                    <Input name="routingBy2" onChange={(event) => update("routingBy2", event.target.value)} value={values.routingBy2} />
                  </Field>
                </div>
              )}
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
                  <Plus className="h-4 w-4" />
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
                <Input name="declaredValueForCarriage" onChange={(event) => update("declaredValueForCarriage", event.target.value)} value={values.declaredValueForCarriage} />
              </Field>
              <Field label="Declared value customs">
                <Input name="declaredValueForCustoms" onChange={(event) => update("declaredValueForCustoms", event.target.value)} value={values.declaredValueForCustoms} />
              </Field>
              <Field label="Insurance">
                <Input name="insuranceAmount" onChange={(event) => update("insuranceAmount", event.target.value)} value={values.insuranceAmount} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Handling information">
                <textarea className={inputClassName} name="handlingInformation" onChange={(event) => update("handlingInformation", event.target.value)} rows={3} value={values.handlingInformation} />
              </Field>
              <Field label="Nature and quantity override">
                <textarea className={inputClassName} name="natureQuantity" onChange={(event) => update("natureQuantity", event.target.value)} rows={3} value={values.natureQuantity} />
              </Field>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            Shipment will store the AWB number only and will not create or link a MAWB workbook document.
          </div>
        )}
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
            label={doorDelivery ? "Receiver phone" : "Consignee contact"}
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
              {!showDestinationCity ? (
                <input name="destinationCity" type="hidden" value={values.destination || values.destinationCity} />
              ) : null}
              <Field error={fieldErrors.postalCode} label="Postal code">
                <Input
                  inputMode="numeric"
                  maxLength={5}
                  name="postalCode"
                  onChange={(event) => update("postalCode", event.target.value)}
                  value={values.postalCode}
                />
              </Field>
              <div className="space-y-3 md:col-span-2">
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input
                    checked={showDestinationCity}
                    name="destinationCityDifferent"
                    onChange={(event) => update("destinationCityDifferent", event.target.checked ? "yes" : "")}
                    type="checkbox"
                    value="yes"
                  />
                  <span>
                    Final delivery city is different from route destination.
                    <span className="mt-1 block text-xs text-slate-500">
                      Default: {values.destination || "same as route destination"}.
                    </span>
                  </span>
                </label>
                {showDestinationCity ? (
                  <Field error={fieldErrors.destinationCity} label="Final delivery city">
                    <Input
                      name="destinationCity"
                      onChange={(event) => update("destinationCity", event.target.value)}
                      value={values.destinationCity}
                    />
                  </Field>
                ) : null}
              </div>
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

      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Flight routing</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add the known flight legs in operational order. Flights are optional and can be
            updated later.
          </p>
        </div>
        <FlightLegsEditor
          error={fieldErrors.flightLegsJson}
          onValueChange={(value) => update("flightLegsJson", value)}
          value={values.flightLegsJson}
        />
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Cargo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pieces are physical cargo units such as cartons, boxes, bags, or pallets. They do not
            create additional shipments or Delivery Records; one CN can print one label per piece.
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
          <Field
            error={fieldErrors.pieces}
            helper="Physical cargo quantity, such as cartons, boxes, bags, or pallets. Pieces do not create additional shipments or Delivery Records."
            label="Pieces *"
          >
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
            ["AWB", values.mawb || "Not entered"],
            ["Service", `${values.serviceType} — ${service?.label ?? ""}`],
            ["Route", `${values.origin || "Missing"} → ${values.destination || "Missing"}`],
            ["MAWB document", hasAwb && createMawbDocument ? "Create/link enabled" : "Not created"],
            [doorDelivery ? "Receiver" : "Consignee", values.receiverName || "Missing"],
            ["Cargo", values.commodity || "Missing"],
            ["Pieces", `${values.pieces || "0"} physical cargo units`],
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
            I reviewed the customer, route, consignee or receiver, pieces, weight, and service.
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
