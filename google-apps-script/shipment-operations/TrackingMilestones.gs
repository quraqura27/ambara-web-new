const TRACKING_MILESTONE_CONFIG = {
  shipmentsSheetName: "Shipments",
  eventsSheetName: "Tracking_Events",
  bulkSheetName: "Bulk_Status_Updates",
  listsSheetName: "Lists",
  headerRow: 1,
  menuName: "Ambara Operations",
  menuItemName: "Process Bulk Tracking Updates",
  processHeader: "process_update",
  trackingIdentifierHeader: "internal_tracking_no",
  statusHeader: "new_status",
  eventTimeHeader: "event_time",
  labelHeader: "label",
  descriptionHeader: "description",
  locationHeader: "location",
  visiblePubliclyHeader: "visible_publicly",
  processingStatusHeader: "processing_status",
  processedAtHeader: "processed_at",
  processedPrefix: "PROCESSED",
  sourceKeyPrefix: "Bulk_Status_Updates!R",
  updatedByPrefix: "Bulk_Status_Updates row ",
  publicEventsOnly: true,
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(TRACKING_MILESTONE_CONFIG.menuName)
    .addItem(
      TRACKING_MILESTONE_CONFIG.menuItemName,
      "processBulkTrackingUpdates",
    )
    .addToUi();
}

function processBulkTrackingUpdates() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return withGeneratorLock_(function () {
    return processBulkTrackingUpdatesForSpreadsheet_(
      spreadsheet,
      TRACKING_MILESTONE_CONFIG,
    );
  });
}

function processBulkTrackingUpdatesForSpreadsheet_(spreadsheet, config) {
  const activeConfig = config || TRACKING_MILESTONE_CONFIG;
  const bulkSheet = getRequiredMilestoneSheet_(
    spreadsheet,
    activeConfig.bulkSheetName,
  );
  const shipmentsSheet = getRequiredMilestoneSheet_(
    spreadsheet,
    activeConfig.shipmentsSheetName,
  );
  const eventsSheet = getRequiredMilestoneSheet_(
    spreadsheet,
    activeConfig.eventsSheetName,
  );
  const listsSheet = getRequiredMilestoneSheet_(
    spreadsheet,
    activeConfig.listsSheetName,
  );

  const bulkContext = getHeaderContext_(bulkSheet, activeConfig.headerRow);
  const shipmentContext = getHeaderContext_(shipmentsSheet, activeConfig.headerRow);
  const eventsContext = getHeaderContext_(eventsSheet, activeConfig.headerRow);
  const listsContext = getHeaderContext_(listsSheet, activeConfig.headerRow);

  assertRequiredHeadersInMap_(bulkContext.headerMap, [
    activeConfig.processHeader,
    activeConfig.trackingIdentifierHeader,
    activeConfig.statusHeader,
    activeConfig.eventTimeHeader,
    activeConfig.labelHeader,
    activeConfig.descriptionHeader,
    activeConfig.locationHeader,
    activeConfig.visiblePubliclyHeader,
    activeConfig.processingStatusHeader,
    activeConfig.processedAtHeader,
  ]);
  assertRequiredHeadersInMap_(shipmentContext.headerMap, [
    "internal_tracking_no",
    "mawb",
    "current_status",
    "updated_at",
  ]);
  assertRequiredHeadersInMap_(eventsContext.headerMap, [
    "internal_tracking_no",
    "event_time",
    "status",
    "label",
    "description",
    "location",
    "visible_publicly",
    "updated_by",
  ]);
  assertRequiredHeadersInMap_(listsContext.headerMap, [
    "tracking_status",
    "tracking_label",
    "tracking_description",
  ]);

  const now = new Date();
  const shipmentRows = getRowsBelowHeader_(
    shipmentsSheet,
    activeConfig.headerRow,
    shipmentContext.headerValues.length,
  );
  const shipmentsByTrackingKey = buildShipmentLookupForMilestones_(
    shipmentRows,
    shipmentContext.headerValues,
    activeConfig,
  );
  const tupleRows = getRowsBelowHeader_(
    listsSheet,
    activeConfig.headerRow,
    listsContext.headerValues.length,
  );
  const eventsRows = getRowsBelowHeader_(
    eventsSheet,
    activeConfig.headerRow,
    eventsContext.headerValues.length,
  );
  const bulkRows = getRowsBelowHeader_(
    bulkSheet,
    activeConfig.headerRow,
    bulkContext.headerValues.length,
  );

  const summary = {
    checkedRows: 0,
    appended: 0,
    alreadyProcessed: 0,
    alreadyPresent: 0,
    updatedShipments: 0,
    invalid: 0,
    notFound: 0,
    errors: 0,
    skipped: 0,
  };

  bulkRows.forEach(function (rowValues, offset) {
    const rowNumber = activeConfig.headerRow + 1 + offset;
    const rowObject = rowValuesToObject_(bulkContext.headerValues, rowValues);

    if (!isCheckedValue_(rowObject[activeConfig.processHeader])) {
      summary.skipped += 1;
      return;
    }

    summary.checkedRows += 1;

    if (isProcessedMilestoneStatus_(
      rowObject[activeConfig.processingStatusHeader],
      activeConfig,
    )) {
      writeUpdatesToRow_(bulkSheet, rowNumber, bulkContext.headerMap, buildUpdates_({
        process_update: false,
      }));
      summary.alreadyProcessed += 1;
      return;
    }

    const prepared = prepareBulkMilestoneUpdate_(
      rowObject,
      rowNumber,
      shipmentsByTrackingKey,
      tupleRows,
      listsContext.headerMap,
      activeConfig,
      now,
    );

    if (!prepared.ok) {
      writeBulkProcessingResult_(
        bulkSheet,
        rowNumber,
        bulkContext.headerMap,
        prepared.error,
        now,
        false,
      );

      if (prepared.reason === "not_found") {
        summary.notFound += 1;
      } else if (prepared.reason === "invalid") {
        summary.invalid += 1;
      } else {
        summary.errors += 1;
      }
      return;
    }

    const appendResult = appendBulkMilestoneEventIfMissing_(
      eventsSheet,
      eventsContext,
      eventsRows,
      prepared.eventRecord,
      prepared.sourceKey,
      activeConfig,
    );

    if (!appendResult.ok) {
      writeBulkProcessingResult_(
        bulkSheet,
        rowNumber,
        bulkContext.headerMap,
        appendResult.error,
        now,
        false,
      );
      summary.errors += 1;
      return;
    }

    writeUpdatesToRow_(
      shipmentsSheet,
      prepared.shipment.rowNumber,
      shipmentContext.headerMap,
      buildUpdates_({
        current_status: prepared.eventRecord.status,
        updated_at: now,
      }),
    );
    writeBulkProcessingResult_(
      bulkSheet,
      rowNumber,
      bulkContext.headerMap,
      "PROCESSED: " + prepared.sourceKey,
      now,
      true,
    );

    summary.updatedShipments += 1;

    if (appendResult.appended) {
      eventsRows.push(appendResult.rowValues);
      summary.appended += 1;
    } else if (appendResult.alreadyPresent) {
      summary.alreadyPresent += 1;
    }
  });

  console.log("Bulk tracking milestone processing complete", summary);
  return summary;
}

