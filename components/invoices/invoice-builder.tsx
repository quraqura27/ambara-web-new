"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, Calculator, FileCheck2, Loader2, Plus, Save, Trash2 } from "lucide-react";

import {
  finalizeInvoiceFromForm,
  getInvoiceableSources,
  type InvoiceActionState,
  type InvoiceCustomerOption,
  type InvoiceableSource,
} from "@/actions/invoices";
import { Button, Card, Input, cn } from "@/components/ui/core";
import {
  calculateInvoiceTotals,
  dateInputFromDate,
  FULL_PAYMENT_TERMS_TEXT,
  formatCurrencyAmount,
  invoiceDueDateForPaymentTerm,
  invoicePaymentTermOptions,
  lineTotal,
  type InvoiceBillingBasis,
  type InvoicePaymentTermCode,
  terbilangRupiah,
} from "@/lib/invoices/core";

type InvoiceBuilderProps = {
  customers: InvoiceCustomerOption[];
  initialSources: InvoiceableSource[];
  mockData?: boolean;
  mockSourcesByCustomerId?: Record<number, InvoiceableSource[]>;
};

type ChargeLine = {
  billingBasis: InvoiceBillingBasis;
  description: string;
  id: string;
  manualChargeableWeight: string;
  reference: string;
  sourceKey: string | null;
  unitRate: string;
};

type ManualLine = {
  amount: string;
  description: string;
  id: string;
};

const initialState: InvoiceActionState = {};
const servicePresets = [
  "Air Freight",
  "Regulated Agent Service",
  "Handling Service",
  "Other Service",
] as const;

function todayDate() {
  return dateInputFromDate(new Date());
}

function displayDate(value: string | null) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).replace(/ /g, "-");
}

function customerLabel(customer: InvoiceCustomerOption) {
  return customer.companyName || customer.fullName || `Customer #${customer.id}`;
}

function routeLabel(source: InvoiceableSource) {
  return [source.origin, source.destination].filter(Boolean).join(" - ") || "-";
}

