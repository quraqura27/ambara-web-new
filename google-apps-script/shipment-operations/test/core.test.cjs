const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scriptPaths = [
  path.resolve(__dirname, "../Code.gs"),
  path.resolve(__dirname, "../TrackingMilestones.gs"),
];
const sandbox = {
  console,
  module: { exports: {} },
};

vm.createContext(sandbox);
scriptPaths.forEach((scriptPath) => {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), sandbox, {
    filename: scriptPath,
  });
});

const core = sandbox.module.exports;

function validRow(overrides = {}) {
  return {
    ready_to_generate: true,
    internal_tracking_no: "",
    tracking_created_at: "",
    generation_status: "",
    mawb: "999-00000000",
    title: "Shipment 999-00000000",
    current_status: "pending",
    service_type: "airport_to_airport",
    sla_days: "",
    origin: "Jakarta",
    origin_iata: "CGK",
    destination: "Singapore",
    destination_iata: "SIN",
    customer_name: "MARS Express",
    commodity: "General cargo",
    total_pcs: 1,
    weight_kg: 12.5,
    chargeable_weight: 13,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

class FakeRange {
  constructor(sheet, row, column, rowCount, columnCount) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
  }

  getValues() {
    const values = [];

    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      const rowValues = [];
      for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
        rowValues.push(this.sheet.getCell_(this.row + rowOffset, this.column + columnOffset));
      }
      values.push(rowValues);
    }

    return values;
  }

  setValues(values) {
    values.forEach((rowValues, rowOffset) => {
      rowValues.forEach((value, columnOffset) => {
        this.sheet.setCell_(this.row + rowOffset, this.column + columnOffset, value);
      });
    });
  }

  setValue(value) {
    this.sheet.setCell_(this.row, this.column, value);
  }
}

class FakeSheet {
  constructor(name, rows, maxRows = rows.length) {
    this.name = name;
    this.rows = rows.map((row) => row.slice());
    this.maxRows = Math.max(maxRows, this.rows.length);
  }

  getName() {
    return this.name;
  }

  getLastColumn() {
    return this.rows.reduce((max, row) => Math.max(max, row.length), 0);
  }

  getLastRow() {
    for (let index = this.rows.length - 1; index >= 0; index -= 1) {
      if (this.rows[index].some((value) => String(value ?? "").trim() !== "")) {
        return index + 1;
      }
    }

    return 0;
  }

  getMaxRows() {
    return this.maxRows;
  }

  getRange(row, column, rowCount = 1, columnCount = 1) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  insertRowAfter(row) {
    while (this.rows.length < row) {
      this.rows.push([]);
    }
    this.rows.splice(row, 0, []);
    this.maxRows = Math.max(this.maxRows + 1, this.rows.length);
  }

  getCell_(row, column) {
    return (this.rows[row - 1] && this.rows[row - 1][column - 1]) ?? "";
  }

  setCell_(row, column, value) {
    while (this.rows.length < row) {
      this.rows.push([]);
    }
    while (this.rows[row - 1].length < column) {
      this.rows[row - 1].push("");
    }
    this.rows[row - 1][column - 1] = value;
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.sheets = sheets;
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }
}

const eventHeaders = [
  "internal_tracking_no",
  "event_time",
  "status",
  "label",
  "description",
  "location",
  "visible_publicly",
  "updated_by",
];

const listHeaders = [
  "tracking_status",
  "tracking_label",
  "tracking_description",
];

function listRow(overrides = {}) {
  return [
    overrides.status ?? core.SHIPMENT_GENERATOR_CONFIG.initialEvent.status,
    overrides.label ?? core.SHIPMENT_GENERATOR_CONFIG.initialEvent.label,
    overrides.description ?? core.SHIPMENT_GENERATOR_CONFIG.initialEvent.description,
  ];
}

function shipmentSheetWithRows(rows) {
  const headers = Object.keys(validRow());
  return new FakeSheet(
    "Shipments",
    [
      headers,
      ...rows.map((row) => headers.map((header) => row[header] ?? "")),
    ],
    10,
  );
}

