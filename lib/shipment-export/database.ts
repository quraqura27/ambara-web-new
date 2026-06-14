import "server-only";

import { and, asc, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customers,
  deliveryBatches,
  parcels,
  parcelVendorTracking,
  shipments,
  trackingEvents,
} from "@/lib/db/schema";
import {
  shipmentExportMaxRows,
  type ShipmentExportFilters,
  type ShipmentExportScope,
} from "@/lib/shipment-export/core";

export class ShipmentExportTooLargeError extends Error {
  constructor(readonly maxRows = shipmentExportMaxRows) {
    super(`Export exceeds ${maxRows} rows. Narrow the filters and try again.`);
    this.name = "ShipmentExportTooLargeError";
  }
}

export type ShipmentExportRow = Record<string, unknown>;

export type ShipmentExportPreview = {
  isTooLarge: boolean;
  maxRows: number;
  rowCount: number;
};

function combineConditions(conditions: SQL[]) {
  return conditions.length ? and(...conditions) : undefined;
}

function contains(value: string) {
  return `%${value}%`;
}

function numberValue(value: unknown) {
  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function timestampValue(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function customerName(row: {
  customerCompanyName?: string | null;
  customerFullName?: string | null;
  shipmentCustomerName?: string | null;
}) {
  return row.customerCompanyName || row.customerFullName || row.shipmentCustomerName || "";
}

function appendShipmentDateCondition(conditions: SQL[], filters: ShipmentExportFilters) {
  if (filters.dateBasis === "created_at") {
    conditions.push(gte(shipments.createdAt, filters.fromDateTime));
    conditions.push(lte(shipments.createdAt, filters.toDateTime));
  }

  if (filters.dateBasis === "updated_at") {
    conditions.push(gte(shipments.updatedAt, filters.fromDateTime));
    conditions.push(lte(shipments.updatedAt, filters.toDateTime));
  }

  if (filters.dateBasis === "delivered_at") {
    conditions.push(gte(shipments.deliveredAt, filters.fromDateTime));
    conditions.push(lte(shipments.deliveredAt, filters.toDateTime));
  }
}

function appendCommonFilters(conditions: SQL[], filters: ShipmentExportFilters) {
  if (filters.status !== "all") {
    conditions.push(eq(shipments.status, filters.status));
  }

  if (filters.customer) {
    const pattern = contains(filters.customer);
    const condition = or(
      ilike(shipments.customerName, pattern),
      ilike(shipments.customerEmail, pattern),
      ilike(shipments.customerReference, pattern),
      ilike(customers.fullName, pattern),
      ilike(customers.companyName, pattern),
      ilike(customers.email, pattern),
    );

    if (condition) {
      conditions.push(condition);
    }
  }

  if (filters.origin) {
    conditions.push(ilike(shipments.origin, contains(filters.origin)));
  }

  if (filters.destination) {
    const pattern = contains(filters.destination);
    const condition = or(ilike(shipments.destination, pattern), ilike(parcels.destinationCity, pattern));

    if (condition) {
      conditions.push(condition);
    }
  }

  if (filters.serviceType) {
    const pattern = contains(filters.serviceType);
    const condition = or(ilike(shipments.serviceType, pattern), ilike(parcels.serviceType, pattern));

    if (condition) {
      conditions.push(condition);
    }
  }

  if (filters.vendor) {
    const pattern = contains(filters.vendor);
    const condition = or(
      ilike(parcelVendorTracking.vendorName, pattern),
      ilike(deliveryBatches.vendorName, pattern),
    );

    if (condition) {
      conditions.push(condition);
    }
  }

  if (filters.deliveryBatch) {
    const pattern = contains(filters.deliveryBatch);
    const batchId = Number.parseInt(filters.deliveryBatch, 10);
    const condition = Number.isInteger(batchId)
      ? or(ilike(deliveryBatches.batchCode, pattern), eq(deliveryBatches.id, batchId))
      : ilike(deliveryBatches.batchCode, pattern);

    if (condition) {
      conditions.push(condition);
    }
  }
}

function scopeNeedsShipmentDate(scope: ShipmentExportScope, filters: ShipmentExportFilters) {
  return scope !== "tracking_events" || filters.dateBasis !== "event_time";
}

async function getSummaryRows(filters: ShipmentExportFilters, limit: number) {
  const conditions: SQL[] = [];

  appendShipmentDateCondition(conditions, filters);
  appendCommonFilters(conditions, filters);

  const shipmentRows = await db
    .selectDistinct({
      id: shipments.id,
      trackingNumber: shipments.trackingNumber,
      customerReference: shipments.customerReference,
      shipperName: shipments.shipperName,
      shipperPhone: shipments.shipperPhone,
      origin: shipments.origin,
      destination: shipments.destination,
      serviceType: shipments.serviceType,
      commodity: shipments.commodity,
      goodsDescription: shipments.goodsDescription,
      status: shipments.status,
      shipmentCustomerName: shipments.customerName,
      customerFullName: customers.fullName,
      customerCompanyName: customers.companyName,
      createdAt: shipments.createdAt,
      updatedAt: shipments.updatedAt,
    })
    .from(shipments)
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(parcels, eq(parcels.shipmentId, shipments.id))
    .leftJoin(parcelVendorTracking, eq(parcelVendorTracking.parcelId, parcels.id))
    .leftJoin(deliveryBatches, eq(parcelVendorTracking.deliveryBatchId, deliveryBatches.id))
    .where(combineConditions(conditions))
    .orderBy(desc(shipments.createdAt))
    .limit(limit);

  const shipmentIds = shipmentRows.map((row) => row.id);

  if (shipmentIds.length === 0) {
    return [];
  }

  const parcelRows = await db
    .select({
      shipmentId: parcels.shipmentId,
      weight: parcels.weight,
    })
    .from(parcels)
    .where(inArray(parcels.shipmentId, shipmentIds));

  const eventRows = await db
    .select({
      eventTime: trackingEvents.eventTime,
      shipmentId: trackingEvents.shipmentId,
      status: trackingEvents.status,
      statusCode: trackingEvents.statusCode,
    })
    .from(trackingEvents)
    .where(and(inArray(trackingEvents.shipmentId, shipmentIds), eq(trackingEvents.visibleToCustomer, true)))
    .orderBy(desc(trackingEvents.eventTime));

  const parcelStats = new Map<number, { count: number; weight: number }>();
  for (const parcel of parcelRows) {
    const current = parcelStats.get(parcel.shipmentId) ?? { count: 0, weight: 0 };
    current.count += 1;
    current.weight += numberValue(parcel.weight);
    parcelStats.set(parcel.shipmentId, current);
  }

  const latestEventByShipment = new Map<number, (typeof eventRows)[number]>();
  for (const event of eventRows) {
    if (!latestEventByShipment.has(event.shipmentId)) {
      latestEventByShipment.set(event.shipmentId, event);
    }
  }

  return shipmentRows.map((shipment) => {
    const stats = parcelStats.get(shipment.id);
    const latestEvent = latestEventByShipment.get(shipment.id);

    return {
      ambara_tracking_number: shipment.trackingNumber,
      customer_name: customerName(shipment),
      customer_reference: shipment.customerReference ?? "",
      shipper_name: shipment.shipperName ?? "",
      shipper_phone: shipment.shipperPhone ?? "",
      origin_city: shipment.origin,
      destination_city: shipment.destination,
      service_type: shipment.serviceType ?? "",
      commodity: shipment.commodity ?? shipment.goodsDescription ?? "",
      current_status: shipment.status,
      total_parcels: stats?.count ?? 0,
      total_weight: stats?.weight ?? "",
      created_at: timestampValue(shipment.createdAt),
      updated_at: timestampValue(shipment.updatedAt),
      latest_public_status: latestEvent?.status ?? latestEvent?.statusCode ?? "",
      latest_public_event_time: timestampValue(latestEvent?.eventTime),
    } satisfies ShipmentExportRow;
  });
}

async function getParcelRows(filters: ShipmentExportFilters, limit: number) {
  const conditions: SQL[] = [];

  appendShipmentDateCondition(conditions, filters);
  appendCommonFilters(conditions, filters);

  const rows = await db
    .select({
      trackingNumber: shipments.trackingNumber,
      customerReference: shipments.customerReference,
      shipmentStatus: shipments.status,
      shipmentCustomerName: shipments.customerName,
      customerFullName: customers.fullName,
      customerCompanyName: customers.companyName,
      ambaraParcelId: parcels.ambaraParcelId,
      parcelNumber: parcels.parcelNumber,
      receiverName: parcels.receiverName,
      receiverPhone: parcels.receiverPhone,
      receiverAddress: parcels.receiverAddress,
      destinationCity: parcels.destinationCity,
      postalCode: parcels.postalCode,
      weight: parcels.weight,
      pieces: parcels.pieces,
      commodity: parcels.commodity,
      serviceType: parcels.serviceType,
      parcelStatus: parcels.currentStatus,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .innerJoin(shipments, eq(parcels.shipmentId, shipments.id))
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(parcelVendorTracking, eq(parcelVendorTracking.parcelId, parcels.id))
    .leftJoin(deliveryBatches, eq(parcelVendorTracking.deliveryBatchId, deliveryBatches.id))
    .where(combineConditions(conditions))
    .orderBy(desc(shipments.createdAt), asc(parcels.parcelNumber))
    .limit(limit);

  return rows.map((row) => ({
    ambara_tracking_number: row.trackingNumber,
    ambara_parcel_id: row.ambaraParcelId,
    parcel_number: row.parcelNumber,
    customer_name: customerName(row),
    customer_reference: row.customerReference ?? "",
    receiver_name: row.receiverName,
    receiver_phone: row.receiverPhone,
    receiver_address: row.receiverAddress,
    destination_city: row.destinationCity,
    postal_code: row.postalCode ?? "",
    weight: row.weight ?? "",
    pieces: row.pieces,
    commodity: row.commodity ?? "",
    service_type: row.serviceType ?? "",
    parcel_status: row.parcelStatus,
    shipment_status: row.shipmentStatus,
    created_at: timestampValue(row.createdAt),
    updated_at: timestampValue(row.updatedAt),
  }));
}

async function getVendorTrackingRows(filters: ShipmentExportFilters, limit: number) {
  const conditions: SQL[] = [];

  appendShipmentDateCondition(conditions, filters);
  appendCommonFilters(conditions, filters);

  const rows = await db
    .select({
      trackingNumber: shipments.trackingNumber,
      shipmentStatus: shipments.status,
      ambaraParcelId: parcels.ambaraParcelId,
      parcelStatus: parcels.currentStatus,
      batchCode: deliveryBatches.batchCode,
      batchVendorName: deliveryBatches.vendorName,
      batchVendorServiceType: deliveryBatches.vendorServiceType,
      vendorName: parcelVendorTracking.vendorName,
      vendorTrackingNumber: parcelVendorTracking.vendorTrackingNumber,
      vendorReferenceNumber: parcelVendorTracking.vendorReferenceNumber,
      lastVendorStatus: parcelVendorTracking.lastVendorStatus,
      lastVendorEventTime: parcelVendorTracking.lastVendorEventTime,
      podUrl: parcelVendorTracking.podUrl,
      receiverName: parcelVendorTracking.receiverName,
      parcelReceiverName: parcels.receiverName,
      createdAt: parcelVendorTracking.createdAt,
      updatedAt: parcelVendorTracking.updatedAt,
    })
    .from(parcelVendorTracking)
    .innerJoin(parcels, eq(parcelVendorTracking.parcelId, parcels.id))
    .innerJoin(shipments, eq(parcels.shipmentId, shipments.id))
    .innerJoin(deliveryBatches, eq(parcelVendorTracking.deliveryBatchId, deliveryBatches.id))
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .where(combineConditions(conditions))
    .orderBy(desc(parcelVendorTracking.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ambara_tracking_number: row.trackingNumber,
    ambara_parcel_id: row.ambaraParcelId,
    delivery_batch_code: row.batchCode,
    vendor_name: row.vendorName || row.batchVendorName,
    vendor_service_type: row.batchVendorServiceType ?? "",
    vendor_tracking_number: row.vendorTrackingNumber ?? "",
    vendor_reference_number: row.vendorReferenceNumber ?? "",
    last_vendor_status: row.lastVendorStatus ?? "",
    last_vendor_event_time: timestampValue(row.lastVendorEventTime),
    pod_url: row.podUrl ?? "",
    receiver_name: row.receiverName ?? row.parcelReceiverName,
    parcel_status: row.parcelStatus,
    shipment_status: row.shipmentStatus,
    created_at: timestampValue(row.createdAt),
    updated_at: timestampValue(row.updatedAt),
  }));
}

async function getTrackingEventRows(filters: ShipmentExportFilters, limit: number) {
  const conditions: SQL[] = [];

  if (scopeNeedsShipmentDate("tracking_events", filters)) {
    appendShipmentDateCondition(conditions, filters);
  } else {
    conditions.push(gte(trackingEvents.eventTime, filters.fromDateTime));
    conditions.push(lte(trackingEvents.eventTime, filters.toDateTime));
  }

  appendCommonFilters(conditions, filters);

  if (!filters.includeInternalEvents) {
    conditions.push(eq(trackingEvents.visibleToCustomer, true));
  }

  const rows = await db
    .select({
      trackingNumber: shipments.trackingNumber,
      ambaraParcelId: parcels.ambaraParcelId,
      statusCode: trackingEvents.statusCode,
      label: trackingEvents.label,
      publicDescription: trackingEvents.publicDescription,
      description: trackingEvents.description,
      internalNote: trackingEvents.internalNote,
      location: trackingEvents.location,
      eventTime: trackingEvents.eventTime,
      source: trackingEvents.source,
      visibleToCustomer: trackingEvents.visibleToCustomer,
      createdAt: trackingEvents.createdAt,
    })
    .from(trackingEvents)
    .innerJoin(shipments, eq(trackingEvents.shipmentId, shipments.id))
    .leftJoin(parcels, eq(trackingEvents.parcelId, parcels.id))
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(parcelVendorTracking, eq(parcelVendorTracking.parcelId, parcels.id))
    .leftJoin(deliveryBatches, eq(parcelVendorTracking.deliveryBatchId, deliveryBatches.id))
    .where(combineConditions(conditions))
    .orderBy(desc(trackingEvents.eventTime))
    .limit(limit);

  return rows.map((row) => ({
    ambara_tracking_number: row.trackingNumber,
    ambara_parcel_id: row.ambaraParcelId ?? "",
    status_code: row.statusCode,
    label: row.label,
    public_description: row.publicDescription ?? "",
    location: row.location ?? "",
    event_time: timestampValue(row.eventTime),
    source: row.source,
    visible_to_customer: row.visibleToCustomer,
    created_at: timestampValue(row.createdAt),
    description: filters.includeInternalEvents ? row.description ?? "" : undefined,
    internal_note: filters.includeInternalEvents ? row.internalNote ?? "" : undefined,
  }));
}

export async function getShipmentExportRows(filters: ShipmentExportFilters, maxRows = shipmentExportMaxRows) {
  const limit = maxRows + 1;
  const rows =
    filters.scope === "summary"
      ? await getSummaryRows(filters, limit)
      : filters.scope === "parcels"
        ? await getParcelRows(filters, limit)
        : filters.scope === "vendor_tracking"
          ? await getVendorTrackingRows(filters, limit)
          : await getTrackingEventRows(filters, limit);

  if (rows.length > maxRows) {
    throw new ShipmentExportTooLargeError(maxRows);
  }

  return rows;
}

export async function getShipmentExportPreview(
  filters: ShipmentExportFilters,
  maxRows = shipmentExportMaxRows,
): Promise<ShipmentExportPreview> {
  const rows =
    filters.scope === "summary"
      ? await getSummaryRows(filters, maxRows + 1)
      : filters.scope === "parcels"
        ? await getParcelRows(filters, maxRows + 1)
        : filters.scope === "vendor_tracking"
          ? await getVendorTrackingRows(filters, maxRows + 1)
          : await getTrackingEventRows(filters, maxRows + 1);

  return {
    isTooLarge: rows.length > maxRows,
    maxRows,
    rowCount: Math.min(rows.length, maxRows),
  };
}
