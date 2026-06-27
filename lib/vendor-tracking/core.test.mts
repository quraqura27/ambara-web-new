import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVendorUploadRows,
  generateAmbaraTrackingNumber,
  isEligibleForDeliveryBatch,
  isInitialBulkImportShipmentStatus,
  isInitialBulkImportTrackingEvent,
  mapVendorStatus,
  matchVendorStatusRows,
  matchVendorTrackingRows,
  normalizeAmbaraTrackingNumberInput,
  parseDelimitedText,
  parseVendorReturnRows,
  prepareBulkShipmentImport,
  publicDescriptionForStatus,
  resolveAmbaraTrackingNumber,
  type MatchableBatchParcel,
} from "./core.ts";

const batchParcels: MatchableBatchParcel[] = [
  {
    id: 1,
    shipmentId: 10,
    ambaraParcelId: "AA26-TEST-0001-001",
    exportRowId: "BATCH-0001",
    vendorTrackingNumber: "JNT0001",
    receiverName: "Budi Santoso",
    receiverPhone: "+62 812 3000 0001",
    receiverAddress: "Jl Sudirman 10",
    destinationCity: "Jakarta",
    postalCode: "10220",
    currentStatus: "VENDOR_TRACKING_ASSIGNED",
  },
  {
    id: 2,
    shipmentId: 10,
    ambaraParcelId: "AA26-TEST-0001-002",
    exportRowId: "BATCH-0002",
    receiverName: "Sari Wijaya",
    receiverPhone: "+62 812 3000 0002",
    receiverAddress: "Jl Thamrin 20",
    destinationCity: "Jakarta",
    postalCode: "10310",
    currentStatus: "HANDED_TO_DELIVERY_PARTNER",
  },
];

test("validates bulk shipment rows with errors and warnings", () => {
  const rows = parseDelimitedText(`awb_number,destination_iata,customer_name,customer_reference,origin_city,receiver_name,receiver_phone,receiver_address,destination_city,postal_code,commodity,weight,pieces,service_type
126-9360193,KUL,ACME,REF-1,Bandung,Budi,+62812345678,Jl Sudirman 10,Jakarta,,General Cargo,12,1,DTD
126-1234567,ZZZ,ACME,REF-1,Bandung,,+62812456789,Jl Thamrin 20,Jakarta,10310,,0,0,UNKNOWN`);

  const preview = prepareBulkShipmentImport(rows);

  assert.equal(preview.summary.totalRows, 2);
  assert.equal(preview.summary.validRows, 1);
  assert.equal(preview.summary.errorRows, 1);
  assert.deepEqual(preview.rows[0]?.warnings.sort(), [
    "duplicate customer_reference",
    "missing postal_code",
  ]);
  assert.ok(preview.rows[1]?.errors.includes("missing receiver_name"));
  assert.ok(preview.rows[1]?.errors.includes("invalid pieces"));
  assert.ok(preview.rows[1]?.errors.includes("invalid service_type"));
});

test("requires delivery address only for DTD and PTD rows", () => {
  const rows = parseDelimitedText(`awb_number,destination_iata,origin_city,receiver_name,receiver_phone,receiver_address,destination_city,commodity,weight,pieces,service_type
126-9360193,SIN,Jakarta,Port Consignee,081230000001,,Singapore,General Cargo,5,2,DTP
126-1234567,TPE,Singapore,Door Receiver,081230000002,,Jakarta,General Cargo,5,2,PTD`);

  const preview = prepareBulkShipmentImport(rows);

  assert.equal(preview.rows[0]?.errors.length, 0);
  assert.ok(preview.rows[1]?.errors.includes("missing receiver_address for door delivery"));
});

test("normalizes mandatory AWB and four fixed flight columns", () => {
  const rows = parseDelimitedText(`awb_number,destination_iata,origin_city,receiver_name,receiver_phone,destination_city,commodity,weight,pieces,service_type,flight_1,flight_2,flight_3,flight_4
126-9360193,TPE,Jakarta,Port Consignee,081230000001,Singapore,General Cargo,5,2,DTP,GA820,A390,M0123,GA821`);

  const preview = prepareBulkShipmentImport(rows);

  assert.equal(preview.rows[0]?.data.awbNumber, "126-93601933");
  assert.equal(preview.rows[0]?.data.awbAirlineName, "Garuda Indonesia");
  assert.equal(preview.rows[0]?.data.originIata, "CGK");
  assert.equal(preview.rows[0]?.data.departureAirport, "Soekarno-Hatta International Airport");
  assert.equal(preview.rows[0]?.data.destinationIata, "TPE");
  assert.equal(preview.rows[0]?.data.destinationAirport, "Taiwan");
  assert.deepEqual(
    preview.rows[0]?.data.flightLegs.map((leg) => leg.formattedNumber),
    ["GA820", "A390", "M0123", "GA821"],
  );
});

