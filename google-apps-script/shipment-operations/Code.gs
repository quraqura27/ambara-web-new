const SHIPMENT_GENERATOR_CONFIG = {
  sheetName: "Shipments",
  headerRow: 1,
  lockWaitMs: 30000,
  maxGenerationAttempts: 100,
  resetReadyAfterCreate: true,
  generatedPrefix: "AA26",
  codeAlphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  eventsSheetName: "Tracking_Events",
  listsSheetName: "Lists",
  readyHeader: "ready_to_generate",
  internalTrackingHeader: "internal_tracking_no",
  trackingCreatedAtHeader: "tracking_created_at",
  generationStatusHeader: "generation_status",
  createdAtHeader: "created_at",
  updatedAtHeader: "updated_at",
  eventsHeaderRow: 1,
  listsHeaderRow: 1,
  initialEvent: {
    status: "pending",
    label: "Electronic information received",
    description: "Shipment information has been received and is awaiting physical handling.",
    visiblePublicly: true,
    updatedBy: "ShipmentGenerator",
  },
  targetedBackfillTrackingNumbers: [],
  requiredInputHeaders: [
    "mawb",
    "title",
    "current_status",
    "service_type",
    "origin",
    "origin_iata",
    "destination",
    "destination_iata",
    "customer_name",
    "commodity",
    "total_pcs",
    "weight_kg",
    "chargeable_weight",
  ],
  canonicalStatuses: [
    "pending",
    "received",
    "processed",
    "in_transit",
    "arrived_destination",
    "customs_review",
    "out_for_delivery",
    "delivered",
    "exception",
    "cancelled",
  ],
};

function handleShipmentReadyEdit(e) {
  try {
    if (!e || !e.range) return;

    const range = e.range;
    const sheet = range.getSheet();
    if (!sheet || sheet.getName() !== SHIPMENT_GENERATOR_CONFIG.sheetName) return;
    if (range.getNumRows() !== 1 || range.getNumColumns() !== 1) return;
    if (range.getRow() <= SHIPMENT_GENERATOR_CONFIG.headerRow) return;

    const context = getSheetContext_(sheet);
    const readyColumn = context.headerMap[SHIPMENT_GENERATOR_CONFIG.readyHeader] + 1;
    if (range.getColumn() !== readyColumn) return;

    const editedValue = Object.prototype.hasOwnProperty.call(e, "value")
      ? e.value
      : range.getValue();
    if (!isCheckedValue_(editedValue)) return;

    processShipmentRow_(sheet, range.getRow());
  } catch (error) {
    console.error("Shipment tracking generation failed in edit handler", error);
  }
}

function processReadyShipments() {
  const sheet = getShipmentsSheet_();
  return withGeneratorLock_(function () {
    return processReadyShipmentsWithoutLock_(sheet);
  });
}

function installShipmentGeneratorTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let hasGeneratorTrigger = false;
  let removedDuplicateTriggers = 0;

  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() !== "handleShipmentReadyEdit") {
      return;
    }

    if (!hasGeneratorTrigger) {
      hasGeneratorTrigger = true;
      return;
    }

    ScriptApp.deleteTrigger(trigger);
    removedDuplicateTriggers += 1;
  });

  if (!hasGeneratorTrigger) {
    ScriptApp.newTrigger("handleShipmentReadyEdit")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
  }

  const summary = {
    created: !hasGeneratorTrigger,
    preservedExisting: hasGeneratorTrigger,
    removedDuplicateTriggers: removedDuplicateTriggers,
  };
  console.log("Shipment generator trigger install complete", summary);
  return summary;
}

function processShipmentRow_(sheet, rowNumber) {
  return withGeneratorLock_(function () {
    return processShipmentRowWithoutLock_(sheet, rowNumber);
  });
}

