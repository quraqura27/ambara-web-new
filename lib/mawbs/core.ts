import { findAirlinesByPrefix, resolveAirWaybill } from "../airlines/core.ts";
import { normalizePortalRole, isSuperadmin, type PortalRoleUser } from "../portal-roles.ts";
import { normalizeShipmentService } from "../shipments/service-model.ts";

export const mawbActionValues = ["create_shipment", "link_shipment", "print_only"] as const;

export type MawbActionValue = (typeof mawbActionValues)[number];

export type MawbCarrier = {
  code: string;
  name: string;
  prefix: string;
};

export const mawbCarrierByPrefix: Record<string, MawbCarrier> = {
  "126": { code: "GA", name: "GARUDA INDONESIA", prefix: "126" },
  "807": { code: "QZ", name: "AIRASIA", prefix: "807" },
  "888": { code: "QG", name: "CITILINK", prefix: "888" },
  "975": { code: "AK", name: "AIRASIA INDONESIA", prefix: "975" },
  "157": { code: "QR", name: "QATAR AIRWAYS", prefix: "157" },
};

export type NormalizedMawbNumber = MawbCarrier & {
  awbSerial: string;
  mawbNumber: string;
};

export type MawbChargeBasis = "fixed" | "per_kg";

export type MawbChargeLine = {
  amount: string;
  basis: MawbChargeBasis;
  code: string;
  currency: string;
};

export const defaultMawbChargeLines: MawbChargeLine[] = [
  { amount: "55500", basis: "fixed", code: "AWC", currency: "IDR" },
  { amount: "84", basis: "per_kg", code: "ZB", currency: "IDR" },
  { amount: "1887", basis: "per_kg", code: "MYC", currency: "IDR" },
  { amount: "533", basis: "per_kg", code: "FCC", currency: "IDR" },
];

export const mawbPrintCopies = [
  { copy: 1, sheetName: "1", weightChargeCell: "A38", otherChargesCell: "A46", totalCell: "A50" },
  { copy: 2, sheetName: "2", weightChargeCell: "A38", otherChargesCell: "A46", totalCell: "A50" },
  { copy: 3, sheetName: "3", weightChargeCell: "A38", otherChargesCell: "A46", totalCell: "A50" },
  { copy: 4, sheetName: "4", weightChargeCell: "A38", otherChargesCell: "A46", totalCell: "A50" },
  { copy: 5, sheetName: "5", weightChargeCell: "A38", otherChargesCell: "A46", totalCell: "A50" },
  { copy: 6, sheetName: "6", weightChargeCell: "A41", otherChargesCell: "A49", totalCell: "A53" },
  { copy: 7, sheetName: "7", weightChargeCell: "A36", otherChargesCell: "A44", totalCell: "A48" },
  { copy: 8, sheetName: "8", weightChargeCell: "A36", otherChargesCell: "A44", totalCell: "A48" },
  { copy: 9, sheetName: "9", weightChargeCell: "A36", otherChargesCell: "A44", totalCell: "A48" },
  { copy: 10, sheetName: "10", weightChargeCell: "A36", otherChargesCell: "A44", totalCell: "A48" },
] as const;

export type MawbFormValues = {
  actionMode: MawbActionValue;
  agentName: string;
  awbSerial: string;
  chargeableWeight: string;
  commodity: string | null;
  consigneeAddress: string;
  consigneeName: string;
  currency: string;
  declaredValueForCarriage: string;
  declaredValueForCustoms: string;
  departureAirport: string;
  destinationAirport: string;
  destinationIata: string;
  executedDate: string | null;
  executedPlace: string;
  existingShipmentTracking: string | null;
  flightDate: string | null;
  flightNumber: string;
  goodsDescription: string | null;
  grossWeight: string;
  handlingInformation: string | null;
  idempotencyKey: string;
  insuranceAmount: string;
  mawbNumber: string;
  natureQuantity: string | null;
  newCustomerAddress: string | null;
  newCustomerCompanyName: string | null;
  newCustomerEmail: string | null;
  newCustomerFullName: string | null;
  newCustomerPhone: string | null;
  originIata: string;
  otherChargeLines: MawbChargeLine[];
  overwriteExistingShipment: boolean;
  pieces: number;
  rate: string;
  serviceType: string;
  shipmentContactPhone: string | null;
  shipmentCustomerId: number | null;
  shipmentCustomerName: string | null;
  shipperAddress: string;
  shipperName: string;
  routingBy1: string | null;
  routingBy2: string | null;
  routingTo1: string | null;
  routingTo2: string | null;
};