export function InvoiceBuilder({
  customers,
  initialSources,
  mockData = false,
  mockSourcesByCustomerId = {},
}: InvoiceBuilderProps) {
  const initialCustomer = customers.find((customer) => customer.invoiceableCount > 0) ?? customers[0] ?? null;
  const [state, formAction, pending] = useActionState(finalizeInvoiceFromForm, initialState);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomer?.id ? String(initialCustomer.id) : "");
  const [sources, setSources] = useState<InvoiceableSource[]>(initialSources);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [chargeLines, setChargeLines] = useState<ChargeLine[]>([]);
  const [deductions, setDeductions] = useState<ManualLine[]>([]);
  const [currency, setCurrency] = useState("IDR");
  const [invoiceDate, setInvoiceDate] = useState(todayDate);
  const [customDueDate, setCustomDueDate] = useState(invoiceDate);
  const [customPaymentTerms, setCustomPaymentTerms] = useState("");
  const [paymentTermCode, setPaymentTermCode] = useState<InvoicePaymentTermCode>("cash");
  const [bankAccount, setBankAccount] = useState("OCBC");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [pphEnabled, setPphEnabled] = useState(false);
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [depositAmount, setDepositAmount] = useState("0");

  const selectedCustomer = customers.find((customer) => String(customer.id) === selectedCustomerId) ?? null;
  const selectedCustomerCode = selectedCustomer?.code ?? "";
  const sourceById = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const dueDate = invoiceDueDateForPaymentTerm({
    customDueDate,
    invoiceDate,
    paymentTermCode,
  }) ?? "";

  const lineInputs = chargeLines.map((line) => {
    const source = line.sourceKey ? sourceById.get(line.sourceKey) : null;
    return {
      billingBasis: line.billingBasis,
      chargeableWeight: line.billingBasis === "per_kg"
        ? source?.chargeableWeight ?? line.manualChargeableWeight
        : null,
      type: "charge" as const,
      unitRate: line.unitRate,
    };
  });
  const totals = calculateInvoiceTotals({
    deductions,
    depositAmount,
    lines: lineInputs,
    pphEnabled,
    vatEnabled,
  });

  function selectCustomer(value: string) {
    setSelectedCustomerId(value);
    setChargeLines([]);
    const customerId = Number.parseInt(value, 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      setSources([]);
      return;
    }
    if (mockData) {
      setSources(mockSourcesByCustomerId[customerId] ?? []);
      return;
    }
    setSourceLoading(true);
    getInvoiceableSources(customerId)
      .then((rows) => setSources(rows))
      .finally(() => setSourceLoading(false));
  }

  function updateInvoiceDate(value: string) {
    setInvoiceDate(value);
    if (paymentTermCode === "custom" && value && customDueDate < value) {
      setCustomDueDate(value);
    }
  }

  function updatePaymentTerm(value: string) {
    const nextCode = value as InvoicePaymentTermCode;
    if (nextCode === "custom" && customDueDate < invoiceDate) {
      setCustomDueDate(invoiceDate);
    }
    setPaymentTermCode(nextCode);
  }

  function addSourceCharge(sourceKey: string) {
    const existingCount = chargeLines.filter((line) => line.sourceKey === sourceKey).length;
    setChargeLines((current) => [
      ...current,
      {
        billingBasis: "per_kg",
        description: existingCount === 0 ? "Air Freight" : "Handling Service",
        id: crypto.randomUUID(),
        manualChargeableWeight: "",
        reference: "",
        sourceKey,
        unitRate: "0",
      },
    ]);
  }

  function addManualCharge() {
    setChargeLines((current) => [
      ...current,
      {
        billingBasis: "per_kg",
        description: "Regulated Agent Service",
        id: crypto.randomUUID(),
        manualChargeableWeight: "",
        reference: "",
        sourceKey: null,
        unitRate: "0",
      },
    ]);
  }

  function updateChargeLine(id: string, patch: Partial<ChargeLine>) {
    setChargeLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  }

  function removeChargeLine(id: string) {
    setChargeLines((current) => current.filter((line) => line.id !== id));
  }

  function addDeduction() {
    setDeductions((current) => [
      ...current,
      { amount: "0", description: "Claim / Deduction", id: crypto.randomUUID() },
    ]);
  }

  function updateDeduction(id: string, patch: Partial<ManualLine>) {
    setDeductions((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  }

  const grossOrNetLabel = pphEnabled ? "Net payable" : "Total due";

  return (
    <form
      action={formAction}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]"
      onSubmit={(event) => {
        if (mockData) event.preventDefault();
      }}
    >
      <input name="customerId" type="hidden" value={selectedCustomerId} />
      <input name="chargeLines" type="hidden" value={JSON.stringify(chargeLines)} />
      <input name="deductions" type="hidden" value={JSON.stringify(deductions)} />
      <input name="vatEnabled" type="hidden" value={vatEnabled ? "true" : "false"} />
      <input name="pphEnabled" type="hidden" value={pphEnabled ? "true" : "false"} />
      <input name="paymentTermCode" type="hidden" value={paymentTermCode} />
      <input name="showPaymentTerms" type="hidden" value={!pphEnabled && showPaymentTerms ? "true" : "false"} />
      <datalist id="invoice-service-presets">
        {servicePresets.map((preset) => <option key={preset} value={preset} />)}
      </datalist>

      <div className="space-y-6">
        {state.formError ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.formError}</span>
          </div>
        ) : null}
        {mockData ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Local mock data is active. Test linked and manual charges, VAT, PPh, deductions, and totals without writing to the database.</span>
          </div>
        ) : null}

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <FileCheck2 className="h-5 w-5 text-blue-300" />
            <div>
              <h2 className="text-lg font-semibold">Customer and numbering</h2>
              <p className="text-sm text-slate-500">Drafts reserve shipment sources. Invoice number is assigned when finance sends.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_140px]">
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Customer</span>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                onChange={(event) => selectCustomer(event.target.value)}
                value={selectedCustomerId}
              >
                {customers.length === 0 ? <option value="">No customers available in this local data source</option> : null}
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customerLabel(customer)} - {customer.invoiceableCount} invoiceable
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Customer code</span>
              <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 font-mono text-sm text-blue-100">
                {selectedCustomerCode || "Set in Directory"}
              </div>
            </label>
          </div>
          {selectedCustomer && !selectedCustomerCode ? (
            <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
              Set this customer&apos;s 3-letter invoice code in Customer Directory before sending invoices.
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="mb-5 text-lg font-semibold">Invoice details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Date</span><Input name="invoiceDate" onChange={(event) => updateInvoiceDate(event.target.value)} required type="date" value={invoiceDate} /></label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Payment terms</span>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" onChange={(event) => updatePaymentTerm(event.target.value)} value={paymentTermCode}>
                {invoicePaymentTermOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Due date</span>
              <Input
                aria-describedby="invoice-due-date-help"
                min={paymentTermCode === "custom" ? invoiceDate : undefined}
                name="dueDate"
                onChange={(event) => setCustomDueDate(event.target.value)}
                readOnly={paymentTermCode !== "custom"}
                required
                type="date"
                value={dueDate}
              />
              <span className="mt-2 block text-xs text-slate-500" id="invoice-due-date-help">
                {paymentTermCode === "custom" ? "Choose the agreed due date." : "Calculated from the invoice date and payment terms."}
              </span>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Currency</span>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" name="currency" onChange={(event) => setCurrency(event.target.value)} value={currency}>
                <option value="IDR">IDR</option><option value="USD">USD</option><option value="JPY">JPY</option>
              </select>
            </label>
            {paymentTermCode === "custom" ? <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Custom terms label</span><Input maxLength={100} name="customPaymentTerms" onChange={(event) => setCustomPaymentTerms(event.target.value)} placeholder="e.g. Payment on delivery" required value={customPaymentTerms} /></label> : null}
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Bank account</span>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" name="bankAccount" onChange={(event) => setBankAccount(event.target.value)} value={bankAccount}>
                <option value="OCBC">Bank OCBC</option><option value="BCA">Bank BCA</option><option value="MANDIRI">Bank Mandiri</option>
              </select>
            </label>
            <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Period</span><Input name="period" placeholder="Optional" /></label>
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <h2 className="text-lg font-semibold">Uninvoiced shipments</h2>
              <p className="text-sm text-slate-500">Add one or more service charges from a shipment. An AWB is optional.</p>
            </div>
            {sourceLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#15151f] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Shipment details</th><th className="px-4 py-3">Pcs</th><th className="px-4 py-3">Chargeable weight</th><th className="px-4 py-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sources.map((source) => {
                  const chargeCount = chargeLines.filter((line) => line.sourceKey === source.id).length;
                  return (
                    <tr key={source.id}>
                      <td className="px-4 py-3"><p className="font-mono text-blue-200">{source.reference}</p><p className="text-xs text-slate-500">{source.awbNumber ? "AWB" : "Shipment reference"}</p></td>
                      <td className="px-4 py-3"><p>{routeLabel(source)}</p><p className="text-xs text-slate-500">{displayDate(source.shipmentDate)}{source.flightNumber ? ` / ${source.flightNumber}` : ""}</p></td>
                      <td className="px-4 py-3">{source.pieces ?? "-"}</td>
                      <td className="px-4 py-3">{source.chargeableWeight ? `${source.chargeableWeight} kg` : <span className="text-amber-200">Missing</span>}</td>
                      <td className="px-4 py-3 text-right"><Button className="gap-2" onClick={() => addSourceCharge(source.id)} type="button" variant="secondary"><Plus className="h-4 w-4" />{chargeCount ? `Add another (${chargeCount})` : "Add charge"}</Button></td>
                    </tr>
                  );
                })}
                {sources.length === 0 ? <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={5}>No uninvoiced shipments found for this customer.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Service charges</h2><p className="text-sm text-slate-500">Linked weights are read-only snapshots from the shipment record.</p></div>
            <Button className="gap-2" onClick={addManualCharge} type="button" variant="secondary"><Plus className="h-4 w-4" />Add manual charge</Button>
          </div>
          <div className="space-y-4">
            {chargeLines.map((line, index) => {
              const source = line.sourceKey ? sourceById.get(line.sourceKey) : null;
              const chargeableWeight = line.billingBasis === "per_kg" ? source?.chargeableWeight ?? line.manualChargeableWeight : null;
              const amount = lineTotal({ billingBasis: line.billingBasis, chargeableWeight, type: "charge", unitRate: line.unitRate });
              return (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4" key={line.id}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div><p className="font-semibold">Charge {index + 1}</p><p className="text-xs text-slate-500">{source ? `Linked to ${source.reference}` : "Manual fallback"}</p></div>
                    <Button aria-label={`Remove charge ${index + 1}`} onClick={() => removeChargeLine(line.id)} type="button" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Reference</span>{source ? <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 font-mono text-sm text-blue-100">{source.reference}</div> : <Input onChange={(event) => updateChargeLine(line.id, { reference: event.target.value })} placeholder="Required reference" required value={line.reference} />}</label>
                    <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Service</span><Input list="invoice-service-presets" onChange={(event) => updateChargeLine(line.id, { description: event.target.value })} required value={line.description} /></label>
                    <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Billing basis</span><select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" onChange={(event) => updateChargeLine(line.id, { billingBasis: event.target.value as InvoiceBillingBasis })} value={line.billingBasis}><option value="per_kg">Per kg</option><option value="flat">Flat</option></select></label>
                    <label>
                      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Quantity</span>
                      {line.billingBasis === "flat" ? <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-300">1 service</div> : source ? <div className={cn("rounded-lg border bg-slate-950/60 px-4 py-2 text-sm", source.chargeableWeight ? "border-slate-700 text-slate-300" : "border-amber-400/30 text-amber-200")}>{source.chargeableWeight ? `${source.chargeableWeight} kg` : "Correct shipment weight first"}</div> : <Input min="0.01" onChange={(event) => updateChargeLine(line.id, { manualChargeableWeight: event.target.value })} placeholder="Chargeable kg" required step="0.01" type="number" value={line.manualChargeableWeight} />}
                    </label>
                    <label><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">{line.billingBasis === "per_kg" ? "Rate / kg" : "Flat amount"}</span><Input min="0" onChange={(event) => updateChargeLine(line.id, { unitRate: event.target.value })} required step="0.01" type="number" value={line.unitRate} /><span className="mt-2 block text-right text-xs text-blue-200">{currency} {formatCurrencyAmount(amount, currency)}</span></label>
                  </div>
                  {source ? <p className="mt-3 text-xs text-slate-500">{displayDate(source.shipmentDate)} / {routeLabel(source)}{source.flightNumber ? ` / ${source.flightNumber}` : ""}{source.pieces ? ` / ${source.pieces} pcs` : ""}</p> : null}
                </div>
              );
            })}
            {chargeLines.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">Add a charge from a shipment above, or add a manual charge when no shipment record exists.</p> : null}
          </div>
        </Card>

        <ManualLines
          addLabel="Add deduction"
          descriptionPlaceholder="Claim / deduction"
          lines={deductions}
          onAdd={addDeduction}
          onRemove={(id) => setDeductions((current) => current.filter((line) => line.id !== id))}
          onUpdate={updateDeduction}
          title="Deductions"
        />
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3"><Calculator className="h-5 w-5 text-blue-300" /><h2 className="text-lg font-semibold">Summary</h2></div>
          <div className="space-y-3 text-sm">
            <SummaryRow currency={currency} label="Subtotal" value={totals.subtotal} />
            <SummaryRow currency={currency} label="Deductions" negative value={totals.totalPengurangan} />
            <SummaryRow currency={currency} label="Net amount" value={totals.netAmount} />
            <label className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3"><span>VAT 1.1%</span><input checked={vatEnabled} onChange={(event) => setVatEnabled(event.target.checked)} type="checkbox" /></label>
            {vatEnabled ? <SummaryRow currency={currency} label="VAT amount" value={totals.vatAmount} /> : null}
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Deposit</span><Input name="depositAmount" onChange={(event) => setDepositAmount(event.target.value)} type="number" value={depositAmount} /></label>
            <SummaryRow currency={currency} label="Total due" value={totals.amountDue} />
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between gap-4"><span className="font-medium">Payment treatment</span><span className="text-xs uppercase tracking-widest text-slate-500">{pphEnabled ? "PPh withheld" : "Full amount"}</span></div>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-4"><span>PPh 23 2% withheld</span><input checked={pphEnabled} onChange={(event) => setPphEnabled(event.target.checked)} type="checkbox" /></label>
                <label className={cn("flex items-center justify-between gap-4", pphEnabled && "opacity-50")}><span>Print Terms of Payment</span><input checked={!pphEnabled && showPaymentTerms} disabled={pphEnabled} onChange={(event) => setShowPaymentTerms(event.target.checked)} type="checkbox" /></label>
                {!pphEnabled && showPaymentTerms ? <p className="rounded-md border border-white/5 bg-slate-950/50 p-2 text-xs italic leading-5 text-slate-400">{FULL_PAYMENT_TERMS_TEXT}</p> : null}
              </div>
            </div>
            {pphEnabled ? <SummaryRow currency={currency} label="PPh 23 withholding" negative value={totals.pphAmount} /> : null}
            <div className="flex items-center justify-between rounded-lg bg-blue-500/15 p-4 font-bold text-blue-100"><span>{grossOrNetLabel}</span><span>{currency} {formatCurrencyAmount(totals.netPayable, currency)}</span></div>
          </div>
          <div className="mt-5 rounded-lg border border-white/5 bg-slate-950/60 p-3 text-xs italic text-slate-400">
            # {currency === "IDR" ? terbilangRupiah(totals.netPayable) : "Amount in words is shown for IDR only."}
          </div>

          <div className="mt-5">
            <Button
              className="gap-2"
              disabled={pending || !selectedCustomer || chargeLines.length === 0 || mockData}
              name="invoiceIntent"
              type="submit"
              value="draft"
              variant="secondary"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mockData ? "Draft disabled" : "Save draft"}
            </Button>
          </div>
        </Card>
        <Card className="p-5 text-sm text-slate-400"><h2 className="mb-2 font-semibold text-white">QR stamp</h2><p>Final invoices include a public verification QR with limited proof only. Shipment sources and internal records stay private.</p></Card>
      </div>
    </form>
  );
}

function ManualLines({ addLabel, descriptionPlaceholder, lines, onAdd, onRemove, onUpdate, title }: {
  addLabel: string;
  descriptionPlaceholder: string;
  lines: ManualLine[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ManualLine>) => void;
  title: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><Button className="gap-2" onClick={onAdd} type="button" variant="secondary"><Plus className="h-4 w-4" />{addLabel}</Button></div>
      <div className="space-y-3">
        {lines.map((line) => <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]" key={line.id}><Input onChange={(event) => onUpdate(line.id, { description: event.target.value })} placeholder={descriptionPlaceholder} value={line.description} /><Input onChange={(event) => onUpdate(line.id, { amount: event.target.value })} type="number" value={line.amount} /><Button aria-label="Remove line" onClick={() => onRemove(line.id)} type="button" variant="ghost"><Trash2 className="h-4 w-4" /></Button></div>)}
        {lines.length === 0 ? <p className="text-sm text-slate-500">No lines added.</p> : null}
      </div>
    </Card>
  );
}

function SummaryRow({ currency, label, negative, value }: { currency: string; label: string; negative?: boolean; value: number }) {
  return <div className={cn("flex items-center justify-between", negative && value > 0 && "text-amber-200")}><span>{label}</span><span>{negative && value > 0 ? "-" : ""}{currency} {formatCurrencyAmount(value, currency)}</span></div>;
}