function prepareBulkMilestoneUpdate_(
  rowObject,
  rowNumber,
  shipmentsByTrackingKey,
  tupleRows,
  listsHeaderMap,
  config,
  now,
) {
  const trackingIdentifier = cleanValue_(rowObject[config.trackingIdentifierHeader]);
  const sourceKey = config.sourceKeyPrefix + rowNumber;

  if (!trackingIdentifier) {
    return {
      ok: false,
      reason: "invalid",
      error: "ERROR: Missing tracking identifier",
    };
  }

  const shipment = shipmentsByTrackingKey[normalizeTrackingKey_(trackingIdentifier)];

  if (!shipment) {
    return {
      ok: false,
      reason: "not_found",
      error: "ERROR: Shipment not found for " + trackingIdentifier,
    };
  }

  const tuple = {
    status: cleanValue_(rowObject[config.statusHeader]).toLowerCase(),
    label: cleanValue_(rowObject[config.labelHeader]),
    description: cleanValue_(rowObject[config.descriptionHeader]),
  };

  if (!tuple.status || !tuple.label || !tuple.description) {
    return {
      ok: false,
      reason: "invalid",
      error: "ERROR: Missing status, label, or description",
    };
  }

  if (!milestoneTupleExists_(tupleRows, listsHeaderMap, tuple)) {
    return {
      ok: false,
      reason: "invalid",
      error: (
        "ERROR: Invalid tracking tuple: " +
        tuple.status + " / " + tuple.label + " / " + tuple.description
      ),
    };
  }

  return {
    ok: true,
    sourceKey: sourceKey,
    shipment: shipment,
    eventRecord: {
      internal_tracking_no: shipment.internalTrackingNo,
      event_time: rowObject[config.eventTimeHeader] || now,
      status: tuple.status,
      label: tuple.label,
      description: tuple.description,
      location: cleanValue_(rowObject[config.locationHeader]),
      visible_publicly: config.publicEventsOnly
        ? true
        : isCheckedValue_(rowObject[config.visiblePubliclyHeader]),
      updated_by: config.updatedByPrefix + rowNumber,
    },
  };
}

