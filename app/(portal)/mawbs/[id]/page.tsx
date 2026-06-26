import Link from "next/link";
import { ArrowLeft, Download, FileText, Package } from "lucide-react";
import { notFound } from "next/navigation";

import { getMawbDetail } from "@/actions/mawbs";
import { Button, Card } from "@/components/ui/core";
import { formatMawbChargeAmount } from "@/lib/mawbs/core";

type MawbDetailPageProps = {
  params: Promise<{ id: string }>;
};

function display(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="break-words text-sm font-medium text-slate-200">{display(value)}</p>
    </div>
  );
}

export default async function MawbDetailPage({ params }: MawbDetailPageProps) {
  const { id } = await params;
  const mawbId = Number.parseInt(id, 10);
  if (!Number.isInteger(mawbId) || mawbId <= 0) notFound();

  const detail = await getMawbDetail(mawbId);
  if (!detail) notFound();
  const { document, links, otherChargeLines } = detail;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/mawbs">
            <Button aria-label="Back to MAWB documents" className="h-auto shrink-0 rounded-full p-2" variant="ghost">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="break-all font-mono text-2xl font-bold tracking-tight sm:text-3xl">{document.mawbNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">{document.carrierCode} / {document.carrierName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          <Link href={`/mawbs/${document.id}/print`} target="_blank">
            <Button className="gap-2" variant="secondary">
              <Download className="h-4 w-4" />
              Print XLSX
            </Button>
          </Link>
          <Link href={`/mawbs/new?shipment=${encodeURIComponent(links[0]?.shipmentTrackingNumber ?? "")}`}>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              New MAWB
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">MAWB Details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem label="Shipper" value={document.shipperName} />
            <DetailItem label="Consignee" value={document.consigneeName} />
            <DetailItem label="Shipper address" value={document.shipperAddress} />
            <DetailItem label="Consignee address" value={document.consigneeAddress} />
            <DetailItem label="Departure airport" value={document.departureAirport} />
            <DetailItem label="Destination airport" value={document.destinationAirport} />
            <DetailItem label="Route" value={`${document.originIata} to ${document.destinationIata}`} />
            <DetailItem label="Flight" value={document.flightNumber} />
            <DetailItem label="Flight date" value={document.flightDate} />
            <DetailItem label="Executed" value={`${display(document.executedDate)} / ${display(document.executedPlace)}`} />
            <DetailItem label="Pieces" value={document.pieces} />
            <DetailItem label="Gross weight" value={document.grossWeight} />
            <DetailItem label="Chargeable weight" value={document.chargeableWeight} />
            <DetailItem label="Commodity" value={document.commodity} />
            <DetailItem label="Goods description" value={document.goodsDescription} />
            <DetailItem label="Nature quantity" value={document.natureQuantity} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">Shipment Link</h2>
            {links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link) => (
                  <Link
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-blue-500/30"
                    href={`/shipments/${encodeURIComponent(link.shipmentTrackingNumber)}`}
                    key={link.id}
                  >
                    <Package className="h-5 w-5 text-blue-300" />
                    <div>
                      <p className="font-mono text-sm font-semibold text-blue-200">{link.shipmentTrackingNumber}</p>
                      <p className="text-xs text-slate-500">{link.linkMode.replace(/_/g, " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No shipment is linked to this MAWB.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">Charges</h2>
            <div className="space-y-3">
              <DetailItem label="Weight charge" value={formatMawbChargeAmount(document.weightCharge)} />
              <DetailItem label="Other charges" value={formatMawbChargeAmount(document.otherChargesTotal)} />
              <DetailItem label="Total prepaid" value={formatMawbChargeAmount(document.totalPrepaid)} />
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-0">
        <div className="border-b border-white/5 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Other Charge Lines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#12121a] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Currency</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {otherChargeLines.map((line, index) => (
                <tr key={`${line.code}-${index}`}>
                  <td className="px-5 py-4 font-mono text-blue-200">{line.code}</td>
                  <td className="px-5 py-4">{line.currency}</td>
                  <td className="px-5 py-4">{formatMawbChargeAmount(line.amount)}</td>
                  <td className="px-5 py-4">{line.basis === "fixed" ? "Fixed" : "Per kg"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
