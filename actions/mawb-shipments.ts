"use server";

import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  customers,
  mawbDocuments,
  mawbShipmentLinks,
  parcels,
  portalAuditLogs,
  portalUxEvents,
  shipments,
  trackingEvents,
  trackingUpdates,
} from "@/lib/db/schema";
import { formValues, type PortalActionState } from "@/lib/forms/action-state";
import {
  calculateMawbCharges,
  canUseMawbWorkflow,
  defaultMawbChargeLines,
  normalizeMawbNumber,
  parseMawbChargeLines,
  type MawbChargeLine,
} from "@/lib/mawbs/core";
import {
  resolveAirportByIata,
  resolveMawbDepartureAirport,
  resolveMawbDestinationDisplay,
} from "@/lib/airports/core";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  getShipmentServiceDefinition,
  normalizeShipmentService,
} from "@/lib/shipments/service-model";
import { buildCustomerVisibleTrackingEvent } from "@/lib/tracking/public-events";
import { buildAmbaraParcelId, resolveAmbaraTrackingNumber } from "@/lib/vendor-tracking/core";

export type MawbShipmentActionState = PortalActionState & {
  duplicateWarnings?: string[];
};

type ShipmentLineInput = {
  chargeableWeight: number;
  commodity: string;
  customerReference: string;
  destinationCity: string;
  goodsDescription: string;
  pieces: number;
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  title: string;
  weightKg: number;
};

type MawbShipmentInput = {
  chargeLines: MawbChargeLine[];
  customerMode: string;
  idempotencyKey: string;
  lineCount: number;
  lines: ShipmentLineInput[];
  mawb: {
    agentName: string;
    carrierCode: string;
    carrierName: string;
    awbPrefix: string;
    awbSerial: string;
    mawbNumber: string;
    originIata: string;
    departureAirport: string;
    destinationIata: string;
    destinationAirport: string;
    shipperName: string;
    shipperAddress: string;
    consigneeName: string;
    consigneeAddress: string;
    flightNumber: string;
    flightDate: string | null;
    executedDate: string | null;
    executedPlace: string;
    currency: string;
    rate: string;
    declaredValueForCarriage: string;
    declaredValueForCustoms: string;
    insuranceAmount: string;
    handlingInformation: string | null;
    natureQuantity: string | null;
    routingTo1: string | null;
    routingBy1: string | null;
    routingTo2: string | null;
    routingBy2: string | null;
  };
  serviceType: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function textAt(formData: FormData, key: string, index: number) {
  const value = formData.get(`${key}_${index}`);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function normalizePhone(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  if (compact.startsWith("+62")) return compact;
  if (compact.startsWith("62")) return `+${compact}`;
  if (compact.startsWith("0")) return `+62${compact.slice(1)}`;
  return compact;
}

function required(
  formData: FormData,
  field: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const value = text(formData, field);
  if (!value) fieldErrors[field] = `${label} is required.`;
  return value;
}

function positiveNumber(value: string, field: string, label: string, fieldErrors: Record<string, string>) {
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    fieldErrors[field] = `${label} must be a positive number.`;
    return 0;
  }
  return parsed;
}

function nonNegativeNumber(value: string, field: string, label: string, fieldErrors: Record<string, string>) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors[field] = `${label} must be zero or a positive number.`;
    return 0;
  }
  return parsed;
}

function optionalDate(value: string, field: string, label: string, fieldErrors: Record<string, string>) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fieldErrors[field] = `${label} must be a valid date.`;
    return null;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    fieldErrors[field] = `${label} must be a valid date.`;
    return null;
  }
  return value;
}

