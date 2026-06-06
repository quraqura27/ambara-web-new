const SHIPMENT_DATABASE_SYNC_CONFIG = {
  sheetName: "Shipments",
  headerRow: 1,
  endpointProperty: "AMBARA_SYNC_ENDPOINT",
  secretProperty: "AMBARA_SYNC_SECRET",
  syncStatusHeader: "db_sync_status",
  syncSyncedAtHeader: "db_synced_at",
  syncErrorHeader: "db_sync_error",
  internalTrackingHeader: "internal_tracking_no",
  generationStatusHeader: "generation_status",
  syncedStatus: "SYNCED",
  allowedPayloadHeaders: [
    "internal_tracking_no",
    "tracking_created_at",
    "generation_status",
    "mawb",
    "title",
    "current_status",
    "service_type",
    "origin",
    "origin_iata",
    "destination",
    "destination_iata",
    "customer_name",
    "shipper_name",
    "shipper_address",
    "shipper_phone",
    "consignee_name",
    "consignee_address",
    "consignee_phone",
    "goods_description",
    "cargo_type",
    "commodity",
    "total_pcs",
    "weight_kg",
    "chargeable_weight",
    "created_at",
    "updated_at",
  ],
  requiredPayloadHeaders: [
    "internal_tracking_no",
    "title",
    "origin",
    "destination",
  ],
};

function syncGeneratedShipmentsToDatabase() {
  const sheet = getShipmentsSheet_();
  return withGeneratorLock_(function () {
    return syncGeneratedShipmentsToDatabaseForSheet_(sheet, SHIPMENT_DATABASE_SYNC_CONFIG);
  });
}

function syncGeneratedShipmentsToDatabaseForSheet_(sheet, config) {
  const activeConfig = config || SHIPMENT_DATABASE_SYNC_CONFIG;
  const context = getHeaderContext_(sheet, activeConfig.headerRow);
  assertDatabaseSyncHeaders_(context.headerMap, activeConfig);
  const syncProperties = getDatabaseSyncProperties_(activeConfig);
  const lastRow = sheet.getLastRow();
  const summary = {
    checkedRows: 0,
    synced: 0,
    alreadySynced: 0,
    skipped: 0,
    errors: 0,
  };

  if (lastRow <= activeConfig.headerRow) {
    console.log("No generated shipments to sync", summary);
    return summary;
  }

  const rowCount = lastRow - activeConfig.headerRow;
  const values = sheet
    .getRange(activeConfig.headerRow + 1, 1, rowCount, context.headerValues.length)
    .getValues();

  values.forEach(function (rowValues, offset) {
    const rowNumber = activeConfig.headerRow + 1 + offset;
    const rowObject = rowValuesToObject_(context.headerValues, rowValues);
    const decision = shouldSyncShipmentDatabaseRow_(rowObject, activeConfig);

    if (!decision.shouldSync) {
      if (decision.reason === "already_synced") {
        summary.alreadySynced += 1;
      } else {
        summary.skipped += 1;
      }
      return;
    }

    summary.checkedRows += 1;
    const result = syncShipmentRowObjectToDatabase_(
      rowObject,
      syncProperties.endpoint,
      syncProperties.secret,
      fetchDatabaseSync_,
      new Date(),
      activeConfig,
    );

    writeUpdatesToRow_(sheet, rowNumber, context.headerMap, result.updates);

    if (result.ok) {
      summary.synced += 1;
    } else {
      summary.errors += 1;
    }
  });

  console.log("Generated shipment database sync complete", summary);
  return summary;
}

function syncGeneratedShipmentRowAfterCreate_(sheet, rowNumber, context, rowObject, now) {
  const config = SHIPMENT_DATABASE_SYNC_CONFIG;

  if (!hasDatabaseSyncHeaders_(context.headerMap, config)) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_sync_headers",
      updates: {},
    };
  }

  try {
    const syncProperties = getDatabaseSyncProperties_(config);
    const result = syncShipmentRowObjectToDatabase_(
      rowObject,
      syncProperties.endpoint,
      syncProperties.secret,
      fetchDatabaseSync_,
      now || new Date(),
      config,
    );
    writeUpdatesToRow_(sheet, rowNumber, context.headerMap, result.updates);
    return result;
  } catch (error) {
    const updates = buildDatabaseSyncUpdates_(
      "ERROR",
      "",
      error.message || String(error),
      config,
    );
    writeUpdatesToRow_(sheet, rowNumber, context.headerMap, updates);
    return {
      ok: false,
      skipped: false,
      reason: "sync_error",
      updates: updates,
    };
  }
}

function shouldSyncShipmentDatabaseRow_(rowObject, config) {
  const trackingNumber = cleanValue_(rowObject[config.internalTrackingHeader]);
  if (!trackingNumber) {
    return { shouldSync: false, reason: "missing_internal_tracking_no" };
  }

  const generationStatus = cleanValue_(rowObject[config.generationStatusHeader]).toUpperCase();
  if (generationStatus && generationStatus !== "CREATED" && generationStatus !== "ALREADY_CREATED") {
    return { shouldSync: false, reason: "not_generated" };
  }

  const syncStatus = cleanValue_(rowObject[config.syncStatusHeader]).toUpperCase();
  if (syncStatus === config.syncedStatus) {
    return { shouldSync: false, reason: "already_synced" };
  }

  return { shouldSync: true, reason: "pending" };
}

