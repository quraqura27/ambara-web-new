"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, Calculator, FileCheck2, Loader2, Plus, Trash2 } from "lucide-react";

import {
  finalizeInvoiceFromForm,
  getInvoiceableAwbs,
  type InvoiceActionState,
  type InvoiceCustomerOption,
  type InvoiceableAwb,
} from "@/actions/invoices";
import { Button, Card, Input, cn } from "@/components/ui/core";
import {
  calculateInvoiceTotals,
  formatCurrencyAmount,
  numberValue,
  terbilangRupiah,
} from "@/lib/invoices/core";

type InvoiceBuilderProps = {
  customers: InvoiceCustomerOption[];
  initialAwbs: InvoiceableAwb[];
  mockAwbsByCustomerId?: Record<number, InvoiceableAwb[]>;
  mockData?: boolean;
};

type AwbLine = {
  awbId: string;
  pricePerKg: string;
};

type ManualLine = {
  amount: string;
  description: string;
  id: string;
};

const initialState: InvoiceActionState = {};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateInput: string, days: number) {
  const date = new Date(`${dateInput}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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

export function InvoiceBuilder({
  customers,
  initialAwbs,
  mockAwbsByCustomerId = {},
  mockData = false,
}: InvoiceBuilderProps) {
  const initialCustomer = customers.find((customer) => customer.invoiceableCount > 0) ?? customers[0] ?? null;
  const [state, formAction, pending] = useActionState(finalizeInvoiceFromForm, initialState);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomer?.id ? String(initialCustomer.id) : "");
  const [customerCode, setCustomerCode] = useState(initialCustomer?.code ?? "");
  const [awbs, setAwbs] = useState<InvoiceableAwb[]>(initialAwbs);
  const [awbLoading, setAwbLoading] = useState(false);
  const [awbLines, setAwbLines] = useState<AwbLine[]>([]);
  const [serviceLines, setServiceLines] = useState<ManualLine[]>([]);
  const [deductions, setDeductions] = useState<ManualLine[]>([]);
  const [currency, setCurrency] = useState("IDR");
  const [invoiceDate, setInvoiceDate] = useState(todayDate());
  const [dueDate, setDueDate] = useState(addDays(todayDate(), 14));
  const [paymentTerms, setPaymentTerms] = useState("CASH");
  const [bankAccount, setBankAccount] = useState("OCBC");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [pphEnabled, setPphEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState("0");

  const selectedCustomer = customers.find((customer) => String(customer.id) === selectedCustomerId) ?? null;
  const awbById = useMemo(() => new Map(awbs.map((awb) => [awb.id, awb])), [awbs]);

  const lineInputs = [
    ...awbLines.map((line) => {
      const awb = awbById.get(line.awbId);
      return {
        chargeableWeight: awb?.chargeableWeight ?? 0,
        pricePerKg: line.pricePerKg,
        type: "awb" as const,
      };
    }),
    ...serviceLines.map((line) => ({
      flatAmount: line.amount,
      type: "service" as const,
    })),
  ];
  const totals = calculateInvoiceTotals({
    deductions,
    depositAmount,
    lines: lineInputs,
    pphEnabled,
    vatEnabled,
  });

  function selectCustomer(value: string) {
    const customer = customers.find((item) => String(item.id) === value);
    setSelectedCustomerId(value);
    setCustomerCode(customer?.code ?? "");
    setAwbLines([]);
    const customerId = Number.parseInt(value, 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      setAwbs([]);
      return;
    }
    if (mockData) {
      setAwbs(mockAwbsByCustomerId[customerId] ?? []);
      return;
    }
    setAwbLoading(true);
    getInvoiceableAwbs(customerId)
      .then((rows) => setAwbs(rows))
      .finally(() => setAwbLoading(false));
  }

  function toggleAwb(awbId: string, checked: boolean) {
    setAwbLines((current) => {
      if (!checked) return current.filter((line) => line.awbId !== awbId);
      if (current.some((line) => line.awbId === awbId)) return current;
      return [...current, { awbId, pricePerKg: "0" }];
    });
  }

  function updateAwbPrice(awbId: string, pricePerKg: string) {
    setAwbLines((current) => current.map((line) => line.awbId === awbId ? { ...line, pricePerKg } : line));
  }

  function addManualLine(setter: React.Dispatch<React.SetStateAction<ManualLine[]>>, description: string) {
    setter((current) => [...current, { amount: "0", description, id: crypto.randomUUID() }]);
  }

  function updateManualLine(
    setter: React.Dispatch<React.SetStateAction<ManualLine[]>>,
    id: string,
    patch: Partial<ManualLine>,
  ) {
    setter((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  }

  function removeManualLine(setter: React.Dispatch<React.SetStateAction<ManualLine[]>>, id: string) {
    setter((current) => current.filter((line) => line.id !== id));
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
      <input name="customerCode" type="hidden" value={customerCode} />
      <input name="awbLines" type="hidden" value={JSON.stringify(awbLines)} />
      <input name="serviceLines" type="hidden" value={JSON.stringify(serviceLines)} />
      <input name="deductions" type="hidden" value={JSON.stringify(deductions)} />
      <input name="vatEnabled" type="hidden" value={vatEnabled ? "true" : "false"} />
      <input name="pphEnabled" type="hidden" value={pphEnabled ? "true" : "false"} />

      <div className="space-y-6">
        {state.formError ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.formError}</span>
          </div>
        ) : null}
        {mockData ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Local mock data is active. Use this screen to test shipment selection, service lines, VAT, PPh, deductions, and totals without writing to the database.</span>
          </div>
        ) : null}

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <FileCheck2 className="h-5 w-5 text-blue-300" />
            <div>
              <h2 className="text-lg font-semibold">Customer and numbering</h2>
              <p className="text-sm text-slate-500">Invoice number is assigned when finance finalizes.</p>
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
                {customers.length === 0 ? (
                  <option value="">No customers available in this local data source</option>
                ) : null}
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customerLabel(customer)} - {customer.invoiceableCount} invoiceable
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Customer code</span>
              <Input maxLength={5} onChange={(event) => setCustomerCode(event.target.value.toUpperCase())} value={customerCode} />
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-5 text-lg font-semibold">Invoice details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Date</span>
              <Input name="invoiceDate" onChange={(event) => setInvoiceDate(event.target.value)} type="date" value={invoiceDate} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Due date</span>
              <Input name="dueDate" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Currency</span>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" name="currency" onChange={(event) => setCurrency(event.target.value)} value={currency}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="JPY">JPY</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Payment terms</span>
              <Input name="paymentTerms" onChange={(event) => setPaymentTerms(event.target.value)} value={paymentTerms} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Bank account</span>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" name="bankAccount" onChange={(event) => setBankAccount(event.target.value)} value={bankAccount}>
                <option value="OCBC">Bank OCBC</option>
                <option value="MANDIRI">Bank Mandiri</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Period</span>
              <Input name="period" placeholder="Optional" />
            </label>
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <h2 className="text-lg font-semibold">Uninvoiced AWBs / shipments</h2>
              <p className="text-sm text-slate-500">Select rows and enter price per kg.</p>
            </div>
            {awbLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : null}
          </div>
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-[#15151f] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="w-14 px-3 py-3">Select</th>
                  <th className="w-[24%] px-3 py-3">AWB</th>
                  <th className="w-[18%] px-3 py-3">Route</th>
                  <th className="w-[17%] px-3 py-3">Date</th>
                  <th className="w-12 px-3 py-3">Pcs</th>
                  <th className="w-14 px-3 py-3">CAW</th>
                  <th className="w-28 px-3 py-3">Price/kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {awbs.map((awb) => {
                  const selected = awbLines.find((line) => line.awbId === awb.id);
                  return (
                    <tr key={awb.id}>
                      <td className="px-3 py-3">
                        <input checked={Boolean(selected)} onChange={(event) => toggleAwb(awb.id, event.target.checked)} type="checkbox" />
                      </td>
                      <td className="break-all px-3 py-3 font-mono text-blue-200">{awb.awbNumber || "-"}</td>
                      <td className="px-3 py-3">{awb.origin || "-"} - {awb.destination || "-"}</td>
                      <td className="px-3 py-3 text-slate-400">{displayDate(awb.shipmentDate)}</td>
                      <td className="px-3 py-3">{awb.pieces ?? "-"}</td>
                      <td className="px-3 py-3">{awb.chargeableWeight ?? "-"}</td>
                      <td className="px-3 py-3">
                        <Input
                          className="px-3 text-right"
                          disabled={!selected}
                          min="0"
                          onChange={(event) => updateAwbPrice(awb.id, event.target.value)}
                          step="0.01"
                          type="number"
                          value={selected?.pricePerKg ?? "0"}
                        />
                      </td>
                    </tr>
                  );
                })}
                {awbs.length === 0 ? (
                  <tr><td className="px-5 py-10 text-center text-slate-500" colSpan={7}>No uninvoiced AWBs or shipments found for this customer.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <ManualLines
            addLabel="Add service"
            descriptionPlaceholder="Airport handling, documentation, delivery..."
            lines={serviceLines}
            onAdd={() => addManualLine(setServiceLines, "Airport Handling")}
            onRemove={(id) => removeManualLine(setServiceLines, id)}
            onUpdate={(id, patch) => updateManualLine(setServiceLines, id, patch)}
            title="Manual service lines"
          />
          <ManualLines
            addLabel="Add deduction"
            descriptionPlaceholder="Claim / deduction"
            lines={deductions}
            onAdd={() => addManualLine(setDeductions, "Claim / Deduction")}
            onRemove={(id) => removeManualLine(setDeductions, id)}
            onUpdate={(id, patch) => updateManualLine(setDeductions, id, patch)}
            title="Deductions"
          />
        </div>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <Calculator className="h-5 w-5 text-blue-300" />
            <h2 className="text-lg font-semibold">Summary</h2>
          </div>

          <div className="space-y-3 text-sm">
            <SummaryRow currency={currency} label="Subtotal" value={totals.subtotal} />
            <SummaryRow currency={currency} label="Deductions" negative value={totals.totalPengurangan} />
            <SummaryRow currency={currency} label="Net amount" value={totals.netAmount} />
            <label className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span>VAT 1.1%</span>
              <input checked={vatEnabled} onChange={(event) => setVatEnabled(event.target.checked)} type="checkbox" />
            </label>
            {vatEnabled ? <SummaryRow currency={currency} label="VAT amount" value={totals.vatAmount} /> : null}
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Deposit</span>
              <Input name="depositAmount" onChange={(event) => setDepositAmount(event.target.value)} type="number" value={depositAmount} />
            </label>
            <SummaryRow currency={currency} label="Total due" value={totals.amountDue} />
            <label className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span>PPh 23 2% withheld</span>
              <input checked={pphEnabled} onChange={(event) => setPphEnabled(event.target.checked)} type="checkbox" />
            </label>
            {pphEnabled ? <SummaryRow currency={currency} label="PPh 23 withholding" negative value={totals.pphAmount} /> : null}
            <div className="flex items-center justify-between rounded-lg bg-blue-500/15 p-4 font-bold text-blue-100">
              <span>{grossOrNetLabel}</span>
              <span>{currency} {formatCurrencyAmount(totals.netPayable, currency)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-white/5 bg-slate-950/60 p-3 text-xs italic text-slate-400">
            # {currency === "IDR" ? terbilangRupiah(totals.netPayable) : "Amount in words is shown for IDR only."}
          </div>

          <Button className="mt-5 w-full gap-2" disabled={pending || !selectedCustomer || mockData} type="submit">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
            {mockData ? "Finalize disabled in mock mode" : "Finalize invoice"}
          </Button>
        </Card>

        <Card className="p-5 text-sm text-slate-400">
          <h2 className="mb-2 font-semibold text-white">QR stamp</h2>
          <p>Final invoices include a public verification QR with limited proof only. AWB lines and internal records stay private.</p>
        </Card>
      </div>
    </form>
  );
}

function ManualLines({
  addLabel,
  descriptionPlaceholder,
  lines,
  onAdd,
  onRemove,
  onUpdate,
  title,
}: {
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button className="gap-2" onClick={onAdd} type="button" variant="secondary">
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      <div className="space-y-3">
        {lines.map((line) => (
          <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]" key={line.id}>
            <Input onChange={(event) => onUpdate(line.id, { description: event.target.value })} placeholder={descriptionPlaceholder} value={line.description} />
            <Input onChange={(event) => onUpdate(line.id, { amount: event.target.value })} type="number" value={line.amount} />
            <Button aria-label="Remove line" onClick={() => onRemove(line.id)} type="button" variant="ghost">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {lines.length === 0 ? <p className="text-sm text-slate-500">No lines added.</p> : null}
      </div>
    </Card>
  );
}

function SummaryRow({
  currency,
  label,
  negative,
  value,
}: {
  currency: string;
  label: string;
  negative?: boolean;
  value: number;
}) {
  return (
    <div className={cn("flex items-center justify-between", negative && value > 0 && "text-amber-200")}>
      <span>{label}</span>
      <span>{negative && value > 0 ? "-" : ""}{currency} {formatCurrencyAmount(value, currency)}</span>
    </div>
  );
}
