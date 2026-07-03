import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getInvoiceDetail } from "@/actions/invoices";
import { PrintButton } from "@/components/invoices/print-button";
import { getInvoiceBankAccount } from "@/lib/invoices/bank-accounts";
import { formatCurrencyAmount, numberValue, terbilangRupiah } from "@/lib/invoices/core";

type InvoicePrintPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

function displayDate(value: string | null | undefined, long = false) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: long ? "long" : "short",
    year: "numeric",
  }).replace(/ /g, long ? " " : "-");
}

function verificationBaseUrl(host: string | null, protocol: string | null) {
  if (host) return `${protocol || "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.ambaraartha.com";
}

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);
  if (!detail) notFound();

  const { deductions, invoice, lines } = detail;
  const hdrs = await headers();
  const baseUrl = verificationBaseUrl(hdrs.get("host"), hdrs.get("x-forwarded-proto"));
  const verificationUrl = invoice.verificationToken
    ? `${baseUrl}/invoice/verify/${invoice.verificationToken}`
    : baseUrl;
  const QRCode = await import("qrcode");
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 180 });
  const currency = invoice.currency || "IDR";
  const bank = getInvoiceBankAccount(invoice.bankAccount);

  return (
    <main className="min-h-screen bg-slate-200 p-6 text-black print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end print:hidden">
        <PrintButton />
      </div>

      <section className="mx-auto min-h-[297mm] w-[210mm] bg-white px-[15mm] py-[14mm] shadow-2xl print:shadow-none">
        <header className="flex items-start justify-between">
          <Image src="/logo-thermal.png" alt="PT Ambara Artha Globaltrans" className="h-auto w-[82mm]" width={4000} height={622} priority />
          <div className="text-right text-[10pt] leading-6">
            <p>Jl. Cengkareng Golf Club, RT 001/010</p>
            <p>Pajang, Benda, Kota Tangerang</p>
            <p>Banten</p>
          </div>
        </header>

        {invoice.status === "voided" ? (
          <div className="mt-6 border-2 border-red-600 py-2 text-center text-[18pt] font-bold tracking-widest text-red-600">
            VOIDED
          </div>
        ) : null}

        <h1 className="mt-10 text-center text-[15pt] font-bold underline">INVOICE</h1>

        <section className="mt-8 grid grid-cols-[1fr_72mm] gap-8">
          <div className="text-[10pt] leading-6">
            <p>BILL TO:</p>
            <p className="font-bold">{invoice.customerNameSnapshot}</p>
            {(invoice.customerAddressSnapshot || "").split("\n").filter(Boolean).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {invoice.customerNpwpSnapshot ? <p>NPWP: {invoice.customerNpwpSnapshot}</p> : null}
          </div>
          <table className="w-full border-collapse text-[10pt]">
            <tbody>
              <tr><th className="border border-black p-1 text-left">Invoice No</th><th className="border border-black p-1 text-left">Date</th></tr>
              <tr><td className="border border-black p-1">{invoice.invoiceNumber}</td><td className="border border-black p-1">{displayDate(invoice.invoiceDate)}</td></tr>
              <tr><th className="border border-black p-1 text-left">{invoice.period ? "Period" : "Payment Terms"}</th><th className="border border-black p-1 text-left">Due Date</th></tr>
              <tr><td className="border border-black bg-blue-100 p-1">{invoice.period || invoice.paymentTerms || "CASH"}</td><td className="border border-black p-1">{displayDate(invoice.dueDate)}</td></tr>
            </tbody>
          </table>
        </section>

        <table className="mt-8 w-full border-collapse text-[9.5pt]">
          <thead>
            <tr>
              <th className="border border-black p-1">No</th>
              <th className="border border-black p-1">ORI</th>
              <th className="border border-black p-1">DES</th>
              <th className="border border-black p-1">Shipment Date</th>
              <th className="border border-black p-1">AWB No</th>
              <th className="border border-black p-1">Flight No</th>
              <th className="border border-black p-1">Pcs</th>
              <th className="border border-black p-1">CAW</th>
              <th className="border border-black p-1" colSpan={2}>Price</th>
              <th className="border border-black p-1" colSpan={2}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id}>
                <td className="border border-black p-1 text-center">{index + 1}</td>
                {line.lineType === "awb" ? (
                  <>
                    <td className="border border-black p-1 text-center">{line.origin || "-"}</td>
                    <td className="border border-black p-1 text-center">{line.destination || "-"}</td>
                    <td className="border border-black p-1 text-center">{displayDate(line.shipmentDate)}</td>
                    <td className="border border-black p-1">{line.awbNumber || "-"}</td>
                    <td className="border border-black p-1 text-center">{line.flightNumber || "-"}</td>
                    <td className="border border-black p-1 text-center">{line.pieces ?? "-"}</td>
                    <td className="border border-black p-1 text-right">{line.chargeableWeight || "-"}</td>
                    <td className="border border-black border-r-0 p-1">{currency === "IDR" ? "Rp" : currency}</td>
                    <td className="border border-black border-l-0 p-1 text-right">{formatCurrencyAmount(line.pricePerKg, currency)}</td>
                  </>
                ) : (
                  <>
                    <td className="border border-black p-1 italic" colSpan={7}>{line.description || "Service"}</td>
                    <td className="border border-black p-1" colSpan={2}></td>
                  </>
                )}
                <td className="border border-black border-r-0 p-1">{currency === "IDR" ? "Rp" : currency}</td>
                <td className="border border-black border-l-0 p-1 text-right">{formatCurrencyAmount(line.lineTotal, currency)}</td>
              </tr>
            ))}
            {deductions.map((deduction) => (
              <tr key={deduction.id}>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 italic" colSpan={7}>{deduction.description}</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black border-r-0 p-1">-{currency === "IDR" ? "Rp" : currency}</td>
                <td className="border border-black border-l-0 p-1 text-right">{formatCurrencyAmount(deduction.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <SummaryPrintRow currency={currency} label="Subtotal" value={invoice.subtotal} />
            {numberValue(invoice.vatAmount) > 0 ? <SummaryPrintRow currency={currency} label="VAT 1.1%" value={invoice.vatAmount} /> : null}
            <SummaryPrintRow currency={currency} label="Total Due" strong value={invoice.amountDue} />
            {numberValue(invoice.pphAmount) > 0 ? <SummaryPrintRow currency={currency} label="PPh 23 (2%)" negative value={invoice.pphAmount} /> : null}
            {numberValue(invoice.pphAmount) > 0 ? <SummaryPrintRow currency={currency} highlight label="Net Payable" strong value={invoice.netPayable} /> : null}
          </tfoot>
        </table>

        <p className="mt-6 text-[8.5pt] italic"># {currency === "IDR" ? terbilangRupiah(invoice.netPayable) : ""}</p>

        <section className="mt-11 grid grid-cols-[1fr_65mm] gap-8">
          <div className="text-[10pt] leading-6">
            <div className="grid grid-cols-[28mm_4mm_1fr] gap-y-1 font-bold">
              <span>Bank Name</span><span>:</span><span>{bank.title}</span>
              <span>SWIFT</span><span>:</span><span>{bank.swift}</span>
              <span>Branch</span><span>:</span><span>{bank.branch}</span>
              <span>Name</span><span>:</span><span>{bank.name}</span>
              <span>Account No</span><span>:</span><span>{bank.accountNo}</span>
            </div>
            <p className="mt-3">If you have any question regarding this invoice, please contact to finance@ambaraartha.com</p>
          </div>
          <div className="mx-auto flex w-[48mm] flex-col items-center text-center text-[10pt]">
            <p className="w-full leading-5">Tangerang, {displayDate(invoice.invoiceDate, true)}</p>
            <div className="mt-3 h-[36mm] w-[36mm] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Invoice verification QR" className="mx-auto h-[36mm] w-[36mm]" src={qrDataUrl} />
            </div>
            <p className="mt-3 w-full text-[8pt] font-bold leading-4">System Generated Invoice</p>
            <p className="w-full text-[7pt] leading-4">Scan to verify - no wet signature required</p>
            <p className="mt-2 w-full font-bold leading-5">FINANCE DEPARTMENT</p>
          </div>
        </section>

        <footer className="mt-24 text-[8pt] text-gray-500">Invoice No {invoice.invoiceNumber}</footer>
      </section>
    </main>
  );
}

function SummaryPrintRow({
  currency,
  highlight,
  label,
  negative,
  strong,
  value,
}: {
  currency: string;
  highlight?: boolean;
  label: string;
  negative?: boolean;
  strong?: boolean;
  value: number | string | null;
}) {
  return (
    <tr>
      <td className="border border-black p-1 text-right font-bold" colSpan={10}>{label}</td>
      <td className={`border border-black border-r-0 p-1 ${highlight ? "bg-blue-200" : ""}`}>{negative ? "-" : ""}{currency === "IDR" ? "Rp" : currency}</td>
      <td className={`border border-black border-l-0 p-1 text-right ${strong ? "font-bold" : ""} ${highlight ? "bg-blue-200" : ""}`}>{formatCurrencyAmount(value, currency)}</td>
    </tr>
  );
}
