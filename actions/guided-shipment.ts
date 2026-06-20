"use server";

import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  customers,
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
  mawb: string;
  receiverName: string;
  receiverPhone: string;
  trackingNumber: string;
}) {
  const warnings: string[] = [];

  if (input.trackingNumber && (await shipmentTrackingNumberExists(input.trackingNumber))) {
    warnings.push(`Tracking number ${input.trackingNumber} already exists.`);
  }

  if (input.mawb) {
    const [match] = await db
      .select({ trackingNumber: shipments.trackingNumber })
      .from(shipments)
      .where(sql`upper(btrim(${shipments.mawb})) = ${input.mawb.toUpperCase()}`)
      .limit(1);
    if (match) warnings.push(`AWB ${input.mawb} is already used by ${match.trackingNumber}.`);
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

async function allocateCreationIds(includeCustomer: boolean) {
  const result = await db.execute<{
    customer_id: number | null;
    parcel_id: number;
    shipment_id: number;
  }>(sql`
    select
      case
        when ${includeCustomer}
        then nextval(pg_get_serial_sequence('customers', 'id'))::int
        else null
      end as customer_id,
      nextval(pg_get_serial_sequence('parcels', 'id'))::int as parcel_id,
      nextval(pg_get_serial_sequence('shipments', 'id'))::int as shipment_id
  `);
  const ids = result.rows[0];
  if (!ids) throw new Error("Unable to allocate shipment identifiers.");
  return ids;
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
  const receiverPhoneRaw = required(
    formData,
    "receiverPhone",
    service?.doorDelivery ? "Receiver phone" : "Consignee contact",
    fieldErrors,
  );
  const receiverPhone = normalizePhone(receiverPhoneRaw);
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
    mawb: resolvedAwb!.canonicalNumber,
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

  const ids = await allocateCreationIds(Boolean(quickCustomer));
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
  const publicEvent = buildCustomerVisibleTrackingEvent("received", serviceType);
  const shipmentInsert = db.insert(shipments).values({
    id: ids.shipment_id,
    cargoType,
    chargeableWeight: chargeableWeight === null ? null : String(chargeableWeight),
    commodity,
    consigneeAddress: service!.doorDelivery ? receiverAddress : null,
    consigneeName: receiverName,
    consigneePhone: receiverPhone,
    createdAt: now,
    createdBy: user.email,
    createdByStaff: user.id,
    customerId,
    customerName,
    customerReference: text(formData, "customerReference") || null,
    destination,
    goodsDescription: text(formData, "goodsDescription") || null,
    idempotencyKey,
    internalTrackingNo: trackingNumber,
    mawb: resolvedAwb!.canonicalNumber,
    awbAirlineName: resolvedAwb!.airlineName,
    awbAirlinePrefix: resolvedAwb!.prefix,
    awbAirlineUnresolved: resolvedAwb!.airlineUnresolved,
    origin,
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
    receiverPhone,
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
  if (customerId) revalidatePath(`/customers/${customerId}`);
  redirect(`/shipments/${encodeURIComponent(trackingNumber)}/created`);
}
