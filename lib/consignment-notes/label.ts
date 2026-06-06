export const CONSIGNMENT_NOTE_TERMS =
  "Shipment accepted subject to Ambara terms and conditions. / Pengiriman tunduk pada syarat dan ketentuan Ambara. Sender is responsible for shipment data, packaging, and regulatory compliance. / Pengirim bertanggung jawab atas data kiriman, kemasan, dan kepatuhan aturan.";

export const DEFAULT_PUBLIC_TRACKING_BASE_URL = "https://www.ambaraartha.com/en";

export type ConsignmentNoteShipmentSource = {
  trackingNumber?: string | null;
  internalTrackingNo?: string | null;
  title?: string | null;
  serviceType?: string | null;
  origin?: string | null;
  originIata?: string | null;
  destination?: string | null;
  destinationIata?: string | null;
  shipperName?: string | null;
  shipperAddress?: string | null;
  shipperPhone?: string | null;
  consigneeName?: string | null;
  consigneeAddress?: string | null;
  consigneePhone?: string | null;
  goodsDescription?: string | null;
  commodity?: string | null;
  totalPcs?: number | string | null;
  chargeableWeight?: number | string | null;
  createdAt?: Date | string | null;
};

export type ConsignmentNoteBaseViewModel = {
  trackingNo: string;
  title: string | null;
  serviceType: string | null;
  origin: string | null;
  originIata: string | null;
  destination: string | null;
  destinationIata: string | null;
  shipperName: string | null;
  shipperAddress: string | null;
  shipperPhone: string | null;
  consigneeName: string | null;
  consigneeAddress: string | null;
  consigneePhone: string | null;
  goodsDescription: string | null;
  commodity: string | null;
  totalPcs: number;
  chargeableWeight: string | null;
  createdDate: string | null;
  publicTrackingUrl: string;
};

export type ConsignmentNotePieceViewModel = ConsignmentNoteBaseViewModel & {
  pieceNo: number;
  pieceSequence: string;
  pieceNoPadded: string;
  totalPcsPadded: string;
  barcodeContent: string;
};

export type ConsignmentNoteBulkPrintModel = {
  requestedTrackingNos: string[];
  shipmentGroups: Array<{
    trackingNo: string;
    labels: ConsignmentNotePieceViewModel[];
  }>;
  missingTrackingNos: string[];
  labels: ConsignmentNotePieceViewModel[];
};

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function requiredTrackingNo(value: unknown) {
  const trackingNo = optionalText(value)?.toUpperCase();

  if (!trackingNo) {
    throw new Error("Consignment note requires internal_tracking_no");
  }

  return trackingNo;
}

export function normalizeConsignmentNoteTrackingNo(value: unknown) {
  return optionalText(value)?.toUpperCase() ?? "";
}

export function normalizeConsignmentNoteIds(value: string | string[] | null | undefined) {
  const rawValue = Array.isArray(value) ? value.join(",") : value ?? "";

  return rawValue
    .split(/[,\n\r]+/)
    .map(normalizeConsignmentNoteTrackingNo)
    .filter(Boolean);
}

function positivePieceCount(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function numericDisplay(value: unknown) {
  const text = optionalText(value);
  if (!text) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return text;

  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2).replace(/\.?0+$/, "");
}