function processReadyShipmentsWithoutLock_(sheet) {
  const spreadsheet = sheet.getParent();
  const context = getSheetContext_(sheet);
  const lastRow = sheet.getLastRow();
  const headerRow = SHIPMENT_GENERATOR_CONFIG.headerRow;
  const initialEventTupleResult = getInitialTrackingTupleFromSpreadsheet_(
    spreadsheet,
    SHIPMENT_GENERATOR_CONFIG,
  );

  const summary = {
    checkedRows: 0,
    created: 0,
    alreadyCreated: 0,
    eventsAppended: 0,
    eventsAlreadyPresent: 0,
    errors: 0,
    skipped: 0,
  };

  if (lastRow <= headerRow) {
    console.log("No shipment rows to process", summary);
    return summary;
  }

  const rowCount = lastRow - headerRow;
  const values = sheet
    .getRange(headerRow + 1, 1, rowCount, context.headerValues.length)
    .getValues();
  const existingNumbers = collectExistingTrackingNumbersFromRows_(
    values,
    context.headerMap,
  );

  values.forEach(function (rowValues, offset) {
    const rowNumber = headerRow + 1 + offset;
    const rowObject = rowValuesToObject_(context.headerValues, rowValues);

    if (!isCheckedValue_(rowObject[SHIPMENT_GENERATOR_CONFIG.readyHeader])) {
      summary.skipped += 1;
      return;
    }

    summary.checkedRows += 1;
    const now = new Date();
    const result = prepareShipmentGenerationUpdate_(rowObject, existingNumbers, now, {
      config: SHIPMENT_GENERATOR_CONFIG,
      initialEventTupleResult: initialEventTupleResult,
    });

    if (result.generated && result.trackingNumber) {
      const eventResult = appendInitialTrackingEventForShipment_(
        spreadsheet,
        rowObject,
        result.trackingNumber,
        now,
        initialEventTupleResult.tuple,
        SHIPMENT_GENERATOR_CONFIG,
      );

      if (!eventResult.ok) {
        writeUpdatesToRow_(sheet, rowNumber, context.headerMap, buildUpdates_({
          generation_status: eventResult.error,
        }));
        summary.errors += 1;
        return;
      }

      writeUpdatesToRow_(sheet, rowNumber, context.headerMap, result.updates);
      addTrackingNumber_(existingNumbers, result.trackingNumber);
      summary.created += 1;
      if (eventResult.appended) {
        summary.eventsAppended += 1;
      } else if (eventResult.alreadyPresent) {
        summary.eventsAlreadyPresent += 1;
      }
      return;
    }

    writeUpdatesToRow_(sheet, rowNumber, context.headerMap, result.updates);

    if (result.alreadyCreated) {
      summary.alreadyCreated += 1;
      return;
    }

    if (!result.ok) {
      summary.errors += 1;
    }
  });

  console.log("Ready shipment generation complete", summary);
  return summary;
}

function processShipmentRowWithoutLock_(sheet, rowNumber) {
  const spreadsheet = sheet.getParent();
  const context = getSheetContext_(sheet);
  const rowValues = sheet
    .getRange(rowNumber, 1, 1, context.headerValues.length)
    .getValues()[0];
  const rowObject = rowValuesToObject_(context.headerValues, rowValues);
  const existingNumbers = collectExistingTrackingNumbersFromSheet_(sheet, context.headerMap);
  const currentTrackingNumber = cleanValue_(
    rowObject[SHIPMENT_GENERATOR_CONFIG.internalTrackingHeader],
  );

  if (currentTrackingNumber) {
    removeTrackingNumber_(existingNumbers, currentTrackingNumber);
  }

  const now = new Date();
  const initialEventTupleResult = getInitialTrackingTupleFromSpreadsheet_(
    spreadsheet,
    SHIPMENT_GENERATOR_CONFIG,
  );
  const result = prepareShipmentGenerationUpdate_(rowObject, existingNumbers, now, {
    config: SHIPMENT_GENERATOR_CONFIG,
    initialEventTupleResult: initialEventTupleResult,
  });

  if (result.generated && result.trackingNumber) {
    const eventResult = appendInitialTrackingEventForShipment_(
      spreadsheet,
      rowObject,
      result.trackingNumber,
      now,
      initialEventTupleResult.tuple,
      SHIPMENT_GENERATOR_CONFIG,
    );

    if (!eventResult.ok) {
      const errorUpdates = buildUpdates_({
        generation_status: eventResult.error,
      });
      writeUpdatesToRow_(sheet, rowNumber, context.headerMap, errorUpdates);
      return {
        ok: false,
        generated: false,
        alreadyCreated: false,
        trackingNumber: "",
        status: eventResult.error,
        updates: errorUpdates,
      };
    }
  }

  writeUpdatesToRow_(sheet, rowNumber, context.headerMap, result.updates);
  return result;
}

