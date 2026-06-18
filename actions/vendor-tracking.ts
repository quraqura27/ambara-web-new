"use server";

import { randomUUID } from "crypto";
import { and, asc, desc, eq, ilike, inArray, isNull, ne, not, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  bulkShipmentImportItems,
  bulkShipmentImportJobs,
  bulkUpdateItems,
  bulkUpdateJobs,
  deliveryBatches,
  parcels,
  parcelVendorTracking,
  portalAuditLogs,
  shipments,
  trackingEvents,
  trackingUpdates,
} from "@/lib/db/schema";
import { requirePortalUser } from "@/lib/portal-auth";
import { hasPortalRoleAtLeast } from "@/lib/portal-roles";
import { recordPortalAudit } from "@/lib/portal-audit";
import {
  isDoorDeliveryService,
  normalizeShipmentService,
} from "@/lib/shipments/service-model";
import {
  canTransitionShipmentStatus,
  getShipmentStatusDefinition,
  normalizeShipmentStatus,
} from "@/lib/shipments/status-model";
import { buildCustomerVisibleTrackingEvent } from "@/lib/tracking/public-events";
import {
  buildAmbaraParcelId,
  buildVendorUploadCsv,
  generateAmbaraTrackingNumber,
  mapVendorStatus,
  matchVendorStatusRows,
  matchVendorTrackingRows,
  parseDelimitedText,
  parseOptionalDate,
  parseVendorReturnRows,
  prepareBulkShipmentImport,
  toCsv,
  type AmbaraStatusCode,
  type BulkShipmentImportPreview,
  type MatchableBatchParcel,
  type NormalizedBulkShipmentRow,
  type VendorReturnRow,
} from "@/lib/vendor-tracking/core";

export type BulkShipmentPreviewState = {
  error?: string;
  filename?: string;
  payload?: string;
  preview?: BulkShipmentImportPreview;
};

export type VendorImportPreviewState = {
  batchId?: number;
  error?: string;
  filename?: string;
  payload?: string;
  result?: ReturnType<typeof matchVendorTrackingRows>;
};

export type VendorStatusPreviewState = {
  batchId?: number;
  error?: string;
  filename?: string;
  payload?: string;
  matches?: ReturnType<typeof matchVendorStatusRows>;
};

type BulkShipmentCommitPayload = {
  filename: string;
  idempotencyKey: string;
  preview: BulkShipmentImportPreview;
};

type VendorTrackingCommitPayload = {
  batchId: number;
  filename: string;
  idempotencyKey: string;
  matches: ReturnType<typeof matchVendorTrackingRows>["matches"];
};

type VendorStatusCommitPayload = {
  batchId: number;
  filename: string;
  idempotencyKey: string;
  matches: ReturnType<typeof matchVendorStatusRows>;
};

const vendorTrackingPaths = [
  "/delivery-batches",
  "/delivery-batches/new",
  "/shipments",
  "/shipments/bulk-import",
  "/dashboard",
];

