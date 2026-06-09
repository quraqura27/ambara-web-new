const QUICK_ENTRY_CONFIG = {
  sheetName: "Quick_Entry",
  shipmentSheetName: "Shipments",
  headerRow: 1,
  portalBaseUrlProperty: "AMBARA_PORTAL_BASE_URL",
  defaultPortalBaseUrl: "https://www.ambaraartha.com",
  readyStatus: "READY",
  processedStatus: "PROCESSED",
  draftStatus: "DRAFT",
  errorStatus: "ERROR",
  defaultServiceType: "airport_to_airport",
  defaultCurrentStatus: "pending",
  defaultCargoType: "general",
  quickEntryHeaders: [
    "entry_status",
    "customer",
    "template",
    "mawb",
    "service_type",
    "origin",
    "origin_iata",
    "destination",
    "destination_iata",
    "shipper_name",
    "shipper_phone",
    "shipper_address",
    "consignee_name",
    "consignee_phone",
    "consignee_address",
    "goods_description",
    "commodity",
    "total_pcs",
    "weight_kg",
    "chargeable_weight",
    "created_cn",
    "print_link",
    "tracking_link",
    "sync_status",
    "error",
  ],
  requiredQuickEntryHeaders: [
    "customer",
    "origin",
    "destination",
    "shipper_name",
    "consignee_name",
    "consignee_phone",
    "consignee_address",
    "goods_description",
    "commodity",
    "total_pcs",
    "chargeable_weight",
  ],
  resultHeaders: [
    "entry_status",
    "created_cn",
    "print_link",
    "tracking_link",
    "sync_status",
    "error",
  ],
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Ambara Shipment")
    .addItem("Setup Quick Entry Sheet", "setupQuickEntrySheet")
    .addItem("Process Quick Entry Rows", "processQuickEntryRows")
    .addSeparator()
    .addItem("Generate Ready Shipments", "processReadyShipments")
    .addItem("Re-sync Generated Shipments", "syncGeneratedShipmentsToDatabase")
    .addItem("Process Bulk Tracking Updates", "processBulkTrackingUpdates")
    .addToUi();
}

function setupQuickEntrySheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(spreadsheet, QUICK_ENTRY_CONFIG.sheetName);
  ensureQuickEntryHeaders_(sheet, QUICK_ENTRY_CONFIG);
  freezeQuickEntryHeader_(sheet);
  console.log("Quick Entry sheet setup complete");
  return { ok: true, sheetName: QUICK_ENTRY_CONFIG.sheetName };
}

function processQuickEntryRows() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return withGeneratorLock_(function () {
    return processQuickEntryRowsForSpreadsheet_(spreadsheet, QUICK_ENTRY_CONFIG);
  });
}

