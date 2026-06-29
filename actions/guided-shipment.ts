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
  shipmentFlightLegs,
  shipments,
  trackingEvents,
  trackingUpdates,
} from "@/lib/db/schema";
import { parseFlightLegsJson, resolveAirWaybill } from "@/lib/airlines/core";
import { formValues, type PortalActionState } from "@/lib/forms/action-state";
import { requirePortalUser } from "@/lib/portal-auth";
import {
  getShipmentServiceDefinition,
  normalizeShipmentService,
} from "@/lib/shipments/service-model";
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
import { buildCustomerVisibleTrackingEvent } from "@/lib/tracking/public-events";
import { resolveAmbaraTrackingNumber } from "@/lib/vendor-tracking/core";

export type GuidedShipmentActionState = PortalActionState & {
  duplicateWarnings?: string[];
};

const specialCargoTypes = new Set(["dangerous_goods", "battery", "fragile", "perishable"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  if (compact.startsWith("+62")) return compact;
  if (compact.startsWith("62")) return `+${compact}`;
  if (compact.startsWith("0")) return `+62${compact.slice(1)}`;
  return compact;
}

function positiveNumber(
  value: string,
  field: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    fieldErrors[field] = `${label} must be a positive number.`;
    return null;
  }
  return parsed;
}

function nonNegativeNumber(
  value: string,
  field: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors[field] = `${label} must be zero or a positive number.`;
    return null;
  }
  return parsed;
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

async function findDuplicateWarnings(input: {
  customerReference: string;
  receiverName: string;
  receiverPhone: string;
  trackingNumber: string;
}) {
  const warnings: string[] = [];

  if (input.trackingNumber && (await shipmentTrackingNumberExists(input.trackingNumber))) {
    warnings.push(`Tracking number ${input.trackingNumber} already exists.`);
  }

  if (input.customerReference) {
    const [match] = await db
      .select({ trackingNumber: shipments.trackingNumber })
      .from(shipments)
      .where(
        sql`lower(btrim(${shipments.customerReference})) = ${input.customerReference.toLowerCase()}`,
      )
      .limit(1);
    if (match) {
      warnings.push(
        `Customer reference ${input.customerReference} is already used by ${match.trackingNumber}.`,
      );
    }
  }

  if (input.receiverName && input.receiverPhone) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const [similar] = await db
      .select({ trackingNumber: shipments.trackingNumber })
      .from(shipments)
      .where(
        and(
          ilike(shipments.consigneeName, input.receiverName),
          ilike(shipments.consigneePhone, input.receiverPhone),
          gte(shipments.createdAt, start),
          lte(shipments.createdAt, end),
        ),
      )
      .limit(1);
    if (similar) {
      warnings.push(
        `A shipment for the same receiver and phone already exists today (${similar.trackingNumber}).`,
      );
    }
  }

  return warnings;
}

async function allocateCreationIds(includeCustomer: boolean, includeMawb: boolean) {
  const result = await db.execute<{
    customer_id: number | null;
    mawb_id: number | null;
    parcel_id: number;
    shipment_id: number;
  }>(sql`
    select
      case
        when ${includeCustomer}
        then nextval(pg_get_serial_sequence('customers', 'id'))::int
        else null
      end as customer_id,
      case
        when ${includeMawb}
        then nextval(pg_get_serial_sequence('mawb_documents', 'id'))::int
        else null
      end as mawb_id,
      nextval(pg_get_serial_sequence('parcels', 'id'))::int as parcel_id,
      nextval(pg_get_serial_sequence('shipments', 'id'))::int as shipment_id
  `);
  const ids = result.rows[0];
  if (!ids) throw new Error("Unable to allocate shipment identifiers.");
  return ids;
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

function parseStoredChargeLines(value: string | null | undefined): MawbChargeLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is MawbChargeLine => {
      return (
        line &&
        typeof line === "object" &&
        typeof line.code === "string" &&
        typeof line.currency === "string" &&
        typeof line.amount === "string" &&
        (line.basis === "fixed" || line.basis === "per_kg")
      );
    });
  } catch {
    return [];
  }
}