export class MawbFormError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super("MAWB form validation failed.");
    this.name = "MawbFormError";
    this.fieldErrors = fieldErrors;
  }
}

export function normalizeMawbNumber(value: unknown): NormalizedMawbNumber | null {
  try {
    const resolved = resolveAirWaybill(value);
    const awbSerial = resolved.canonicalNumber.replace(/[^0-9]/g, "").slice(3);
    const airline = findAirlinesByPrefix(resolved.prefix).find(
      (candidate) => candidate.name.toLowerCase() === resolved.airlineName.toLowerCase(),
    ) ?? findAirlinesByPrefix(resolved.prefix)[0];

    return {
      awbSerial,
      code: airline?.iataDesignator || resolved.prefix,
      mawbNumber: resolved.canonicalNumber,
      name: resolved.airlineName,
      prefix: resolved.prefix,
    };
  } catch {
    return null;
  }
}

export function normalizeMawbAction(value: unknown): MawbActionValue {
  const normalized = String(value ?? "").trim();
  return mawbActionValues.includes(normalized as MawbActionValue)
    ? (normalized as MawbActionValue)
    : "print_only";
}

function cleanText(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  return cleanText(formData.get(key)) || null;
}

function optionalUpperText(formData: FormData, key: string) {
  return optionalText(formData, key)?.toUpperCase() ?? null;
}

function optionalPositiveId(formData: FormData, key: string) {
  const value = cleanText(formData.get(key));
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function requiredText(
  formData: FormData,
  key: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const value = cleanText(formData.get(key));
  if (!value) fieldErrors[key] = `${label} is required.`;
  return value;
}

function positiveInteger(
  formData: FormData,
  key: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const value = requiredText(formData, key, label, fieldErrors).replace(/,/g, "");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fieldErrors[key] = `${label} must be a positive whole number.`;
    return 0;
  }
  return parsed;
}

function decimalString(
  formData: FormData,
  key: string,
  label: string,
  fieldErrors: Record<string, string>,
  options: { allowZero?: boolean; required?: boolean } = { required: true },
) {
  const rawValue =
    options.required === false
      ? cleanText(formData.get(key))
      : requiredText(formData, key, label, fieldErrors);
  const value = rawValue.replace(/,/g, "");

  if (!value && options.required === false) return "0";

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && (options.allowZero ? parsed >= 0 : parsed > 0);
  if (!valid) {
    fieldErrors[key] = `${label} must be ${options.allowZero ? "zero or " : ""}a positive number.`;
    return "0";
  }

  return String(parsed);
}

function optionalDate(
  formData: FormData,
  key: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const value = cleanText(formData.get(key));
  if (!value) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fieldErrors[key] = `${label} must be a valid date.`;
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    fieldErrors[key] = `${label} must be a valid date.`;
    return null;
  }

  return value;
}

function normalizeChargeBasis(value: unknown): MawbChargeBasis {
  return String(value ?? "").trim() === "fixed" ? "fixed" : "per_kg";
}

