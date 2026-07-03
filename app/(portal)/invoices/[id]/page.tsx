import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Download, Printer, QrCode, XCircle } from "lucide-react";

import { archiveInvoiceFromForm, getInvoiceDetail, voidInvoiceFromForm } from "@/actions/invoices";
import { Button, Card } from "@/components/ui/core";
import { formatCurrencyAmount } from "@/lib/invoices/core";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);
  if (!detail) notFound();

  const { deductions, invoice, lines } = detail;
  const archiveAction = archiveInvoiceFromForm.bind(null, invoice.id);
  const voidAction = voidInvoiceFromForm.bind(null, invoice.id);
  const currency = invoice.currency || "IDR";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-blue-300">{invoice.invoiceNumber}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{invoice.customerNameSnapshot || "Invoice"}</h1>
          <p className="mt-1 text-slate-500">
            {invoice.status || "finalized"} invoice snapshot. Later shipment edits do not recalculate these totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/invoices/${invoice.id}/pdf`}>
            <Button className="gap-2" variant="secondary"><Download className="h-4 w-4" /> Download PDF</Button>
          </Link>
          <Link href={`/invoices/${invoice.id}/print`} target="_blank">
            <Button className="gap-2"><Printer className="h-4 w-4" /> Print</Button>
          </Link>
          <Link href="/invoices"><Button variant="secondary">Back</Button></Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="border-b border-white/5 p-5">
            <h2 className="text-lg font-semibold">Line items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-[#15151f] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-3">No</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Route / Description</th>
                  <th className="px-5 py-3">AWB</th>
                  <th className="px-5 py-3">CAW</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lines.map((line, index) => (
                  <tr key={line.id}>
                    <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-5 py-3 uppercase text-slate-400">{line.lineType}</td>
                    <td className="px-5 py-3">
                      {line.lineType === "awb"
                        ? `${line.origin || "-"} - ${line.destination || "-"}`
                        : line.description || "Service"}
                    </td>
                    <td className="px-5 py-3 font-mono text-blue-200">{line.awbNumber || "-"}</td>
                    <td className="px-5 py-3">{line.chargeableWeight || "-"}</td>
                    <td className="px-5 py-3">{line.pricePerKg ? `${currency} ${formatCurrencyAmount(line.pricePerKg, currency)}` : "-"}</td>
                    <td className="px-5 py-3 text-right font-semibold">{currency} {formatCurrencyAmount(line.lineTotal, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <TotalRow currency={currency} label="Total due" value={invoice.amountDue} />
              <TotalRow currency={currency} label="PPh 23 withholding" negative value={invoice.pphAmount} />
              <div className="flex justify-between rounded-lg bg-blue-500/15 p-3 font-bold text-blue-100">
                <span>Net payable</span>
                <span>{currency} {formatCurrencyAmount(invoice.netPayable, currency)}</span>
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

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <QrCode className="mt-1 h-5 w-5 text-blue-300" />
              <div>
                <h2 className="font-semibold">System verification</h2>
                <p className="mt-1 text-sm text-slate-500">Checksum {invoice.verificationChecksum || "not available"}</p>
              </div>
            </div>
          </Card>

          {invoice.status !== "archived" && invoice.status !== "voided" ? (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-amber-200">Archive invoice</h2>
              <form action={archiveAction} className="space-y-3">
                <input name="confirmed" type="hidden" value="archive" />
                <input className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm" name="reason" placeholder="Reason" />
                <Button className="gap-2" type="submit" variant="secondary">
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              </form>
            </Card>
          ) : null}

          {invoice.status !== "voided" ? (
            <Card className="border-red-500/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-red-200">Void invoice</h2>
              <form action={voidAction} className="space-y-3">
                <input name="confirmed" type="hidden" value="void" />
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm"
                  name="reason"
                  placeholder="Reason"
                  required
                />
                <Button className="gap-2" type="submit" variant="danger">
                  <XCircle className="h-4 w-4" />
                  Void and release lines
                </Button>
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