function appendBulkMilestoneEventIfMissing_(
  eventsSheet,
  eventsContext,
  eventsRows,
  eventRecord,
  sourceKey,
  config,
) {
  try {
    if (bulkMilestoneEventExists_(eventsRows, eventsContext.headerMap, eventRecord, config)) {
      return {
        ok: true,
        appended: false,
        alreadyPresent: true,
      };
    }

    const nextRow = findNextEmptyGeneratorEventRow_(
      eventsSheet,
      eventsContext.headerMap.internal_tracking_no + 1,
      config.headerRow,
    );
    const rowValues = buildTrackingEventRow_(eventsContext.headerValues, eventRecord);
    eventsSheet
      .getRange(nextRow, 1, 1, eventsContext.headerValues.length)
      .setValues([rowValues]);

    return {
      ok: true,
      appended: true,
      alreadyPresent: false,
      sourceKey: sourceKey,
      rowValues: rowValues,
    };
  } catch (error) {
    return {
      ok: false,
      error: "ERROR: Event append failed: " + error.message,
    };
  }
}

function buildShipmentLookupForMilestones_(rows, headers, config) {
  const headerMap = buildHeaderMap_(headers);
  const lookup = {};

  rows.forEach(function (rowValues, index) {
    const rowObject = rowValuesToObject_(headers, rowValues);
    const internalTrackingNo = cleanValue_(rowObject.internal_tracking_no);
    const mawb = cleanValue_(rowObject.mawb);
    const shipment = {
      rowNumber: config.headerRow + 1 + index,
      rowObject: rowObject,
      internalTrackingNo: internalTrackingNo,
      mawb: mawb,
    };

    if (internalTrackingNo) {
      lookup[normalizeTrackingKey_(internalTrackingNo)] = shipment;
    }

    if (mawb) {
      lookup[normalizeTrackingKey_(mawb)] = shipment;
    }
  });

  if (typeof headerMap.internal_tracking_no !== "number") {
    throw new Error("Missing required header(s): internal_tracking_no");
  }

  return lookup;
}

function milestoneTupleExists_(rows, headerMap, tuple) {
  const expectedStatus = cleanValue_(tuple.status).toLowerCase();
  const expectedLabel = cleanValue_(tuple.label);
  const expectedDescription = cleanValue_(tuple.description);

  return rows.some(function (row) {
    return (
      cleanValue_(row[headerMap.tracking_status]).toLowerCase() === expectedStatus &&
      cleanValue_(row[headerMap.tracking_label]) === expectedLabel &&
      cleanValue_(row[headerMap.tracking_description]) === expectedDescription
    );
  });
}

function bulkMilestoneEventExists_(rows, headerMap, eventRecord, config) {
  const expectedTrackingKey = normalizeTrackingKey_(eventRecord.internal_tracking_no);
  const expectedUpdatedBy = cleanValue_(eventRecord.updated_by);

  return rows.some(function (row) {
    return (
      normalizeTrackingKey_(row[headerMap.internal_tracking_no]) === expectedTrackingKey &&
      cleanValue_(row[headerMap.updated_by]) === expectedUpdatedBy
    );
  });
}

function writeBulkProcessingResult_(
  sheet,
  rowNumber,
  headerMap,
  processingStatus,
  processedAt,
  clearProcessFlag,
) {
  const updates = {
    processing_status: processingStatus,
    processed_at: processedAt,
  };

  if (clearProcessFlag) {
    updates.process_update = false;
  }

  writeUpdatesToRow_(sheet, rowNumber, headerMap, buildUpdates_(updates));
}

function isProcessedMilestoneStatus_(value, config) {
  return cleanValue_(value)
    .toUpperCase()
    .indexOf(config.processedPrefix) === 0;
}

function getRequiredMilestoneSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Missing sheet "' + sheetName + '"');
  }

  return sheet;
}

if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    TRACKING_MILESTONE_CONFIG: TRACKING_MILESTONE_CONFIG,
    appendBulkMilestoneEventIfMissing_: appendBulkMilestoneEventIfMissing_,
    buildShipmentLookupForMilestones_: buildShipmentLookupForMilestones_,
    bulkMilestoneEventExists_: bulkMilestoneEventExists_,
    milestoneTupleExists_: milestoneTupleExists_,
    prepareBulkMilestoneUpdate_: prepareBulkMilestoneUpdate_,
    processBulkTrackingUpdatesForSpreadsheet_: processBulkTrackingUpdatesForSpreadsheet_,
  });
}