export function parseMawbChargeLines(formData: FormData, fieldErrors: Record<string, string>) {
  const codes = formData.getAll("chargeCode");
  const currencies = formData.getAll("chargeCurrency");
  const amounts = formData.getAll("chargeAmount");
  const bases = formData.getAll("chargeBasis");
  const count = Math.max(codes.length, currencies.length, amounts.length, bases.length);
  const lines: MawbChargeLine[] = [];

  for (let index = 0; index < count; index += 1) {
    const code = cleanText(codes[index]).toUpperCase();
    const currency = (cleanText(currencies[index]).toUpperCase() || "IDR").slice(0, 3);
    const amountText = cleanText(amounts[index]).replace(/,/g, "");
    const basis = normalizeChargeBasis(bases[index]);

    if (!code && !amountText) {
      continue;
    }

    if (!/^[A-Z0-9]{2,6}$/.test(code)) {
      fieldErrors.chargeCode = "Each charge line needs a 2 to 6 character charge code.";
    }

    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount < 0) {
      fieldErrors.chargeAmount = "Each charge line amount must be zero or a positive number.";
    }

    lines.push({
      amount: Number.isFinite(amount) ? String(amount) : "0",
      basis,
      code,
      currency,
    });
  }

  if (lines.length === 0) {
    fieldErrors.chargeCode = "Add at least one other-charge line item.";
  }

  return lines;
}