function dateDisplay(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

export function buildPieceSequence(pieceNo: number, totalPcs: number) {
  const safeTotalPcs = positivePieceCount(totalPcs);
  const safePieceNo = Math.min(Math.max(1, pieceNo), safeTotalPcs);

  return {
    display: `${safePieceNo}/${safeTotalPcs}`,
    pieceNoPadded: String(safePieceNo).padStart(3, "0"),
    totalPcsPadded: String(safeTotalPcs).padStart(3, "0"),
  };
}

export function buildConsignmentNoteBarcodeContent(
  trackingNo: string,
  pieceNo: number,
  totalPcs: number,
) {
  const sequence = buildPieceSequence(pieceNo, totalPcs);
  return `${trackingNo}-${sequence.pieceNoPadded}-${sequence.totalPcsPadded}`;
}

export function buildPublicTrackingUrl(
  trackingNo: string,
  baseUrl = DEFAULT_PUBLIC_TRACKING_BASE_URL,
) {
  const url = new URL(baseUrl);
  url.searchParams.set("tracking", trackingNo);
  return url.toString();
}

export function mapShipmentToConsignmentNoteBase(
  shipment: ConsignmentNoteShipmentSource,
  options?: { publicTrackingBaseUrl?: string },
): ConsignmentNoteBaseViewModel {
  const trackingNo = requiredTrackingNo(shipment.internalTrackingNo);
  const totalPcs = positivePieceCount(shipment.totalPcs);

  return {
    trackingNo,
    title: optionalText(shipment.title),
    serviceType: optionalText(shipment.serviceType),
    origin: optionalText(shipment.origin),
    originIata: optionalText(shipment.originIata)?.toUpperCase() ?? null,
    destination: optionalText(shipment.destination),
    destinationIata: optionalText(shipment.destinationIata)?.toUpperCase() ?? null,
    shipperName: optionalText(shipment.shipperName),
    shipperAddress: optionalText(shipment.shipperAddress),
    shipperPhone: optionalText(shipment.shipperPhone),
    consigneeName: optionalText(shipment.consigneeName),
    consigneeAddress: optionalText(shipment.consigneeAddress),
    consigneePhone: optionalText(shipment.consigneePhone),
    goodsDescription: optionalText(shipment.goodsDescription),
    commodity: optionalText(shipment.commodity),
    totalPcs,
    chargeableWeight: numericDisplay(shipment.chargeableWeight),
    createdDate: dateDisplay(shipment.createdAt),
    publicTrackingUrl: buildPublicTrackingUrl(
      trackingNo,
      options?.publicTrackingBaseUrl ?? DEFAULT_PUBLIC_TRACKING_BASE_URL,
    ),
  };
}

export function expandShipmentToConsignmentNoteLabels(
  shipment: ConsignmentNoteShipmentSource,
  options?: { publicTrackingBaseUrl?: string },
) {
  const base = mapShipmentToConsignmentNoteBase(shipment, options);

  return Array.from({ length: base.totalPcs }, (_, index) => {
    const pieceNo = index + 1;
    const sequence = buildPieceSequence(pieceNo, base.totalPcs);

    return {
      ...base,
      pieceNo,
      pieceSequence: sequence.display,
      pieceNoPadded: sequence.pieceNoPadded,
      totalPcsPadded: sequence.totalPcsPadded,
      barcodeContent: buildConsignmentNoteBarcodeContent(base.trackingNo, pieceNo, base.totalPcs),
    };
  });
}

export function buildBulkConsignmentNotePrintModel(
  requestedTrackingNos: string[],
  shipments: ConsignmentNoteShipmentSource[],
  options?: { publicTrackingBaseUrl?: string },
): ConsignmentNoteBulkPrintModel {
  const normalizedRequestedTrackingNos = requestedTrackingNos
    .map(normalizeConsignmentNoteTrackingNo)
    .filter(Boolean);
  const shipmentsByTrackingNo = new Map(
    shipments.map((shipment) => [
      normalizeConsignmentNoteTrackingNo(shipment.internalTrackingNo),
      shipment,
    ]),
  );
  const shipmentGroups: ConsignmentNoteBulkPrintModel["shipmentGroups"] = [];
  const missingTrackingNos: string[] = [];

  normalizedRequestedTrackingNos.forEach((trackingNo) => {
    const shipment = shipmentsByTrackingNo.get(trackingNo);

    if (!shipment) {
      missingTrackingNos.push(trackingNo);
      return;
    }

    shipmentGroups.push({
      trackingNo,
      labels: expandShipmentToConsignmentNoteLabels(shipment, options),
    });
  });

  return {
    requestedTrackingNos: normalizedRequestedTrackingNos,
    shipmentGroups,
    missingTrackingNos,
    labels: shipmentGroups.flatMap((group) => group.labels),
  };
}