type GuidedMawbInput = {
  agentName: string;
  awbPrefix: string;
  awbSerial: string;
  carrierCode: string;
  carrierName: string;
  chargeLines: MawbChargeLine[];
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
  flightDate: string | null;
  flightNumber: string;
  handlingInformation: string | null;
  insuranceAmount: string;
  mawbNumber: string;
  natureQuantity: string | null;
  originIata: string;
  rate: string;
  routingBy1: string | null;
  routingBy2: string | null;
  routingTo1: string | null;
  routingTo2: string | null;
  shipperAddress: string;
  shipperName: string;
};

function optionalUpper(formData: FormData, field: string) {
  return text(formData, field).toUpperCase() || null;
}

function parseGuidedMawbInput(
  formData: FormData,
  fallback: {
    chargeableWeight: number;
    commodity: string;
    customerName: string;
    destinationAirportFallback: string;
    goodsDescription: string;
    receiverAddress: string;
    receiverName: string;
    shipperAddress: string;
    shipperName: string;
    weightKg: number;
  },
  fieldErrors: Record<string, string>,
): GuidedMawbInput | null {
  const normalizedMawb = normalizeMawbNumber(text(formData, "mawb"));
  if (!normalizedMawb) {
    fieldErrors.mawb = "Enter a MAWB number with a recognized airline prefix before creating a MAWB document.";
    return null;
  }

  const originIata = (text(formData, "originIata") || "CGK").toUpperCase();
  const destinationIata = text(formData, "destinationIata").toUpperCase();
  const departureAirport = resolveMawbDepartureAirport(originIata);
  const destinationAirport = resolveMawbDestinationDisplay(
    destinationIata,
    text(formData, "destinationAirport"),
  );
  if (!/^[A-Z]{3}$/.test(originIata) || !resolveAirportByIata(originIata)) {
    fieldErrors.originIata = "Departure IATA must be a known 3-letter airport code.";
  }
  if (!/^[A-Z]{3}$/.test(destinationIata)) {
    fieldErrors.destinationIata = "Destination IATA must be a 3-letter airport code.";
  }
  if (!destinationAirport) {
    fieldErrors.destinationAirport =
      "Enter the destination airport/display name when the destination IATA is not in the airport reference.";
  }

  const rate = nonNegativeNumber(text(formData, "rate") || "0", "rate", "Rate", fieldErrors);
  const chargeLines = parseMawbChargeLines(formData, fieldErrors);
  const flightDate = optionalDate(text(formData, "flightDate"), "flightDate", "Flight date", fieldErrors);
  const executedDate = optionalDate(
    text(formData, "executedDate"),
    "executedDate",
    "Execution date",
    fieldErrors,
  );

  if (!departureAirport || !destinationAirport || rate === null) return null;

  return {
    agentName: text(formData, "agentName") || "PT PLI",
    awbPrefix: normalizedMawb.prefix,
    awbSerial: normalizedMawb.awbSerial,
    carrierCode: normalizedMawb.code,
    carrierName: normalizedMawb.name,
    chargeLines: chargeLines.length > 0 ? chargeLines : defaultMawbChargeLines,
    consigneeAddress:
      text(formData, "mawbConsigneeAddress") ||
      fallback.receiverAddress ||
      fallback.destinationAirportFallback ||
      "-",
    consigneeName: text(formData, "mawbConsigneeName") || fallback.receiverName,
    currency: text(formData, "currency").toUpperCase() || "IDR",
    declaredValueForCarriage: text(formData, "declaredValueForCarriage").toUpperCase() || "NVD",
    declaredValueForCustoms: text(formData, "declaredValueForCustoms").toUpperCase() || "NCV",
    departureAirport,
    destinationAirport,
    destinationIata,
    executedDate,
    executedPlace: text(formData, "executedPlace").toUpperCase() || originIata,
    flightDate,
    flightNumber: text(formData, "flightNumber").toUpperCase() || "TBA",
    handlingInformation: text(formData, "handlingInformation") || null,
    insuranceAmount: text(formData, "insuranceAmount").toUpperCase() || "NIL",
    mawbNumber: normalizedMawb.mawbNumber,
    natureQuantity: text(formData, "natureQuantity") || null,
    originIata,
    rate: String(rate),
    routingBy1: optionalUpper(formData, "routingBy1"),
    routingBy2: optionalUpper(formData, "routingBy2"),
    routingTo1: optionalUpper(formData, "routingTo1"),
    routingTo2: optionalUpper(formData, "routingTo2"),
    shipperAddress:
      text(formData, "mawbShipperAddress") ||
      fallback.shipperAddress ||
      fallback.destinationAirportFallback ||
      "-",
    shipperName: text(formData, "mawbShipperName") || fallback.shipperName || fallback.customerName || "-",
  };
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "23505" || candidate.message?.includes("duplicate key") === true;
}

