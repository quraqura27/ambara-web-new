"use server";

import { desc, eq, ilike, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  mawbDocuments,
  mawbShipmentLinks,
  parcels,
  portalAuditLogs,
  portalUxEvents,
  customers,
  shipments,
  trackingEvents,
  trackingUpdates,
} from "@/lib/db/schema";
import { formValues, type PortalActionState } from "@/lib/forms/action-state";
import {
  buildMawbShipmentCopyUpdates,
  calculateMawbCharges,
  canOverwriteShipmentFromMawb,
  canUseMawbWorkflow,
  mawbActionValues,
  type MawbActionValue,
  type MawbChargeLine,
  MawbFormError,
  type MawbFormValues,
  normalizeMawbNumber,
  parseMawbChargeLines,
  parseMawbForm,
} from "@/lib/mawbs/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { buildCustomerVisibleTrackingEvent, normalizePublicTrackingInput } from "@/lib/tracking/public-events";
import { buildAmbaraParcelId, resolveAmbaraTrackingNumber } from "@/lib/vendor-tracking/core";

export type MawbActionState = PortalActionState & {
  chargeLines?: MawbChargeLine[];
};

export type MawbCustomerOption = {
  companyName: string | null;
  fullName: string | null;
  id: number;
  phone: string | null;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function dateText(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return text(value);
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "23505" || candidate.message?.includes("duplicate key") === true;
}

async function requireMawbUser() {
  const user = await requirePortalUser();
  if (!canUseMawbWorkflow(user)) {
    redirect("/dashboard");
  }
  return user;
}

export async function getMawbCustomerOptions(): Promise<MawbCustomerOption[]> {
  await requireMawbUser();

  return db
    .select({
      companyName: customers.companyName,
      fullName: customers.fullName,
      id: customers.id,
      phone: customers.phone,
    })
    .from(customers)
    .orderBy(customers.fullName);
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

async function allocateMawbIds(includeShipment: boolean) {
  const result = await db.execute<{
    mawb_id: number;
    parcel_id: number | null;
    shipment_id: number | null;
  }>(sql`
    select
      nextval(pg_get_serial_sequence('mawb_documents', 'id'))::int as mawb_id,
      case
        when ${includeShipment}
        then nextval(pg_get_serial_sequence('shipments', 'id'))::int
        else null
      end as shipment_id,
      case
        when ${includeShipment}
        then nextval(pg_get_serial_sequence('parcels', 'id'))::int
        else null
      end as parcel_id
  `);
  const ids = result.rows[0];
  if (!ids) throw new Error("Unable to allocate MAWB identifiers.");
  return ids;
}

function normalizeActionMode(value: string | null): MawbActionValue {
  return mawbActionValues.includes(value as MawbActionValue)
    ? (value as MawbActionValue)
    : "print_only";
}

function parseStoredChargeLines(value: string | null): MawbChargeLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as MawbChargeLine[];
    return Array.isArray(parsed)
      ? parsed.filter((line) => line && typeof line.code === "string")
      : [];
  } catch {
    return [];
  }
}

function customerDisplayName(customer: {
  companyName: string | null;
  fullName: string | null;
  id: number;
}) {
  return customer.fullName || customer.companyName || `Customer #${customer.id}`;
}