function processQuickEntryRowsForSpreadsheet_(spreadsheet, config) {
  const activeConfig = config || QUICK_ENTRY_CONFIG;
  const quickSheet = spreadsheet.getSheetByName(activeConfig.sheetName);
  if (!quickSheet) {
    throw new Error('Missing sheet "' + activeConfig.sheetName + '". Run setupQuickEntrySheet first.');
  }

  const shipmentSheet = spreadsheet.getSheetByName(activeConfig.shipmentSheetName);
  if (!shipmentSheet) {
    throw new Error('Missing sheet "' + activeConfig.shipmentSheetName + '"');
  }

  ensureQuickEntryHeaders_(quickSheet, activeConfig);

  const quickContext = getHeaderContext_(quickSheet, activeConfig.headerRow);
  const shipmentContext = getHeaderContext_(shipmentSheet, SHIPMENT_GENERATOR_CONFIG.headerRow);
  assertRequiredHeaders_(shipmentContext.headerMap);
  assertRequiredHeadersInMap_(quickContext.headerMap, activeConfig.resultHeaders);

  const lastRow = quickSheet.getLastRow();
  const summary = {
    checkedRows: 0,
    created: 0,
    processed: 0,
    skipped: 0,
    errors: 0,
  };

  if (lastRow <= activeConfig.headerRow) {
    console.log("No Quick Entry rows to process", summary);
    return summary;
  }

  const rowCount = lastRow - activeConfig.headerRow;
  const quickRows = quickSheet
    .getRange(activeConfig.headerRow + 1, 1, rowCount, quickContext.headerValues.length)
    .getValues();

  quickRows.forEach(function (rowValues, offset) {
    const quickRowNumber = activeConfig.headerRow + 1 + offset;
    const quickRowObject = rowValuesToObject_(quickContext.headerValues, rowValues);
    const status = normalizeQuickEntryStatus_(quickRowObject.entry_status);

    if (status !== activeConfig.readyStatus) {
      summary.skipped += 1;
      return;
    }

    summary.checkedRows += 1;
    const validation = validateQuickEntryRow_(quickRowObject, activeConfig);
    if (!validation.ok) {
      writeQuickEntryResult_(quickSheet, quickRowNumber, quickContext.headerMap, {
        entry_status: activeConfig.errorStatus,
        error: validation.error,
      });
      summary.errors += 1;
      return;
    }

    try {
      const now = new Date();
      const shipmentRowObject = buildShipmentRowFromQuickEntry_(quickRowObject, now, activeConfig);
      const appendResult = appendShipmentRowFromObject_(shipmentSheet, shipmentContext, shipmentRowObject);
      const generationResult = processShipmentRowWithoutLock_(shipmentSheet, appendResult.rowNumber);
      const updatedShipmentObject = readRowObject_(shipmentSheet, appendResult.rowNumber, shipmentContext);
      const trackingNumber = cleanValue_(
        updatedShipmentObject[SHIPMENT_GENERATOR_CONFIG.internalTrackingHeader] ||
        generationResult.trackingNumber,
      );
      const links = buildQuickEntryResultLinks_(trackingNumber, activeConfig);
      const syncStatus = cleanValue_(updatedShipmentObject.db_sync_status || "");
      const syncError = cleanValue_(updatedShipmentObject.db_sync_error || "");
      const generationStatus = cleanValue_(updatedShipmentObject.generation_status || generationResult.status);
      const isCreated = trackingNumber && (generationStatus === "CREATED" || generationStatus === "ALREADY_CREATED");

      if (!isCreated) {
        writeQuickEntryResult_(quickSheet, quickRowNumber, quickContext.headerMap, {
          entry_status: activeConfig.errorStatus,
          created_cn: trackingNumber,
          print_link: links.printLink,
          tracking_link: links.trackingLink,
          sync_status: syncStatus,
          error: generationStatus || "ERROR: Shipment generation failed",
        });
        summary.errors += 1;
        return;
      }

      writeQuickEntryResult_(quickSheet, quickRowNumber, quickContext.headerMap, {
        entry_status: activeConfig.processedStatus,
        created_cn: trackingNumber,
        print_link: links.printLink,
        tracking_link: links.trackingLink,
        sync_status: syncStatus,
        error: syncError,
      });
      summary.created += 1;
      summary.processed += 1;
    } catch (error) {
      writeQuickEntryResult_(quickSheet, quickRowNumber, quickContext.headerMap, {
        entry_status: activeConfig.errorStatus,
        error: "ERROR: " + (error.message || String(error)),
      });
      summary.errors += 1;
    }
  });

  console.log("Quick Entry processing complete", summary);
  return summary;
}

function ensureQuickEntryHeaders_(sheet, config) {
  const activeConfig = config || QUICK_ENTRY_CONFIG;
  const lastColumn = Math.max(sheet.getLastColumn(), activeConfig.quickEntryHeaders.length);
  const existingHeaders = lastColumn > 0
    ? sheet.getRange(activeConfig.headerRow, 1, 1, lastColumn).getValues()[0]
    : [];
  const headerMap = buildHeaderMap_(existingHeaders);
  const headersToAppend = activeConfig.quickEntryHeaders.filter(function (header) {
    return !Object.prototype.hasOwnProperty.call(headerMap, header);
  });

  if (existingHeaders.filter(function (header) { return cleanValue_(header); }).length === 0) {
    sheet.getRange(activeConfig.headerRow, 1, 1, activeConfig.quickEntryHeaders.length)
      .setValues([activeConfig.quickEntryHeaders]);
    return;
  }

  if (!headersToAppend.length) return;

  const startColumn = existingHeaders.length + 1;
  sheet.getRange(activeConfig.headerRow, startColumn, 1, headersToAppend.length)
    .setValues([headersToAppend]);
}

function freezeQuickEntryHeader_(sheet) {
  if (typeof sheet.setFrozenRows === "function") {
    sheet.setFrozenRows(1);
  }
}

function getOrCreateSheet_(spreadsheet, sheetName) {
  const existingSheet = spreadsheet.getSheetByName(sheetName);
  if (existingSheet) return existingSheet;
  if (typeof spreadsheet.insertSheet !== "function") {
    throw new Error('Missing sheet "' + sheetName + '"');
  }
  return spreadsheet.insertSheet(sheetName);
}

function validateQuickEntryRow_(rowObject, config) {
  const activeConfig = config || QUICK_ENTRY_CONFIG;
  const missing = [];

  activeConfig.requiredQuickEntryHeaders.forEach(function (header) {
    if (isBlank_(rowObject[header])) {
      missing.push(header);
    }
  });

  if (missing.length) {
    return { ok: false, error: "ERROR: Missing " + missing.join(", ") };
  }

  const pcs = Number(rowObject.total_pcs);
  if (!Number.isFinite(pcs) || pcs < 1) {
    return { ok: false, error: "ERROR: total_pcs must be at least 1" };
  }

  const chargeableWeight = Number(rowObject.chargeable_weight);
  if (!Number.isFinite(chargeableWeight) || chargeableWeight <= 0) {
    return { ok: false, error: "ERROR: chargeable_weight must be greater than 0" };
  }

  return { ok: true, error: "" };
}