export function parseMawbForm(formData: FormData): MawbFormValues {
  const fieldErrors: Record<string, string> = {};
  const normalizedMawb = normalizeMawbNumber(formData.get("mawbNumber"));
  const actionMode = normalizeMawbAction(formData.get("actionMode"));
  const serviceType = normalizeShipmentService(cleanText(formData.get("serviceType"))) ?? "PTP";
  const requestedServiceType = cleanText(formData.get("serviceType"));
  const originIataValue = cleanText(formData.get("originIata")) || cleanText(formData.get("originIATA"));
  const destinationIataValue = cleanText(formData.get("destinationIata"));
  const newCustomerPhone = optionalText(formData, "newCustomerPhone");

  if (!normalizedMawb) {
    fieldErrors.mawbNumber =
      "Enter a valid MAWB number with 3-digit prefix and 7 or 8-digit number, such as 126-91929552.";
  }

  if (requestedServiceType && !normalizeShipmentService(requestedServiceType)) {
    fieldErrors.serviceType = "Select DTD, DTP, PTD, or PTP.";
  }

  const values: MawbFormValues = {
    actionMode,
    agentName: cleanText(formData.get("agentName")) || "PT PLI",
    awbSerial: normalizedMawb?.awbSerial ?? "",
    chargeableWeight: decimalString(formData, "chargeableWeight", "Chargeable weight", fieldErrors),
    commodity: optionalText(formData, "commodity"),
    consigneeAddress: requiredText(formData, "consigneeAddress", "Consignee address", fieldErrors),
    consigneeName: requiredText(formData, "consigneeName", "Consignee name", fieldErrors),
    currency: cleanText(formData.get("currency")).toUpperCase() || "IDR",
    declaredValueForCarriage:
      cleanText(formData.get("declaredValueForCarriage")).toUpperCase() || "NVD",
    declaredValueForCustoms:
      cleanText(formData.get("declaredValueForCustoms")).toUpperCase() || "NCV",
    departureAirport:
      cleanText(formData.get("departureAirport")).toUpperCase() || originIataValue.toUpperCase(),
    destinationAirport:
      cleanText(formData.get("destinationAirport")).toUpperCase() || destinationIataValue.toUpperCase(),
    destinationIata: requiredText(formData, "destinationIata", "Destination IATA", fieldErrors).toUpperCase(),
    executedDate: optionalDate(formData, "executedDate", "Execution date", fieldErrors),
    executedPlace: cleanText(formData.get("executedPlace")).toUpperCase() || "CGK",
    existingShipmentTracking: optionalText(formData, "existingShipmentTracking"),
    flightDate: optionalDate(formData, "flightDate", "Flight date", fieldErrors),
    flightNumber: cleanText(formData.get("flightNumber")).toUpperCase() || "TBA",
    goodsDescription: optionalText(formData, "goodsDescription"),
    grossWeight: decimalString(formData, "grossWeight", "Gross weight", fieldErrors),
    handlingInformation: optionalText(formData, "handlingInformation"),
    idempotencyKey: requiredText(formData, "idempotencyKey", "Submission identifier", fieldErrors),
    insuranceAmount: cleanText(formData.get("insuranceAmount")).toUpperCase() || "NIL",
    mawbNumber: normalizedMawb?.mawbNumber ?? "",
    natureQuantity: optionalText(formData, "natureQuantity"),
    newCustomerAddress: optionalText(formData, "newCustomerAddress"),
    newCustomerCompanyName: optionalText(formData, "newCustomerCompanyName"),
    newCustomerEmail: optionalText(formData, "newCustomerEmail"),
    newCustomerFullName: optionalText(formData, "newCustomerFullName"),
    newCustomerPhone,
    originIata: originIataValue.toUpperCase(),
    otherChargeLines: parseMawbChargeLines(formData, fieldErrors),
    overwriteExistingShipment: cleanText(formData.get("overwriteExistingShipment")) === "yes",
    pieces: positiveInteger(formData, "pieces", "Pieces", fieldErrors),
    rate: decimalString(formData, "rate", "Rate", fieldErrors, { allowZero: true }),
    serviceType,
    shipmentContactPhone: optionalText(formData, "shipmentContactPhone") || newCustomerPhone,
    shipmentCustomerId: optionalPositiveId(formData, "shipmentCustomerId"),
    shipmentCustomerName: optionalText(formData, "shipmentCustomerName"),
    shipperAddress: requiredText(formData, "shipperAddress", "Shipper address", fieldErrors),
    shipperName: requiredText(formData, "shipperName", "Shipper name", fieldErrors),
    routingBy1: optionalUpperText(formData, "routingBy1"),
    routingBy2: optionalUpperText(formData, "routingBy2"),
    routingTo1: optionalUpperText(formData, "routingTo1"),
    routingTo2: optionalUpperText(formData, "routingTo2"),
  };

  if (!values.originIata) fieldErrors.originIata = "Origin IATA is required.";
  if (!values.departureAirport) fieldErrors.originIata = "Origin IATA is required.";
  if (!values.destinationAirport) fieldErrors.destinationIata = "Destination IATA is required.";
  if (values.originIata && values.originIata.length !== 3) {
    fieldErrors.originIata = "Origin IATA must be 3 letters.";
  }
  if (values.destinationIata.length !== 3) {
    fieldErrors.destinationIata = "Destination IATA must be 3 letters.";
  }
  if (actionMode === "create_shipment") {
    const hasNewCustomer = Boolean(values.newCustomerFullName || values.newCustomerCompanyName);
    if (!values.shipmentCustomerId && !hasNewCustomer) {
      fieldErrors.newCustomerName = "Select an existing customer or enter a new customer name/company.";
    }
  }
  if (actionMode === "link_shipment" && !values.existingShipmentTracking) {
    fieldErrors.existingShipmentTracking = "Existing shipment tracking number is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new MawbFormError(fieldErrors);
  }

  return values;
}

export function calculateMawbOtherCharges(
  lines: readonly MawbChargeLine[],
  grossWeight: number | string,
) {
  const weight = Number(grossWeight);
  const safeWeight = Number.isFinite(weight) ? weight : 0;

  return lines.reduce((total, line) => {
    const amount = Number(line.amount);
    if (!Number.isFinite(amount)) return total;
    return total + (line.basis === "fixed" ? amount : amount * safeWeight);
  }, 0);
}