function parseMawbShipmentInput(formData: FormData): {
  fieldErrors: Record<string, string>;
  input: MawbShipmentInput | null;
} {
  const fieldErrors: Record<string, string> = {};
  const idempotencyKey = required(formData, "idempotencyKey", "Submission identifier", fieldErrors);
  const serviceType = normalizeShipmentService(text(formData, "serviceType")) ?? "PTP";
  const service = getShipmentServiceDefinition(serviceType);
  if (!service) fieldErrors.serviceType = "Select DTD, DTP, PTD, or PTP.";

  const normalizedMawb = normalizeMawbNumber(text(formData, "mawbNumber"));
  if (!normalizedMawb) {
    fieldErrors.mawbNumber = "Enter a recognized MAWB number with 3-digit airline prefix.";
  }

  const originIata = (text(formData, "originIata") || "CGK").toUpperCase();
  const destinationIata = text(formData, "destinationIata").toUpperCase();
  const departureAirport = resolveMawbDepartureAirport(originIata);
  const destinationAirport = resolveMawbDestinationDisplay(destinationIata);
  if (!resolveAirportByIata(originIata)) {
    fieldErrors.originIata = "Origin IATA was not found in the airport reference.";
  }
  if (!destinationIata) {
    fieldErrors.destinationIata = "Destination IATA is required.";
  } else if (!resolveAirportByIata(destinationIata)) {
    fieldErrors.destinationIata = "Destination IATA was not found in the airport reference.";
  }

  const lineCount = Math.max(1, Number.parseInt(text(formData, "shipmentLineCount") || "1", 10));
  const lines: ShipmentLineInput[] = [];
  for (let index = 0; index < lineCount; index += 1) {
    const prefix = `line ${index + 1}`;
    const receiverName = textAt(formData, "lineReceiverName", index);
    if (!receiverName) fieldErrors[`lineReceiverName_${index}`] = `Receiver/consignee is required for ${prefix}.`;
    const commodity = textAt(formData, "lineCommodity", index);
    if (!commodity) fieldErrors[`lineCommodity_${index}`] = `Commodity is required for ${prefix}.`;
    const pieces = positiveNumber(textAt(formData, "linePieces", index), `linePieces_${index}`, `Pieces for ${prefix}`, fieldErrors);
    if (!Number.isInteger(pieces)) fieldErrors[`linePieces_${index}`] = `Pieces for ${prefix} must be a whole number.`;
    const weightKg = positiveNumber(textAt(formData, "lineWeightKg", index), `lineWeightKg_${index}`, `Gross weight for ${prefix}`, fieldErrors);
    const chargeableWeight =
      nonNegativeNumber(textAt(formData, "lineChargeableWeight", index), `lineChargeableWeight_${index}`, `Chargeable weight for ${prefix}`, fieldErrors) || weightKg;
    const receiverAddress = textAt(formData, "lineReceiverAddress", index);
    if (service?.doorDelivery && !receiverAddress) {
      fieldErrors[`lineReceiverAddress_${index}`] = `Delivery address is required for ${prefix}.`;
    }
    lines.push({
      chargeableWeight,
      commodity,
      customerReference: textAt(formData, "lineCustomerReference", index),
      destinationCity: textAt(formData, "lineDestinationCity", index) || destinationAirport || destinationIata,
      goodsDescription: textAt(formData, "lineGoodsDescription", index),
      pieces,
      receiverAddress,
      receiverName,
      receiverPhone: normalizePhone(textAt(formData, "lineReceiverPhone", index)),
      title: textAt(formData, "lineTitle", index),
      weightKg,
    });
  }

  const shipperName = required(formData, "mawbShipperName", "MAWB shipper name", fieldErrors);
  const shipperAddress = required(formData, "mawbShipperAddress", "MAWB shipper address", fieldErrors);
  const consigneeName = required(formData, "mawbConsigneeName", "MAWB consignee name", fieldErrors);
  const consigneeAddress = required(formData, "mawbConsigneeAddress", "MAWB consignee address", fieldErrors);
  const flightDate = optionalDate(text(formData, "flightDate"), "flightDate", "Flight date", fieldErrors);
  const executedDate = optionalDate(text(formData, "executedDate"), "executedDate", "Execution date", fieldErrors);
  const rate = String(nonNegativeNumber(text(formData, "rate") || "0", "rate", "Rate", fieldErrors));
  const chargeLines = parseMawbChargeLines(formData, fieldErrors);

  if (text(formData, "reviewConfirmed") !== "yes") {
    fieldErrors.reviewConfirmed = "Confirm that the MAWB and shipment lines were reviewed.";
  }

  if (Object.keys(fieldErrors).length > 0 || !normalizedMawb || !departureAirport || !destinationAirport) {
    return { fieldErrors, input: null };
  }

  return {
    fieldErrors,
    input: {
      chargeLines: chargeLines.length > 0 ? chargeLines : defaultMawbChargeLines,
      customerMode: text(formData, "customerMode") || "existing",
      idempotencyKey,
      lineCount,
      lines,
      mawb: {
        agentName: text(formData, "agentName") || "PT PLI",
        awbPrefix: normalizedMawb.prefix,
        awbSerial: normalizedMawb.awbSerial,
        carrierCode: normalizedMawb.code,
        carrierName: normalizedMawb.name,
        mawbNumber: normalizedMawb.mawbNumber,
        originIata,
        departureAirport,
        destinationIata,
        destinationAirport,
        shipperName,
        shipperAddress,
        consigneeName,
        consigneeAddress,
        flightNumber: text(formData, "flightNumber").toUpperCase() || "TBA",
        flightDate,
        executedDate,
        executedPlace: text(formData, "executedPlace").toUpperCase() || originIata,
        currency: text(formData, "currency").toUpperCase() || "IDR",
        rate,
        declaredValueForCarriage: text(formData, "declaredValueForCarriage").toUpperCase() || "NVD",
        declaredValueForCustoms: text(formData, "declaredValueForCustoms").toUpperCase() || "NCV",
        insuranceAmount: text(formData, "insuranceAmount").toUpperCase() || "NIL",
        handlingInformation: optionalText(formData, "handlingInformation"),
        natureQuantity: optionalText(formData, "natureQuantity"),
        routingTo1: optionalText(formData, "routingTo1")?.toUpperCase() ?? null,
        routingBy1: optionalText(formData, "routingBy1")?.toUpperCase() ?? null,
        routingTo2: optionalText(formData, "routingTo2")?.toUpperCase() ?? null,
        routingBy2: optionalText(formData, "routingBy2")?.toUpperCase() ?? null,
      },
      serviceType,
    },
  };
}