function formText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function formNumber(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(formText(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function redirectWithNotice(path: string, message: string): never {
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function revalidateVendorTrackingPaths(batchId?: number) {
  vendorTrackingPaths.forEach((path) => revalidatePath(path));

  if (batchId) {
    revalidatePath(`/delivery-batches/${batchId}`);
  }
}

async function requireVendorTrackingAdmin() {
  const user = await requirePortalUser();

  if (!hasPortalRoleAtLeast(user, "operations")) {
    redirect("/dashboard");
  }

  return user;
}

async function readDelimitedUpload(formData: FormData) {
  const pastedTable = formText(formData.get("pastedTable"));
  const uploadedFile = formData.get("file");

  if (pastedTable) {
    return { text: pastedTable, filename: "pasted-table.csv" };
  }

  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    if (/\.(xlsx|xls)$/i.test(uploadedFile.name)) {
      throw new Error(
        "Native .xlsx parsing is not supported. Export the sheet as CSV / TSV / Excel-compatible CSV first.",
      );
    }

    return { text: await uploadedFile.text(), filename: uploadedFile.name };
  }

  throw new Error("Upload or paste a CSV / TSV table first.");
}

function parsePayload<T>(value: FormDataEntryValue | null, fallbackPath: string): T {
  const text = formText(value);

  if (!text) {
    redirectWithError(fallbackPath, "Missing confirmation payload.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    redirectWithError(fallbackPath, "Confirmation payload is invalid.");
  }
}

function lowerShipmentStatus(statusCode: AmbaraStatusCode) {
  return normalizeShipmentStatus(statusCode);
}

function eventSourceForFilename(filename: string, fallback: string) {
  return /\.csv$/i.test(filename) ? "csv_import" : fallback;
}

async function createCustomerTrackingEvent(input: {
  createdBy: number;
  internalNote?: string;
  location?: string;
  parcelId?: number | null;
  serviceType?: string | null;
  shipmentId: number;
  source: string;
  statusCode: AmbaraStatusCode;
  visibleToCustomer?: boolean;
}) {
  const definition = getShipmentStatusDefinition(input.statusCode, input.serviceType);
  const publicDescription = definition.publicDescription;
  const label = definition.publicLabel;
  const eventTime = new Date();
  const visibleToCustomer = input.visibleToCustomer !== false;
  const status = definition.publicStatus;

  await db.insert(trackingEvents).values({
    shipmentId: input.shipmentId,
    parcelId: input.parcelId ?? null,
    statusCode: input.statusCode,
    status,
    label,
    publicDescription: visibleToCustomer ? publicDescription : null,
    description: visibleToCustomer ? publicDescription : null,
    internalNote: input.internalNote ?? null,
    location: input.location ?? null,
    eventTime,
    source: input.source,
    visibleToCustomer,
    createdBy: input.createdBy,
    state: "done",
    createdAt: eventTime,
  });

  if (visibleToCustomer) {
    await db.insert(trackingUpdates).values({
      shipmentId: input.shipmentId,
      status,
      description: publicDescription,
      location: input.location ?? null,
      timestamp: eventTime,
    });
  }
}

async function createUniqueTrackingNumber() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const trackingNumber = generateAmbaraTrackingNumber();
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

    if (!existing) {
      return trackingNumber;
    }
  }

  throw new Error("Unable to generate a unique tracking number.");
}

function shipmentTitle(row: NormalizedBulkShipmentRow) {
  const route = [row.originCity || "Unknown origin", row.destinationCity || "Unknown destination"].join(
    " to ",
  );
  return `${route} ${row.serviceType}`.trim();
}

function selectedBulkRows(preview: BulkShipmentImportPreview, approvedWarningRows: Set<number>) {
  return preview.rows.filter(
    (row) =>
      row.errors.length === 0 &&
      (row.warnings.length === 0 || approvedWarningRows.has(row.rowNumber)),
  );
}

function revalidateBulkPreview(preview: BulkShipmentImportPreview) {
  return prepareBulkShipmentImport(
    preview.rows.map((row) => ({
      rowNumber: row.rowNumber,
      values: {
        cod_amount: row.data.codAmount === null ? "" : String(row.data.codAmount),
        commodity: row.data.commodity,
        customer_name: row.data.customerName,
        customer_reference: row.data.customerReference,
        delivery_instruction: row.data.deliveryInstruction,
        destination_city: row.data.destinationCity,
        origin_city: row.data.originCity,
        pieces: String(row.data.pieces),
        postal_code: row.data.postalCode,
        receiver_address: row.data.receiverAddress,
        receiver_name: row.data.receiverName,
        receiver_phone: row.data.receiverPhone,
        service_type: row.data.serviceType,
        shipper_name: row.data.shipperName,
        shipper_phone: row.data.shipperPhone,
        weight: String(row.data.weight),
      },
    })),
  );
}

async function allocateBulkImportIds(rowCount: number) {
  const result = await db.execute<{
    job_id: number;
    parcel_ids: number[];
    shipment_ids: number[];
  }>(sql`
    select
      nextval(pg_get_serial_sequence('bulk_shipment_import_jobs', 'id'))::int as job_id,
      array(
        select nextval(pg_get_serial_sequence('parcels', 'id'))::int
        from generate_series(1, ${rowCount})
      ) as parcel_ids,
      array(
        select nextval(pg_get_serial_sequence('shipments', 'id'))::int
        from generate_series(1, ${rowCount})
      ) as shipment_ids
  `);
  const ids = result.rows[0];
  if (!ids || ids.parcel_ids.length !== rowCount || ids.shipment_ids.length !== rowCount) {
    throw new Error("Unable to allocate import identifiers.");
  }
  return ids;
}

async function createUniqueTrackingNumbers(count: number) {
  const trackingNumbers = new Set<string>();
  while (trackingNumbers.size < count) {
    trackingNumbers.add(await createUniqueTrackingNumber());
  }
  return Array.from(trackingNumbers);
}

export async function previewBulkShipmentImport(
  _state: BulkShipmentPreviewState,
  formData: FormData,
): Promise<BulkShipmentPreviewState> {
  await requireVendorTrackingAdmin();

  try {
    const { text, filename } = await readDelimitedUpload(formData);
    const preview = prepareBulkShipmentImport(parseDelimitedText(text));

    return {
      filename,
      preview,
      payload: JSON.stringify({
        filename,
        idempotencyKey: randomUUID(),
        preview,
      } satisfies BulkShipmentCommitPayload),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import preview failed." };
  }
}

export async function commitBulkShipmentImport(formData: FormData) {
  const user = await requireVendorTrackingAdmin();
  const payload = parsePayload<BulkShipmentCommitPayload>(
    formData.get("payload"),
    "/shipments/bulk-import",
  );
  const preview = revalidateBulkPreview(payload.preview);
  const approvedWarningRows = new Set(
    formData
      .getAll("warningRows")
      .map((value) => Number.parseInt(String(value), 10))
      .filter(Number.isInteger),
  );

  if (preview.summary.totalRows === 0) {
    redirectWithError("/shipments/bulk-import", "No rows were available to import.");
  }

  if (preview.summary.errorRows > 0) {
    redirectWithError("/shipments/bulk-import", "Resolve validation errors before confirming import.");
  }

  const selectedRows = selectedBulkRows(preview, approvedWarningRows);
  if (selectedRows.length === 0) {
    redirectWithError(
      "/shipments/bulk-import",
      "No valid rows were selected. Review warning rows or upload a corrected file.",
    );
  }

  const [existingJob] = await db
    .select({ id: bulkShipmentImportJobs.id })
    .from(bulkShipmentImportJobs)
    .where(eq(bulkShipmentImportJobs.idempotencyKey, payload.idempotencyKey))
    .limit(1);
  if (existingJob) {
    redirectWithNotice("/shipments/bulk-import", "This import was already processed.");
  }
  const now = new Date();
  const ids = await allocateBulkImportIds(selectedRows.length);
  const trackingNumbers = await createUniqueTrackingNumbers(selectedRows.length);
  const queries: BatchItem<"pg">[] = [
    db.insert(bulkShipmentImportJobs).values({
      id: ids.job_id,
      uploadedFilename: payload.filename,
      totalRows: preview.summary.totalRows,
      validRows: preview.summary.validRows,
      errorRows: preview.summary.errorRows,
      warningRows: preview.summary.warningRows,
      createdShipments: selectedRows.length,
      createdParcels: selectedRows.length,
      status: "completed",
      idempotencyKey: payload.idempotencyKey,
      createdBy: user.id,
      createdAt: now,
      completedAt: now,
    }),
  ];

  selectedRows.forEach((item, index) => {
    const row = item.data;
    const trackingNumber = trackingNumbers[index]!;
    const shipmentId = ids.shipment_ids[index]!;
    const parcelId = ids.parcel_ids[index]!;
    const serviceType = normalizeShipmentService(row.serviceType)!;
    const doorDelivery = isDoorDeliveryService(serviceType);
    const receiverAddress = doorDelivery
      ? row.receiverAddress
      : `Destination port: ${row.destinationCity}`;
    const publicEvent = buildCustomerVisibleTrackingEvent("received", serviceType);

    queries.push(
      db.insert(shipments).values({
        id: shipmentId,
        trackingNumber,
        internalTrackingNo: trackingNumber,
        customerReference: row.customerReference || null,
        title: shipmentTitle(row),
        origin: row.originCity || "Unknown",
        destination: row.destinationCity,
        serviceType,
        shipperName: row.shipperName || null,
        shipperPhone: row.shipperPhone || null,
        consigneeName: row.receiverName,
        consigneeAddress: doorDelivery ? row.receiverAddress : null,
        consigneePhone: row.receiverPhone,
        customerName: row.customerName || null,
        goodsDescription: row.commodity || null,
        totalPcs: row.pieces,
        weightKg: row.weight.toString(),
        commodity: row.commodity || null,
        status: "received",
        createdByStaff: user.id,
        updatedByStaff: user.id,
        createdBy: user.email,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(parcels).values({
        id: parcelId,
        shipmentId,
        ambaraParcelId: buildAmbaraParcelId(trackingNumber, 1),
        parcelNumber: 1,
        receiverName: row.receiverName,
        receiverPhone: row.receiverPhone,
        receiverAddress,
        destinationCity: row.destinationCity,
        postalCode: doorDelivery ? row.postalCode || null : null,
        weight: row.weight.toString(),
        pieces: row.pieces,
        serviceType,
        commodity: row.commodity || null,
        deliveryInstruction: doorDelivery ? row.deliveryInstruction || null : null,
        codAmount:
          doorDelivery && row.codAmount !== null ? row.codAmount.toString() : null,
        currentStatus: "DRAFT",
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(trackingEvents).values({
        shipmentId,
        parcelId,
        statusCode: publicEvent.statusCode,
        status: publicEvent.status,
        label: publicEvent.label,
        publicDescription: publicEvent.publicDescription,
        description: publicEvent.publicDescription,
        location: row.originCity || null,
        eventTime: now,
        source: eventSourceForFilename(payload.filename, "excel_import"),
        visibleToCustomer: true,
        createdBy: user.id,
        state: "done",
        createdAt: now,
      }),
      db.insert(trackingUpdates).values({
        shipmentId,
        status: publicEvent.status,
        description: publicEvent.publicDescription,
        location: row.originCity || null,
        timestamp: now,
      }),
      db.insert(bulkShipmentImportItems).values({
        importJobId: ids.job_id,
        rowNumber: item.rowNumber,
        shipmentId,
        parcelId,
        customerReference: row.customerReference || null,
        receiverName: row.receiverName,
        validationStatus: item.warnings.length > 0 ? "warning" : "valid",
        errorMessage: item.warnings.join("; ") || null,
        createdAt: now,
      }),
    );
  });

  queries.push(
    db.insert(portalAuditLogs).values({
      action: "shipment.bulk_imported",
      entityId: String(ids.job_id),
      entityType: "bulk_shipment_import",
      metadataJson: JSON.stringify({
        createdParcels: selectedRows.length,
        createdShipments: selectedRows.length,
      }),
      performedBy: user.id,
      createdAt: now,
    }),
  );

  try {
    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  } catch {
    const [processedJob] = await db
      .select({ id: bulkShipmentImportJobs.id })
      .from(bulkShipmentImportJobs)
      .where(eq(bulkShipmentImportJobs.idempotencyKey, payload.idempotencyKey))
      .limit(1);
    if (processedJob) {
      redirectWithNotice("/shipments/bulk-import", "This import was already processed.");
    }
    redirectWithError(
      "/shipments/bulk-import",
      "Import failed. No shipment or delivery records were saved.",
    );
  }

  revalidateVendorTrackingPaths();
  redirectWithNotice(
    "/shipments/bulk-import",
    `Import completed: ${selectedRows.length} independent shipments created.`,
  );
}

export async function rollbackBulkShipmentImportJob(jobId: number, formData: FormData) {
  const user = await requireVendorTrackingAdmin();
  if (formText(formData.get("confirmed")) !== "yes") {
    redirectWithError("/shipments/bulk-import", "Rollback confirmation is required.");
  }

  const [job] = await db
    .select()
    .from(bulkShipmentImportJobs)
    .where(eq(bulkShipmentImportJobs.id, jobId))
    .limit(1);

  if (!job || job.status === "rolled_back") {
    redirectWithError("/shipments/bulk-import", "Import job is not available for rollback.");
  }

  const items = await db
    .select()
    .from(bulkShipmentImportItems)
    .where(eq(bulkShipmentImportItems.importJobId, jobId));
  const parcelIds = items
    .map((item) => item.parcelId)
    .filter((id): id is number => typeof id === "number");
  const shipmentIds = Array.from(
    new Set(items.map((item) => item.shipmentId).filter((id): id is number => typeof id === "number")),
  );

  if (parcelIds.length === 0 || shipmentIds.length === 0) {
    redirectWithError("/shipments/bulk-import", "Import job has no created draft records.");
  }

  const linkedTracking = await db
    .select({ id: parcelVendorTracking.id })
    .from(parcelVendorTracking)
    .where(inArray(parcelVendorTracking.parcelId, parcelIds))
    .limit(1);

  if (linkedTracking.length > 0) {
    redirectWithError(
      "/shipments/bulk-import",
      "Cannot roll back parcels that have been assigned to a vendor batch.",
    );
  }

  const createdParcels = await db.select().from(parcels).where(inArray(parcels.id, parcelIds));
  const nonDraftParcel = createdParcels.find((parcel) => parcel.currentStatus !== "DRAFT");

  if (nonDraftParcel) {
    redirectWithError("/shipments/bulk-import", "Only draft, unassigned imports can be rolled back.");
  }

  const laterTrackingEvents = await db
    .select({ id: trackingEvents.id })
    .from(trackingEvents)
    .where(
      and(
        inArray(trackingEvents.shipmentId, shipmentIds),
        or(
          ne(trackingEvents.statusCode, "DRAFT"),
          not(inArray(trackingEvents.source, ["csv_import", "excel_import"])),
        ),
      ),
    )
    .limit(1);

  if (laterTrackingEvents.length > 0) {
    redirectWithError(
      "/shipments/bulk-import",
      "Cannot roll back imports that already have later tracking events.",
    );
  }

  await db.delete(trackingEvents).where(inArray(trackingEvents.shipmentId, shipmentIds));
  await db.delete(trackingUpdates).where(inArray(trackingUpdates.shipmentId, shipmentIds));
  await db.delete(parcels).where(inArray(parcels.id, parcelIds));
  await db.delete(shipments).where(inArray(shipments.id, shipmentIds));
  await db
    .update(bulkShipmentImportJobs)
    .set({ status: "rolled_back", completedAt: new Date() })
    .where(eq(bulkShipmentImportJobs.id, jobId));

  await recordPortalAudit({
    action: "shipment.bulk_import_rolled_back",
    entityId: jobId,
    entityType: "bulk_shipment_import",
    metadata: { parcelCount: parcelIds.length, shipmentCount: shipmentIds.length },
    performedBy: user.id,
  });

  revalidateVendorTrackingPaths();
  redirectWithNotice("/shipments/bulk-import", "Draft import rolled back.");
}

export async function getRecentBulkShipmentImportJobs() {
  await requireVendorTrackingAdmin();

  return db
    .select()
    .from(bulkShipmentImportJobs)
    .orderBy(desc(bulkShipmentImportJobs.createdAt))
    .limit(10);
}

async function createUniqueBatchCode() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const batchCode = `BATCH-${ymd}-${suffix}`;
    const [existing] = await db
      .select({ id: deliveryBatches.id })
      .from(deliveryBatches)
      .where(eq(deliveryBatches.batchCode, batchCode))
      .limit(1);

    if (!existing) {
      return batchCode;
    }
  }

  throw new Error("Unable to generate a unique batch code.");
}

export async function getAvailableParcelsForBatch(search?: string) {
  await requireVendorTrackingAdmin();
  const trimmedSearch = search?.trim();
  const selectedFields = {
    id: parcels.id,
    shipmentId: parcels.shipmentId,
    ambaraParcelId: parcels.ambaraParcelId,
    receiverName: parcels.receiverName,
    receiverPhone: parcels.receiverPhone,
    receiverAddress: parcels.receiverAddress,
    destinationCity: parcels.destinationCity,
    postalCode: parcels.postalCode,
    weight: parcels.weight,
    pieces: parcels.pieces,
    serviceType: parcels.serviceType,
    commodity: parcels.commodity,
    currentStatus: parcels.currentStatus,
    shipmentTrackingNumber: shipments.trackingNumber,
    customerReference: shipments.customerReference,
  };
  const baseCondition = and(
    isNull(parcelVendorTracking.id),
    sql`upper(coalesce(${shipments.serviceType}, ${parcels.serviceType}, '')) in ('DTD', 'PTD')`,
  );
  const searchCondition = trimmedSearch
    ? or(
        ilike(parcels.ambaraParcelId, `%${trimmedSearch}%`),
        ilike(parcels.receiverName, `%${trimmedSearch}%`),
        ilike(parcels.receiverPhone, `%${trimmedSearch}%`),
        ilike(parcels.destinationCity, `%${trimmedSearch}%`),
        ilike(shipments.trackingNumber, `%${trimmedSearch}%`),
        ilike(shipments.customerReference, `%${trimmedSearch}%`),
      )
    : undefined;

  const query = db
    .select(selectedFields)
    .from(parcels)
    .innerJoin(shipments, eq(parcels.shipmentId, shipments.id))
    .leftJoin(parcelVendorTracking, eq(parcelVendorTracking.parcelId, parcels.id));

  return query
    .where(searchCondition ? and(baseCondition, searchCondition) : baseCondition)
    .orderBy(desc(parcels.createdAt))
    .limit(250);
}

export async function createDeliveryBatchFromForm(formData: FormData) {
  await requireVendorTrackingAdmin();
  const parcelIds = formData
    .getAll("parcelIds")
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value) && value > 0);
  const vendorName = formText(formData.get("vendorName"));
  const vendorServiceType = formText(formData.get("vendorServiceType"));
  const handoverDate = formText(formData.get("handoverDate")) || null;
  const slaDeadline = parseOptionalDate(formText(formData.get("slaDeadline")));
  const notes = formText(formData.get("notes"));

  if (!vendorName) {
    redirectWithError("/delivery-batches/new", "Vendor name is required.");
  }

  if (parcelIds.length === 0) {
    redirectWithError("/delivery-batches/new", "Select at least one parcel.");
  }

  const selectedParcels = await db
    .select({
      id: parcels.id,
      shipmentId: parcels.shipmentId,
      ambaraParcelId: parcels.ambaraParcelId,
      currentStatus: parcels.currentStatus,
      destinationCity: parcels.destinationCity,
      serviceType: sql<string>`upper(coalesce(${shipments.serviceType}, ${parcels.serviceType}, ''))`,
    })
    .from(parcels)
    .where(inArray(parcels.id, parcelIds));

  if (selectedParcels.length !== parcelIds.length) {
    redirectWithError("/delivery-batches/new", "One or more selected parcels no longer exist.");
  }
  if (selectedParcels.some((parcel) => !isDoorDeliveryService(parcel.serviceType))) {
    redirectWithError(
      "/delivery-batches/new",
      "Only DTD and PTD shipments can be added to a delivery batch.",
    );
  }

  const existingAssignments = await db
    .select({ parcelId: parcelVendorTracking.parcelId })
    .from(parcelVendorTracking)
    .where(inArray(parcelVendorTracking.parcelId, parcelIds));

  if (existingAssignments.length > 0) {
    redirectWithError("/delivery-batches/new", "One or more selected parcels already belong to a batch.");
  }

  const batchCode = await createUniqueBatchCode();
  const now = new Date();
  const [batch] = await db
    .insert(deliveryBatches)
    .values({
      batchCode,
      vendorName,
      vendorServiceType: vendorServiceType || null,
      handoverDate,
      slaDeadline,
      batchStatus: "HANDED_TO_DELIVERY_PARTNER",
      totalParcels: selectedParcels.length,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  for (let index = 0; index < selectedParcels.length; index += 1) {
    const parcel = selectedParcels[index];
    if (!parcel) continue;

    await db.insert(parcelVendorTracking).values({
      parcelId: parcel.id,
      deliveryBatchId: batch.id,
      vendorName,
      exportRowId: `${batch.batchCode}-${String(index + 1).padStart(4, "0")}`,
      createdAt: now,
      updatedAt: now,
    });

    await db
      .update(parcels)
      .set({ currentStatus: "HANDED_TO_DELIVERY_PARTNER", updatedAt: now })
      .where(eq(parcels.id, parcel.id));
  }

  revalidateVendorTrackingPaths(batch.id);
  redirect(`/delivery-batches/${batch.id}?notice=${encodeURIComponent("Delivery batch created.")}`);
}

export async function getDeliveryBatchDashboard() {
  await requireVendorTrackingAdmin();
  const batches = await db.select().from(deliveryBatches).orderBy(desc(deliveryBatches.createdAt));
  const trackingRows = await db
    .select({
      batchId: parcelVendorTracking.deliveryBatchId,
      vendorTrackingNumber: parcelVendorTracking.vendorTrackingNumber,
      lastVendorStatus: parcelVendorTracking.lastVendorStatus,
      podUrl: parcelVendorTracking.podUrl,
      parcelStatus: parcels.currentStatus,
      serviceType: sql<string>`upper(coalesce(${shipments.serviceType}, ${parcels.serviceType}, ''))`,
    })
    .from(parcelVendorTracking)
    .innerJoin(parcels, eq(parcelVendorTracking.parcelId, parcels.id))
    .innerJoin(shipments, eq(parcels.shipmentId, shipments.id))
    .where(sql`upper(coalesce(${shipments.serviceType}, ${parcels.serviceType}, '')) in ('DTD', 'PTD')`);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return batches
    .map((batch) => {
      const rows = trackingRows.filter((row) => row.batchId === batch.id);
      if (rows.length === 0) return null;
      const deliveredCount = rows.filter((row) => row.parcelStatus === "DELIVERED").length;
      const deliveryIssueCount = rows.filter((row) => row.parcelStatus === "DELIVERY_ISSUE").length;
      const missingVendorTrackingCount = rows.filter((row) => !row.vendorTrackingNumber).length;
      const outForDeliveryCount = rows.filter((row) => row.parcelStatus === "OUT_FOR_DELIVERY").length;
      const deliveredMissingPodCount = rows.filter(
        (row) => row.parcelStatus === "DELIVERED" && !row.podUrl,
      ).length;
      const checkedToday = batch.lastCheckedAt
        ? new Date(batch.lastCheckedAt).toISOString().slice(0, 10) === today
        : false;
      const slaTime = batch.slaDeadline ? new Date(batch.slaDeadline).getTime() : null;
      const closeToSla = slaTime ? slaTime - now.getTime() < 24 * 60 * 60 * 1000 : false;
      const priority =
        !checkedToday
          ? 1
          : closeToSla
            ? 2
            : outForDeliveryCount > 0
              ? 3
              : deliveryIssueCount > 0
                ? 4
                : deliveredMissingPodCount > 0
                  ? 5
                  : missingVendorTrackingCount > 0
                    ? 6
                    : 7;

      return {
        ...batch,
        deliveredCount,
        deliveryIssueCount,
        missingVendorTrackingCount,
        priority,
      };
    })
    .filter((batch): batch is NonNullable<typeof batch> => batch !== null)
    .sort((left, right) => left.priority - right.priority || right.id - left.id);
}

export async function getDeliveryBatchPage(options: {
  from?: string;
  page?: number;
  search?: string;
  sort?: "created_asc" | "created_desc" | "sla_asc";
  to?: string;
  view?: "delivery_issues" | "missing_tracking" | "overdue" | "";
} = {}) {
  const batches = await getDeliveryBatchDashboard();
  const search = options.search?.trim().toLowerCase();
  const now = new Date();
  const filtered = batches.filter((batch) => {
    if (
      search &&
      !`${batch.batchCode} ${batch.vendorName} ${batch.vendorServiceType ?? ""}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    if (options.view === "delivery_issues" && batch.deliveryIssueCount === 0) return false;
    if (options.view === "missing_tracking" && batch.missingVendorTrackingCount === 0) return false;
    if (
      options.view === "overdue" &&
      (!batch.slaDeadline || new Date(batch.slaDeadline).getTime() >= now.getTime())
    ) {
      return false;
    }
    if (
      options.from &&
      /^\d{4}-\d{2}-\d{2}$/.test(options.from) &&
      batch.createdAt &&
      new Date(batch.createdAt).getTime() < new Date(`${options.from}T00:00:00+07:00`).getTime()
    ) {
      return false;
    }
    if (
      options.to &&
      /^\d{4}-\d{2}-\d{2}$/.test(options.to) &&
      batch.createdAt &&
      new Date(batch.createdAt).getTime() > new Date(`${options.to}T23:59:59+07:00`).getTime()
    ) {
      return false;
    }
    return true;
  });
  filtered.sort((left, right) => {
    if (options.sort === "created_asc") {
      return new Date(left.createdAt ?? 0).getTime() - new Date(right.createdAt ?? 0).getTime();
    }
    if (options.sort === "sla_asc") {
      return new Date(left.slaDeadline ?? "9999-12-31").getTime() - new Date(right.slaDeadline ?? "9999-12-31").getTime();
    }
    return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
  });
  const pageSize = 20;
  const page = Math.max(1, options.page ?? 1);
  const total = filtered.length;
  return {
    page,
    pageSize,
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getBatchParcels(batchId: number) {
  return db
    .select({
      id: parcels.id,
      shipmentId: parcels.shipmentId,
      ambaraParcelId: parcels.ambaraParcelId,
      receiverName: parcels.receiverName,
      receiverPhone: parcels.receiverPhone,
      receiverAddress: parcels.receiverAddress,
      destinationCity: parcels.destinationCity,
      postalCode: parcels.postalCode,
      weight: parcels.weight,
      pieces: parcels.pieces,
      serviceType: parcels.serviceType,
      commodity: parcels.commodity,
      deliveryInstruction: parcels.deliveryInstruction,
      codAmount: parcels.codAmount,
      currentStatus: parcels.currentStatus,
      shipmentStatus: shipments.status,
      shipmentServiceType: shipments.serviceType,
      shipmentTrackingNumber: shipments.trackingNumber,
      shipmentInternalTrackingNo: shipments.internalTrackingNo,
      exportRowId: parcelVendorTracking.exportRowId,
      vendorTrackingNumber: parcelVendorTracking.vendorTrackingNumber,
      vendorName: parcelVendorTracking.vendorName,
      lastVendorStatus: parcelVendorTracking.lastVendorStatus,
      lastVendorEventTime: parcelVendorTracking.lastVendorEventTime,
      podUrl: parcelVendorTracking.podUrl,
      vendorTrackingId: parcelVendorTracking.id,
    })
    .from(parcelVendorTracking)
    .innerJoin(parcels, eq(parcelVendorTracking.parcelId, parcels.id))
    .innerJoin(shipments, eq(parcels.shipmentId, shipments.id))
    .where(
      and(
        eq(parcelVendorTracking.deliveryBatchId, batchId),
        sql`upper(coalesce(${shipments.serviceType}, ${parcels.serviceType}, '')) in ('DTD', 'PTD')`,
      ),
    )
    .orderBy(asc(parcelVendorTracking.exportRowId));
}

function toMatchableParcels(rows: Awaited<ReturnType<typeof getBatchParcels>>): MatchableBatchParcel[] {
  return rows.map((row) => ({
    id: row.id,
    shipmentId: row.shipmentId,
    ambaraParcelId: row.ambaraParcelId,
    exportRowId: row.exportRowId,
    vendorTrackingNumber: row.vendorTrackingNumber,
    receiverName: row.receiverName,
    receiverPhone: row.receiverPhone,
    receiverAddress: row.receiverAddress,
    destinationCity: row.destinationCity,
    postalCode: row.postalCode,
    currentStatus: row.currentStatus,
    serviceType: row.serviceType,
    shipmentServiceType: row.shipmentServiceType,
    shipmentStatus: row.shipmentStatus,
  }));
}

export async function getDeliveryBatchDetail(batchId: number) {
  await requireVendorTrackingAdmin();
  const [batch] = await db
    .select()
    .from(deliveryBatches)
    .where(eq(deliveryBatches.id, batchId))
    .limit(1);

  if (!batch) {
    redirect("/delivery-batches");
  }

  const batchParcels = await getBatchParcels(batchId);

  return {
    batch,
    parcels: batchParcels,
    summary: {
      deliveredCount: batchParcels.filter((parcel) => parcel.currentStatus === "DELIVERED").length,
      issueCount: batchParcels.filter((parcel) => parcel.currentStatus === "DELIVERY_ISSUE").length,
      missingVendorTrackingCount: batchParcels.filter((parcel) => !parcel.vendorTrackingNumber).length,
    },
  };
}

export async function getDeliveryBatchExportCsv(batchId: number) {
  await requireVendorTrackingAdmin();
  const { batch, parcels: batchParcels } = await getDeliveryBatchDetail(batchId);
  const rows = batchParcels.map((parcel) => ({
    ambara_batch_id: batch.batchCode,
    export_row_id: parcel.exportRowId ?? "",
    ambara_parcel_id: parcel.ambaraParcelId,
    receiver_name: parcel.receiverName,
    receiver_phone: parcel.receiverPhone,
    receiver_address: parcel.receiverAddress,
    destination_city: parcel.destinationCity,
    postal_code: parcel.postalCode ?? "",
    weight: parcel.weight ?? "",
    pieces: parcel.pieces,
    commodity: parcel.commodity ?? "",
    service_type: parcel.serviceType ?? "",
    delivery_instruction: parcel.deliveryInstruction ?? "",
    cod_amount: parcel.codAmount ?? "",
  }));

  return {
    batchCode: batch.batchCode,
    csv: rows.length
      ? toCsv(rows)
      : buildVendorUploadCsv(batch.batchCode, []),
  };
}

export async function previewVendorTrackingImport(
  _state: VendorImportPreviewState,
  formData: FormData,
): Promise<VendorImportPreviewState> {
  await requireVendorTrackingAdmin();
  const batchId = formNumber(formData.get("batchId"));

  if (!batchId) {
    return { error: "Delivery batch is required." };
  }

  try {
    const { text, filename } = await readDelimitedUpload(formData);
    const rows = parseVendorReturnRows(text);
    const batchParcels = await getBatchParcels(batchId);
    const activeTrackingRows = await db
      .select({ vendorTrackingNumber: parcelVendorTracking.vendorTrackingNumber })
      .from(parcelVendorTracking)
      .where(ne(parcelVendorTracking.deliveryBatchId, batchId));
    const activeVendorTrackingNumbers = new Set(
      activeTrackingRows
        .map((row) => row.vendorTrackingNumber?.trim().toUpperCase())
        .filter((value): value is string => Boolean(value)),
    );
    const result = matchVendorTrackingRows(rows, toMatchableParcels(batchParcels), {
      activeVendorTrackingNumbers,
    });

    return {
      batchId,
      filename,
      result,
      payload: JSON.stringify({
        batchId,
        filename,
        idempotencyKey: randomUUID(),
        matches: result.matches,
      } satisfies VendorTrackingCommitPayload),
    };
  } catch (error) {
    return { batchId, error: error instanceof Error ? error.message : "Vendor import preview failed." };
  }
}

export async function commitVendorTrackingImport(formData: FormData) {
  const user = await requireVendorTrackingAdmin();
  const payload = parsePayload<VendorTrackingCommitPayload>(
    formData.get("payload"),
    "/delivery-batches",
  );
  const submittedRows = payload.matches.map((match) => match.row);
  const batchParcels = await getBatchParcels(payload.batchId);
  const activeTrackingRows = await db
    .select({ vendorTrackingNumber: parcelVendorTracking.vendorTrackingNumber })
    .from(parcelVendorTracking)
    .where(ne(parcelVendorTracking.deliveryBatchId, payload.batchId));
  const activeVendorTrackingNumbers = new Set(
    activeTrackingRows
      .map((row) => row.vendorTrackingNumber?.trim().toUpperCase())
      .filter((value): value is string => Boolean(value)),
  );
  const recomputedResult = matchVendorTrackingRows(submittedRows, toMatchableParcels(batchParcels), {
    activeVendorTrackingNumbers,
  });
  const selectedReviewRows = new Set(
    formData
      .getAll("reviewRows")
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isInteger(value)),
  );
  const confirmableMatches = recomputedResult.matches.filter(
    (match) =>
      match.parcel &&
      (match.matchStatus === "auto_confirm" || selectedReviewRows.has(match.row.rowNumber)),
  );
  const now = new Date();

  if (confirmableMatches.length === 0) {
    redirectWithError(`/delivery-batches/${payload.batchId}`, "No vendor tracking rows were confirmed.");
  }

  const [existingJob] = await db
    .select({ id: bulkUpdateJobs.id })
    .from(bulkUpdateJobs)
    .where(eq(bulkUpdateJobs.idempotencyKey, payload.idempotencyKey))
    .limit(1);
  if (existingJob) {
    redirectWithNotice(`/delivery-batches/${payload.batchId}`, "This vendor tracking import was already processed.");
  }

  const [job] = await db
    .insert(bulkUpdateJobs)
    .values({
      deliveryBatchId: payload.batchId,
      updateType: "vendor_tracking_import",
      source: "vendor_tracking_import",
      idempotencyKey: payload.idempotencyKey,
      uploadedFilename: payload.filename,
      totalRows: recomputedResult.matches.length,
      matchedRows: confirmableMatches.length,
      unmatchedRows: recomputedResult.matches.filter((match) => !match.parcel).length,
      duplicateRows: recomputedResult.matches.filter((match) =>
        match.errors.includes("duplicate vendor_tracking_number"),
      ).length,
      status: "completed",
      createdBy: user.id,
      createdAt: now,
      completedAt: now,
    })
    .returning();

  for (const match of recomputedResult.matches) {
    const shouldCommit =
      match.parcel &&
      (match.matchStatus === "auto_confirm" || selectedReviewRows.has(match.row.rowNumber));

    await db.insert(bulkUpdateItems).values({
      bulkUpdateJobId: job.id,
      parcelId: match.parcel?.id ?? null,
      vendorTrackingNumber: match.row.vendorTrackingNumber || null,
      oldStatus: match.parcel?.currentStatus ?? null,
      newStatus: shouldCommit ? "VENDOR_TRACKING_ASSIGNED" : null,
      vendorRawStatus: match.row.vendorStatus || null,
      eventTime: parseOptionalDate(match.row.vendorCreatedAt),
      receiverName: match.row.receiverName || null,
      podUrl: match.row.podUrl || null,
      matchStatus: shouldCommit ? "matched" : match.matchStatus,
      errorMessage: match.errors.join("; ") || null,
      createdAt: now,
    });

    if (!shouldCommit || !match.parcel) {
      continue;
    }

    await db
      .update(parcelVendorTracking)
      .set({
        vendorTrackingNumber: match.row.vendorTrackingNumber,
        ...(match.row.vendorName ? { vendorName: match.row.vendorName } : {}),
        vendorReferenceNumber: match.row.ambaraParcelId || match.row.exportRowId || null,
        matchMethod: match.matchMethod,
        matchConfidence: match.matchConfidence,
        lastVendorStatus: match.row.vendorStatus || null,
        lastVendorEventTime: parseOptionalDate(match.row.vendorCreatedAt),
        podUrl: match.row.podUrl || null,
        receiverName: match.row.receiverName || null,
        matchedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(parcelVendorTracking.deliveryBatchId, payload.batchId),
          eq(parcelVendorTracking.parcelId, match.parcel.id),
        ),
      );

    await db
      .update(parcels)
      .set({ currentStatus: "VENDOR_TRACKING_ASSIGNED", updatedAt: now })
      .where(eq(parcels.id, match.parcel.id));
    await createCustomerTrackingEvent({
      createdBy: user.id,
      shipmentId: match.parcel.shipmentId,
      parcelId: match.parcel.id,
      serviceType: match.parcel.serviceType,
      source: "vendor_tracking_import",
      statusCode: "VENDOR_TRACKING_ASSIGNED",
      visibleToCustomer: false,
      internalNote: `Vendor tracking number ${match.row.vendorTrackingNumber}; import job ${job.id}.`,
    });
  }

  await db
    .update(deliveryBatches)
    .set({ batchStatus: "VENDOR_TRACKING_IMPORTED", updatedAt: now })
    .where(eq(deliveryBatches.id, payload.batchId));

  await recordPortalAudit({
    action: "delivery_batch.vendor_tracking_imported",
    entityId: payload.batchId,
    entityType: "delivery_batch",
    metadata: { confirmedRows: confirmableMatches.length, jobId: job.id },
    performedBy: user.id,
  });

  revalidateVendorTrackingPaths(payload.batchId);
  redirectWithNotice(
    `/delivery-batches/${payload.batchId}`,
    `Vendor tracking imported for ${confirmableMatches.length} parcels.`,
  );
}

export async function bulkUpdateBatchStatusFromForm(batchId: number, formData: FormData) {
  const user = await requireVendorTrackingAdmin();
  const status = formText(formData.get("status")) as AmbaraStatusCode;
  const scope = formText(formData.get("scope")) || "selected";
  const selectedParcelIds = formData
    .getAll("parcelIds")
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value) && value > 0);
  const idempotencyKey = formText(formData.get("idempotencyKey"));
  const expectedUpdatedAt = formText(formData.get("expectedUpdatedAt"));
  const confirmationCode = formText(formData.get("confirmationCode"));

  const [batch] = await db
    .select({
      batchCode: deliveryBatches.batchCode,
      updatedAt: deliveryBatches.updatedAt,
    })
    .from(deliveryBatches)
    .where(eq(deliveryBatches.id, batchId))
    .limit(1);
  if (!batch) redirectWithError("/delivery-batches", "Delivery batch was not found.");
  if (
    expectedUpdatedAt &&
    batch.updatedAt &&
    batch.updatedAt.toISOString() !== expectedUpdatedAt
  ) {
    redirectWithError(
      `/delivery-batches/${batchId}`,
      "This batch changed after the page loaded. Review the latest rows before updating.",
    );
  }
  if (scope === "all" && confirmationCode !== batch.batchCode) {
    redirectWithError(
      `/delivery-batches/${batchId}`,
      `Type ${batch.batchCode} to confirm a batch-wide update.`,
    );
  }
  if (scope !== "all" && formText(formData.get("confirmed")) !== "yes") {
    redirectWithError(`/delivery-batches/${batchId}`, "Selected update confirmation is required.");
  }
  if (!idempotencyKey) {
    redirectWithError(`/delivery-batches/${batchId}`, "Missing update identifier. Reload and try again.");
  }
  const [existingJob] = await db
    .select({ id: bulkUpdateJobs.id })
    .from(bulkUpdateJobs)
    .where(eq(bulkUpdateJobs.idempotencyKey, idempotencyKey))
    .limit(1);
  if (existingJob) {
    redirectWithNotice(`/delivery-batches/${batchId}`, "This update was already processed.");
  }

  if (!["OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY_ISSUE", "RETURN_IN_PROGRESS", "ON_HOLD"].includes(status)) {
    redirectWithError(`/delivery-batches/${batchId}`, "Select a valid status.");
  }

  const batchParcels = await getBatchParcels(batchId);
  const targets =
    scope === "all"
      ? batchParcels
      : batchParcels.filter((parcel) => selectedParcelIds.includes(parcel.id));

  if (targets.length === 0) {
    redirectWithError(`/delivery-batches/${batchId}`, "Select at least one parcel to update.");
  }
  const invalidTargets = targets.filter(
    (target) =>
      !isDoorDeliveryService(target.shipmentServiceType || target.serviceType) ||
      !canTransitionShipmentStatus(
        target.shipmentStatus,
        lowerShipmentStatus(status),
        target.shipmentServiceType || target.serviceType,
      ),
  );
  if (invalidTargets.length > 0) {
    redirectWithError(
      `/delivery-batches/${batchId}`,
      `${invalidTargets.length} selected shipments cannot move to ${getShipmentStatusDefinition(status).label} from their current status.`,
    );
  }

  const now = new Date();
  const [job] = await db
    .insert(bulkUpdateJobs)
    .values({
      deliveryBatchId: batchId,
      updateType: scope === "all" ? "batch_status_update" : "selected_status_update",
      source: "bulk_update",
      idempotencyKey,
      totalRows: targets.length,
      matchedRows: targets.length,
      unmatchedRows: 0,
      duplicateRows: 0,
      status: "completed",
      createdBy: user.id,
      createdAt: now,
      completedAt: now,
    })
    .returning();

  for (const target of targets) {
    await db.insert(bulkUpdateItems).values({
      bulkUpdateJobId: job.id,
      parcelId: target.id,
      vendorTrackingNumber: target.vendorTrackingNumber || null,
      oldStatus: target.currentStatus,
      newStatus: status,
      matchStatus: "matched",
      createdAt: now,
    });
    await db
      .update(parcels)
      .set({ currentStatus: status, updatedAt: now })
      .where(eq(parcels.id, target.id));
    await db
      .update(parcelVendorTracking)
      .set({ lastVendorStatus: status, updatedAt: now })
      .where(eq(parcelVendorTracking.id, target.vendorTrackingId));
    await db
      .update(shipments)
      .set({ status: lowerShipmentStatus(status), updatedAt: now, updatedByStaff: user.id })
      .where(eq(shipments.id, target.shipmentId));
    await createCustomerTrackingEvent({
      createdBy: user.id,
      shipmentId: target.shipmentId,
      parcelId: target.id,
      serviceType: target.shipmentServiceType || target.serviceType,
      source: "bulk_update",
      statusCode: status,
      location: target.destinationCity,
      internalNote: `Bulk update job ${job.id}.`,
    });
  }

  await db
    .update(deliveryBatches)
    .set({ batchStatus: status, updatedAt: now })
    .where(eq(deliveryBatches.id, batchId));

  await recordPortalAudit({
    action: scope === "all" ? "delivery_batch.status_updated_all" : "delivery_batch.status_updated_selected",
    entityId: batchId,
    entityType: "delivery_batch",
    metadata: { status, targetCount: targets.length },
    performedBy: user.id,
  });

  revalidateVendorTrackingPaths(batchId);
  redirectWithNotice(`/delivery-batches/${batchId}`, `Updated ${targets.length} parcels.`);
}

export async function previewVendorStatusUpdate(
  _state: VendorStatusPreviewState,
  formData: FormData,
): Promise<VendorStatusPreviewState> {
  await requireVendorTrackingAdmin();
  const batchId = formNumber(formData.get("batchId"));

  if (!batchId) {
    return { error: "Delivery batch is required." };
  }

  try {
    const { text, filename } = await readDelimitedUpload(formData);
    const rows = parseVendorReturnRows(text);
    const batchParcels = await getBatchParcels(batchId);
    const matches = matchVendorStatusRows(rows, toMatchableParcels(batchParcels));

    return {
      batchId,
      filename,
      matches,
      payload: JSON.stringify({
        batchId,
        filename,
        idempotencyKey: randomUUID(),
        matches,
      } satisfies VendorStatusCommitPayload),
    };
  } catch (error) {
    return { batchId, error: error instanceof Error ? error.message : "Vendor status preview failed." };
  }
}

export async function commitVendorStatusUpdate(formData: FormData) {
  const user = await requireVendorTrackingAdmin();
  const payload = parsePayload<VendorStatusCommitPayload>(
    formData.get("payload"),
    "/delivery-batches",
  );
  const submittedRows = payload.matches.map((match) => match.row);
  const batchParcels = await getBatchParcels(payload.batchId);
  const recomputedMatches = matchVendorStatusRows(submittedRows, toMatchableParcels(batchParcels));
  const matches = recomputedMatches.filter((match) => match.matchStatus === "matched" && match.parcel);
  const now = new Date();

  if (matches.length === 0) {
    redirectWithError(`/delivery-batches/${payload.batchId}`, "No vendor status rows matched this batch.");
  }
  const parcelById = new Map(batchParcels.map((parcel) => [parcel.id, parcel]));
  const invalidMatches = matches.filter((match) => {
    const parcel = match.parcel ? parcelById.get(match.parcel.id) : null;
    return (
      !parcel ||
      !match.newStatus ||
      !canTransitionShipmentStatus(
        parcel.shipmentStatus,
        lowerShipmentStatus(match.newStatus),
        parcel.shipmentServiceType || parcel.serviceType,
      )
    );
  });
  if (invalidMatches.length > 0) {
    redirectWithError(
      `/delivery-batches/${payload.batchId}`,
      `${invalidMatches.length} vendor updates are invalid for the current shipment status.`,
    );
  }

  const [existingJob] = await db
    .select({ id: bulkUpdateJobs.id })
    .from(bulkUpdateJobs)
    .where(eq(bulkUpdateJobs.idempotencyKey, payload.idempotencyKey))
    .limit(1);
  if (existingJob) {
    redirectWithNotice(`/delivery-batches/${payload.batchId}`, "This vendor status import was already processed.");
  }

  const [job] = await db
    .insert(bulkUpdateJobs)
    .values({
      deliveryBatchId: payload.batchId,
      updateType: "vendor_status_import",
      source: "vendor_status_import",
      idempotencyKey: payload.idempotencyKey,
      uploadedFilename: payload.filename,
      totalRows: recomputedMatches.length,
      matchedRows: matches.length,
      unmatchedRows: recomputedMatches.length - matches.length,
      duplicateRows: recomputedMatches.filter((match) =>
        match.errors.includes("duplicate vendor_tracking_number"),
      ).length,
      status: "completed",
      createdBy: user.id,
      createdAt: now,
      completedAt: now,
    })
    .returning();

  for (const match of recomputedMatches) {
    await db.insert(bulkUpdateItems).values({
      bulkUpdateJobId: job.id,
      parcelId: match.parcel?.id ?? null,
      vendorTrackingNumber: match.row.vendorTrackingNumber || null,
      oldStatus: match.oldStatus || null,
      newStatus: match.newStatus,
      vendorRawStatus: match.row.vendorStatus || null,
      eventTime: parseOptionalDate(match.row.vendorCreatedAt),
      receiverName: match.row.receiverName || null,
      podUrl: match.row.podUrl || null,
      matchStatus: match.matchStatus,
      errorMessage: match.errors.join("; ") || null,
      createdAt: now,
    });

    if (match.matchStatus !== "matched" || !match.parcel || !match.newStatus) {
      continue;
    }

    const mapped = mapVendorStatus(match.row.vendorStatus, match.row.vendorName);
    await db
      .update(parcels)
      .set({ currentStatus: mapped.statusCode, updatedAt: now })
      .where(eq(parcels.id, match.parcel.id));
    await db
      .update(parcelVendorTracking)
      .set({
        lastVendorStatus: match.row.vendorStatus || null,
        lastVendorEventTime: parseOptionalDate(match.row.vendorCreatedAt),
        podUrl: match.row.podUrl || null,
        receiverName: match.row.receiverName || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(parcelVendorTracking.deliveryBatchId, payload.batchId),
          eq(parcelVendorTracking.parcelId, match.parcel.id),
        ),
      );
    await db
      .update(shipments)
      .set({
        status: lowerShipmentStatus(mapped.statusCode),
        updatedAt: now,
        updatedByStaff: user.id,
        ...(mapped.statusCode === "DELIVERED" ? { deliveredAt: now } : {}),
      })
      .where(eq(shipments.id, match.parcel.shipmentId));
    await createCustomerTrackingEvent({
      createdBy: user.id,
      shipmentId: match.parcel.shipmentId,
      parcelId: match.parcel.id,
      serviceType: parcelById.get(match.parcel.id)?.shipmentServiceType || match.parcel.serviceType,
      source: "vendor_status_import",
      statusCode: mapped.statusCode,
      location: match.parcel.destinationCity,
      internalNote: `Vendor raw status "${match.row.vendorStatus}" imported by job ${job.id}.`,
    });
  }

  await db
    .update(deliveryBatches)
    .set({ lastCheckedAt: now, lastCheckedBy: user.id, updatedAt: now })
    .where(eq(deliveryBatches.id, payload.batchId));

  await recordPortalAudit({
    action: "delivery_batch.vendor_status_imported",
    entityId: payload.batchId,
    entityType: "delivery_batch",
    metadata: { jobId: job.id, matchedRows: matches.length },
    performedBy: user.id,
  });

  revalidateVendorTrackingPaths(payload.batchId);
  redirectWithNotice(`/delivery-batches/${payload.batchId}`, `Imported ${matches.length} status updates.`);
}

export async function markBatchCheckedNoChange(batchId: number) {
  const user = await requireVendorTrackingAdmin();
  const now = new Date();
  const nextCheckDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await db
    .update(deliveryBatches)
    .set({
      lastCheckedAt: now,
      lastCheckedBy: user.id,
      nextCheckDueAt,
      updatedAt: now,
    })
    .where(eq(deliveryBatches.id, batchId));

  revalidateVendorTrackingPaths(batchId);
  redirectWithNotice(`/delivery-batches/${batchId}`, "Batch checked without customer status change.");
}