function prepareShipmentGenerationUpdate_(rowObject, existingNumbers, now, options) {
  const activeOptions = options || {};
  const config = activeOptions.config ||
    (activeOptions.requiredInputHeaders ? activeOptions : SHIPMENT_GENERATOR_CONFIG);
  const initialEventTupleResult = activeOptions.initialEventTupleResult;
  const existingTrackingNumber = cleanValue_(rowObject[config.internalTrackingHeader]);
  const currentGenerationStatus = cleanValue_(rowObject[config.generationStatusHeader]).toUpperCase();

  if (existingTrackingNumber) {
    if (currentGenerationStatus === "CREATED") {
      return {
        ok: true,
        generated: false,
        alreadyCreated: true,
        trackingNumber: existingTrackingNumber,
        status: "CREATED",
        updates: {},
      };
    }

    return {
      ok: true,
      generated: false,
      alreadyCreated: true,
      trackingNumber: existingTrackingNumber,
      status: "ALREADY_CREATED",
      updates: buildUpdates_({
        generation_status: "ALREADY_CREATED",
        updated_at: now,
        ready_to_generate: false,
      }),
    };
  }

  const validation = validateShipmentInput_(rowObject, config);
  if (!validation.ok) {
    return {
      ok: false,
      generated: false,
      alreadyCreated: false,
      trackingNumber: "",
      status: validation.error,
      updates: buildUpdates_({
        generation_status: validation.error,
      }),
    };
  }

  if (initialEventTupleResult && !initialEventTupleResult.ok) {
    return {
      ok: false,
      generated: false,
      alreadyCreated: false,
      trackingNumber: "",
      status: initialEventTupleResult.error,
      updates: buildUpdates_({
        generation_status: initialEventTupleResult.error,
      }),
    };
  }

  try {
    const trackingNumber = generateUniqueTrackingNumber_(
      existingNumbers,
      Math.random,
      config.maxGenerationAttempts,
      config,
    );
    const updates = {
      internal_tracking_no: trackingNumber,
      tracking_created_at: now,
      generation_status: "CREATED",
      updated_at: now,
      ready_to_generate: config.resetReadyAfterCreate ? false : true,
    };

    if (isBlank_(rowObject[config.createdAtHeader])) {
      updates.created_at = now;
    }

    return {
      ok: true,
      generated: true,
      alreadyCreated: false,
      trackingNumber: trackingNumber,
      status: "CREATED",
      updates: buildUpdates_(updates),
    };
  } catch (error) {
    return {
      ok: false,
      generated: false,
      alreadyCreated: false,
      trackingNumber: "",
      status: "ERROR: " + error.message,
      updates: buildUpdates_({
        generation_status: "ERROR: " + error.message,
      }),
    };
  }
}

function validateShipmentInput_(rowObject, config) {
  const missing = [];

  config.requiredInputHeaders.forEach(function (header) {
    if (isBlank_(rowObject[header])) {
      missing.push(header);
    }
  });

  if (missing.length) {
    return {
      ok: false,
      error: "ERROR: Missing " + missing.join(", "),
    };
  }

  const status = cleanValue_(rowObject.current_status).toLowerCase();
  if (config.canonicalStatuses.indexOf(status) === -1) {
    return {
      ok: false,
      error: 'ERROR: Invalid current_status "' + cleanValue_(rowObject.current_status) + '"',
    };
  }

  return { ok: true, error: "" };
}

function backfillMissingInitialTrackingEvents(targetTrackingNumbers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return withGeneratorLock_(function () {
    return backfillMissingInitialTrackingEventsForTargets_(
      spreadsheet,
      targetTrackingNumbers || SHIPMENT_GENERATOR_CONFIG.targetedBackfillTrackingNumbers,
      SHIPMENT_GENERATOR_CONFIG,
    );
  });
}