async function shipmentTrackingNumberExists(trackingNumber: string) {
  const [existing] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(
      or(
        eq(shipments.trackingNumber, trackingNumber),
        eq(shipments.internalTrackingNo, trackingNumber),
      ),
    )
    .limit(1);
  return Boolean(existing);
}

async function createUniqueTrackingNumbers(count: number) {
  const generated = new Set<string>();
  while (generated.size < count) {
    const next = await resolveAmbaraTrackingNumber("", async (trackingNumber) =>
      generated.has(trackingNumber) || await shipmentTrackingNumberExists(trackingNumber),
    );
    generated.add(next.trackingNumber);
  }
  return Array.from(generated);
}

async function allocateIds(lineCount: number, includeCustomer: boolean) {
  const result = await db.execute<{
    customer_id: number | null;
    mawb_id: number;
    parcel_ids: number[];
    shipment_ids: number[];
  }>(sql`
    select
      case
        when ${includeCustomer}
        then nextval(pg_get_serial_sequence('customers', 'id'))::int
        else null
      end as customer_id,
      nextval(pg_get_serial_sequence('mawb_documents', 'id'))::int as mawb_id,
      array(
        select nextval(pg_get_serial_sequence('parcels', 'id'))::int
        from generate_series(1, ${lineCount})
      ) as parcel_ids,
      array(
        select nextval(pg_get_serial_sequence('shipments', 'id'))::int
        from generate_series(1, ${lineCount})
      ) as shipment_ids
  `);
  const ids = result.rows[0];
  if (!ids || ids.parcel_ids.length !== lineCount || ids.shipment_ids.length !== lineCount) {
    throw new Error("Unable to allocate shipment identifiers.");
  }
  return ids;
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "23505" || candidate.message?.includes("duplicate key") === true;
}

async function resolveCustomer(input: MawbShipmentInput, formData: FormData, fieldErrors: Record<string, string>) {
  let customerId: number | null = null;
  let customerName = "";
  let quickCustomer:
    | {
        address: string;
        companyName: string;
        email: string;
        fullName: string;
        phone: string;
      }
    | null = null;
  let unlinkedReason: string | null = null;

  if (input.customerMode === "existing") {
    customerId = Number.parseInt(text(formData, "customerId"), 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      fieldErrors.customerId = "Select an existing customer.";
      return { customerId: null, customerName, quickCustomer, unlinkedReason };
    }
    const [customer] = await db
      .select({ companyName: customers.companyName, fullName: customers.fullName })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (!customer) {
      fieldErrors.customerId = "The selected customer is unavailable.";
      return { customerId: null, customerName, quickCustomer, unlinkedReason };
    }
    customerName = customer.fullName || customer.companyName || `Customer #${customerId}`;
  } else if (input.customerMode === "quick") {
    const fullName = text(formData, "quickFullName");
    const companyName = text(formData, "quickCompanyName");
    const email = text(formData, "quickEmail").toLowerCase();
    const phone = normalizePhone(text(formData, "quickPhone"));
    if (!fullName && !companyName) fieldErrors.quickFullName = "Enter a contact or company name.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.quickEmail = "Enter a valid email address.";
    if (phone && !/^\+?\d{8,15}$/.test(phone)) fieldErrors.quickPhone = "Enter a valid phone number.";
    customerName = fullName || companyName;
    quickCustomer = {
      address: text(formData, "quickAddress"),
      companyName,
      email,
      fullName,
      phone,
    };
  } else if (input.customerMode === "unlinked") {
    customerName = required(formData, "customerName", "Customer name", fieldErrors);
    unlinkedReason = required(formData, "unlinkedReason", "Reason for creating without a customer", fieldErrors);
  } else {
    fieldErrors.customerMode = "Select how these shipments should be linked to a customer.";
  }

  return { customerId, customerName, quickCustomer, unlinkedReason };
}