function buildShipmentDatabaseSyncPayload_(rowObject, config) {
  const activeConfig = config || SHIPMENT_DATABASE_SYNC_CONFIG;
  const payload = {};
  const missing = [];

  activeConfig.allowedPayloadHeaders.forEach(function (header) {
    if (!Object.prototype.hasOwnProperty.call(rowObject, header)) return;
    if (isBlank_(rowObject[header])) return;
    payload[header] = rowObject[header];
  });

  activeConfig.requiredPayloadHeaders.forEach(function (header) {
    if (isBlank_(payload[header])) {
      missing.push(header);
    }
  });

  if (missing.length) {
    throw new Error("Missing required sync field(s): " + missing.join(", "));
  }

  return payload;
}

function syncShipmentRowObjectToDatabase_(rowObject, endpoint, secret, fetchFn, now, config) {
  const activeConfig = config || SHIPMENT_DATABASE_SYNC_CONFIG;

  try {
    const payload = buildShipmentDatabaseSyncPayload_(rowObject, activeConfig);
    const response = fetchFn(endpoint, {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + secret,
      },
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
    });
    const parsed = parseDatabaseSyncResponse_(response);

    if (
      parsed.statusCode >= 200 &&
      parsed.statusCode < 300 &&
      parsed.body &&
      parsed.body.success === true
    ) {
      return {
        ok: true,
        statusCode: parsed.statusCode,
        trackingNumber: parsed.body.tracking_number || payload.internal_tracking_no,
        updates: buildDatabaseSyncUpdates_(activeConfig.syncedStatus, now, "", activeConfig),
      };
    }

    return {
      ok: false,
      statusCode: parsed.statusCode,
      updates: buildDatabaseSyncUpdates_(
        "ERROR",
        "",
        databaseSyncErrorMessage_(parsed),
        activeConfig,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 0,
      updates: buildDatabaseSyncUpdates_(
        "ERROR",
        "",
        error.message || String(error),
        activeConfig,
      ),
    };
  }
}

function fetchDatabaseSync_(endpoint, options) {
  return UrlFetchApp.fetch(endpoint, options);
}

function parseDatabaseSyncResponse_(response) {
  const statusCode = response.getResponseCode();
  const text = response.getContentText();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = null;
  }

  return {
    statusCode: statusCode,
    body: body,
    text: text,
  };
}

function databaseSyncErrorMessage_(parsed) {
  const bodyError = parsed.body && parsed.body.error;
  const message = bodyError && bodyError.message
    ? bodyError.message
    : parsed.text || "Database sync failed";
  const code = bodyError && bodyError.code ? bodyError.code + ": " : "";
  return truncateDatabaseSyncError_(code + message);
}

function truncateDatabaseSyncError_(message) {
  const text = cleanValue_(message);
  return text.length > 500 ? text.slice(0, 497) + "..." : text;
}

function buildDatabaseSyncUpdates_(status, syncedAt, errorMessage, config) {
  const updates = {};
  updates[config.syncStatusHeader] = status;
  updates[config.syncSyncedAtHeader] = syncedAt || "";
  updates[config.syncErrorHeader] = errorMessage ? truncateDatabaseSyncError_(errorMessage) : "";
  return buildUpdates_(updates);
}

function getDatabaseSyncProperties_(config) {
  const properties = PropertiesService.getScriptProperties();
  const endpoint = cleanValue_(properties.getProperty(config.endpointProperty));
  const secret = cleanValue_(properties.getProperty(config.secretProperty));

  if (!endpoint) {
    throw new Error("Missing Script Property: " + config.endpointProperty);
  }

  if (!secret) {
    throw new Error("Missing Script Property: " + config.secretProperty);
  }

  return {
    endpoint: endpoint,
    secret: secret,
  };
}

function hasDatabaseSyncHeaders_(headerMap, config) {
  return [
    config.syncStatusHeader,
    config.syncSyncedAtHeader,
    config.syncErrorHeader,
  ].every(function (header) {
    return Object.prototype.hasOwnProperty.call(headerMap, header);
  });
}

function assertDatabaseSyncHeaders_(headerMap, config) {
  assertRequiredHeadersInMap_(headerMap, [
    config.internalTrackingHeader,
    config.syncStatusHeader,
    config.syncSyncedAtHeader,
    config.syncErrorHeader,
  ].concat(config.requiredPayloadHeaders));
}

if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    SHIPMENT_DATABASE_SYNC_CONFIG: SHIPMENT_DATABASE_SYNC_CONFIG,
    buildShipmentDatabaseSyncPayload_: buildShipmentDatabaseSyncPayload_,
    parseDatabaseSyncResponse_: parseDatabaseSyncResponse_,
    shouldSyncShipmentDatabaseRow_: shouldSyncShipmentDatabaseRow_,
    syncGeneratedShipmentsToDatabaseForSheet_: syncGeneratedShipmentsToDatabaseForSheet_,
    syncShipmentRowObjectToDatabase_: syncShipmentRowObjectToDatabase_,
  });
}