function backfillMissingInitialTrackingEventsForTargets_(
  spreadsheet,
  targetTrackingNumbers,
  config,
) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;
  const targets = normalizeTargetTrackingNumbers_(targetTrackingNumbers);
  const summary = {
    targets: targets.length,
    appended: 0,
    alreadyPresent: 0,
    notFound: 0,
    skipped: 0,
    errors: 0,
  };

  if (!targets.length) {
    console.log("No targeted tracking numbers configured for initial-event backfill", summary);
    return summary;
  }

  const shipmentsSheet = spreadsheet.getSheetByName(activeConfig.sheetName);
  if (!shipmentsSheet) {
    throw new Error('Missing sheet "' + activeConfig.sheetName + '"');
  }

  const context = getSheetContext_(shipmentsSheet);
  const shipmentRows = getRowsBelowHeader_(
    shipmentsSheet,
    activeConfig.headerRow,
    context.headerValues.length,
  );
  const shipmentsByTrackingNumber = buildShipmentMapByTrackingNumber_(
    context.headerValues,
    shipmentRows,
    activeConfig,
  );
  const initialEventTupleResult = getInitialTrackingTupleFromSpreadsheet_(
    spreadsheet,
    activeConfig,
  );

  targets.forEach(function (trackingNumber) {
    const shipment = shipmentsByTrackingNumber[normalizeTrackingKey_(trackingNumber)];

    if (!shipment) {
      summary.notFound += 1;
      return;
    }

    const generationStatus = cleanValue_(
      shipment[activeConfig.generationStatusHeader],
    ).toUpperCase();

    if (generationStatus !== "CREATED") {
      summary.skipped += 1;
      return;
    }

    if (!initialEventTupleResult.ok) {
      summary.errors += 1;
      console.error(initialEventTupleResult.error);
      return;
    }

    const eventTimestamp = getInitialEventTimestamp_(shipment, new Date(), activeConfig);
    const eventResult = appendInitialTrackingEventForShipment_(
      spreadsheet,
      shipment,
      trackingNumber,
      eventTimestamp,
      initialEventTupleResult.tuple,
      activeConfig,
    );

    if (!eventResult.ok) {
      summary.errors += 1;
      console.error(eventResult.error);
      return;
    }

    if (eventResult.appended) {
      summary.appended += 1;
      return;
    }

    if (eventResult.alreadyPresent) {
      summary.alreadyPresent += 1;
    }
  });

  console.log("Initial tracking-event backfill complete", summary);
  return summary;
}

function getInitialTrackingTupleFromSpreadsheet_(spreadsheet, config) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;
  const listsSheet = spreadsheet.getSheetByName(activeConfig.listsSheetName);

  if (!listsSheet) {
    return {
      ok: false,
      error: 'ERROR: Missing sheet "' + activeConfig.listsSheetName + '"',
    };
  }

  try {
    const context = getHeaderContext_(listsSheet, activeConfig.listsHeaderRow);
    assertRequiredHeadersInMap_(context.headerMap, [
      "tracking_status",
      "tracking_label",
      "tracking_description",
    ]);
    const rows = getRowsBelowHeader_(
      listsSheet,
      activeConfig.listsHeaderRow,
      context.headerValues.length,
    );
    return findInitialTrackingTupleInRows_(
      rows,
      context.headerMap,
      activeConfig.initialEvent,
    );
  } catch (error) {
    return {
      ok: false,
      error: "ERROR: Initial tracking tuple validation failed: " + error.message,
    };
  }
}

function findInitialTrackingTupleInRows_(rows, headerMap, initialEvent) {
  const expectedStatus = cleanValue_(initialEvent.status).toLowerCase();
  const expectedLabel = cleanValue_(initialEvent.label);
  const expectedDescription = cleanValue_(initialEvent.description);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const status = cleanValue_(row[headerMap.tracking_status]).toLowerCase();
    const label = cleanValue_(row[headerMap.tracking_label]);
    const description = cleanValue_(row[headerMap.tracking_description]);

    if (
      status === expectedStatus &&
      label === expectedLabel &&
      description === expectedDescription
    ) {
      return {
        ok: true,
        tuple: {
          status: status,
          label: label,
          description: description,
        },
      };
    }
  }

  return {
    ok: false,
    error: (
      "ERROR: Initial tracking tuple not found in Lists: " +
      expectedStatus + " / " + expectedLabel + " / " + expectedDescription
    ),
  };
}

function appendInitialTrackingEventForShipment_(
  spreadsheet,
  shipmentRowObject,
  trackingNumber,
  eventTimestamp,
  tuple,
  config,
) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;
  const eventsSheet = spreadsheet.getSheetByName(activeConfig.eventsSheetName);

  if (!eventsSheet) {
    return {
      ok: false,
      error: 'ERROR: Missing sheet "' + activeConfig.eventsSheetName + '"',
    };
  }

  const eventRecord = buildInitialTrackingEventRecord_(
    trackingNumber,
    shipmentRowObject,
    eventTimestamp,
    tuple,
    activeConfig,
  );

  return appendInitialTrackingEventIfMissing_(eventsSheet, eventRecord, activeConfig);
}