async function duplicateWarnings(input: MawbShipmentInput) {
  const warnings: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  for (const [index, line] of input.lines.entries()) {
    if (line.customerReference) {
      const [match] = await db
        .select({ trackingNumber: shipments.trackingNumber })
        .from(shipments)
        .where(sql`lower(btrim(${shipments.customerReference})) = ${line.customerReference.toLowerCase()}`)
        .limit(1);
      if (match) warnings.push(`Line ${index + 1}: customer reference already used by ${match.trackingNumber}.`);
    }
    if (line.receiverName && line.receiverPhone) {
      const [similar] = await db
        .select({ trackingNumber: shipments.trackingNumber })
        .from(shipments)
        .where(
          and(
            ilike(shipments.consigneeName, line.receiverName),
            ilike(shipments.consigneePhone, line.receiverPhone),
            gte(shipments.createdAt, start),
            lte(shipments.createdAt, end),
          ),
        )
        .limit(1);
      if (similar) warnings.push(`Line ${index + 1}: same receiver and phone already exists today (${similar.trackingNumber}).`);
    }
  }

  return warnings;
}

async function customerDuplicateWarnings(quickCustomer: { email: string; fullName: string; phone: string } | null) {
  if (!quickCustomer) return [];
  const conditions = [];
  if (quickCustomer.email) conditions.push(eq(customers.email, quickCustomer.email));
  if (quickCustomer.phone) conditions.push(eq(customers.phone, quickCustomer.phone));
  if (quickCustomer.fullName) conditions.push(ilike(customers.fullName, quickCustomer.fullName));
  if (conditions.length === 0) return [];

  const matches = await db
    .select({ id: customers.id, companyName: customers.companyName, fullName: customers.fullName })
    .from(customers)
    .where(or(...conditions))
    .limit(3);

  return matches.map((match) => {
    const name = match.fullName || match.companyName || `Customer #${match.id}`;
    return `Quick-created customer may duplicate existing customer ${name}.`;
  });
}

