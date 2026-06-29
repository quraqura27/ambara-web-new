"use client";

import { useActionState, useMemo, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

import { saveMawbFromForm, type MawbActionState, type MawbCustomerOption } from "@/actions/mawbs";
import { Button, Card, Input, cn } from "@/components/ui/core";
import {
  calculateMawbCharges,
  defaultMawbChargeLines,
  formatMawbChargeAmount,
  normalizeMawbNumber,
  type MawbActionValue,
  type MawbChargeLine,
} from "@/lib/mawbs/core";
import {
  needsManualDestinationAirport,
  resolveMawbDepartureAirport,
  resolveMawbDestinationDisplay,
} from "@/lib/airports/core";
import { shipmentServiceDefinitions, shipmentServiceValues } from "@/lib/shipments/service-model";

type MawbFormProps = {
  canOverwrite: boolean;
  customers: MawbCustomerOption[];
  idempotencyKey: string;
  initialActionMode?: MawbActionValue;
  initialShipmentTracking?: string;
  localPrintEnabled?: boolean;
};

const initialActionState: MawbActionState = {};
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
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      {children}
      <FieldError error={error} />
    </label>
  );
}

function newChargeLine(): MawbChargeLine {
  return { amount: "", basis: "per_kg", code: "", currency: "IDR" };
}