export function calculateMawbCharges(input: {
  chargeableWeight: number | string;
  grossWeight: number | string;
  otherChargeLines: readonly MawbChargeLine[];
  rate: number | string;
}) {
  const chargeableWeight = Number(input.chargeableWeight);
  const rate = Number(input.rate);
  const otherChargesTotal = calculateMawbOtherCharges(input.otherChargeLines, input.grossWeight);
  const weightCharge =
    Number.isFinite(chargeableWeight) && Number.isFinite(rate) ? chargeableWeight * rate : 0;
  const totalPrepaid = weightCharge + otherChargesTotal;

  return {
    otherChargesTotal,
    totalPrepaid,
    weightCharge,
  };
}

export function excelSerialDate(value: string | Date | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";

  const excelEpoch = Date.UTC(1899, 11, 30);
  return String(Math.round((date.getTime() - excelEpoch) / 86400000));
}

export function numberForTemplate(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return "";
  return Number.isInteger(parsed) ? String(parsed) : String(Number(parsed.toFixed(2)));
}

export function formatMawbChargeAmount(value: number | string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  const fixed = Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  const [whole, decimal] = fixed.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimal ? `${formattedWhole},${decimal}` : formattedWhole;
}

export function buildOtherChargesText(lines: readonly MawbChargeLine[]) {
  return lines
    .map((line) => `${line.code} ${line.currency} ${formatMawbChargeAmount(line.amount)}`.trim())
    .filter(Boolean)
    .join("\n");
}

function routeCell(label: "by" | "to", value: string | null) {
  return value ? `${label}\n\n${value}` : label;
}

export function buildMawbTemplateValues(input: MawbFormValues) {
  const normalized = normalizeMawbNumber(input.mawbNumber);
  if (!normalized) throw new Error("Cannot build MAWB template without a known MAWB number.");

  const charges = calculateMawbCharges(input);
  const executedDate = input.executedDate || input.flightDate;
  const natureQuantity = input.natureQuantity || input.goodsDescription || input.commodity || "";

  return {
    A1: normalized.prefix,
    A3: input.shipperName,
    A4: input.shipperAddress,
    A8: input.consigneeName,
    A9: input.consigneeAddress,
    A14: input.agentName,
    A19: input.departureAirport,
    A20: input.destinationIata,
    A23: input.destinationAirport,
    A29: String(input.pieces),
    AA29: numberForTemplate(input.rate),
    AC52: excelSerialDate(executedDate),
    AH21: input.currency,
    AI29: numberForTemplate(charges.weightCharge),
    AN2: normalized.name,
    AS29: natureQuantity,
    AV21: input.declaredValueForCarriage,
    AO52: input.executedPlace,
    AO54: normalized.mawbNumber,
    A38: numberForTemplate(charges.weightCharge),
    A46: numberForTemplate(charges.otherChargesTotal),
    A50: numberForTemplate(charges.totalPrepaid),
    BE21: input.declaredValueForCustoms,
    D1: input.originIata,
    D21: normalized.name,
    D29: numberForTemplate(input.grossWeight),
    G1: normalized.awbSerial,
    R23: input.flightNumber,
    S29: numberForTemplate(input.chargeableWeight),
    V20: routeCell("to", input.routingTo1),
    Y20: routeCell("by", input.routingBy1),
    Z23: excelSerialDate(input.flightDate),
    AB20: routeCell("to", input.routingTo2),
    AE20: routeCell("by", input.routingBy2),
    handlingInformationText: input.handlingInformation || "",
    natureQuantityText: natureQuantity,
    otherChargesText: buildOtherChargesText(input.otherChargeLines),
  } satisfies Record<string, string>;
}

export type ShipmentCopySource = Pick<
  MawbFormValues,
  | "chargeableWeight"
  | "commodity"
  | "consigneeAddress"
  | "consigneeName"
  | "destinationAirport"
  | "destinationIata"
  | "goodsDescription"
  | "grossWeight"
  | "mawbNumber"
  | "originIata"
  | "pieces"
  | "serviceType"
  | "shipperAddress"
  | "shipperName"
>;