function appendInitialTrackingEventIfMissing_(eventsSheet, eventRecord, config) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;

  try {
    const context = getHeaderContext_(eventsSheet, activeConfig.eventsHeaderRow);
    assertRequiredHeadersInMap_(context.headerMap, [
      "internal_tracking_no",
      "event_time",
      "status",
      "label",
      "description",
      "location",
      "visible_publicly",
      "updated_by",
    ]);
    const rows = getRowsBelowHeader_(
      eventsSheet,
      activeConfig.eventsHeaderRow,
      context.headerValues.length,
    );

    if (initialTrackingEventExistsInRows_(rows, context.headerMap, eventRecord)) {
      return {
        ok: true,
        appended: false,
        alreadyPresent: true,
      };
    }

    const nextRow = findNextEmptyGeneratorEventRow_(
      eventsSheet,
      context.headerMap.internal_tracking_no + 1,
      activeConfig.eventsHeaderRow,
    );
    const rowValues = buildTrackingEventRow_(context.headerValues, eventRecord);
    eventsSheet.getRange(nextRow, 1, 1, context.headerValues.length).setValues([rowValues]);

    return {
      ok: true,
      appended: true,
      alreadyPresent: false,
    };
  } catch (error) {
    return {
      ok: false,
      error: "ERROR: Initial event append failed: " + error.message,
    };
  }
}

function buildInitialTrackingEventRecord_(
  trackingNumber,
  shipmentRowObject,
  eventTimestamp,
  tuple,
  config,
) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;

  return {
    internal_tracking_no: cleanValue_(trackingNumber),
    event_time: eventTimestamp,
    status: cleanValue_(tuple.status).toLowerCase(),
    label: cleanValue_(tuple.label),
    description: cleanValue_(tuple.description),
    location: cleanValue_(shipmentRowObject.origin),
    visible_publicly: activeConfig.initialEvent.visiblePublicly,
    updated_by: activeConfig.initialEvent.updatedBy,
  };
}

function buildTrackingEventRow_(headers, eventRecord) {
  return headers.map(function (header) {
    const key = normalizeHeader_(header);
    if (!key || !Object.prototype.hasOwnProperty.call(eventRecord, key)) {
      return "";
    }
    return eventRecord[key];
  });
}

function initialTrackingEventExistsInRows_(rows, headerMap, eventRecord) {
  const expectedTrackingKey = normalizeTrackingKey_(eventRecord.internal_tracking_no);
  const expectedStatus = cleanValue_(eventRecord.status).toLowerCase();
  const expectedLabel = cleanValue_(eventRecord.label);
  const expectedDescription = cleanValue_(eventRecord.description);

  return rows.some(function (row) {
    return (
      normalizeTrackingKey_(row[headerMap.internal_tracking_no]) === expectedTrackingKey &&
      cleanValue_(row[headerMap.status]).toLowerCase() === expectedStatus &&
      cleanValue_(row[headerMap.label]) === expectedLabel &&
      cleanValue_(row[headerMap.description]) === expectedDescription
    );
  });
}

function buildShipmentMapByTrackingNumber_(headers, rows, config) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;
  const shipmentsByTrackingNumber = {};

  rows.forEach(function (row) {
    const shipment = rowValuesToObject_(headers, row);
    const trackingKey = normalizeTrackingKey_(shipment[activeConfig.internalTrackingHeader]);
    if (trackingKey) {
      shipmentsByTrackingNumber[trackingKey] = shipment;
    }
  });

  return shipmentsByTrackingNumber;
}

function normalizeTargetTrackingNumbers_(targetTrackingNumbers) {
  if (!Array.isArray(targetTrackingNumbers)) {
    return [];
  }

  return targetTrackingNumbers
    .map(function (trackingNumber) {
      return cleanValue_(trackingNumber);
    })
    .filter(function (trackingNumber) {
      return trackingNumber !== "";
    });
}

function getInitialEventTimestamp_(shipment, fallback, config) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;
  return (
    shipment[activeConfig.trackingCreatedAtHeader] ||
    shipment[activeConfig.createdAtHeader] ||
    shipment[activeConfig.updatedAtHeader] ||
    fallback
  );
}