function mawbDocumentInsertValues(input: MawbFormValues, userId: number, mawbId: number, now: Date) {
  const normalized = normalizeMawbNumber(input.mawbNumber);
  if (!normalized) throw new Error("Cannot save MAWB without a recognized airline prefix.");

  const charges = calculateMawbCharges(input);

  return {
    id: mawbId,
    actionMode: input.actionMode,
    agentName: input.agentName || null,
    awbPrefix: normalized.prefix,
    awbSerial: normalized.awbSerial,
    carrierCode: normalized.code,
    carrierName: normalized.name,
    chargeableWeight: input.chargeableWeight,
    commodity: input.commodity,
    consigneeAddress: input.consigneeAddress,
    consigneeName: input.consigneeName,
    createdAt: now,
    createdByStaff: userId,
    currency: input.currency,
    declaredValueForCarriage: input.declaredValueForCarriage,
    declaredValueForCustoms: input.declaredValueForCustoms,
    departureAirport: input.departureAirport,
    destinationAirport: input.destinationAirport,
    destinationIata: input.destinationIata,
    executedDate: input.executedDate,
    executedPlace: input.executedPlace,
    flightDate: input.flightDate,
    flightNumber: input.flightNumber,
    goodsDescription: input.goodsDescription,
    grossWeight: input.grossWeight,
    handlingInformation: input.handlingInformation,
    idempotencyKey: input.idempotencyKey,
    insuranceAmount: input.insuranceAmount,
    mawbNumber: normalized.mawbNumber,
    natureQuantity: input.natureQuantity,
    originIata: input.originIata,
    otherChargesJson: JSON.stringify(input.otherChargeLines),
    otherChargesTotal: String(charges.otherChargesTotal),
    pieces: input.pieces,
    rate: input.rate,
    routingBy1: input.routingBy1,
    routingBy2: input.routingBy2,
    routingTo1: input.routingTo1,
    routingTo2: input.routingTo2,
    serviceType: input.serviceType,
    shipmentContactPhone: input.shipmentContactPhone,
    shipmentCustomerId: input.shipmentCustomerId,
    shipmentCustomerName: input.shipmentCustomerName,
    shipperAddress: input.shipperAddress,
    shipperName: input.shipperName,
    totalPrepaid: String(charges.totalPrepaid),
    updatedAt: now,
    updatedByStaff: userId,
    weightCharge: String(charges.weightCharge),
  };
}

function mawbShipmentTitle(input: MawbFormValues) {
  return `${input.mawbNumber} ${input.originIata} to ${input.destinationIata}`.trim();
}

function createdShipmentValues(input: MawbFormValues, user: { email: string; id: number }, ids: {
  parcel_id: number | null;
  shipment_id: number | null;
}, trackingNumber: string, now: Date) {
  if (!ids.shipment_id || !ids.parcel_id) {
    throw new Error("Shipment identifiers were not allocated.");
  }

  const publicEvent = buildCustomerVisibleTrackingEvent("received", input.serviceType);
  const destinationForParcel = `Destination port: ${input.destinationAirport || input.destinationIata}`;
  const contactPhone = input.shipmentContactPhone || "-";

  return {
    auditInsert: db.insert(portalAuditLogs).values({
      action: "mawb.created_shipment",
      entityId: String(ids.shipment_id),
      entityType: "shipment",
      metadataJson: JSON.stringify({
        mawbNumber: input.mawbNumber,
        serviceType: input.serviceType,
        trackingNumber,
      }),
      performedBy: user.id,
      createdAt: now,
    }),
    eventInsert: db.insert(trackingEvents).values({
      createdAt: now,
      createdBy: user.id,
      eventTime: now,
      internalNote: `Created from MAWB ${input.mawbNumber}`,
      label: publicEvent.label,
      location: input.originIata,
      parcelId: ids.parcel_id,
      publicDescription: publicEvent.publicDescription,
      description: publicEvent.publicDescription,
      shipmentId: ids.shipment_id,
      source: "mawb_create_shipment",
      state: "done",
      status: publicEvent.status,
      statusCode: publicEvent.statusCode,
      visibleToCustomer: true,
    }),
    parcelInsert: db.insert(parcels).values({
      id: ids.parcel_id,
      ambaraParcelId: buildAmbaraParcelId(trackingNumber, 1),
      codAmount: null,
      commodity: input.commodity,
      createdAt: now,
      currentStatus: "DRAFT",
      deliveryInstruction: null,
      destinationCity: input.destinationAirport || input.destinationIata,
      parcelNumber: 1,
      pieces: input.pieces,
      postalCode: null,
      receiverAddress: destinationForParcel,
      receiverName: input.consigneeName,
      receiverPhone: contactPhone,
      serviceType: input.serviceType,
      shipmentId: ids.shipment_id,
      updatedAt: now,
      weight: input.grossWeight,
    }),
    publicEvent,
    shipmentInsert: db.insert(shipments).values({
      id: ids.shipment_id,
      cargoType: "general",
      chargeableWeight: input.chargeableWeight,
      commodity: input.commodity,
      consigneeAddress: input.consigneeAddress,
      consigneeName: input.consigneeName,
      consigneePhone: contactPhone,
      createdAt: now,
      createdBy: user.email,
      createdByStaff: user.id,
      customerId: input.shipmentCustomerId,
      customerName: input.shipmentCustomerName,
      destination: input.destinationAirport || input.destinationIata,
      destinationIata: input.destinationIata,
      goodsDescription: input.goodsDescription,
      internalTrackingNo: trackingNumber,
      mawb: input.mawbNumber,
      origin: input.originIata,
      originIata: input.originIata,
      serviceType: input.serviceType,
      shipperAddress: input.shipperAddress,
      shipperName: input.shipperName,
      status: "received",
      title: mawbShipmentTitle(input),
      totalPcs: input.pieces,
      trackingNumber,
      updatedAt: now,
      updatedByStaff: user.id,
      weightKg: input.grossWeight,
    }),
    updateInsert: db.insert(trackingUpdates).values({
      description: publicEvent.publicDescription,
      location: input.originIata,
      shipmentId: ids.shipment_id,
      status: publicEvent.status,
      timestamp: now,
    }),
  };
}