export async function createMawbShipments(
  _previousState: MawbShipmentActionState,
  formData: FormData,
): Promise<MawbShipmentActionState> {
  const user = await requirePortalUser();
  if (!canUseMawbWorkflow(user)) redirect("/dashboard");
  const values = formValues(formData);
  const parsed = parseMawbShipmentInput(formData);
  const input = parsed.input;
  const fieldErrors = parsed.fieldErrors;
  if (!input) return { fieldErrors, values };

  const customer = await resolveCustomer(input, formData, fieldErrors);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const [existingMawb] = await db
    .select({ id: mawbDocuments.id })
    .from(mawbDocuments)
    .where(eq(mawbDocuments.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existingMawb) redirect(`/mawbs/${existingMawb.id}`);

  const warnings = [
    ...(await duplicateWarnings(input)),
    ...(await customerDuplicateWarnings(customer.quickCustomer)),
  ];
  if (warnings.length > 0 && text(formData, "confirmDuplicates") !== "yes") {
    return {
      duplicateWarnings: warnings,
      fieldErrors: { confirmDuplicates: "Review and acknowledge the possible duplicate shipments." },
      values,
    };
  }

  const now = new Date();
  const totals = input.lines.reduce(
    (sum, line) => ({
      chargeableWeight: sum.chargeableWeight + line.chargeableWeight,
      pieces: sum.pieces + line.pieces,
      weightKg: sum.weightKg + line.weightKg,
    }),
    { chargeableWeight: 0, pieces: 0, weightKg: 0 },
  );
  const chargeSummary = calculateMawbCharges({
    chargeableWeight: String(totals.chargeableWeight),
    grossWeight: String(totals.weightKg),
    otherChargeLines: input.chargeLines,
    rate: input.mawb.rate,
  });
  const ids = await allocateIds(input.lines.length, Boolean(customer.quickCustomer));
  if (customer.quickCustomer) {
    if (!ids.customer_id) return { formError: "Unable to allocate a customer identifier.", values };
    customer.customerId = ids.customer_id;
  }
  const trackingNumbers = await createUniqueTrackingNumbers(input.lines.length);
  const publicEvent = buildCustomerVisibleTrackingEvent("received", input.serviceType);
  const service = getShipmentServiceDefinition(input.serviceType)!;
  const queries: BatchItem<"pg">[] = [];

  if (customer.quickCustomer) {
    queries.push(db.insert(customers).values({
      id: ids.customer_id!,
      address: customer.quickCustomer.address || null,
      companyName: customer.quickCustomer.companyName || null,
      country: "Indonesia",
      countryCode: "ID",
      email: customer.quickCustomer.email || null,
      fullName: customer.quickCustomer.fullName || null,
      phone: customer.quickCustomer.phone || null,
      type: "b2b",
      createdAt: now,
      updatedAt: now,
    }));
  }

  queries.push(db.insert(mawbDocuments).values({
    id: ids.mawb_id,
    actionMode: "create_shipment",
    agentName: input.mawb.agentName,
    awbPrefix: input.mawb.awbPrefix,
    awbSerial: input.mawb.awbSerial,
    carrierCode: input.mawb.carrierCode,
    carrierName: input.mawb.carrierName,
    chargeableWeight: String(totals.chargeableWeight),
    commodity: Array.from(new Set(input.lines.map((line) => line.commodity).filter(Boolean))).join(", "),
    consigneeAddress: input.mawb.consigneeAddress,
    consigneeName: input.mawb.consigneeName,
    createdAt: now,
    createdByStaff: user.id,
    currency: input.mawb.currency,
    declaredValueForCarriage: input.mawb.declaredValueForCarriage,
    declaredValueForCustoms: input.mawb.declaredValueForCustoms,
    departureAirport: input.mawb.departureAirport,
    destinationAirport: input.mawb.destinationAirport,
    destinationIata: input.mawb.destinationIata,
    executedDate: input.mawb.executedDate,
    executedPlace: input.mawb.executedPlace,
    flightDate: input.mawb.flightDate,
    flightNumber: input.mawb.flightNumber,
    goodsDescription: input.lines.map((line) => line.goodsDescription || line.commodity).filter(Boolean).join("; "),
    grossWeight: String(totals.weightKg),
    handlingInformation: input.mawb.handlingInformation,
    idempotencyKey: input.idempotencyKey,
    insuranceAmount: input.mawb.insuranceAmount,
    mawbNumber: input.mawb.mawbNumber,
    natureQuantity: input.mawb.natureQuantity,
    originIata: input.mawb.originIata,
    otherChargesJson: JSON.stringify(input.chargeLines),
    otherChargesTotal: String(chargeSummary.otherChargesTotal),
    pieces: totals.pieces,
    rate: input.mawb.rate,
    routingBy1: input.mawb.routingBy1,
    routingBy2: input.mawb.routingBy2,
    routingTo1: input.mawb.routingTo1,
    routingTo2: input.mawb.routingTo2,
    serviceType: input.serviceType,
    shipmentContactPhone: customer.quickCustomer?.phone || null,
    shipmentCustomerId: customer.customerId,
    shipmentCustomerName: customer.customerName,
    shipperAddress: input.mawb.shipperAddress,
    shipperName: input.mawb.shipperName,
    totalPrepaid: String(chargeSummary.totalPrepaid),
    updatedAt: now,
    updatedByStaff: user.id,
    weightCharge: String(chargeSummary.weightCharge),
  }));

  input.lines.forEach((line, index) => {
    const trackingNumber = trackingNumbers[index]!;
    const shipmentId = ids.shipment_ids[index]!;
    const parcelId = ids.parcel_ids[index]!;
    const receiverPhone = line.receiverPhone || customer.quickCustomer?.phone || "-";
    const receiverAddress = service.doorDelivery ? line.receiverAddress : `Destination port: ${line.destinationCity || input.mawb.destinationAirport}`;
    queries.push(
      db.insert(shipments).values({
        id: shipmentId,
        awbAirlineName: input.mawb.carrierName,
        awbAirlinePrefix: input.mawb.awbPrefix,
        awbAirlineUnresolved: false,
        cargoType: "general",
        chargeableWeight: String(line.chargeableWeight),
        commodity: line.commodity,
        consigneeAddress: service.doorDelivery ? line.receiverAddress || null : null,
        consigneeName: line.receiverName,
        consigneePhone: receiverPhone,
        createdAt: now,
        createdBy: user.email,
        createdByStaff: user.id,
        customerId: customer.customerId,
        customerName: customer.customerName || null,
        customerReference: line.customerReference || null,
        destination: line.destinationCity || input.mawb.destinationAirport,
        destinationIata: input.mawb.destinationIata,
        goodsDescription: line.goodsDescription || line.commodity,
        idempotencyKey: `${input.idempotencyKey}:${index + 1}`,
        internalTrackingNo: trackingNumber,
        mawb: input.mawb.mawbNumber,
        origin: input.mawb.originIata,
        originIata: input.mawb.originIata,
        serviceType: input.serviceType,
        shipperAddress: input.mawb.shipperAddress,
        shipperName: input.mawb.shipperName,
        status: "received",
        title: line.title || `${line.receiverName} ${input.mawb.originIata} to ${input.mawb.destinationIata}`,
        totalPcs: line.pieces,
        trackingNumber,
        unlinkedReason: customer.unlinkedReason,
        updatedAt: now,
        updatedByStaff: user.id,
        weightKg: String(line.weightKg),
      }),
      db.insert(parcels).values({
        id: parcelId,
        ambaraParcelId: buildAmbaraParcelId(trackingNumber, 1),
        codAmount: null,
        commodity: line.commodity,
        createdAt: now,
        currentStatus: "DRAFT",
        deliveryInstruction: null,
        destinationCity: line.destinationCity || input.mawb.destinationAirport,
        parcelNumber: 1,
        pieces: line.pieces,
        postalCode: null,
        receiverAddress,
        receiverName: line.receiverName,
        receiverPhone,
        serviceType: input.serviceType,
        shipmentId,
        updatedAt: now,
        weight: String(line.weightKg),
      }),
      db.insert(trackingEvents).values({
        createdAt: now,
        createdBy: user.id,
        eventTime: now,
        internalNote: `Created from MAWB ${input.mawb.mawbNumber}`,
        label: publicEvent.label,
        location: input.mawb.originIata,
        parcelId,
        publicDescription: publicEvent.publicDescription,
        description: publicEvent.publicDescription,
        shipmentId,
        source: "mawb_shipment_create",
        state: "done",
        status: publicEvent.status,
        statusCode: publicEvent.statusCode,
        visibleToCustomer: true,
      }),
      db.insert(trackingUpdates).values({
        description: publicEvent.publicDescription,
        location: input.mawb.originIata,
        shipmentId,
        status: publicEvent.status,
        timestamp: now,
      }),
      db.insert(mawbShipmentLinks).values({
        mawbDocumentId: ids.mawb_id,
        shipmentId,
        linkMode: "create_shipment",
        copiedFieldsJson: JSON.stringify({ createdShipment: true, trackingNumber }),
        createdByStaff: user.id,
        createdAt: now,
      }),
    );
  });

  queries.push(
    db.insert(portalAuditLogs).values({
      action: "mawb.created_shipments",
      entityId: String(ids.mawb_id),
      entityType: "mawb_document",
      metadataJson: JSON.stringify({
        createdShipments: input.lines.length,
        duplicateWarningsAcknowledged: warnings.length,
        mawbNumber: input.mawb.mawbNumber,
        trackingNumbers,
      }),
      performedBy: user.id,
      reason: customer.unlinkedReason,
      createdAt: now,
    }),
    db.insert(portalUxEvents).values({
      category: "mawb_shipments",
      eventName: "mawb_shipments_created",
      route: "shipments_new",
      userId: user.id,
      createdAt: now,
    }),
  );

  try {
    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      const [existing] = await db
        .select({ id: mawbDocuments.id })
        .from(mawbDocuments)
        .where(eq(mawbDocuments.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing) redirect(`/mawbs/${existing.id}`);
    }
    return { formError: "The MAWB shipments could not be created. No partial records were saved.", values };
  }

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath("/mawbs");
  revalidatePath(`/mawbs/${ids.mawb_id}`);
  if (customer.customerId) revalidatePath(`/customers/${customer.customerId}`);
  redirect(`/mawbs/${ids.mawb_id}`);
}
