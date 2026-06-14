import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShipmentExportCsv,
  buildShipmentExportFilename,
  canExportShipments,
  getShipmentExportColumns,
  isXlsxExportEnabled,
  parseShipmentExportFilters,
  sanitizeExportCellValue,
  xlsxExportUnavailableMessage,
} from "./core.ts";

test("validates default export filters with last 30 day date range", () => {
  const result = parseShipmentExportFilters(new URLSearchParams(), new Date(2026, 5, 15, 12));

  assert.deepEqual(result.errors, []);
  assert.equal(result.filters.scope, "summary");
  assert.equal(result.filters.format, "csv");
  assert.equal(result.filters.dateBasis, "created_at");
  assert.equal(result.filters.fromDate, "2026-05-16");
  assert.equal(result.filters.toDate, "2026-06-15");
});

test("rejects invalid date ranges and unsupported event-time summary filtering", () => {
  const params = new URLSearchParams({
    date_basis: "event_time",
    from_date: "2026-01-01",
    scope: "summary",
    to_date: "2026-06-15",
  });
  const result = parseShipmentExportFilters(params);

  assert.ok(result.errors.includes("Date range cannot exceed 90 days."));
  assert.ok(
    result.errors.includes(
      "Event time date basis is only available for tracking event detail exports.",
    ),
  );
});

test("parses tracking-event date filtering and internal event option", () => {
  const params = new URLSearchParams({
    date_basis: "event_time",
    from_date: "2026-06-01",
    include_internal_events: "true",
    scope: "tracking_events",
    to_date: "2026-06-30",
  });
  const result = parseShipmentExportFilters(params);

  assert.deepEqual(result.errors, []);
  assert.equal(result.filters.includeInternalEvents, true);
  assert.equal(result.filters.fromDateTime.getHours(), 0);
  assert.equal(result.filters.toDateTime.getHours(), 23);
  assert.equal(result.filters.toDateTime.getMinutes(), 59);
});

test("builds shipment summary CSV with safe escaping", () => {
  const csv = buildShipmentExportCsv(
    { includeInternalEvents: false, scope: "summary" },
    [
      {
        ambara_tracking_number: "AA26-TEST-0001",
        commodity: "General cargo",
        created_at: "2026-06-15T00:00:00.000Z",
        current_status: "delivered",
        customer_name: "ACME, Indonesia",
        customer_reference: "REF-1",
        destination_city: "Jakarta",
        latest_public_event_time: "2026-06-15T05:00:00.000Z",
        latest_public_status: "DELIVERED",
        origin_city: "Singapore",
        service_type: "DTD",
        shipper_name: "QA Shipper",
        shipper_phone: "+62000000001",
        total_parcels: 1,
        total_weight: 1.5,
        updated_at: "2026-06-15T05:00:00.000Z",
      },
    ],
  );

  assert.match(csv, /^ambara_tracking_number,customer_name,/);
  assert.match(csv, /"ACME, Indonesia"/);
  assert.match(csv, /AA26-TEST-0001/);
});

test("builds parcel detail CSV with phone numbers as plain text", () => {
  const csv = buildShipmentExportCsv(
    { includeInternalEvents: false, scope: "parcels" },
    [
      {
        ambara_parcel_id: "AA26-TEST-0001-001",
        ambara_tracking_number: "AA26-TEST-0001",
        commodity: "General cargo",
        created_at: "2026-06-15T00:00:00.000Z",
        customer_name: "ACME",
        customer_reference: "REF-1",
        destination_city: "Jakarta",
        parcel_number: 1,
        parcel_status: "DRAFT",
        pieces: 1,
        postal_code: "12190",
        receiver_address: "Jl Example 1",
        receiver_name: "Receiver",
        receiver_phone: "+628000000201",
        service_type: "DTD",
        shipment_status: "pending",
        updated_at: "2026-06-15T00:00:00.000Z",
        weight: 1.5,
      },
    ],
  );

  assert.match(csv, /receiver_phone/);
  assert.match(csv, /\+628000000201/);
});

test("builds vendor tracking export CSV", () => {
  const csv = buildShipmentExportCsv(
    { includeInternalEvents: false, scope: "vendor_tracking" },
    [
      {
        ambara_parcel_id: "AA26-TEST-0001-001",
        ambara_tracking_number: "AA26-TEST-0001",
        created_at: "2026-06-15T00:00:00.000Z",
        delivery_batch_code: "BATCH-001",
        last_vendor_event_time: "2026-06-15T02:00:00.000Z",
        last_vendor_status: "DELIVERED",
        parcel_status: "DELIVERED",
        pod_url: "https://example.com/pod",
        receiver_name: "Receiver",
        shipment_status: "delivered",
        updated_at: "2026-06-15T02:00:00.000Z",
        vendor_name: "Vendor",
        vendor_reference_number: "REF",
        vendor_service_type: "REG",
        vendor_tracking_number: "JNT0001",
      },
    ],
  );

  assert.match(csv, /^ambara_tracking_number,ambara_parcel_id,delivery_batch_code,/);
  assert.match(csv, /JNT0001/);
});

test("customer-visible tracking event export excludes internal notes by default", () => {
  const columns = getShipmentExportColumns({ includeInternalEvents: false, scope: "tracking_events" });
  const csv = buildShipmentExportCsv(
    { includeInternalEvents: false, scope: "tracking_events" },
    [
      {
        ambara_parcel_id: "",
        ambara_tracking_number: "AA26-TEST-0001",
        created_at: "2026-06-15T00:00:00.000Z",
        event_time: "2026-06-15T00:00:00.000Z",
        internal_note: "Do not export by default",
        label: "Delivered",
        location: "Jakarta",
        public_description: "Shipment has been delivered successfully.",
        source: "manual_portal_update",
        status_code: "DELIVERED",
        visible_to_customer: true,
      },
    ],
  );

  assert.equal(columns.some((column) => column.key === "internal_note"), false);
  assert.doesNotMatch(csv, /Do not export by default/);
  assert.match(csv, /Shipment has been delivered successfully\./);
});

test("internal event export includes internal note only when selected", () => {
  const columns = getShipmentExportColumns({ includeInternalEvents: true, scope: "tracking_events" });

  assert.equal(columns.some((column) => column.key === "internal_note"), true);
});

test("protects CSV cells from formula injection", () => {
  assert.equal(sanitizeExportCellValue("=IMPORTDATA(\"https://example.com\")"), "'=IMPORTDATA(\"https://example.com\")");
  assert.equal(sanitizeExportCellValue(" +SUM(1,2)"), "' +SUM(1,2)");
});

test("admin export access is limited to admin and superadmin roles", () => {
  assert.equal(canExportShipments({ role: "superadmin" }), true);
  assert.equal(canExportShipments({ role: "admin" }), true);
  assert.equal(canExportShipments({ role: "operations" }), false);
  assert.equal(canExportShipments({ role: "viewer" }), false);
});

test("XLSX export is disabled without a writer dependency", () => {
  assert.equal(isXlsxExportEnabled(), false);
  assert.equal(xlsxExportUnavailableMessage, "XLSX export is not enabled yet. Use CSV / Excel-compatible CSV.");
});

test("builds export filenames with scope and date range", () => {
  const filename = buildShipmentExportFilename({
    format: "csv",
    fromDate: "2026-06-01",
    scope: "vendor_tracking",
    toDate: "2026-06-30",
  });

  assert.equal(filename, "ambara_shipments_vendor_tracking_2026-06-01_to_2026-06-30.csv");
});