function revalidateMawbPaths(input: MawbFormValues, mawbId: number, trackingNumber?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/mawbs");
  revalidatePath(`/mawbs/${mawbId}`);
  revalidatePath("/shipments");
  if (trackingNumber) revalidatePath(`/shipments/${trackingNumber}`);
  if (input.shipmentCustomerId) revalidatePath(`/customers/${input.shipmentCustomerId}`);
  if (input.existingShipmentTracking) {
    revalidatePath(`/shipments/${input.existingShipmentTracking}`);
  }
}

export async function saveMawbFromForm(
  _previousState: MawbActionState,
  formData: FormData,
): Promise<MawbActionState> {
  const user = await requireMawbUser();
  const values = formValues(formData);
  let input: MawbFormValues;

  try {
    input = parseMawbForm(formData);
  } catch (error) {
    if (error instanceof MawbFormError) {
      const chargeLineErrors: Record<string, string> = {};
      return {
        chargeLines: parseMawbChargeLines(formData, chargeLineErrors),
        fieldErrors: error.fieldErrors,
        values,
      };
    }

    throw error;
  }

  if (input.overwriteExistingShipment && !canOverwriteShipmentFromMawb(user)) {
    return {
      fieldErrors: {
        overwriteExistingShipment: "Superadmin access is required to overwrite non-empty shipment fields.",
      },
      values,
    };
  }

  if (input.actionMode === "create_shipment") {
    const [customer] = await db
      .select({
        companyName: customers.companyName,
        fullName: customers.fullName,
        id: customers.id,
        phone: customers.phone,
      })
      .from(customers)
      .where(eq(customers.id, input.shipmentCustomerId ?? 0))
      .limit(1);

    if (!customer) {
      return {
        chargeLines: input.otherChargeLines,
        fieldErrors: {
          shipmentCustomerId: "Select a customer from the customer list.",
        },
        values,
      };
    }

    input = {
      ...input,
      shipmentContactPhone: input.shipmentContactPhone || customer.phone,
      shipmentCustomerName: customerDisplayName(customer),
    };
  }

  let existingSubmission: { id: number } | undefined;
  try {
    [existingSubmission] = await db
      .select({ id: mawbDocuments.id })
      .from(mawbDocuments)
      .where(eq(mawbDocuments.idempotencyKey, input.idempotencyKey))
      .limit(1);
  } catch (error) {
    console.error("MAWB save lookup failed:", error);
    return {
      chargeLines: input.otherChargeLines,
      formError:
        "The MAWB database is unavailable. Use Download test workbook for local format testing, or connect a reachable database before saving.",
      values,
    };
  }
  if (existingSubmission) {
    redirect(`/mawbs/${existingSubmission.id}`);
  }

  let linkedShipment:
    | {
        id: number;
        trackingNumber: string;
      }
    | null = null;

  if (input.actionMode === "link_shipment") {
    const trackingNumber = normalizePublicTrackingInput(input.existingShipmentTracking);
    const [existingShipment] = await db
      .select()
      .from(shipments)
      .where(
        or(
          eq(shipments.trackingNumber, trackingNumber),
          eq(shipments.internalTrackingNo, trackingNumber),
        ),
      )
      .limit(1);

    if (!existingShipment) {
      return {
        fieldErrors: { existingShipmentTracking: "Existing shipment was not found." },
        values,
      };
    }

    linkedShipment = {
      id: existingShipment.id,
      trackingNumber: existingShipment.trackingNumber,
    };
  }

  let trackingNumber = "";
  if (input.actionMode === "create_shipment") {
    try {
      trackingNumber = (
        await resolveAmbaraTrackingNumber("", shipmentTrackingNumberExists)
      ).trackingNumber;
    } catch (error) {
      return {
        formError:
          error instanceof Error ? error.message : "Tracking number could not be generated.",
        values,
      };
    }
  }

  const now = new Date();
  const ids = await allocateMawbIds(input.actionMode === "create_shipment");
  const mawbInsert = db.insert(mawbDocuments).values(mawbDocumentInsertValues(input, user.id, ids.mawb_id, now));
  const queries: BatchItem<"pg">[] = [mawbInsert];

  if (input.actionMode === "create_shipment") {
    const shipmentValues = createdShipmentValues(input, user, ids, trackingNumber, now);
    queries.push(
      shipmentValues.shipmentInsert,
      shipmentValues.parcelInsert,
      shipmentValues.eventInsert,
      shipmentValues.updateInsert,
      db.insert(mawbShipmentLinks).values({
        mawbDocumentId: ids.mawb_id,
        shipmentId: ids.shipment_id!,
        linkMode: "create_shipment",
        copiedFieldsJson: JSON.stringify({
          createdShipment: true,
          trackingNumber,
        }),
        createdByStaff: user.id,
        createdAt: now,
      }),
      shipmentValues.auditInsert,
    );
  } else if (input.actionMode === "link_shipment" && linkedShipment) {
    const [targetShipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, linkedShipment.id))
      .limit(1);
    if (!targetShipment) {
      return {
        fieldErrors: { existingShipmentTracking: "Existing shipment was not found." },
        values,
      };
    }
    const updates = buildMawbShipmentCopyUpdates({
      mawb: input,
      target: targetShipment,
      user,
      overwriteRequested: input.overwriteExistingShipment,
      updatedAt: now,
      updatedByStaff: user.id,
    });

    if (Object.keys(updates).length > 0) {
      queries.push(db.update(shipments).set(updates).where(eq(shipments.id, linkedShipment.id)));
    }

    queries.push(
      db.insert(mawbShipmentLinks).values({
        mawbDocumentId: ids.mawb_id,
        shipmentId: linkedShipment.id,
        linkMode: "link_shipment",
        copiedFieldsJson: JSON.stringify({
          fields: Object.keys(updates).filter((key) => key !== "updatedAt" && key !== "updatedByStaff"),
          overwriteRequested: input.overwriteExistingShipment,
        }),
        createdByStaff: user.id,
        createdAt: now,
      }),
      db.insert(portalAuditLogs).values({
        action: "mawb.linked_shipment",
        entityId: String(linkedShipment.id),
        entityType: "shipment",
        metadataJson: JSON.stringify({
          copiedFields: Object.keys(updates),
          mawbNumber: input.mawbNumber,
          overwriteRequested: input.overwriteExistingShipment,
        }),
        performedBy: user.id,
        createdAt: now,
      }),
    );
  } else {
    queries.push(
      db.insert(portalAuditLogs).values({
        action: "mawb.print_only_saved",
        entityId: String(ids.mawb_id),
        entityType: "mawb_document",
        metadataJson: JSON.stringify({
          mawbNumber: input.mawbNumber,
        }),
        performedBy: user.id,
        createdAt: now,
      }),
    );
  }

  queries.push(
    db.insert(portalUxEvents).values({
      category: input.actionMode,
      eventName: "mawb_saved",
      route: "mawbs_new",
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

    return {
      formError: "The MAWB document could not be saved. No partial records were saved.",
      values,
    };
  }

  revalidateMawbPaths(input, ids.mawb_id, trackingNumber || linkedShipment?.trackingNumber);
  redirect(`/mawbs/${ids.mawb_id}`);
}

export async function getMawbsPage(options: { page?: number; search?: string } = {}) {
  await requireMawbUser();
  const pageSize = 25;
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim();
  const pattern = search ? `%${search}%` : "";
  const where = search
    ? or(
        ilike(mawbDocuments.mawbNumber, pattern),
        ilike(mawbDocuments.carrierName, pattern),
        ilike(mawbDocuments.shipperName, pattern),
        ilike(mawbDocuments.consigneeName, pattern),
        ilike(shipments.trackingNumber, pattern),
        ilike(shipments.internalTrackingNo, pattern),
      )
    : undefined;

  const rows = await db
    .select({
      actionMode: mawbDocuments.actionMode,
      carrierCode: mawbDocuments.carrierCode,
      carrierName: mawbDocuments.carrierName,
      consigneeName: mawbDocuments.consigneeName,
      createdAt: mawbDocuments.createdAt,
      destinationIata: mawbDocuments.destinationIata,
      id: mawbDocuments.id,
      mawbNumber: mawbDocuments.mawbNumber,
      originIata: mawbDocuments.originIata,
      pieces: mawbDocuments.pieces,
      shipmentTrackingNumber: shipments.trackingNumber,
      shipperName: mawbDocuments.shipperName,
      totalPrepaid: mawbDocuments.totalPrepaid,
    })
    .from(mawbDocuments)
    .leftJoin(mawbShipmentLinks, eq(mawbShipmentLinks.mawbDocumentId, mawbDocuments.id))
    .leftJoin(shipments, eq(shipments.id, mawbShipmentLinks.shipmentId))
    .where(where)
    .orderBy(desc(mawbDocuments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countRows = await db
    .select({ count: sql<number>`count(distinct ${mawbDocuments.id})::int` })
    .from(mawbDocuments)
    .leftJoin(mawbShipmentLinks, eq(mawbShipmentLinks.mawbDocumentId, mawbDocuments.id))
    .leftJoin(shipments, eq(shipments.id, mawbShipmentLinks.shipmentId))
    .where(where);

  const total = countRows[0]?.count ?? 0;
  return {
    page,
    pageSize,
    rows,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMawbDetail(id: number) {
  await requireMawbUser();
  const [document] = await db
    .select()
    .from(mawbDocuments)
    .where(eq(mawbDocuments.id, id))
    .limit(1);

  if (!document) return null;

  const links = await db
    .select({
      createdAt: mawbShipmentLinks.createdAt,
      id: mawbShipmentLinks.id,
      linkMode: mawbShipmentLinks.linkMode,
      shipmentId: mawbShipmentLinks.shipmentId,
      shipmentTrackingNumber: shipments.trackingNumber,
    })
    .from(mawbShipmentLinks)
    .innerJoin(shipments, eq(shipments.id, mawbShipmentLinks.shipmentId))
    .where(eq(mawbShipmentLinks.mawbDocumentId, id))
    .orderBy(desc(mawbShipmentLinks.createdAt));

  return {
    document,
    links,
    otherChargeLines: parseStoredChargeLines(document.otherChargesJson),
  };
}

export async function getMawbWorkbookInput(id: number): Promise<MawbFormValues | null> {
  await requireMawbUser();
  const detail = await getMawbDetail(id);
  if (!detail) return null;
  const document = detail.document;

  return {
    actionMode: normalizeActionMode(document.actionMode),
    agentName: document.agentName ?? "PT PLI",
    awbSerial: document.awbSerial,
    chargeableWeight: String(document.chargeableWeight),
    commodity: document.commodity,
    consigneeAddress: document.consigneeAddress,
    consigneeName: document.consigneeName,
    currency: document.currency,
    declaredValueForCarriage: document.declaredValueForCarriage ?? "NVD",
    declaredValueForCustoms: document.declaredValueForCustoms ?? "NCV",
    departureAirport: document.departureAirport,
    destinationAirport: document.destinationAirport,
    destinationIata: document.destinationIata,
    executedDate: dateText(document.executedDate),
    executedPlace: document.executedPlace ?? "CGK",
    existingShipmentTracking: null,
    flightDate: dateText(document.flightDate),
    flightNumber: document.flightNumber ?? "TBA",
    goodsDescription: document.goodsDescription,
    grossWeight: String(document.grossWeight),
    handlingInformation: document.handlingInformation,
    idempotencyKey: document.idempotencyKey ?? String(document.id),
    insuranceAmount: document.insuranceAmount ?? "NIL",
    mawbNumber: document.mawbNumber,
    natureQuantity: document.natureQuantity,
    originIata: document.originIata,
    otherChargeLines: detail.otherChargeLines,
    overwriteExistingShipment: false,
    pieces: document.pieces,
    rate: String(document.rate),
    routingBy1: document.routingBy1,
    routingBy2: document.routingBy2,
    routingTo1: document.routingTo1,
    routingTo2: document.routingTo2,
    serviceType: document.serviceType,
    shipmentContactPhone: document.shipmentContactPhone,
    shipmentCustomerId: document.shipmentCustomerId,
    shipmentCustomerName: document.shipmentCustomerName,
    shipperAddress: document.shipperAddress,
    shipperName: document.shipperName,
  };
}

export async function searchMawbFromForm(formData: FormData) {
  await requireMawbUser();
  const query = text(formData.get("q"));
  if (!query) redirect("/mawbs");
  redirect(`/mawbs?search=${encodeURIComponent(query)}`);
}