export function MawbForm({
  canOverwrite,
  customers,
  idempotencyKey,
  initialActionMode = "create_shipment",
  initialShipmentTracking = "",
  localPrintEnabled = false,
}: MawbFormProps) {
  const [state, action, pending] = useActionState(saveMawbFromForm, initialActionState);
  const [actionMode, setActionMode] = useState<MawbActionValue>(initialActionMode);
  const [mawbNumber, setMawbNumber] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [destinationIata, setDestinationIata] = useState("");
  const [destinationAirport, setDestinationAirport] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [shipmentContactPhone, setShipmentContactPhone] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [chargeableWeight, setChargeableWeight] = useState("");
  const [rate, setRate] = useState("0");
  const [chargeLines, setChargeLines] = useState<MawbChargeLine[]>(defaultMawbChargeLines);
  const fieldErrors = state.fieldErrors ?? {};
  const normalizedMawb = normalizeMawbNumber(mawbNumber);
  const chargeSummary = useMemo(
    () =>
      calculateMawbCharges({
        chargeableWeight: chargeableWeight || "0",
        grossWeight: grossWeight || "0",
        otherChargeLines: chargeLines,
        rate: rate || "0",
      }),
    [chargeLines, chargeableWeight, grossWeight, rate],
  );
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      `${customer.fullName ?? ""} ${customer.companyName ?? ""} ${customer.phone ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [customerSearch, customers]);
  const selectedCustomer = customers.find((customer) => String(customer.id) === selectedCustomerId);
  const selectedCustomerName =
    customerMode === "existing"
      ? selectedCustomer?.fullName || selectedCustomer?.companyName || (selectedCustomer ? `Customer #${selectedCustomer.id}` : "")
      : "";
  const departureAirport = resolveMawbDepartureAirport(originIata) ?? "";
  const resolvedDestinationAirport = resolveMawbDestinationDisplay(destinationIata) ?? "";
  const destinationNeedsManual = needsManualDestinationAirport(destinationIata);

  function updateChargeLine(index: number, patch: Partial<MawbChargeLine>) {
    setChargeLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    );
  }

  function updateSelectedCustomer(value: string) {
    if (value === "__new") {
      setCustomerMode("new");
      setSelectedCustomerId("");
      return;
    }

    setCustomerMode("existing");
    setSelectedCustomerId(value);
    const customer = customers.find((option) => String(option.id) === value);
    if (customer?.phone) setShipmentContactPhone(customer.phone);
  }

  return (
    <form action={action} className="space-y-6">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <input name="actionMode" type="hidden" value={actionMode} />
      <input name="departureAirport" type="hidden" value={departureAirport} />
      <input name="shipmentCustomerName" type="hidden" value={selectedCustomerName} />

      {state.formError ? (
        <div
          className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {state.formError}
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">MAWB action</h2>
            <p className="mt-1 text-sm text-slate-500">Save once, then create, link, or store for print.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["create_shipment", "Create new shipment"],
            ["link_shipment", "Link existing shipment"],
            ["print_only", "Print/store only"],
          ].map(([value, label]) => (
            <label
              className={cn(
                "cursor-pointer rounded-xl border p-4",
                actionMode === value
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/5 bg-white/[0.02]",
              )}
              key={value}
            >
              <input
                checked={actionMode === value}
                className="mr-2"
                onChange={() => setActionMode(value as MawbActionValue)}
                type="radio"
              />
              <span className="font-semibold">{label}</span>
            </label>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field error={fieldErrors.mawbNumber} label="MAWB number *">
            <Input
              name="mawbNumber"
              onChange={(event) => setMawbNumber(event.target.value)}
              placeholder="126-91929552"
              value={mawbNumber}
            />
          </Field>
          <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Carrier</p>
            <p className={cn("mt-2 text-sm font-semibold", normalizedMawb ? "text-blue-200" : "text-rose-300")}>
              {normalizedMawb ? `${normalizedMawb.prefix} / ${normalizedMawb.name}` : "Unknown prefix"}
            </p>
          </div>
          <Field error={fieldErrors.serviceType} label="Shipment service">
            <select className={inputClassName} defaultValue="PTP" name="serviceType">
              {shipmentServiceValues.map((service) => (
                <option key={service} value={service}>
                  {service} - {shipmentServiceDefinitions[service].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {actionMode === "create_shipment" ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Find customer">
                <Input
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search customer, company, or phone..."
                  value={customerSearch}
                />
              </Field>
              <Field error={fieldErrors.shipmentCustomerId || fieldErrors.newCustomerName} label="Customer *">
                <select
                  className={inputClassName}
                  name="shipmentCustomerId"
                  onChange={(event) => updateSelectedCustomer(event.target.value)}
                  value={customerMode === "new" ? "__new" : selectedCustomerId}
                >
                  <option value="">Select existing customer</option>
                  <option value="__new">Create new customer</option>
                  {filteredCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName || customer.companyName || `Customer #${customer.id}`}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {customerMode === "new" ? (
              <div className="grid gap-4 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 md:grid-cols-2">
                <Field error={fieldErrors.newCustomerFullName || fieldErrors.newCustomerName} label="New customer name">
                  <Input name="newCustomerFullName" placeholder="Contact person / customer name" />
                </Field>
                <Field error={fieldErrors.newCustomerCompanyName || fieldErrors.newCustomerName} label="New customer company">
                  <Input name="newCustomerCompanyName" placeholder="Company name if any" />
                </Field>
                <Field label="New customer email">
                  <Input name="newCustomerEmail" type="email" />
                </Field>
                <Field label="New customer phone">
                  <Input name="newCustomerPhone" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="New customer address">
                    <textarea className={inputClassName} name="newCustomerAddress" rows={3} />
                  </Field>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field error={fieldErrors.shipmentContactPhone} label="Shipment contact phone">
                <Input
                  name="shipmentContactPhone"
                  onChange={(event) => setShipmentContactPhone(event.target.value)}
                  value={shipmentContactPhone}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {actionMode === "link_shipment" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={fieldErrors.existingShipmentTracking} label="Existing tracking number *">
              <Input defaultValue={initialShipmentTracking} name="existingShipmentTracking" />
            </Field>
            {canOverwrite ? (
              <label className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-slate-300">
                <input name="overwriteExistingShipment" type="checkbox" value="yes" />
                Overwrite non-empty safe shipment fields
              </label>
            ) : null}
          </div>
        ) : null}
        <FieldError error={fieldErrors.overwriteExistingShipment} />
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Parties and route</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Issuing carrier's agent name and city">
            <textarea className={inputClassName} defaultValue="PT PLI" name="agentName" rows={2} />
          </Field>
          <Field error={fieldErrors.shipperName} label="Shipper name *">
            <Input name="shipperName" />
          </Field>
          <Field error={fieldErrors.consigneeName} label="Consignee name *">
            <Input name="consigneeName" />
          </Field>
          <Field error={fieldErrors.shipperAddress} label="Shipper address *">
            <textarea className={inputClassName} name="shipperAddress" rows={4} />
          </Field>
          <Field error={fieldErrors.consigneeAddress} label="Consignee address *">
            <textarea className={inputClassName} name="consigneeAddress" rows={4} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field error={fieldErrors.originIata} label="Origin IATA *">
            <Input
              maxLength={3}
              name="originIata"
              onChange={(event) => setOriginIata(event.target.value.toUpperCase())}
              placeholder="CGK"
              value={originIata}
            />
            {departureAirport ? <span className="block text-xs text-slate-500">{departureAirport}</span> : null}
          </Field>
          <Field error={fieldErrors.destinationIata} label="Destination IATA *">
            <Input
              maxLength={3}
              name="destinationIata"
              onChange={(event) => {
                const next = event.target.value.toUpperCase();
                setDestinationIata(next);
                const resolved = resolveMawbDestinationDisplay(next);
                if (resolved) setDestinationAirport(resolved);
                else setDestinationAirport("");
              }}
              placeholder="TPE"
              value={destinationIata}
            />
            {resolvedDestinationAirport ? <span className="block text-xs text-slate-500">{resolvedDestinationAirport}</span> : null}
          </Field>
          <Field
            error={fieldErrors.destinationAirport}
            label={destinationNeedsManual ? "Destination airport/display *" : "Destination airport/display"}
          >
            <Input
              name="destinationAirport"
              onChange={(event) => setDestinationAirport(event.target.value)}
              placeholder={destinationNeedsManual ? "Type destination airport or city" : resolvedDestinationAirport}
              value={destinationAirport || resolvedDestinationAirport}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Onward to 1">
            <Input maxLength={3} name="routingTo1" placeholder="MLE" />
          </Field>
          <Field label="Onward by 1">
            <Input maxLength={3} name="routingBy1" placeholder="AK" />
          </Field>
          <Field label="Onward to 2">
            <Input maxLength={3} name="routingTo2" />
          </Field>
          <Field label="Onward by 2">
            <Input maxLength={3} name="routingBy2" />
          </Field>
        </div>
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Flight and cargo</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Flight number">
            <Input name="flightNumber" placeholder="TBA" />
          </Field>
          <Field error={fieldErrors.flightDate} label="Flight date">
            <Input name="flightDate" type="date" />
          </Field>
          <Field error={fieldErrors.executedDate} label="Executed date">
            <Input name="executedDate" type="date" />
          </Field>
          <Field label="Executed at">
            <Input defaultValue="CGK" name="executedPlace" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field error={fieldErrors.pieces} label="Pieces *">
            <Input min="1" name="pieces" type="number" />
          </Field>
          <Field error={fieldErrors.grossWeight} label="Gross weight *">
            <Input
              min="0"
              name="grossWeight"
              onChange={(event) => setGrossWeight(event.target.value)}
              step="0.01"
              type="number"
              value={grossWeight}
            />
          </Field>
          <Field error={fieldErrors.chargeableWeight} label="Chargeable weight *">
            <Input
              min="0"
              name="chargeableWeight"
              onChange={(event) => setChargeableWeight(event.target.value)}
              step="0.01"
              type="number"
              value={chargeableWeight}
            />
          </Field>
          <Field error={fieldErrors.rate} label="Rate *">
            <Input
              min="0"
              name="rate"
              onChange={(event) => setRate(event.target.value)}
              step="0.01"
              type="number"
              value={rate}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Commodity">
            <Input name="commodity" />
          </Field>
          <Field label="Goods description">
            <Input name="goodsDescription" />
          </Field>
          <Field label="Currency">
            <Input defaultValue="IDR" maxLength={3} name="currency" />
          </Field>
        </div>
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
          <Field label="Handling information text box">
            <textarea className={inputClassName} name="handlingInformation" rows={5} />
          </Field>
          <Field label="Nature and quantity text box">
            <textarea className={inputClassName} name="natureQuantity" rows={5} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Other charges</h2>
            <p className="mt-1 text-sm text-slate-500">These rows generate the text box and the other-charges total.</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setChargeLines((current) => [...current, newChargeLine()])}
            type="button"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        </div>
        <div className="space-y-3">
          {chargeLines.map((line, index) => (
            <div className="grid gap-3 rounded-lg border border-white/5 bg-slate-950/40 p-3 md:grid-cols-[1fr_100px_1fr_130px_auto]" key={`${line.code}-${index}`}>
              <Input
                aria-label={`Charge code ${index + 1}`}
                name="chargeCode"
                onChange={(event) => updateChargeLine(index, { code: event.target.value.toUpperCase() })}
                placeholder="AWC"
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
                min="0"
                name="chargeAmount"
                onChange={(event) => updateChargeLine(index, { amount: event.target.value })}
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
        <FieldError error={fieldErrors.chargeCode || fieldErrors.chargeAmount} />
        <div className="grid gap-3 rounded-lg border border-blue-500/10 bg-blue-500/5 p-4 text-sm sm:grid-cols-3">
          <p>
            <span className="block text-xs uppercase tracking-widest text-slate-500">Weight charge</span>
            <span className="font-mono text-blue-100">{formatMawbChargeAmount(chargeSummary.weightCharge)}</span>
          </p>
          <p>
            <span className="block text-xs uppercase tracking-widest text-slate-500">Other charges</span>
            <span className="font-mono text-blue-100">{formatMawbChargeAmount(chargeSummary.otherChargesTotal)}</span>
          </p>
          <p>
            <span className="block text-xs uppercase tracking-widest text-slate-500">Total prepaid</span>
            <span className="font-mono text-blue-100">{formatMawbChargeAmount(chargeSummary.totalPrepaid)}</span>
          </p>
        </div>
      </Card>

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        {localPrintEnabled ? (
          <Button
            className="min-w-48"
            formAction="/mawbs/local-print"
            formMethod="post"
            formTarget="_blank"
            type="submit"
            variant="secondary"
          >
            Download test workbook
          </Button>
        ) : null}
        <Button className="min-w-40" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save MAWB"}
        </Button>
      </div>
    </form>
  );
}