function generateUniqueTrackingNumber_(existingNumbers, randomFn, maxAttempts, config) {
  const attempts = maxAttempts || SHIPMENT_GENERATOR_CONFIG.maxGenerationAttempts;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const trackingNumber = generateTrackingNumber_(randomFn, config);
    if (!trackingNumberExists_(existingNumbers, trackingNumber)) {
      return trackingNumber;
    }
  }

  throw new Error(
    "Unable to generate unique internal_tracking_no after " + attempts + " attempts",
  );
}

function generateTrackingNumber_(randomFn, config) {
  const activeConfig = config || SHIPMENT_GENERATOR_CONFIG;
  const rng = randomFn || Math.random;
  return (
    activeConfig.generatedPrefix +
    "-" +
    randomCodeGroup_(4, activeConfig.codeAlphabet, rng) +
    "-" +
    randomCodeGroup_(4, activeConfig.codeAlphabet, rng)
  );
}

function randomCodeGroup_(length, alphabet, randomFn) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    const charIndex = Math.floor(randomFn() * alphabet.length);
    value += alphabet[Math.min(charIndex, alphabet.length - 1)];
  }
  return value;
}

function getShipmentsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHIPMENT_GENERATOR_CONFIG.sheetName);
  if (!sheet) {
    throw new Error('Missing sheet "' + SHIPMENT_GENERATOR_CONFIG.sheetName + '"');
  }
  return sheet;
}

function getSheetContext_(sheet) {
  const context = getHeaderContext_(sheet, SHIPMENT_GENERATOR_CONFIG.headerRow);
  assertRequiredHeaders_(context.headerMap);
  return context;
}

function getHeaderContext_(sheet, headerRow) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    throw new Error('Sheet "' + sheet.getName() + '" has no header row');
  }

  const headerValues = sheet
    .getRange(headerRow, 1, 1, lastColumn)
    .getValues()[0];
  const headerMap = buildHeaderMap_(headerValues);

  return {
    headerValues: headerValues,
    headerMap: headerMap,
  };
}

function getRowsBelowHeader_(sheet, headerRow, width) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return [];
  }

  return sheet
    .getRange(headerRow + 1, 1, lastRow - headerRow, width)
    .getValues();
}

function assertRequiredHeaders_(headerMap) {
  const requiredHeaders = [
    SHIPMENT_GENERATOR_CONFIG.readyHeader,
    SHIPMENT_GENERATOR_CONFIG.internalTrackingHeader,
    SHIPMENT_GENERATOR_CONFIG.trackingCreatedAtHeader,
    SHIPMENT_GENERATOR_CONFIG.generationStatusHeader,
    SHIPMENT_GENERATOR_CONFIG.createdAtHeader,
    SHIPMENT_GENERATOR_CONFIG.updatedAtHeader,
  ].concat(SHIPMENT_GENERATOR_CONFIG.requiredInputHeaders);

  const missing = requiredHeaders.filter(function (header) {
    return !Object.prototype.hasOwnProperty.call(headerMap, header);
  });

  if (missing.length) {
    throw new Error("Missing required header(s): " + missing.join(", "));
  }
}

function assertRequiredHeadersInMap_(headerMap, requiredHeaders) {
  const missing = requiredHeaders.filter(function (header) {
    return !Object.prototype.hasOwnProperty.call(headerMap, header);
  });

  if (missing.length) {
    throw new Error("Missing required header(s): " + missing.join(", "));
  }
}

function buildHeaderMap_(headers) {
  if (!Array.isArray(headers)) {
    throw new Error("Header row must be an array");
  }

  const map = {};
  const duplicates = [];

  headers.forEach(function (header, index) {
    const normalized = normalizeHeader_(header);
    if (!normalized) return;
    if (Object.prototype.hasOwnProperty.call(map, normalized)) {
      duplicates.push(normalized);
      return;
    }
    map[normalized] = index;
  });

  if (duplicates.length) {
    throw new Error("Duplicate header(s): " + duplicates.join(", "));
  }

  return map;
}

function rowValuesToObject_(headers, rowValues) {
  const rowObject = {};
  headers.forEach(function (header, index) {
    const normalized = normalizeHeader_(header);
    if (!normalized) return;
    rowObject[normalized] = rowValues[index];
  });
  return rowObject;
}

function collectExistingTrackingNumbersFromSheet_(sheet, headerMap) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= SHIPMENT_GENERATOR_CONFIG.headerRow) {
    return createTrackingNumberSet_();
  }

  const column = headerMap[SHIPMENT_GENERATOR_CONFIG.internalTrackingHeader] + 1;
  const values = sheet
    .getRange(
      SHIPMENT_GENERATOR_CONFIG.headerRow + 1,
      column,
      lastRow - SHIPMENT_GENERATOR_CONFIG.headerRow,
      1,
    )
    .getValues()
    .map(function (row) {
      return row[0];
    });

  return createTrackingNumberSet_(values);
}