const bulkHeaders = [
  "process_update",
  "internal_tracking_no",
  "new_status",
  "event_time",
  "label",
  "description",
  "location",
  "visible_publicly",
  "processing_status",
  "processed_at",
];

function bulkRow(overrides = {}) {
  const defaults = {
    process_update: true,
    internal_tracking_no: "AA26-TEST-0001",
    new_status: "processed",
    event_time: new Date("2026-06-05T02:00:00.000Z"),
    label: "Shipment processed at origin",
    description: "Cargo has been processed and prepared for onward movement.",
    location: "Jakarta, Indonesia",
    visible_publicly: true,
    processing_status: "",
    processed_at: "",
    ...overrides,
  };

  return bulkHeaders.map((header) => defaults[header] ?? "");
}

function milestoneSpreadsheet({ bulkRows = [bulkRow()], events = [] } = {}) {
  const createdAt = new Date("2026-06-04T15:14:36.067Z");
  const shipmentsSheet = shipmentSheetWithRows([
    validRow({
      ready_to_generate: false,
      internal_tracking_no: "AA26-TEST-0001",
      tracking_created_at: createdAt,
      generation_status: "CREATED",
      current_status: "pending",
      origin: "Jakarta, Indonesia",
      created_at: createdAt,
      updated_at: createdAt,
    }),
  ]);
  const eventsSheet = new FakeSheet(
    "Tracking_Events",
    [
      eventHeaders,
      [
        "AA26-TEST-0001",
        createdAt,
        "pending",
        "Electronic information received",
        "Shipment information has been received and is awaiting physical handling.",
        "Jakarta, Indonesia",
        true,
        "ShipmentGenerator",
      ],
      ...events,
    ],
    12,
  );
  const listsSheet = new FakeSheet(
    "Lists",
    [
      listHeaders,
      listRow(),
      [
        "processed",
        "Shipment processed at origin",
        "Cargo has been processed and prepared for onward movement.",
      ],
      [
        "in_transit",
        "Departed origin airport",
        "Shipment has departed from the origin airport.",
      ],
    ],
    12,
  );
  const bulkSheet = new FakeSheet(
    "Bulk_Status_Updates",
    [bulkHeaders, ...bulkRows],
    12,
  );

  return {
    bulkSheet,
    eventsSheet,
    shipmentsSheet,
    spreadsheet: new FakeSpreadsheet({
      Shipments: shipmentsSheet,
      Tracking_Events: eventsSheet,
      Lists: listsSheet,
      Bulk_Status_Updates: bulkSheet,
    }),
  };
}

