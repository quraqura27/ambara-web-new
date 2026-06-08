import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildBulkConsignmentNotePrintModel,
  buildConsignmentNoteBarcodeContent,
  buildPieceSequence,
  expandShipmentToConsignmentNoteLabels,
  normalizeConsignmentNoteIds,
} from "./label.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const printCss = readFileSync(
  resolve(repoRoot, "components/consignment-notes/consignment-note-print.module.css"),
  "utf8",
);

function shipment(overrides = {}) {
  return {
    trackingNumber: "SHOULD-NOT-BE-CN",
    internalTrackingNo: "AA26-K6AR-997L",
    mawb: "126-93601933",
    status: "arrived_destination",
    cargoType: "general",
    weightKg: "92",
    internalNotes: "Private note",
    dbSyncStatus: "SYNCED",
    generationStatus: "CREATED",
    title: "Jakarta to Sorong PTP",
    serviceType: "PTP",
    origin: "Jakarta, Indonesia",
    originIata: "cgk",
    destination: "Sorong, ID",
    destinationIata: "soq",
    shipperName: "NRL JKT",
    shipperAddress: "Private shipper address",
    shipperPhone: "+62 811-0000-0000",
    consigneeName: "NRL SOQ",
    consigneeAddress: "Private consignee address",
    consigneePhone: "+62 812-0000-0000",
    goodsDescription: "CONSOL",
    commodity: "General Cargo",
    totalPcs: 5,
    chargeableWeight: "92.00",
    createdAt: "2026-06-04T15:14:36.067Z",
    ...overrides,
  };
}

test("builds one label for a one-piece shipment", () => {
  const labels = expandShipmentToConsignmentNoteLabels(shipment({ totalPcs: 1 }));

  assert.equal(labels.length, 1);
  assert.equal(labels[0]?.trackingNo, "AA26-K6AR-997L");
  assert.equal(labels[0]?.pieceSequence, "1/1");
  assert.equal(labels[0]?.barcodeContent, "AA26-K6AR-997L-001-001");
  assert.equal(labels[0]?.chargeableWeight, "92");
  assert.equal(labels[0]?.createdDate, "2026-06-04");
  assert.equal(labels[0]?.originIata, "CGK");
  assert.equal(labels[0]?.destinationIata, "SOQ");
});

test("expands multi-piece shipment into sequential labels", () => {
  const labels = expandShipmentToConsignmentNoteLabels(shipment({ totalPcs: 5 }));

  assert.equal(labels.length, 5);
  assert.deepEqual(
    labels.map((label) => label.pieceSequence),
    ["1/5", "2/5", "3/5", "4/5", "5/5"],
  );
  assert.deepEqual(
    labels.map((label) => label.barcodeContent),
    [
      "AA26-K6AR-997L-001-005",
      "AA26-K6AR-997L-002-005",
      "AA26-K6AR-997L-003-005",
      "AA26-K6AR-997L-004-005",
      "AA26-K6AR-997L-005-005",
    ],
  );
});

test("builds barcode content and piece sequence with padded suffixes", () => {
  assert.deepEqual(buildPieceSequence(2, 12), {
    display: "2/12",
    pieceNoPadded: "002",
    totalPcsPadded: "012",
  });
  assert.equal(
    buildConsignmentNoteBarcodeContent("AA26-TEST-0001", 2, 12),
    "AA26-TEST-0001-002-012",
  );
});

test("falls back to one piece for missing or invalid piece counts", () => {
  assert.equal(expandShipmentToConsignmentNoteLabels(shipment({ totalPcs: null })).length, 1);
  assert.equal(expandShipmentToConsignmentNoteLabels(shipment({ totalPcs: 0 })).length, 1);
  assert.equal(expandShipmentToConsignmentNoteLabels(shipment({ totalPcs: "abc" })).length, 1);
});

test("preserves bulk input order and reports missing shipments", () => {
  const model = buildBulkConsignmentNotePrintModel(
    ["AA26-SECOND-0002", "AA26-MISSING-0000", "AA26-FIRST-0001"],
    [
      shipment({ internalTrackingNo: "AA26-FIRST-0001", totalPcs: 1 }),
      shipment({ internalTrackingNo: "AA26-SECOND-0002", totalPcs: 2 }),
    ],
  );

  assert.deepEqual(
    model.shipmentGroups.map((group) => group.trackingNo),
    ["AA26-SECOND-0002", "AA26-FIRST-0001"],
  );
  assert.equal(model.labels.length, 3);
  assert.deepEqual(model.missingTrackingNos, ["AA26-MISSING-0000"]);
});

test("normalizes pasted and comma-separated tracking IDs", () => {
  assert.deepEqual(
    normalizeConsignmentNoteIds(" aa26-first-0001\nAA26-SECOND-0002, aa26-third-0003 "),
    ["AA26-FIRST-0001", "AA26-SECOND-0002", "AA26-THIRD-0003"],
  );
});

test("excludes MAWB, status, cargo, weight, notes, sync, and generation fields", () => {
  const [label] = expandShipmentToConsignmentNoteLabels(shipment());
  assert.ok(label);

  const keys = new Set(Object.keys(label));
  [
    "mawb",
    "status",
    "currentStatus",
    "cargoType",
    "weightKg",
    "internalNotes",
    "dbSyncStatus",
    "dbSyncedAt",
    "dbSyncError",
    "generationStatus",
    "readyToGenerate",
    "trackingCreatedAt",
  ].forEach((key) => assert.equal(keys.has(key), false, key));
});

test("print stylesheet fixes the physical 150mm x 100mm landscape label contract", () => {
  assert.match(printCss, /@page\s*{[\s\S]*size:\s*150mm 100mm;[\s\S]*margin:\s*0;[\s\S]*}/);
  assert.match(printCss, /\.labelPage\s*{[\s\S]*width:\s*150mm;[\s\S]*height:\s*100mm;/);
  assert.match(printCss, /box-sizing:\s*border-box;/);
  assert.match(printCss, /overflow:\s*hidden;/);
  assert.match(printCss, /page-break-after:\s*always;/);
  assert.match(printCss, /break-after:\s*page;/);
  assert.match(printCss, /@media print\s*{[\s\S]*:global\(html\),[\s\S]*:global\(body\)[\s\S]*margin:\s*0 !important;[\s\S]*padding:\s*0 !important;/);
  assert.match(printCss, /@media print\s*{[\s\S]*\.toolbar,[\s\S]*\.missingPanel\s*{[\s\S]*display:\s*none !important;/);
  assert.doesNotMatch(printCss, /(^|[;{\s])zoom\s*:/);
  assert.doesNotMatch(printCss, /(^|[;{\s])transform\s*:/);
  assert.doesNotMatch(printCss, /\b\d+(?:\.\d+)?v[hw]\b/);
});

test("print stylesheet clamps long fields inside fixed label sections", () => {
  assert.match(printCss, /\.fieldValue\s*{[\s\S]*-webkit-line-clamp:\s*2;/);
  assert.match(printCss, /\.partyName\s*{[\s\S]*-webkit-line-clamp:\s*1;/);
  assert.match(printCss, /\.partyDetail\s*{[\s\S]*-webkit-line-clamp:\s*2;/);
  assert.match(printCss, /\.terms\s*{[\s\S]*-webkit-line-clamp:\s*2;/);
  assert.match(printCss, /\.barcode\s*{[\s\S]*height:\s*10\.5mm;/);
  assert.match(printCss, /\.qrGraphic,[\s\S]*\.qrGraphic svg\s*{[\s\S]*width:\s*16\.5mm;[\s\S]*height:\s*16\.5mm;/);
});
