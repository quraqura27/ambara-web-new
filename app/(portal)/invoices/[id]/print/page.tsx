import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getInvoiceDetail } from "@/actions/invoices";
import { PrintButton } from "@/components/invoices/print-button";
import { getInvoiceBankAccount } from "@/lib/invoices/bank-accounts";
import {
  formatCurrencyAmount,
  FULL_PAYMENT_TERMS_TEXT,
  INVOICE_QR_STAMP_ISSUER_TEXT,
  INVOICE_QR_STAMP_TITLE,
  INVOICE_QR_STAMP_VALIDITY_TEXT,
  INVOICE_QR_STAMP_VERIFY_TEXT,
  invoiceLineBillingBasis,
  invoiceLineReference,
  invoiceLineService,
  numberValue,
  normalizeInvoiceStatus,
  shouldPrintTermsOfPayment,
  terbilangRupiah,
} from "@/lib/invoices/core";

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

function formatCurrencyCell(value: number | string | null, currency: string, negative = false) {
  return `${negative ? "-" : ""}${currency === "IDR" ? "Rp" : currency} ${formatCurrencyAmount(value, currency)}`;
}

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);
  if (!detail) notFound();

  const { deductions, invoice, lines } = detail;
  const hdrs = await headers();
  const baseUrl = verificationBaseUrl(hdrs.get("host"), hdrs.get("x-forwarded-proto"));
  const storedStatus = normalizeInvoiceStatus(invoice.status);
  const verificationUrl = invoice.verificationToken
    ? `${baseUrl}/invoice/verify/${invoice.verificationToken}`
    : null;
  const qrDataUrl = verificationUrl
    ? await (await import("qrcode")).toDataURL(verificationUrl, { margin: 1, width: 180 })
    : null;
  const currency = invoice.currency || "IDR";
  const bank = getInvoiceBankAccount(invoice.bankAccount);
  const showPaymentTerms = shouldPrintTermsOfPayment(invoice);

  return (
    <main className="min-h-screen bg-slate-200 p-6 text-black print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end print:hidden">
        <PrintButton href={`/invoices/${invoice.id}/pdf?disposition=inline`} />
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
              <tr><td className="border border-black p-1">{invoice.invoiceNumber || "DRAFT"}</td><td className="border border-black p-1">{displayDate(invoice.invoiceDate)}</td></tr>
              <tr><th className="border border-black p-1 text-left">{invoice.period ? "Period" : "Payment Terms"}</th><th className="border border-black p-1 text-left">Due Date</th></tr>
              <tr><td className="border border-black bg-blue-100 p-1">{invoice.period || invoice.paymentTerms || "CASH"}</td><td className="border border-black p-1">{displayDate(invoice.dueDate)}</td></tr>
            </tbody>
          </table>
        </section>

        {invoice.formatVersion >= 2 ? (
          <table className="mt-8 w-full table-fixed border-collapse text-[8.5pt]">
            <colgroup><col className="w-[5%]" /><col className="w-[16%]" /><col className="w-[22%]" /><col className="w-[19%]" /><col className="w-[11%]" /><col className="w-[13%]" /><col className="w-[14%]" /></colgroup>
            <thead><tr><th className="border border-black p-1">No</th><th className="border border-black p-1">Reference</th><th className="border border-black p-1">Shipment Details</th><th className="border border-black p-1">Service</th><th className="border border-black p-1">Quantity</th><th className="border border-black p-1">Unit Rate</th><th className="border border-black p-1">Amount</th></tr></thead>
            <tbody>
              {lines.map((line, index) => {
                const billingBasis = invoiceLineBillingBasis(line);
                const rate = billingBasis === "per_kg" ? line.pricePerKg : line.flatAmount ?? line.lineTotal;
                const route = [line.origin, line.destination].filter(Boolean).join(" - ");
                const secondaryDetails = [line.flightNumber, line.pieces ? `${line.pieces} pcs` : ""].filter(Boolean).join(" / ");
                return (
                  <tr key={line.id}>
                    <td className="border border-black p-1 text-center">{index + 1}</td>
                    <td className="break-words border border-black p-1 font-mono">{invoiceLineReference(line)}</td>
                    <td className="border border-black p-1"><p>{[displayDate(line.shipmentDate), route].filter((value) => value && value !== "-").join(" / ") || "-"}</p>{secondaryDetails ? <p className="text-[7.5pt]">{secondaryDetails}</p> : null}</td>
                    <td className="break-words border border-black p-1">{invoiceLineService(line)}</td>
                    <td className="border border-black p-1 text-right">{billingBasis === "per_kg" ? `${line.chargeableWeight || "-"} kg` : "1 service"}</td>
                    <td className="border border-black p-1 text-right">{formatCurrencyCell(rate, currency)}{billingBasis === "per_kg" ? "/kg" : ""}</td>
                    <td className="border border-black p-1 text-right">{formatCurrencyCell(line.lineTotal, currency)}</td>
                  </tr>
                );
              })}
              {deductions.map((deduction) => <tr key={deduction.id}><td className="border border-black p-1"></td><td className="border border-black p-1 italic" colSpan={5}>{deduction.description}</td><td className="border border-black p-1 text-right">{formatCurrencyCell(deduction.amount, currency, true)}</td></tr>)}
            </tbody>
            <tfoot>
              <SummaryPrintRow currency={currency} label="Subtotal" labelColSpan={6} value={invoice.subtotal} />
              {numberValue(invoice.vatAmount) > 0 ? <SummaryPrintRow currency={currency} label="VAT 1.1%" labelColSpan={6} value={invoice.vatAmount} /> : null}
              {numberValue(invoice.depositAmount) > 0 ? <SummaryPrintRow currency={currency} label="Deposit" labelColSpan={6} negative value={invoice.depositAmount} /> : null}
              <SummaryPrintRow currency={currency} label="Total Due" labelColSpan={6} strong value={invoice.amountDue} />
              {numberValue(invoice.pphAmount) > 0 ? <SummaryPrintRow currency={currency} label="PPh 23 (2%)" labelColSpan={6} negative value={invoice.pphAmount} /> : null}
              {numberValue(invoice.pphAmount) > 0 ? <SummaryPrintRow currency={currency} highlight label="Net Payable" labelColSpan={6} strong value={invoice.netPayable} /> : null}
            </tfoot>
          </table>
        ) : (
          <table className="mt-8 w-full border-collapse text-[9.5pt]">
            <thead><tr><th className="border border-black p-1">No</th><th className="border border-black p-1">ORI</th><th className="border border-black p-1">DES</th><th className="border border-black p-1">Shipment Date</th><th className="border border-black p-1">AWB No</th><th className="border border-black p-1">Flight No</th><th className="border border-black p-1">Pcs</th><th className="border border-black p-1">CAW</th><th className="border border-black p-1">Price</th><th className="border border-black p-1">Total Amount</th></tr></thead>
            <tbody>
              {lines.map((line, index) => <tr key={line.id}><td className="border border-black p-1 text-center">{index + 1}</td>{line.lineType === "awb" ? <><td className="border border-black p-1 text-center">{line.origin || "-"}</td><td className="border border-black p-1 text-center">{line.destination || "-"}</td><td className="border border-black p-1 text-center">{displayDate(line.shipmentDate)}</td><td className="border border-black p-1">{line.awbNumber || "-"}</td><td className="border border-black p-1 text-center">{line.flightNumber || "-"}</td><td className="border border-black p-1 text-center">{line.pieces ?? "-"}</td><td className="border border-black p-1 text-right">{line.chargeableWeight || "-"}</td><td className="border border-black p-1 text-right">{formatCurrencyCell(line.pricePerKg, currency)}</td><td className="border border-black p-1 text-right">{formatCurrencyCell(line.lineTotal, currency)}</td></> : <><td className="border border-black p-1 italic" colSpan={8}>{line.description || "Service"}</td><td className="border border-black p-1 text-right">{formatCurrencyCell(line.lineTotal, currency)}</td></>}</tr>)}
              {deductions.map((deduction) => <tr key={deduction.id}><td className="border border-black p-1"></td><td className="border border-black p-1 italic" colSpan={8}>{deduction.description}</td><td className="border border-black p-1 text-right">{formatCurrencyCell(deduction.amount, currency, true)}</td></tr>)}
            </tbody>
            <tfoot>
              <SummaryPrintRow currency={currency} label="Subtotal" value={invoice.subtotal} />
              {numberValue(invoice.vatAmount) > 0 ? <SummaryPrintRow currency={currency} label="VAT 1.1%" value={invoice.vatAmount} /> : null}
              {numberValue(invoice.depositAmount) > 0 ? <SummaryPrintRow currency={currency} label="Deposit" negative value={invoice.depositAmount} /> : null}
              <SummaryPrintRow currency={currency} label="Total Due" strong value={invoice.amountDue} />
              {numberValue(invoice.pphAmount) > 0 ? <SummaryPrintRow currency={currency} label="PPh 23 (2%)" negative value={invoice.pphAmount} /> : null}
              {numberValue(invoice.pphAmount) > 0 ? <SummaryPrintRow currency={currency} highlight label="Net Payable" strong value={invoice.netPayable} /> : null}
            </tfoot>
          </table>
        )}

        <p className="mt-6 text-[8.5pt] italic"># {currency === "IDR" ? terbilangRupiah(invoice.netPayable) : ""}</p>

        {showPaymentTerms ? (
          <section className="mt-8 max-w-[165mm] text-[8pt] italic leading-4">
            <p className="font-bold">Terms of Payment:</p>
            <p>{FULL_PAYMENT_TERMS_TEXT}</p>
          </section>
        ) : null}

        <section className={`${showPaymentTerms ? "mt-8" : "mt-11"} grid grid-cols-[1fr_65mm] gap-8`}>
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
          <div className="mx-auto flex w-[62mm] max-w-full flex-col items-center text-center text-[10pt]">
            <p className="w-full leading-5">Tangerang, {displayDate(invoice.invoiceDate, true)}</p>
            {qrDataUrl ? (
              <div className="mt-3 h-[36mm] w-[36mm] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Invoice verification QR" className="mx-auto h-[36mm] w-[36mm]" src={qrDataUrl} />
              </div>
            ) : (
              <div className="mt-3 flex h-[36mm] w-[36mm] shrink-0 items-center justify-center border border-black text-[9pt] font-bold">
                DRAFT
              </div>
            )}
            <p className="mt-3 w-full text-[8pt] font-bold leading-4">
              {storedStatus === "draft" ? "Draft Invoice" : INVOICE_QR_STAMP_TITLE}
            </p>
            <p className="w-full text-[7pt] leading-4">
              {storedStatus === "draft" ? "No public verification until sent" : INVOICE_QR_STAMP_VERIFY_TEXT}
            </p>
            {storedStatus === "draft" ? null : (
              <>
                <p className="w-full text-[7pt] leading-4">{INVOICE_QR_STAMP_VALIDITY_TEXT}</p>
                <p className="mt-1 w-full text-[7pt] font-bold leading-4">{INVOICE_QR_STAMP_ISSUER_TEXT}</p>
              </>
            )}
          </div>
        </section>

        <footer className="mt-24 text-[8pt] text-gray-500">Invoice No {invoice.invoiceNumber || "DRAFT"}</footer>
      </section>
    </main>
  );
}

function SummaryPrintRow({
  currency,
  highlight,
  label,
  labelColSpan = 9,
  negative,
  strong,
  value,
}: {
  currency: string;
  highlight?: boolean;
  label: string;
  labelColSpan?: number;
  negative?: boolean;
  strong?: boolean;
  value: number | string | null;
}) {
  return (
    <tr>
      <td className="border border-black p-1 text-right font-bold" colSpan={labelColSpan}>{label}</td>
      <td className={`border border-black p-1 text-right ${strong ? "font-bold" : ""} ${highlight ? "bg-blue-200" : ""}`}>
        {formatCurrencyCell(value, currency, negative)}
      </td>
    </tr>
  );
}