function collectExistingTrackingNumbersFromRows_(rows, headerMap) {
  const columnIndex = headerMap[SHIPMENT_GENERATOR_CONFIG.internalTrackingHeader];
  return createTrackingNumberSet_(
    rows.map(function (row) {
      return row[columnIndex];
    }),
  );
}

function createTrackingNumberSet_(values) {
  const set = {};
  (values || []).forEach(function (value) {
    addTrackingNumber_(set, value);
  });
  return set;
}

function addTrackingNumber_(set, value) {
  const trackingNumber = cleanValue_(value);
  if (trackingNumber) {
    set[trackingNumber] = true;
  }
}

function removeTrackingNumber_(set, value) {
  const trackingNumber = cleanValue_(value);
  if (trackingNumber) {
    delete set[trackingNumber];
  }
}

function trackingNumberExists_(set, value) {
  return Boolean(set && set[cleanValue_(value)]);
}

function findNextEmptyGeneratorEventRow_(eventsSheet, trackingNumberColumn, headerRow) {
  const maxRows = typeof eventsSheet.getMaxRows === "function"
    ? eventsSheet.getMaxRows()
    : eventsSheet.getLastRow();
  const rowCount = Math.max(maxRows - headerRow, 1);
  const trackingNumbers = eventsSheet
    .getRange(headerRow + 1, trackingNumberColumn, rowCount, 1)
    .getValues();

  for (let index = 0; index < trackingNumbers.length; index += 1) {
    if (isBlank_(trackingNumbers[index][0])) {
      return headerRow + 1 + index;
    }
  }

  if (typeof eventsSheet.insertRowAfter === "function") {
    eventsSheet.insertRowAfter(maxRows);
  }

  return maxRows + 1;
}

function writeUpdatesToRow_(sheet, rowNumber, headerMap, updates) {
  Object.keys(updates).forEach(function (header) {
    if (!Object.prototype.hasOwnProperty.call(headerMap, header)) return;
    sheet.getRange(rowNumber, headerMap[header] + 1).setValue(updates[header]);
  });
}

function buildUpdates_(updates) {
  const mapped = {};
  Object.keys(updates).forEach(function (header) {
    const normalized = normalizeHeader_(header);
    mapped[normalized] = updates[header];
  });
  return mapped;
}

function withGeneratorLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(SHIPMENT_GENERATOR_CONFIG.lockWaitMs)) {
    throw new Error("Could not acquire shipment generation lock");
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanValue_(value) {
  return String(value == null ? "" : value).trim();
}

function normalizeTrackingKey_(value) {
  return cleanValue_(value).replace(/[\s-]/g, "").toUpperCase();
}

function isBlank_(value) {
  return cleanValue_(value) === "";
}

function isCheckedValue_(value) {
  if (value === true) return true;
  const text = cleanValue_(value).toUpperCase();
  return text === "TRUE" || text === "YES" || text === "1" || text === "CHECKED";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SHIPMENT_GENERATOR_CONFIG: SHIPMENT_GENERATOR_CONFIG,
    appendInitialTrackingEventIfMissing_: appendInitialTrackingEventIfMissing_,
    backfillMissingInitialTrackingEventsForTargets_: backfillMissingInitialTrackingEventsForTargets_,
    buildHeaderMap_: buildHeaderMap_,
    buildInitialTrackingEventRecord_: buildInitialTrackingEventRecord_,
    buildTrackingEventRow_: buildTrackingEventRow_,
    findInitialTrackingTupleInRows_: findInitialTrackingTupleInRows_,
    generateTrackingNumber_: generateTrackingNumber_,
    generateUniqueTrackingNumber_: generateUniqueTrackingNumber_,
    initialTrackingEventExistsInRows_: initialTrackingEventExistsInRows_,
    isCheckedValue_: isCheckedValue_,
    normalizeTrackingKey_: normalizeTrackingKey_,
    prepareShipmentGenerationUpdate_: prepareShipmentGenerationUpdate_,
    rowValuesToObject_: rowValuesToObject_,
    validateShipmentInput_: validateShipmentInput_,
  };
}