test("requires AWB in bulk rows and permits the same AWB on independent shipments", () => {
  const missingAwb = prepareBulkShipmentImport(
    parseDelimitedText(`destination_iata,origin_city,receiver_name,receiver_phone,destination_city,commodity,weight,pieces,service_type
SIN,Jakarta,Port Consignee,081230000001,Singapore,General Cargo,5,2,DTP`),
  );
  assert.ok(missingAwb.rows[0]?.errors.includes("missing awb_number"));

  const sharedAwb = prepareBulkShipmentImport(
    parseDelimitedText(`awb_number,destination_iata,origin_city,receiver_name,receiver_phone,destination_city,commodity,weight,pieces,service_type
126-9360193,KUL,Jakarta,Consignee One,081230000001,Singapore,General Cargo,5,2,DTP
126-9360193,KUL,Jakarta,Consignee Two,081230000002,Singapore,General Cargo,6,3,DTP`),
  );
  assert.equal(sharedAwb.summary.validRows, 2);
  assert.equal(sharedAwb.summary.warningRows, 0);
});

test("bulk import rejects unknown destination IATA and allows blank receiver phone", () => {
  const preview = prepareBulkShipmentImport(
    parseDelimitedText(`awb_number,destination_iata,origin_city,receiver_name,receiver_phone,destination_city,commodity,weight,pieces,service_type
126-9360193,ZZZ,Jakarta,Consignee One,,Taiwan,General Cargo,5,2,DTP
126-9360193,DMK,Jakarta,Consignee Two,,Bangkok,General Cargo,6,3,DTP`),
  );

  assert.ok(preview.rows[0]?.errors.includes("invalid destination_iata"));
  assert.equal(preview.rows[1]?.errors.length, 0);
  assert.equal(preview.rows[1]?.data.destinationAirport, "Bangkok");
});

test("builds vendor upload rows with required Ambara references", () => {
  const rows = buildVendorUploadRows("BATCH", [
    {
      ambaraParcelId: "AA26-TEST-0001-001",
      receiverName: "Budi",
      receiverPhone: "+62812",
      receiverAddress: "Jl Sudirman 10",
      destinationCity: "Jakarta",
      postalCode: "10220",
      weight: 12,
      pieces: 1,
      commodity: "General Cargo",
      serviceType: "DTD",
      deliveryInstruction: "Call before delivery",
    },
  ]);

  assert.equal(rows[0]?.ambara_parcel_id, "AA26-TEST-0001-001");
  assert.equal(rows[0]?.export_row_id, "BATCH-0001");
});

test("bulk import tracking generator still creates Ambara tracking numbers", () => {
  assert.equal(generateAmbaraTrackingNumber(() => 0), "AA26-AAAA-AAAA");
});

test("bulk rollback accepts the received import state and initial import event", () => {
  assert.equal(isInitialBulkImportShipmentStatus("received"), true);
  assert.equal(
    isInitialBulkImportTrackingEvent({
      source: "csv_import",
      status: "pending",
      statusCode: "DRAFT",
    }),
    true,
  );
  assert.equal(
    isInitialBulkImportTrackingEvent({
      source: "excel_import",
      status: "received",
      statusCode: "RECEIVED",
    }),
    true,
  );
});

test("bulk rollback rejects later or non-import tracking activity", () => {
  assert.equal(isInitialBulkImportShipmentStatus("processed"), false);
  assert.equal(
    isInitialBulkImportTrackingEvent({
      source: "manual",
      status: "pending",
      statusCode: "DRAFT",
    }),
    false,
  );
  assert.equal(
    isInitialBulkImportTrackingEvent({
      source: "csv_import",
      status: "processed",
      statusCode: "PROCESSED",
    }),
    false,
  );
});

test("delivery batches include only active door-delivery shipments", () => {
  assert.equal(isEligibleForDeliveryBatch("DTD", "DRAFT"), true);
  assert.equal(isEligibleForDeliveryBatch("PTD", "PROCESSED"), true);
  assert.equal(isEligibleForDeliveryBatch("DTP", "DRAFT"), false);
  assert.equal(isEligibleForDeliveryBatch("PTP", "ARRIVED_DESTINATION"), false);
  assert.equal(isEligibleForDeliveryBatch("DTD", "DELIVERED"), false);
  assert.equal(isEligibleForDeliveryBatch("PTD", "RETURN_IN_PROGRESS"), false);
});

test("normalizes manual tracking number overrides", () => {
  assert.equal(normalizeAmbaraTrackingNumberInput(" ,aa26-test-0001 "), "AA26-TEST-0001");
});

test("manual create without tracking number generates a unique one", async () => {
  const resolved = await resolveAmbaraTrackingNumber("", async () => false, () => 0);

  assert.deepEqual(resolved, {
    generated: true,
    trackingNumber: "AA26-AAAA-AAAA",
  });
});

test("manual create retries generated tracking numbers until unique", async () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomValues = [
    ...Array.from({ length: 8 }, () => 0),
    ...Array.from({ length: 8 }, () => 1 / alphabet.length),
  ];
  const resolved = await resolveAmbaraTrackingNumber(
    "",
    async (trackingNumber) => trackingNumber === "AA26-AAAA-AAAA",
    () => randomValues.shift() ?? 0,
  );

  assert.deepEqual(resolved, {
    generated: true,
    trackingNumber: "AA26-BBBB-BBBB",
  });
});