function buildShipmentRowFromQuickEntry_(rowObject, now, config) {
  const activeConfig = config || QUICK_ENTRY_CONFIG;
  const timestamp = now || new Date();
  const mawb = cleanValue_(rowObject.mawb);
  const origin = cleanValue_(rowObject.origin);
  const destination = cleanValue_(rowObject.destination);
  const customer = cleanValue_(rowObject.customer);
  const titleParts = [customer, origin, destination].filter(function (part) { return part; });
  const title = cleanValue_(rowObject.title) ||
    (mawb ? "Shipment " + mawb : "Shipment " + titleParts.join(" - "));
  const chargeableWeight = cleanValue_(rowObject.chargeable_weight);
  const weightKg = cleanValue_(rowObject.weight_kg) || chargeableWeight;

  return buildUpdates_({
    ready_to_generate: true,
    internal_tracking_no: "",
    tracking_created_at: "",
    generation_status: "",
    mawb: mawb,
    title: title,
    current_status: activeConfig.defaultCurrentStatus,
    service_type: cleanValue_(rowObject.service_type) || activeConfig.defaultServiceType,
    origin: origin,
    origin_iata: cleanValue_(rowObject.origin_iata),
    destination: destination,
    destination_iata: cleanValue_(rowObject.destination_iata),
    customer_name: customer,
    shipper_name: cleanValue_(rowObject.shipper_name),
    shipper_address: cleanValue_(rowObject.shipper_address),
    shipper_phone: cleanValue_(rowObject.shipper_phone),
    consignee_name: cleanValue_(rowObject.consignee_name),
    consignee_address: cleanValue_(rowObject.consignee_address),
    consignee_phone: cleanValue_(rowObject.consignee_phone),
    goods_description: cleanValue_(rowObject.goods_description),
    cargo_type: cleanValue_(rowObject.cargo_type) || activeConfig.defaultCargoType,
    commodity: cleanValue_(rowObject.commodity),
    total_pcs: Number(rowObject.total_pcs),
    weight_kg: weightKg,
    chargeable_weight: chargeableWeight,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

function appendShipmentRowFromObject_(sheet, context, rowObject) {
  const nextRow = Math.max(sheet.getLastRow() + 1, SHIPMENT_GENERATOR_CONFIG.headerRow + 1);
  const values = context.headerValues.map(function (header) {
    const key = normalizeHeader_(header);
    if (!key || !Object.prototype.hasOwnProperty.call(rowObject, key)) {
      return "";
    }
    return rowObject[key];
  });
  sheet.getRange(nextRow, 1, 1, context.headerValues.length).setValues([values]);
  return { rowNumber: nextRow, values: values };
}

function readRowObject_(sheet, rowNumber, context) {
  const values = sheet.getRange(rowNumber, 1, 1, context.headerValues.length).getValues()[0];
  return rowValuesToObject_(context.headerValues, values);
}

function writeQuickEntryResult_(sheet, rowNumber, headerMap, updates) {
  writeUpdatesToRow_(sheet, rowNumber, headerMap, buildUpdates_(updates));
}

function buildQuickEntryResultLinks_(trackingNumber, config) {
  const activeConfig = config || QUICK_ENTRY_CONFIG;
  const cleanedTrackingNumber = cleanValue_(trackingNumber);
  const portalBaseUrl = getPortalBaseUrl_(activeConfig);
  const encodedTrackingNumber = encodeURIComponent(cleanedTrackingNumber);

  if (!cleanedTrackingNumber) {
    return { printLink: "", trackingLink: "" };
  }

  return {
    printLink: portalBaseUrl + "/shipments/" + encodedTrackingNumber + "/consignment-note",
    trackingLink: portalBaseUrl + "/track?number=" + encodedTrackingNumber,
  };
}

function getPortalBaseUrl_(config) {
  const activeConfig = config || QUICK_ENTRY_CONFIG;
  try {
    if (typeof PropertiesService !== "undefined") {
      const propertyValue = PropertiesService.getScriptProperties()
        .getProperty(activeConfig.portalBaseUrlProperty);
      if (cleanValue_(propertyValue)) {
        return cleanValue_(propertyValue).replace(/\/+$/, "");
      }
    }
  } catch (error) {
    // Fall back to the production public domain when script properties are unavailable.
  }

  return activeConfig.defaultPortalBaseUrl.replace(/\/+$/, "");
}

function normalizeQuickEntryStatus_(status) {
  return cleanValue_(status).toUpperCase();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports.QUICK_ENTRY_CONFIG = QUICK_ENTRY_CONFIG;
  module.exports.buildQuickEntryResultLinks_ = buildQuickEntryResultLinks_;
  module.exports.buildShipmentRowFromQuickEntry_ = buildShipmentRowFromQuickEntry_;
  module.exports.normalizeQuickEntryStatus_ = normalizeQuickEntryStatus_;
  module.exports.validateQuickEntryRow_ = validateQuickEntryRow_;
}