export async function createGuidedShipment(
  _previousState: GuidedShipmentActionState,
  formData: FormData,
): Promise<GuidedShipmentActionState> {
  const user = await requirePortalUser();
  const values = formValues(formData);
  const fieldErrors: Record<string, string> = {};
  const customerMode = text(formData, "customerMode") || "existing";
  const serviceType = normalizeShipmentService(
    required(formData, "serviceType", "Service type", fieldErrors),
  );
  const service = getShipmentServiceDefinition(serviceType);
  const origin = required(formData, "origin", "Origin city", fieldErrors);
  const destination = required(formData, "destination", "Route destination", fieldErrors);
  const receiverName = required(
    formData,
    "receiverName",
    service?.doorDelivery ? "Receiver name" : "Consignee name",
    fieldErrors,
  );
  const receiverPhone = normalizePhone(text(formData, "receiverPhone"));
  const destinationCity = service?.doorDelivery
    ? required(formData, "destinationCity", "Final delivery city", fieldErrors) || destination
    : destination;
  const receiverAddress = service?.doorDelivery
    ? required(formData, "receiverAddress", "Delivery address", fieldErrors)
    : "";
  const postalCode = service?.doorDelivery ? text(formData, "postalCode") : "";
  const commodity = required(formData, "commodity", "Commodity", fieldErrors);
  const cargoType = text(formData, "cargoType") || "general";
  const pieces = positiveNumber(text(formData, "pieces"), "pieces", "Pieces", fieldErrors);
  const weightKg = positiveNumber(
    text(formData, "weightKg"),
    "weightKg",
    "Gross weight",
    fieldErrors,
  );
  const chargeableWeight = nonNegativeNumber(
    text(formData, "chargeableWeight"),
    "chargeableWeight",
    "Chargeable weight",
    fieldErrors,
  );
  const codAmount = service?.doorDelivery
    ? nonNegativeNumber(text(formData, "codAmount"), "codAmount", "COD amount", fieldErrors)
    : null;
  const idempotencyKey = required(
    formData,
    "idempotencyKey",
    "Submission identifier",
    fieldErrors,
  );
  const awbInput = required(formData, "mawb", "Airline AWB number", fieldErrors);
  let resolvedAwb: ReturnType<typeof resolveAirWaybill> | null = null;
  let flightLegs: ReturnType<typeof parseFlightLegsJson> = [];

  if (awbInput) {
    try {
      resolvedAwb = resolveAirWaybill(awbInput, text(formData, "awbAirlineName"));
    } catch (error) {
      fieldErrors.mawb =
        error instanceof Error ? error.message : "Enter a valid airline AWB number.";
    }
  }

  try {
    flightLegs = parseFlightLegsJson(text(formData, "flightLegsJson"));
  } catch (error) {
    fieldErrors.flightLegsJson =
      error instanceof Error ? error.message : "Enter valid flight legs.";
  }

  if (!serviceType || !service) fieldErrors.serviceType = "Select DTD, DTP, PTD, or PTP.";
  if (receiverPhone && !/^\+?\d{8,15}$/.test(receiverPhone)) {
    fieldErrors.receiverPhone = "Enter a valid phone number with 8 to 15 digits.";
  }
  if (postalCode && !/^\d{5}$/.test(postalCode)) {
    fieldErrors.postalCode = "Indonesian postal codes must contain 5 digits.";
  }
  if (pieces !== null && !Number.isInteger(pieces)) {
    fieldErrors.pieces = "Pieces must be a positive whole number.";
  }
  if (specialCargoTypes.has(cargoType) && text(formData, "handlingConfirmed") !== "yes") {
    fieldErrors.handlingConfirmed = "Confirm that special-handling requirements were reviewed.";
  }
  if (text(formData, "reviewConfirmed") !== "yes") {
    fieldErrors.reviewConfirmed = "Confirm that the shipment information was reviewed.";
  }

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

  if (customerMode === "existing") {
    customerId = Number.parseInt(text(formData, "customerId"), 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      fieldErrors.customerId = "Select an existing customer.";
      customerId = null;
    } else {
      const [customer] = await db
        .select({ companyName: customers.companyName, fullName: customers.fullName })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      if (!customer) {
        fieldErrors.customerId = "The selected customer is unavailable.";
        customerId = null;
      } else {
        customerName = customer.fullName || customer.companyName || `Customer #${customerId}`;
      }
    }
  } else if (customerMode === "quick") {
    const fullName = text(formData, "quickFullName");
    const companyName = text(formData, "quickCompanyName");
    const email = text(formData, "quickEmail").toLowerCase();
    const phone = normalizePhone(text(formData, "quickPhone"));
    if (!fullName && !companyName) fieldErrors.quickFullName = "Enter a contact or company name.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.quickEmail = "Enter a valid email address.";
    }
    if (phone && !/^\+?\d{8,15}$/.test(phone)) {
      fieldErrors.quickPhone = "Enter a valid phone number.";
    }
    customerName = fullName || companyName;
    quickCustomer = {
      address: text(formData, "quickAddress"),
      companyName,
      email,
      fullName,
      phone,
    };
  } else if (customerMode === "unlinked") {
    customerName = required(formData, "customerName", "Customer name", fieldErrors);
    unlinkedReason = required(
      formData,
      "unlinkedReason",
      "Reason for creating without a customer",
      fieldErrors,
    );
  } else {
    fieldErrors.customerMode = "Select how this shipment should be linked to a customer.";
  }

  const createMawbDocument = text(formData, "createMawbDocument") === "yes";
  let guidedMawb: GuidedMawbInput | null = null;
  if (createMawbDocument) {
    if (!canUseMawbWorkflow(user)) {
      fieldErrors.createMawbDocument = "Your role cannot create or link MAWB documents.";
    } else {
      guidedMawb = parseGuidedMawbInput(
        formData,
        {
          chargeableWeight: chargeableWeight ?? weightKg ?? 0,
          commodity,
          customerName,
          destinationAirportFallback: destinationCity || destination,
          goodsDescription: text(formData, "goodsDescription") || commodity,
          receiverAddress,
          receiverName,
          shipperAddress: text(formData, "shipperAddress") || quickCustomer?.address || "",
          shipperName: text(formData, "shipperName"),
          weightKg: weightKg ?? 0,
        },
        fieldErrors,
      );
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  const [existingSubmission] = await db
    .select({ trackingNumber: shipments.trackingNumber })
    .from(shipments)
    .where(eq(shipments.idempotencyKey, idempotencyKey))
    .limit(1);
  if (existingSubmission) {
    redirect(`/shipments/${encodeURIComponent(existingSubmission.trackingNumber)}/created`);
  }

  if (quickCustomer) {
    const duplicateConditions = [];
    if (quickCustomer.email) {
      duplicateConditions.push(sql`lower(btrim(${customers.email})) = ${quickCustomer.email}`);
    }
    if (quickCustomer.phone) duplicateConditions.push(eq(customers.phone, quickCustomer.phone));
    if (quickCustomer.companyName) {
      duplicateConditions.push(
        sql`lower(btrim(${customers.companyName})) = ${quickCustomer.companyName.toLowerCase()}`,
      );
    }
    if (duplicateConditions.length > 0) {
      const duplicateRows = await db
        .select({ companyName: customers.companyName, fullName: customers.fullName })
        .from(customers)
        .where(or(...duplicateConditions))
        .limit(3);
      if (duplicateRows.length > 0 && text(formData, "confirmCustomerDuplicate") !== "yes") {
        return {
          duplicateWarnings: duplicateRows.map(
            (customer) =>
              `Possible existing customer: ${customer.fullName || customer.companyName || "Unnamed customer"}.`,
          ),
          fieldErrors: {
            confirmCustomerDuplicate:
              "Review possible duplicate customers before creating a new record.",
          },
          values,
        };
      }
    }
  }

  const manualTracking = text(formData, "trackingNumber").toUpperCase();
  const duplicateWarnings = await findDuplicateWarnings({
    customerReference: text(formData, "customerReference"),
    receiverName,
    receiverPhone,
    trackingNumber: manualTracking,
  });
  if (duplicateWarnings.length > 0 && text(formData, "confirmDuplicates") !== "yes") {
    return {
      duplicateWarnings,
      fieldErrors: {
        confirmDuplicates: "Review and acknowledge the possible duplicate shipment.",
      },
      values,
    };
  }

  let trackingNumber = "";
  try {
    trackingNumber = (
      await resolveAmbaraTrackingNumber(manualTracking, shipmentTrackingNumberExists)
    ).trackingNumber;
  } catch (error) {
    return {
      fieldErrors: {
        trackingNumber: error instanceof Error ? error.message : "Invalid tracking number.",
      },
      values,
    };
  }

  const [existingMawb] = guidedMawb
    ? await db
        .select({
          id: mawbDocuments.id,
          otherChargesJson: mawbDocuments.otherChargesJson,
          rate: mawbDocuments.rate,
        })
        .from(mawbDocuments)
        .where(eq(mawbDocuments.mawbNumber, guidedMawb.mawbNumber))
        .limit(1)
    : [];
  const ids = await allocateCreationIds(Boolean(quickCustomer), Boolean(guidedMawb && !existingMawb));
  if (quickCustomer) {
    if (!ids.customer_id) {
      return { formError: "Unable to allocate a customer identifier.", values };
    }
    customerId = ids.customer_id;
  }

  const now = new Date();
  const title = text(formData, "title") || `${customerName} ${origin} to ${destination}`;
  const parcelAddress = service!.doorDelivery
    ? receiverAddress
    : `Destination port: ${destination}`;
  const storedReceiverPhone = receiverPhone || "-";
  const publicEvent = buildCustomerVisibleTrackingEvent("received", serviceType);
  const shipmentInsert = db.insert(shipments).values({
    id: ids.shipment_id,
    cargoType,
    chargeableWeight: chargeableWeight === null ? null : String(chargeableWeight),
    commodity,
    consigneeAddress: service!.doorDelivery ? receiverAddress : null,
    consigneeName: receiverName,
    consigneePhone: storedReceiverPhone,
    createdAt: now,
    createdBy: user.email,
    createdByStaff: user.id,
    customerId,
    customerName,
    customerReference: text(formData, "customerReference") || null,
    destination,
    destinationIata: guidedMawb?.destinationIata ?? null,
    goodsDescription: text(formData, "goodsDescription") || null,
    idempotencyKey,
    internalTrackingNo: trackingNumber,
    mawb: resolvedAwb!.canonicalNumber,
    awbAirlineName: resolvedAwb!.airlineName,
    awbAirlinePrefix: resolvedAwb!.prefix,
    awbAirlineUnresolved: resolvedAwb!.airlineUnresolved,
    origin,
    originIata: guidedMawb?.originIata ?? null,
    serviceType,
    shipperAddress: text(formData, "shipperAddress") || null,
    shipperName: text(formData, "shipperName") || null,
    shipperPhone: normalizePhone(text(formData, "shipperPhone")) || null,
    status: "received",
    title,
    totalPcs: pieces,
    trackingNumber,
    unlinkedReason,
    updatedAt: now,
    updatedByStaff: user.id,
    weightKg: String(weightKg),
  });
  const parcelInsert = db.insert(parcels).values({
    id: ids.parcel_id,
    ambaraParcelId: `${trackingNumber}-001`,
    codAmount: codAmount === null ? null : String(codAmount),
    commodity,
    createdAt: now,
    currentStatus: "DRAFT",
    deliveryInstruction: service!.doorDelivery
      ? text(formData, "deliveryInstruction") || null
      : null,
    destinationCity,
    parcelNumber: 1,
    pieces: pieces ?? 1,
    postalCode: postalCode || null,
    receiverAddress: parcelAddress,
    receiverName,
    receiverPhone: storedReceiverPhone,
    serviceType,
    shipmentId: ids.shipment_id,
    updatedAt: now,
    weight: String(weightKg ?? 0),
  });
  const eventInsert = db.insert(trackingEvents).values({
    createdAt: now,
    createdBy: user.id,
    eventTime: now,
    internalNote: text(formData, "internalNote") || null,
    label: publicEvent.label,
    location: origin,
    parcelId: ids.parcel_id,
    publicDescription: publicEvent.publicDescription,
    description: publicEvent.publicDescription,
    shipmentId: ids.shipment_id,
    source: "single_shipment_input",
    state: "done",
    status: publicEvent.status,
    statusCode: publicEvent.statusCode,
    visibleToCustomer: true,
  });
  const updateInsert = db.insert(trackingUpdates).values({
    description: publicEvent.publicDescription,
    location: origin,
    shipmentId: ids.shipment_id,
    status: publicEvent.status,
    timestamp: now,
  });
  const auditInsert = db.insert(portalAuditLogs).values({
    action: "shipment.created",
    entityId: String(ids.shipment_id),
    entityType: "shipment",
    metadataJson: JSON.stringify({
      customerMode,
      duplicateWarningsAcknowledged: duplicateWarnings.length,
      flightLegCount: flightLegs.length,
      serviceType,
      trackingNumber,
    }),
    performedBy: user.id,
    reason: unlinkedReason,
    createdAt: now,
  });
  const uxInsert = db.insert(portalUxEvents).values({
    category: customerMode,
    eventName: "shipment_created",
    route: "shipments_new",
    userId: user.id,
    createdAt: now,
  });

  const flightInserts = flightLegs.map((leg, index) =>
    db.insert(shipmentFlightLegs).values({
      airlineDesignator: leg.airlineDesignator,
      airlineName: leg.airlineName,
      airlineUnresolved: leg.airlineUnresolved,
      createdAt: now,
      flightNumber: leg.flightNumber,
      operationalSuffix: leg.operationalSuffix || null,
      sequence: index + 1,
      shipmentId: ids.shipment_id,
      updatedAt: now,
    }),
  );

  try {
    const queries: BatchItem<"pg">[] = [
      shipmentInsert,
      parcelInsert,
      ...flightInserts,
      eventInsert,
      updateInsert,
      auditInsert,
      uxInsert,
    ];
    if (quickCustomer) {
      const customerInsert = db.insert(customers).values({
        id: ids.customer_id!,
        address: quickCustomer.address || null,
        companyName: quickCustomer.companyName || null,
        country: "Indonesia",
        countryCode: "ID",
        email: quickCustomer.email || null,
        fullName: quickCustomer.fullName || null,
        phone: quickCustomer.phone || null,
        type: "b2b",
        createdAt: now,
        updatedAt: now,
      });
      queries.unshift(customerInsert);
    }
    if (guidedMawb) {
      const currentShipmentLine = {
        chargeableWeight: chargeableWeight ?? weightKg ?? 0,
        commodity,
        goodsDescription: text(formData, "goodsDescription") || commodity,
        pieces: pieces ?? 0,
        weightKg: weightKg ?? 0,
      };
      const chargeLines = existingMawb
        ? parseStoredChargeLines(existingMawb.otherChargesJson)
        : guidedMawb.chargeLines;
      const effectiveChargeLines = chargeLines.length > 0 ? chargeLines : defaultMawbChargeLines;
      const rate = existingMawb ? String(existingMawb.rate) : guidedMawb.rate;
      let mawbDocumentId = ids.mawb_id;
      let totals = {
        chargeableWeight: currentShipmentLine.chargeableWeight,
        pieces: currentShipmentLine.pieces,
        weightKg: currentShipmentLine.weightKg,
      };
      let commodityText = currentShipmentLine.commodity;
      let goodsDescriptionText = currentShipmentLine.goodsDescription;

      if (existingMawb) {
        mawbDocumentId = existingMawb.id;
        const linkedShipments = await db
          .select({
            chargeableWeight: shipments.chargeableWeight,
            commodity: shipments.commodity,
            goodsDescription: shipments.goodsDescription,
            pieces: shipments.totalPcs,
            weightKg: shipments.weightKg,
          })
          .from(mawbShipmentLinks)
          .innerJoin(shipments, eq(shipments.id, mawbShipmentLinks.shipmentId))
          .where(eq(mawbShipmentLinks.mawbDocumentId, existingMawb.id));
        const linkedLines = [
          ...linkedShipments.map((shipment) => ({
            chargeableWeight: Number(shipment.chargeableWeight ?? shipment.weightKg ?? 0),
            commodity: shipment.commodity ?? "",
            goodsDescription: shipment.goodsDescription ?? shipment.commodity ?? "",
            pieces: Number(shipment.pieces ?? 0),
            weightKg: Number(shipment.weightKg ?? 0),
          })),
          currentShipmentLine,
        ];
        totals = linkedLines.reduce(
          (sum, line) => ({
            chargeableWeight: sum.chargeableWeight + line.chargeableWeight,
            pieces: sum.pieces + line.pieces,
            weightKg: sum.weightKg + line.weightKg,
          }),
          { chargeableWeight: 0, pieces: 0, weightKg: 0 },
        );
        commodityText = Array.from(new Set(linkedLines.map((line) => line.commodity).filter(Boolean))).join(", ");
        goodsDescriptionText = Array.from(new Set(linkedLines.map((line) => line.goodsDescription).filter(Boolean))).join("; ");
      }

      const chargeSummary = calculateMawbCharges({
        chargeableWeight: totals.chargeableWeight,
        grossWeight: totals.weightKg,
        otherChargeLines: effectiveChargeLines,
        rate,
      });

      if (existingMawb) {
        queries.push(
          db
            .update(mawbDocuments)
            .set({
              chargeableWeight: String(totals.chargeableWeight),
              commodity: commodityText || null,
              goodsDescription: goodsDescriptionText || null,
              grossWeight: String(totals.weightKg),
              otherChargesTotal: String(chargeSummary.otherChargesTotal),
              pieces: totals.pieces,
              totalPrepaid: String(chargeSummary.totalPrepaid),
              updatedAt: now,
              updatedByStaff: user.id,
              weightCharge: String(chargeSummary.weightCharge),
            })
            .where(eq(mawbDocuments.id, existingMawb.id)),
        );
      } else {
        if (!mawbDocumentId) {
          return { formError: "Unable to allocate a MAWB document identifier.", values };
        }
        queries.unshift(
          db.insert(mawbDocuments).values({
            id: mawbDocumentId,
            actionMode: "create_shipment",
            agentName: guidedMawb.agentName,
            awbPrefix: guidedMawb.awbPrefix,
            awbSerial: guidedMawb.awbSerial,
            carrierCode: guidedMawb.carrierCode,
            carrierName: guidedMawb.carrierName,
            chargeableWeight: String(totals.chargeableWeight),
            commodity: commodityText || null,
            consigneeAddress: guidedMawb.consigneeAddress,
            consigneeName: guidedMawb.consigneeName,
            createdAt: now,
            createdByStaff: user.id,
            currency: guidedMawb.currency,
            declaredValueForCarriage: guidedMawb.declaredValueForCarriage,
            declaredValueForCustoms: guidedMawb.declaredValueForCustoms,
            departureAirport: guidedMawb.departureAirport,
            destinationAirport: guidedMawb.destinationAirport,
            destinationIata: guidedMawb.destinationIata,
            executedDate: guidedMawb.executedDate,
            executedPlace: guidedMawb.executedPlace,
            flightDate: guidedMawb.flightDate,
            flightNumber: guidedMawb.flightNumber,
            goodsDescription: goodsDescriptionText || null,
            grossWeight: String(totals.weightKg),
            handlingInformation: guidedMawb.handlingInformation,
            idempotencyKey: `${idempotencyKey}:mawb`,
            insuranceAmount: guidedMawb.insuranceAmount,
            mawbNumber: guidedMawb.mawbNumber,
            natureQuantity: guidedMawb.natureQuantity,
            originIata: guidedMawb.originIata,
            otherChargesJson: JSON.stringify(effectiveChargeLines),
            otherChargesTotal: String(chargeSummary.otherChargesTotal),
            pieces: totals.pieces,
            rate,
            routingBy1: guidedMawb.routingBy1,
            routingBy2: guidedMawb.routingBy2,
            routingTo1: guidedMawb.routingTo1,
            routingTo2: guidedMawb.routingTo2,
            serviceType: serviceType!,
            shipmentContactPhone: storedReceiverPhone,
            shipmentCustomerId: customerId,
            shipmentCustomerName: customerName || null,
            shipperAddress: guidedMawb.shipperAddress,
            shipperName: guidedMawb.shipperName,
            totalPrepaid: String(chargeSummary.totalPrepaid),
            updatedAt: now,
            updatedByStaff: user.id,
            weightCharge: String(chargeSummary.weightCharge),
          }),
        );
      }

      queries.push(
        db.insert(mawbShipmentLinks).values({
          mawbDocumentId: mawbDocumentId!,
          shipmentId: ids.shipment_id,
          linkMode: existingMawb ? "link_shipment" : "create_shipment",
          copiedFieldsJson: JSON.stringify({ createdShipment: true, trackingNumber }),
          createdByStaff: user.id,
          createdAt: now,
        }),
      );
    }
    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      const [existing] = await db
        .select({ trackingNumber: shipments.trackingNumber })
        .from(shipments)
        .where(eq(shipments.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing) {
        redirect(`/shipments/${encodeURIComponent(existing.trackingNumber)}/created`);
      }
      return {
        fieldErrors: {
          trackingNumber:
            "This tracking number was created by another request. Reload and submit again.",
        },
        values,
      };
    }
    return {
      formError: "The shipment could not be created. No partial records were saved.",
      values,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/shipments");
  revalidatePath("/mawbs");
  if (customerId) revalidatePath(`/customers/${customerId}`);
  redirect(`/shipments/${encodeURIComponent(trackingNumber)}/created`);
}