export type ShipmentCopyTarget = {
  chargeableWeight?: number | string | null;
  commodity?: string | null;
  consigneeAddress?: string | null;
  consigneeName?: string | null;
  destination?: string | null;
  destinationIata?: string | null;
  goodsDescription?: string | null;
  mawb?: string | null;
  origin?: string | null;
  originIata?: string | null;
  serviceType?: string | null;
  shipperAddress?: string | null;
  shipperName?: string | null;
  totalPcs?: number | string | null;
  weightKg?: number | string | null;
};

function hasValue(value: unknown) {
  return String(value ?? "").trim() !== "";
}

function setIfAllowed<T extends Record<string, unknown>>(
  updates: T,
  key: keyof T,
  currentValue: unknown,
  nextValue: unknown,
  canOverwrite: boolean,
) {
  if (!hasValue(nextValue)) return;
  if (!hasValue(currentValue) || canOverwrite) {
    updates[key] = nextValue as T[keyof T];
  }
}

export function buildMawbShipmentCopyUpdates(input: {
  mawb: ShipmentCopySource;
  target: ShipmentCopyTarget;
  user: PortalRoleUser;
  overwriteRequested?: boolean;
  updatedAt?: Date;
  updatedByStaff?: number;
}) {
  const canOverwrite = Boolean(input.overwriteRequested && isSuperadmin(input.user));
  const updates: Record<string, unknown> = {};

  setIfAllowed(updates, "mawb", input.target.mawb, input.mawb.mawbNumber, canOverwrite);
  setIfAllowed(updates, "origin", input.target.origin, input.mawb.originIata, canOverwrite);
  setIfAllowed(updates, "originIata", input.target.originIata, input.mawb.originIata, canOverwrite);
  setIfAllowed(
    updates,
    "destination",
    input.target.destination,
    input.mawb.destinationAirport || input.mawb.destinationIata,
    canOverwrite,
  );
  setIfAllowed(
    updates,
    "destinationIata",
    input.target.destinationIata,
    input.mawb.destinationIata,
    canOverwrite,
  );
  setIfAllowed(updates, "serviceType", input.target.serviceType, input.mawb.serviceType, canOverwrite);
  setIfAllowed(updates, "shipperName", input.target.shipperName, input.mawb.shipperName, canOverwrite);
  setIfAllowed(
    updates,
    "shipperAddress",
    input.target.shipperAddress,
    input.mawb.shipperAddress,
    canOverwrite,
  );
  setIfAllowed(updates, "consigneeName", input.target.consigneeName, input.mawb.consigneeName, canOverwrite);
  setIfAllowed(
    updates,
    "consigneeAddress",
    input.target.consigneeAddress,
    input.mawb.consigneeAddress,
    canOverwrite,
  );
  setIfAllowed(updates, "commodity", input.target.commodity, input.mawb.commodity, canOverwrite);
  setIfAllowed(
    updates,
    "goodsDescription",
    input.target.goodsDescription,
    input.mawb.goodsDescription,
    canOverwrite,
  );
  setIfAllowed(updates, "totalPcs", input.target.totalPcs, input.mawb.pieces, canOverwrite);
  setIfAllowed(updates, "weightKg", input.target.weightKg, input.mawb.grossWeight, canOverwrite);
  setIfAllowed(
    updates,
    "chargeableWeight",
    input.target.chargeableWeight,
    input.mawb.chargeableWeight,
    canOverwrite,
  );

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = input.updatedAt ?? new Date();
    if (input.updatedByStaff) updates.updatedByStaff = input.updatedByStaff;
  }

  return updates;
}

export function canUseMawbWorkflow(user: PortalRoleUser | null | undefined) {
  const role = normalizePortalRole(user?.role);
  return role === "operations" || role === "admin" || role === "superadmin";
}

export function canOverwriteShipmentFromMawb(user: PortalRoleUser | null | undefined) {
  return isSuperadmin(user);
}