test("manual duplicate tracking number override is rejected", async () => {
  await assert.rejects(
    resolveAmbaraTrackingNumber("AA26-EXISTING-0001", async () => true),
    /Tracking number AA26-EXISTING-0001 already exists\./,
  );
});

test("matches vendor tracking import by Ambara parcel ID and export row ID", () => {
  const rows = parseVendorReturnRows(`ambara_parcel_id,export_row_id,vendor_tracking_number
AA26-TEST-0001-002,,JNT0002
,BATCH-0001,JNT0003`);
  const unlinkedParcels = batchParcels.map((parcel) => ({
    ...parcel,
    currentStatus: "HANDED_TO_DELIVERY_PARTNER",
    vendorTrackingNumber: null,
  }));

  const result = matchVendorTrackingRows(rows, unlinkedParcels);

  assert.equal(result.summary.matchedRows, 2);
  assert.equal(result.matches[0]?.parcel?.id, 2);
  assert.equal(result.matches[0]?.matchMethod, "ambara_parcel_id");
  assert.equal(result.matches[1]?.parcel?.id, 1);
  assert.equal(result.matches[1]?.matchMethod, "export_row_id");
});

test("uses fallback matching only within the selected batch", () => {
  const rows = parseVendorReturnRows(`vendor_tracking_number,receiver_phone,receiver_name,receiver_address,destination_city,postal_code
JNT0004,+62 812 3000 0002,Sari Wijaya,Jl Thamrin 20,Jakarta,10310`);

  const result = matchVendorTrackingRows(rows, batchParcels);

  assert.equal(result.matches[0]?.parcel?.id, 2);
  assert.equal(result.matches[0]?.matchStatus, "auto_confirm");
  assert.equal(result.matches[0]?.matchMethod, "receiver_phone_full_address");
});

test("requires review for medium-confidence fallback matches", () => {
  const rows = parseVendorReturnRows(`vendor_tracking_number,receiver_phone,receiver_name
JNT0005,+62 812 3000 0002,Sari Wijaya`);

  const result = matchVendorTrackingRows(rows, batchParcels);

  assert.equal(result.matches[0]?.parcel?.id, 2);
  assert.equal(result.matches[0]?.matchStatus, "review_required");
  assert.equal(result.matches[0]?.matchMethod, "receiver_phone_receiver_name");
});

test("keeps low-confidence fallback rows unmatched", () => {
  const rows = parseVendorReturnRows(`vendor_tracking_number,receiver_name,destination_city
JNT0006,Sari Wijaya,Jakarta`);

  const result = matchVendorTrackingRows(rows, batchParcels);

  assert.equal(result.matches[0]?.parcel, null);
  assert.equal(result.matches[0]?.matchStatus, "unmatched");
});

test("rejects duplicate vendor tracking numbers", () => {
  const rows = parseVendorReturnRows(`ambara_parcel_id,vendor_tracking_number
AA26-TEST-0001-001,JNT0099
AA26-TEST-0001-002,JNT0099`);

  const result = matchVendorTrackingRows(rows, batchParcels);

  assert.equal(result.summary.duplicateRows, 2);
  assert.equal(result.matches.every((match) => match.matchStatus === "rejected"), true);
});

test("rejects vendor tracking already assigned to another Delivery Record in the same batch", () => {
  const rows = parseVendorReturnRows(`ambara_parcel_id,vendor_tracking_number
AA26-TEST-0001-002,JNT0001`);

  const result = matchVendorTrackingRows(rows, batchParcels);

  assert.equal(result.matches[0]?.matchStatus, "rejected");
  assert.ok(
    result.matches[0]?.errors.includes(
      "vendor tracking already assigned to another Delivery Record in this batch",
    ),
  );
});

test("rejects changing an already linked Delivery Record to a different vendor tracking number", () => {
  const rows = parseVendorReturnRows(`ambara_parcel_id,vendor_tracking_number
AA26-TEST-0001-001,JNT9999`);

  const result = matchVendorTrackingRows(rows, batchParcels);

  assert.equal(result.matches[0]?.matchStatus, "rejected");
  assert.ok(
    result.matches[0]?.errors.includes(
      "Delivery Record already has a different vendor tracking number",
    ),
  );
});

test("maps vendor raw statuses to customer-safe Ambara status descriptions", () => {
  const mapped = mapVendorStatus("Paket dibawa kurir", "JNT");

  assert.equal(mapped.statusCode, "OUT_FOR_DELIVERY");
  assert.equal(mapped.publicDescription, publicDescriptionForStatus("OUT_FOR_DELIVERY"));
});

test("matches bulk status updates by vendor tracking number", () => {
  const rows = parseVendorReturnRows(`vendor_tracking_number,status,event_time
JNT0001,Delivered,2026-06-13T10:00:00Z`);

  const [match] = matchVendorStatusRows(rows, batchParcels);

  assert.equal(match?.parcel?.id, 1);
  assert.equal(match?.oldStatus, "VENDOR_TRACKING_ASSIGNED");
  assert.equal(match?.newStatus, "DELIVERED");
  assert.equal(match?.publicDescription, "Shipment has been delivered successfully.");
});