test("generates the AA26-XXXX-XXXX tracking-number format", () => {
  const trackingNumber = core.generateTrackingNumber_(() => 0);
  assert.match(trackingNumber, /^AA26-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test("retries when a generated tracking number already exists", () => {
  const existingNumbers = { "AA26-AAAA-AAAA": true };
  const sequence = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04,
  ];
  const trackingNumber = core.generateUniqueTrackingNumber_(
    existingNumbers,
    () => sequence.shift() ?? 0.04,
    2,
    core.SHIPMENT_GENERATOR_CONFIG,
  );

  assert.equal(trackingNumber, "AA26-BBBB-BBBB");
});

test("rejects rows with missing required fields", () => {
  const result = core.validateShipmentInput_(
    validRow({ mawb: "", customer_name: "" }),
    core.SHIPMENT_GENERATOR_CONFIG,
  );

  assert.equal(result.ok, false);
  assert.equal(result.error, "ERROR: Missing mawb, customer_name");
});

test("validates the initial tracking tuple against Lists rows", () => {
  const headerMap = core.buildHeaderMap_(listHeaders);
  const result = core.findInitialTrackingTupleInRows_(
    [listRow()],
    headerMap,
    core.SHIPMENT_GENERATOR_CONFIG.initialEvent,
  );

  assert.equal(result.ok, true);
  assert.equal(result.tuple.status, "pending");
  assert.equal(result.tuple.label, "Electronic information received");
  assert.equal(
    result.tuple.description,
    "Shipment information has been received and is awaiting physical handling.",
  );
});

test("rejects generation when the initial tracking tuple is missing", () => {
  const now = new Date("2026-06-04T00:00:00.000Z");
  const result = core.prepareShipmentGenerationUpdate_(
    validRow(),
    {},
    now,
    {
      config: core.SHIPMENT_GENERATOR_CONFIG,
      initialEventTupleResult: {
        ok: false,
        error: "ERROR: Initial tracking tuple not found in Lists",
      },
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.generated, false);
  assert.equal(result.updates.generation_status, "ERROR: Initial tracking tuple not found in Lists");
  assert.equal(result.updates.internal_tracking_no, undefined);
});

test("does not overwrite a successful CREATED rerun", () => {
  const now = new Date("2026-06-04T00:00:00.000Z");
  const result = core.prepareShipmentGenerationUpdate_(
    validRow({
      internal_tracking_no: "AA26-ZZZZ-ZZZZ",
      generation_status: "CREATED",
      ready_to_generate: true,
    }),
    {},
    now,
  );

  assert.equal(result.ok, true);
  assert.equal(result.generated, false);
  assert.equal(result.alreadyCreated, true);
  assert.equal(result.trackingNumber, "AA26-ZZZZ-ZZZZ");
  assert.equal(result.status, "CREATED");
  assert.deepEqual(Object.keys(result.updates), []);
});

test("does not replace an existing tracking number without CREATED status", () => {
  const now = new Date("2026-06-04T00:00:00.000Z");
  const result = core.prepareShipmentGenerationUpdate_(
    validRow({ internal_tracking_no: "AA26-ZZZZ-ZZZZ", generation_status: "" }),
    {},
    now,
  );

  assert.equal(result.ok, true);
  assert.equal(result.generated, false);
  assert.equal(result.alreadyCreated, true);
  assert.equal(result.trackingNumber, "AA26-ZZZZ-ZZZZ");
  assert.equal(result.updates.generation_status, "ALREADY_CREATED");
  assert.equal(result.updates.ready_to_generate, false);
  assert.equal(result.updates.internal_tracking_no, undefined);
});

test("does not define a simple onEdit automatic processor", () => {
  assert.equal(typeof sandbox.onEdit, "undefined");
});

test("looks up columns by header name", () => {
  const headers = ["mawb", "ready_to_generate", "internal_tracking_no"];
  const map = core.buildHeaderMap_(headers);
  const row = core.rowValuesToObject_(headers, ["999-00000000", true, ""]);

  assert.equal(map.ready_to_generate, 1);
  assert.equal(map.internal_tracking_no, 2);
  assert.equal(row.mawb, "999-00000000");
  assert.equal(row.ready_to_generate, true);
});

test("appends the initial tracking event exactly once", () => {
  const now = new Date("2026-06-04T15:14:36.067Z");
  const eventsSheet = new FakeSheet("Tracking_Events", [eventHeaders], 8);
  const tuple = {
    status: "pending",
    label: "Electronic information received",
    description: "Shipment information has been received and is awaiting physical handling.",
  };
  const eventRecord = core.buildInitialTrackingEventRecord_(
    "AA26-TEST-0001",
    validRow({ origin: "Jakarta, Indonesia" }),
    now,
    tuple,
    core.SHIPMENT_GENERATOR_CONFIG,
  );

  const firstResult = core.appendInitialTrackingEventIfMissing_(
    eventsSheet,
    eventRecord,
    core.SHIPMENT_GENERATOR_CONFIG,
  );
  const secondResult = core.appendInitialTrackingEventIfMissing_(
    eventsSheet,
    eventRecord,
    core.SHIPMENT_GENERATOR_CONFIG,
  );

  assert.equal(firstResult.appended, true);
  assert.equal(secondResult.alreadyPresent, true);
  assert.equal(
    eventsSheet.rows.filter((row) => row[0] === "AA26-TEST-0001").length,
    1,
  );
});

test("targeted backfill for AA26-TEST-0001 preserves shipment fields", () => {
  const createdAt = new Date("2026-06-04T15:14:36.067Z");
  const shipment = validRow({
    ready_to_generate: false,
    internal_tracking_no: "AA26-TEST-0001",
    tracking_created_at: createdAt,
    generation_status: "CREATED",
    origin: "Jakarta, Indonesia",
    created_at: createdAt,
    updated_at: createdAt,
  });
  const shipmentsSheet = shipmentSheetWithRows([shipment]);
  const eventsSheet = new FakeSheet("Tracking_Events", [eventHeaders], 8);
  const listsSheet = new FakeSheet("Lists", [listHeaders, listRow()], 8);
  const spreadsheet = new FakeSpreadsheet({
    Shipments: shipmentsSheet,
    Tracking_Events: eventsSheet,
    Lists: listsSheet,
  });

  const firstSummary = core.backfillMissingInitialTrackingEventsForTargets_(
    spreadsheet,
    ["AA26-TEST-0001"],
    core.SHIPMENT_GENERATOR_CONFIG,
  );
  const secondSummary = core.backfillMissingInitialTrackingEventsForTargets_(
    spreadsheet,
    ["AA26-TEST-0001"],
    core.SHIPMENT_GENERATOR_CONFIG,
  );

  assert.equal(firstSummary.appended, 1);
  assert.equal(firstSummary.errors, 0);
  assert.equal(secondSummary.appended, 0);
  assert.equal(secondSummary.alreadyPresent, 1);
  assert.equal(shipmentsSheet.rows[1][1], "AA26-TEST-0001");
  assert.equal(shipmentsSheet.rows[1][3], "CREATED");
  assert.equal(
    eventsSheet.rows.filter((row) => row[0] === "AA26-TEST-0001").length,
    1,
  );
});

test("tracking event rows remain public-field allowlisted", () => {
  const now = new Date("2026-06-04T15:14:36.067Z");
  const row = core.buildTrackingEventRow_(eventHeaders, {
    internal_tracking_no: "AA26-TEST-0001",
    event_time: now,
    status: "pending",
    label: "Electronic information received",
    description: "Shipment information has been received and is awaiting physical handling.",
    location: "Jakarta, Indonesia",
    visible_publicly: true,
    updated_by: "ShipmentGenerator",
    customer_name: "MARS Express",
    consignee_phone: "+62 800-0000-0000",
    generation_status: "CREATED",
  });

  assert.deepEqual(row, [
    "AA26-TEST-0001",
    now,
    "pending",
    "Electronic information received",
    "Shipment information has been received and is awaiting physical handling.",
    "Jakarta, Indonesia",
    true,
    "ShipmentGenerator",
  ]);
});

test("bulk milestone accepts a valid Lists tuple", () => {
  const { spreadsheet, bulkSheet } = milestoneSpreadsheet();
  const summary = core.processBulkTrackingUpdatesForSpreadsheet_(
    spreadsheet,
    core.TRACKING_MILESTONE_CONFIG,
  );

  assert.equal(summary.checkedRows, 1);
  assert.equal(summary.appended, 1);
  assert.equal(summary.updatedShipments, 1);
  assert.match(bulkSheet.rows[1][8], /^PROCESSED: Bulk_Status_Updates!R2$/);
});

test("bulk milestone rejects mismatched status label description", () => {
  const { spreadsheet, eventsSheet, shipmentsSheet, bulkSheet } = milestoneSpreadsheet({
    bulkRows: [
      bulkRow({
        new_status: "processed",
        label: "Departed origin airport",
        description: "Shipment has departed from the origin airport.",
      }),
    ],
  });
  const summary = core.processBulkTrackingUpdatesForSpreadsheet_(
    spreadsheet,
    core.TRACKING_MILESTONE_CONFIG,
  );

  assert.equal(summary.invalid, 1);
  assert.equal(eventsSheet.rows.filter((row) => row[0] === "AA26-TEST-0001").length, 1);
  assert.equal(shipmentsSheet.rows[1][6], "pending");
  assert.match(bulkSheet.rows[1][8], /^ERROR: Invalid tracking tuple/);
});

test("valid bulk milestone appends one event and updates current status", () => {
  const { spreadsheet, eventsSheet, shipmentsSheet } = milestoneSpreadsheet();
  const summary = core.processBulkTrackingUpdatesForSpreadsheet_(
    spreadsheet,
    core.TRACKING_MILESTONE_CONFIG,
  );
  const events = eventsSheet.rows.filter((row) => row[0] === "AA26-TEST-0001");

  assert.equal(summary.appended, 1);
  assert.equal(events.length, 2);
  assert.equal(events[1][2], "processed");
  assert.equal(events[1][3], "Shipment processed at origin");
  assert.equal(events[1][7], "Bulk_Status_Updates row 2");
  assert.equal(shipmentsSheet.rows[1][6], "processed");
});

test("bulk milestone rerun does not duplicate an event", () => {
  const context = milestoneSpreadsheet();
  const firstSummary = core.processBulkTrackingUpdatesForSpreadsheet_(
    context.spreadsheet,
    core.TRACKING_MILESTONE_CONFIG,
  );
  context.bulkSheet.rows[1][0] = true;
  const secondSummary = core.processBulkTrackingUpdatesForSpreadsheet_(
    context.spreadsheet,
    core.TRACKING_MILESTONE_CONFIG,
  );

  assert.equal(firstSummary.appended, 1);
  assert.equal(secondSummary.appended, 0);
  assert.equal(secondSummary.alreadyProcessed, 1);
  assert.equal(
    context.eventsSheet.rows.filter((row) => row[0] === "AA26-TEST-0001").length,
    2,
  );
});

test("later legitimate milestone can append after an earlier milestone", () => {
  const { spreadsheet, eventsSheet, shipmentsSheet } = milestoneSpreadsheet({
    bulkRows: [
      bulkRow(),
      bulkRow({
        new_status: "in_transit",
        event_time: new Date("2026-06-05T04:00:00.000Z"),
        label: "Departed origin airport",
        description: "Shipment has departed from the origin airport.",
      }),
    ],
  });
  const summary = core.processBulkTrackingUpdatesForSpreadsheet_(
    spreadsheet,
    core.TRACKING_MILESTONE_CONFIG,
  );
  const events = eventsSheet.rows.filter((row) => row[0] === "AA26-TEST-0001");

  assert.equal(summary.appended, 2);
  assert.equal(events.length, 3);
  assert.equal(events[1][3], "Shipment processed at origin");
  assert.equal(events[2][3], "Departed origin airport");
  assert.equal(shipmentsSheet.rows[1][6], "in_transit");
});

test("public event ordering can be chronological by event_time", () => {
  const events = [
    { label: "Shipment processed at origin", event_time: "2026-06-05T02:00:00.000Z" },
    { label: "Electronic information received", event_time: "2026-06-04T15:14:36.067Z" },
  ].sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());

  assert.deepEqual(events.map((event) => event.label), [
    "Electronic information received",
    "Shipment processed at origin",
  ]);
});

test("bulk milestone event record does not add private fields", () => {
  const { spreadsheet } = milestoneSpreadsheet();
  const shipmentRows = core.buildShipmentLookupForMilestones_(
    spreadsheet.getSheetByName("Shipments").rows.slice(1),
    spreadsheet.getSheetByName("Shipments").rows[0],
    core.TRACKING_MILESTONE_CONFIG,
  );
  const prepared = core.prepareBulkMilestoneUpdate_(
    Object.fromEntries(bulkHeaders.map((header, index) => [header, bulkRow()[index]])),
    2,
    shipmentRows,
    spreadsheet.getSheetByName("Lists").rows.slice(1),
    core.buildHeaderMap_(spreadsheet.getSheetByName("Lists").rows[0]),
    core.TRACKING_MILESTONE_CONFIG,
    new Date("2026-06-05T02:00:00.000Z"),
  );

  assert.equal(prepared.ok, true);
  assert.deepEqual(Object.keys(prepared.eventRecord).sort(), [
    "description",
    "event_time",
    "internal_tracking_no",
    "label",
    "location",
    "status",
    "updated_by",
    "visible_publicly",
  ]);
});
