import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Ban, CheckCircle2, Download, Printer, QrCode, Send, XCircle } from "lucide-react";

import {
  archiveInvoiceFromForm,
  getInvoiceDetail,
  markDraftInvoiceSentFromForm,
  recordInvoicePaymentFromForm,
  voidInvoicePaymentFromForm,
  voidInvoiceFromForm,
} from "@/actions/invoices";
import { Button, Card } from "@/components/ui/core";
import { ConfirmSubmitButton, TypedConfirmSubmitButton } from "@/components/portal/confirm-submit-button";
import {
  formatCurrencyAmount,
  invoiceEffectiveStatus,
  invoiceLineBillingBasis,
  invoiceLineReference,
  invoiceLineService,
  invoiceStatusLabel,
  numberValue,
  normalizeInvoiceStatus,
} from "@/lib/invoices/core";
import { formatWibDateTime } from "@/lib/time/wib";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);
  if (!detail) notFound();

  const { deductions, invoice, lines, payments, paymentSummary } = detail;
  const archiveAction = archiveInvoiceFromForm.bind(null, invoice.id);
  const paymentAction = recordInvoicePaymentFromForm.bind(null, invoice.id);
  const sendAction = markDraftInvoiceSentFromForm.bind(null, invoice.id);
  const voidAction = voidInvoiceFromForm.bind(null, invoice.id);
  const currency = invoice.currency || "IDR";
  const storedStatus = normalizeInvoiceStatus(invoice.status);
  const effectiveStatus = invoiceEffectiveStatus({ ...invoice, paymentState: paymentSummary.paymentState });
  const invoiceDisplayNumber = invoice.invoiceNumber || "DRAFT";
  const confirmationIdentifier = invoice.invoiceNumber || invoice.id;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-blue-300">{invoiceDisplayNumber}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{invoice.customerNameSnapshot || "Invoice"}</h1>
          <p className="mt-1 text-slate-500">
            {invoiceStatusLabel(effectiveStatus)} invoice snapshot. Later shipment edits do not recalculate these totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {storedStatus !== "draft" ? (
            <>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-all duration-200 hover:bg-slate-700 active:scale-[0.98]"
                href={`/invoices/${invoice.id}/pdf`}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
                href={`/invoices/${invoice.id}/pdf?disposition=inline`}
                rel="noreferrer"
                target="_blank"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </a>
            </>
          ) : null}
          <Link href="/invoices"><Button variant="secondary">Back</Button></Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="border-b border-white/5 p-5">
            <h2 className="text-lg font-semibold">Line items</h2>
          </div>
          <div className="overflow-x-auto">
            {invoice.formatVersion >= 2 ? (
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="bg-[#15151f] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Shipment details</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Unit rate</th><th className="px-4 py-3 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lines.map((line, index) => {
                    const billingBasis = invoiceLineBillingBasis(line);
                    const rate = billingBasis === "per_kg" ? line.pricePerKg : line.flatAmount ?? line.lineTotal;
                    const detailParts = [
                      [line.origin, line.destination].filter(Boolean).join(" - "),
                      line.shipmentDate,
                      line.flightNumber,
                      line.pieces ? `${line.pieces} pcs` : "",
                    ].filter(Boolean);
                    return (
                      <tr key={line.id}>
                        <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 font-mono text-blue-200">{invoiceLineReference(line)}</td>
                        <td className="px-4 py-3 text-slate-400">{detailParts.join(" / ") || "-"}</td>
                        <td className="px-4 py-3">{invoiceLineService(line)}</td>
                        <td className="px-4 py-3">{billingBasis === "per_kg" ? `${line.chargeableWeight || "-"} kg` : "1 service"}</td>
                        <td className="px-4 py-3">{currency} {formatCurrencyAmount(rate, currency)}{billingBasis === "per_kg" ? "/kg" : "/service"}</td>
                        <td className="px-4 py-3 text-right font-semibold">{currency} {formatCurrencyAmount(line.lineTotal, currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-[#15151f] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <tr><th className="px-5 py-3">No</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Route / Description</th><th className="px-5 py-3">AWB</th><th className="px-5 py-3">CAW</th><th className="px-5 py-3">Price</th><th className="px-5 py-3 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lines.map((line, index) => (
                    <tr key={line.id}><td className="px-5 py-3 text-slate-500">{index + 1}</td><td className="px-5 py-3 uppercase text-slate-400">{line.lineType}</td><td className="px-5 py-3">{line.lineType === "awb" ? `${line.origin || "-"} - ${line.destination || "-"}` : line.description || "Service"}</td><td className="px-5 py-3 font-mono text-blue-200">{line.awbNumber || "-"}</td><td className="px-5 py-3">{line.chargeableWeight || "-"}</td><td className="px-5 py-3">{line.pricePerKg ? `${currency} ${formatCurrencyAmount(line.pricePerKg, currency)}` : "-"}</td><td className="px-5 py-3 text-right font-semibold">{currency} {formatCurrencyAmount(line.lineTotal, currency)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Totals</h2>
            <div className="space-y-3 text-sm">
              <TotalRow currency={currency} label="Subtotal" value={invoice.subtotal} />
              <TotalRow currency={currency} label="Deductions" negative value={invoice.totalPengurangan} />
              <TotalRow currency={currency} label="Net amount" value={invoice.netAmount} />
              <TotalRow currency={currency} label="VAT" value={invoice.vatAmount} />
              {numberValue(invoice.depositAmount) > 0 ? <TotalRow currency={currency} label="Deposit" negative value={invoice.depositAmount} /> : null}
              <TotalRow currency={currency} label="Total due" value={invoice.amountDue} />
              <TotalRow currency={currency} label="PPh 23 withholding" negative value={invoice.pphAmount} />
              <div className="flex justify-between rounded-lg bg-blue-500/15 p-3 font-bold text-blue-100">
                <span>Net payable</span>
                <span>{currency} {formatCurrencyAmount(invoice.netPayable, currency)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-emerald-500/10 p-3 font-semibold text-emerald-100">
                <span>Paid</span>
                <span>{currency} {formatCurrencyAmount(paymentSummary.amountPaid, currency)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-amber-500/10 p-3 font-bold text-amber-100">
                <span>Outstanding</span>
                <span>{currency} {formatCurrencyAmount(paymentSummary.outstanding, currency)}</span>
              </div>
            </div>
          </Card>

          {deductions.length > 0 ? (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-semibold">Deductions</h2>
              <div className="space-y-2 text-sm">
                {deductions.map((deduction) => (
                  <div className="flex justify-between" key={deduction.id}>
                    <span>{deduction.description}</span>
                    <span>-{currency} {formatCurrencyAmount(deduction.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {payments.length > 0 ? (
            <Card className="p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Payment history</h2>
                <p className="mt-1 text-xs text-slate-500">Payment entries are append-only. Void an incorrect entry and record its replacement.</p>
              </div>
              <div className="space-y-4">
                {payments.map((payment) => {
                  const voidPaymentAction = voidInvoicePaymentFromForm.bind(null, invoice.id, payment.id);
                  return (
                    <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4" key={payment.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-slate-500">{payment.paymentDate || "Legacy date unavailable"}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{currency} {formatCurrencyAmount(payment.amount, currency)}</p>
                        </div>
                        {payment.voidedAt ? <span className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-200">Voided</span> : <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">Active</span>}
                      </div>
                      <dl className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between gap-3"><dt className="text-slate-600">Reference</dt><dd className="text-right text-slate-300">{payment.reference || "Legacy record"}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-600">Recorded by</dt><dd className="text-right text-slate-300">{payment.recordedByName || (payment.source === "legacy_backfill" ? "Legacy backfill" : "Staff account unavailable")}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-600">Recorded at</dt><dd className="text-right text-slate-300">{formatWibDateTime(payment.createdAt)}</dd></div>
                        {payment.note ? <div><dt className="text-slate-600">Note</dt><dd className="mt-1 text-slate-300">{payment.note}</dd></div> : null}
                        {payment.voidedAt ? <div className="flex justify-between gap-3"><dt className="text-rose-300">Voided by</dt><dd className="text-right text-rose-100">{payment.voidedByName || (payment.voidedBy ? `Staff #${payment.voidedBy}` : "Staff account unavailable")} / {formatWibDateTime(payment.voidedAt)}</dd></div> : null}
                        {payment.voidReason ? <div><dt className="text-rose-300">Void reason</dt><dd className="mt-1 text-rose-100">{payment.voidReason}</dd></div> : null}
                      </dl>
                      {!payment.voidedAt ? (
                        <form action={voidPaymentAction} className="mt-4 space-y-3">
                          <label className="block space-y-1">
                            <span className="text-xs font-medium text-slate-400">Void reason</span>
                            <input className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs" maxLength={500} name="reason" placeholder="Reason for voiding this payment" required />
                          </label>
                          <ConfirmSubmitButton confirmLabel="Void payment" description="The entry remains in payment history and the invoice balance is recalculated." title="Void this payment?">
                            <Ban className="h-4 w-4" />
                            Void payment
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <QrCode className="mt-1 h-5 w-5 text-blue-300" />
              <div>
                <h2 className="font-semibold">System verification</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {storedStatus === "draft"
                    ? "Draft invoices do not have public QR verification yet."
                    : `Checksum ${invoice.verificationChecksum || "not available"}`}
                </p>
              </div>
            </div>
          </Card>

          {storedStatus === "draft" ? (
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-semibold text-blue-200">Mark as sent</h2>
              <p className="mb-3 text-xs leading-5 text-slate-500">Assigns the final number and records dispatch. Email delivery remains external.</p>
              <form action={sendAction} className="space-y-3">
                <TypedConfirmSubmitButton confirmLabel="Mark sent" confirmText="MARK SENT" description="This records the invoice as sent and enables its public verification. It does not send an email." title="Record invoice dispatch?">
                  <Send className="h-4 w-4" />
                  Assign number and mark sent
                </TypedConfirmSubmitButton>
              </form>
            </Card>
          ) : null}

          {storedStatus === "sent" && paymentSummary.outstanding > 0 ? (
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-semibold text-emerald-200">Record payment</h2>
              <p className="mb-3 text-xs leading-5 text-slate-500">The outstanding balance is prefilled. Enter a lower amount for a partial payment.</p>
              <form action={paymentAction} className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">Amount ({currency})</span>
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                    defaultValue={paymentSummary.outstanding.toFixed(2)}
                    max={paymentSummary.outstanding.toFixed(2)}
                    min="0.01"
                    name="amount"
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">Payment date</span>
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                    defaultValue={today}
                    max={today}
                    name="paymentDate"
                    required
                    type="date"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">Payment reference</span>
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                    maxLength={200}
                    name="paymentReference"
                    placeholder="Bank transfer or receipt reference"
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">Note (optional)</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" maxLength={500} name="note" placeholder="Optional internal note" />
                </label>
                <ConfirmSubmitButton confirmLabel="Record payment" description="Record this payment in the append-only invoice ledger and recalculate the outstanding balance." title="Confirm payment?" variant="secondary">
                  <CheckCircle2 className="h-4 w-4" />
                  Record payment
                </ConfirmSubmitButton>
              </form>
            </Card>
          ) : null}

          {storedStatus !== "archived" && storedStatus !== "voided" ? (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-amber-200">Archive invoice</h2>
              <form action={archiveAction} className="space-y-3">
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" name="reason" placeholder="Reason" required />
                <TypedConfirmSubmitButton confirmLabel="Archive invoice" confirmText={confirmationIdentifier} description="The invoice and audit history remain retained, but the record leaves active finance queues." title="Archive invoice?" variant="secondary">
                  <Archive className="h-4 w-4" />
                  Archive
                </TypedConfirmSubmitButton>
              </form>
            </Card>
          ) : null}

          {storedStatus !== "voided" ? (
            <Card className="border-red-500/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-red-200">Void invoice</h2>
              {paymentSummary.paymentCount > 0 ? <p className="mb-3 text-xs leading-5 text-rose-200">Void every active payment before voiding this invoice.</p> : null}
              <form action={voidAction} className="space-y-3">
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                  name="reason"
                  placeholder="Reason"
                  required
                />
                <TypedConfirmSubmitButton confirmLabel="Void invoice" confirmText={confirmationIdentifier} description="Voiding releases linked billing lines but preserves the invoice, lines, and audit history." disabled={paymentSummary.paymentCount > 0} title="Void invoice?">
                  <XCircle className="h-4 w-4" />
                  Void and release lines
                </TypedConfirmSubmitButton>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TotalRow({
  currency,
  label,
  negative,
  value,
}: {
  currency: string;
  label: string;
  negative?: boolean;
  value: number | string | null;
}) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{negative && Number(value ?? 0) > 0 ? "-" : ""}{currency} {formatCurrencyAmount(value, currency)}</span>
    </div>
  );
}
