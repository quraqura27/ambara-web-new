export const bulkShipmentImportModes = ["shipment_per_row", "parcel_per_row"] as const;

export type BulkShipmentImportMode = (typeof bulkShipmentImportModes)[number];

export const ambaraStatusCodes = [
  "DRAFT",
  "READY_FOR_VENDOR_HANDOVER",
  "HANDED_TO_DELIVERY_PARTNER",
  "VENDOR_TRACKING_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_ISSUE",
  "RETURN_IN_PROGRESS",
  "ON_HOLD",
] as const;

export type AmbaraStatusCode = (typeof ambaraStatusCodes)[number];

export type RawTableRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type NormalizedBulkShipmentRow = {
  rowNumber: number;
  customerName: string;
  customerReference: string;
  shipperName: string;
  shipperPhone: string;
  originCity: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  destinationCity: string;
  postalCode: string;
  commodity: string;
  weight: number;
  pieces: number;
  serviceType: string;
  deliveryInstruction: string;
  codAmount: number | null;
};

export type ValidatedBulkShipmentRow = {
  rowNumber: number;
  data: NormalizedBulkShipmentRow;
  errors: string[];
  warnings: string[];
  validationStatus: "valid" | "error" | "warning";
};

export type BulkShipmentImportPreview = {
  mode: BulkShipmentImportMode;
  rows: ValidatedBulkShipmentRow[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
};

export type VendorReturnRow = {
  rowNumber: number;
  ambaraParcelId: string;
  exportRowId: string;
  vendorTrackingNumber: string;
  vendorName: string;
  vendorServiceType: string;
  vendorStatus: string;
  vendorCreatedAt: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  destinationCity: string;
  postalCode: string;
  podUrl: string;
  remarks: string;
};

export type MatchableBatchParcel = {
  id: number;
  shipmentId: number;
  ambaraParcelId: string;
  exportRowId?: string | null;
  vendorTrackingNumber?: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  destinationCity: string;
  postalCode?: string | null;
  currentStatus?: string | null;
};

export type VendorTrackingMatch = {
  row: VendorReturnRow;
  parcel: MatchableBatchParcel | null;
  matchStatus: "auto_confirm" | "review_required" | "rejected" | "unmatched";
  matchMethod: string;
  matchConfidence: number;
  errors: string[];
};

export type VendorTrackingMatchResult = {
  matches: VendorTrackingMatch[];
  summary: {
    totalRows: number;
    matchedRows: number;
    highConfidenceRows: number;
    mediumConfidenceRows: number;
    unmatchedRows: number;
    duplicateRows: number;
    missingVendorTrackingRows: number;
    rowsOutsideBatch: number;
  };
};

export type StatusUpdateMatch = {
  row: VendorReturnRow;
  parcel: MatchableBatchParcel | null;
  oldStatus: string;
  newStatus: AmbaraStatusCode | null;
  publicDescription: string;
  matchStatus: "matched" | "rejected" | "unmatched";
  errors: string[];
};

export type VendorUploadParcel = {
  ambaraParcelId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  destinationCity: string;
  postalCode?: string | null;
  weight: string | number;
  pieces: string | number;
  commodity?: string | null;
  serviceType?: string | null;
  deliveryInstruction?: string | null;
  codAmount?: string | number | null;
};

export const defaultVendorStatusMappings = [
  {
    vendorName: "*",
    vendorRawStatus: "Paket dibawa kurir",
    ambaraStatusCode: "OUT_FOR_DELIVERY" as const,
    publicDescriptionTemplate: "Shipment is out for delivery.",
    isException: false,
  },
  {
    vendorName: "*",
    vendorRawStatus: "With delivery courier",
    ambaraStatusCode: "OUT_FOR_DELIVERY" as const,
    publicDescriptionTemplate: "Shipment is out for delivery.",
    isException: false,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Out for Delivery",
    ambaraStatusCode: "OUT_FOR_DELIVERY" as const,
    publicDescriptionTemplate: "Shipment is out for delivery.",
    isException: false,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Delivered",
    ambaraStatusCode: "DELIVERED" as const,
    publicDescriptionTemplate: "Shipment has been delivered successfully.",
    isException: false,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Diterima oleh",
    ambaraStatusCode: "DELIVERED" as const,
    publicDescriptionTemplate: "Shipment has been delivered successfully.",
    isException: false,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Penerima tidak di tempat",
    ambaraStatusCode: "DELIVERY_ISSUE" as const,
    publicDescriptionTemplate:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    isException: true,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Receiver unavailable",
    ambaraStatusCode: "DELIVERY_ISSUE" as const,
    publicDescriptionTemplate:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    isException: true,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Bad address",
    ambaraStatusCode: "DELIVERY_ISSUE" as const,
    publicDescriptionTemplate:
      "Delivery attempt could not be completed. Our team is monitoring the next update.",
    isException: true,
  },
  {
    vendorName: "*",
    vendorRawStatus: "Return in progress",
    ambaraStatusCode: "RETURN_IN_PROGRESS" as const,
    publicDescriptionTemplate: "Shipment is being returned by the delivery partner.",
    isException: true,
  },
];

const serviceTypeValues = new Set([
  "PP",
  "PD",
  "DP",
  "DD",
  "PTP",
  "PTD",
  "DTP",
  "DTD",
  "REGULAR",
  "EXPRESS",
  "SAME_DAY",
  "NEXT_DAY",
]);

const bulkShipmentColumns = {
  customerName: ["customer_name", "customer", "customer_full_name"],
  customerReference: ["customer_reference", "customer_ref", "reference", "order_id"],
  shipperName: ["shipper_name", "shipper"],
  shipperPhone: ["shipper_phone", "shipper_mobile"],
  originCity: ["origin_city", "origin"],
  receiverName: ["receiver_name", "consignee_name", "recipient_name"],
  receiverPhone: ["receiver_phone", "consignee_phone", "recipient_phone"],
  receiverAddress: ["receiver_address", "consignee_address", "recipient_address", "address"],
  destinationCity: ["destination_city", "destination"],
  postalCode: ["postal_code", "postcode", "zip"],
  commodity: ["commodity", "goods_description"],
  weight: ["weight", "weight_kg"],
  pieces: ["pieces", "pcs", "total_pcs"],
  serviceType: ["service_type", "service"],
  deliveryInstruction: ["delivery_instruction", "instruction", "remarks"],
  codAmount: ["cod_amount", "cod"],
};

const vendorReturnColumns = {
  ambaraParcelId: ["ambara_parcel_id", "parcel_id", "shipper_reference", "customer_reference"],
  exportRowId: ["export_row_id", "external_order_id", "external_id", "order_id"],
  vendorTrackingNumber: ["vendor_tracking_number", "tracking_number", "awb", "waybill", "vendor_awb"],
  vendorName: ["vendor_name", "vendor", "courier"],
  vendorServiceType: ["vendor_service_type", "vendor_service", "service_type"],
  vendorStatus: ["vendor_status", "status", "raw_status"],
  vendorCreatedAt: ["vendor_created_at", "event_time", "created_at", "timestamp"],
  receiverName: ["receiver_name", "recipient_name", "consignee_name", "receiver"],
  receiverPhone: ["receiver_phone", "recipient_phone", "consignee_phone", "phone"],
  receiverAddress: ["receiver_address", "recipient_address", "consignee_address", "address"],
  destinationCity: ["destination_city", "city"],
  postalCode: ["postal_code", "postcode", "zip"],
  podUrl: ["pod_url", "proof_of_delivery", "pod"],
  remarks: ["remarks", "note", "notes"],
};

export function normalizeTableHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeIdentifier(value: unknown) {
  return normalizeText(value).toUpperCase();
}

export function normalizePhone(value: unknown) {
  return normalizeText(value).replace(/[^\d+]/g, "");
}

function normalizeComparable(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseDelimitedText(text: string): RawTableRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n").filter((line) => line.trim());
  const headerLine = lines[0] ?? "";
  const delimiter = headerLine.includes("\t") ? "\t" : ",";
  const headers = parseDelimitedLine(headerLine, delimiter).map(normalizeTableHeader);

  return lines.slice(1).map((line, index) => {
    const cells = parseDelimitedLine(line, delimiter);
    const values = headers.reduce<Record<string, string>>((result, header, cellIndex) => {
      if (header) {
        result[header] = cells[cellIndex]?.trim() ?? "";
      }

      return result;
    }, {});

    return {
      rowNumber: index + 2,
      values,
    };
  });
}

function getValue(row: RawTableRow, aliases: string[]) {
  for (const alias of aliases) {
    const key = normalizeTableHeader(alias);
    const value = row.values[key];

    if (value !== undefined && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

function parseNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

function parsePieces(value: string) {
  const parsed = Number.parseInt(value.replace(/,/g, "").trim(), 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function validationStatus(errors: string[], warnings: string[]) {
  if (errors.length > 0) {
    return "error" as const;
  }

  if (warnings.length > 0) {
    return "warning" as const;
  }

  return "valid" as const;
}

export function prepareBulkShipmentImport(
  rows: RawTableRow[],
  mode: BulkShipmentImportMode,
): BulkShipmentImportPreview {
  const normalizedRows = rows.map((row) => {
    const weight = parseNumber(getValue(row, bulkShipmentColumns.weight));
    const piecesValue = getValue(row, bulkShipmentColumns.pieces) || "1";
    const pieces = parsePieces(piecesValue);
    const serviceType = normalizeIdentifier(getValue(row, bulkShipmentColumns.serviceType));
    const codAmountText = getValue(row, bulkShipmentColumns.codAmount);
    const codAmount = codAmountText ? parseNumber(codAmountText) : null;

    return {
      rowNumber: row.rowNumber,
      customerName: getValue(row, bulkShipmentColumns.customerName),
      customerReference: getValue(row, bulkShipmentColumns.customerReference),
      shipperName: getValue(row, bulkShipmentColumns.shipperName),
      shipperPhone: getValue(row, bulkShipmentColumns.shipperPhone),
      originCity: getValue(row, bulkShipmentColumns.originCity),
      receiverName: getValue(row, bulkShipmentColumns.receiverName),
      receiverPhone: getValue(row, bulkShipmentColumns.receiverPhone),
      receiverAddress: getValue(row, bulkShipmentColumns.receiverAddress),
      destinationCity: getValue(row, bulkShipmentColumns.destinationCity),
      postalCode: getValue(row, bulkShipmentColumns.postalCode),
      commodity: getValue(row, bulkShipmentColumns.commodity),
      weight,
      pieces,
      serviceType,
      deliveryInstruction: getValue(row, bulkShipmentColumns.deliveryInstruction),
      codAmount: codAmount === null || Number.isFinite(codAmount) ? codAmount : null,
    } satisfies NormalizedBulkShipmentRow;
  });

  const referenceCounts = new Map<string, number>();
  const phoneCounts = new Map<string, number>();
  const receiverAddressMap = new Map<string, Set<string>>();

  normalizedRows.forEach((row) => {
    const reference = normalizeComparable(row.customerReference);
    if (reference) {
      referenceCounts.set(reference, (referenceCounts.get(reference) ?? 0) + 1);
    }

    const phone = normalizePhone(row.receiverPhone);
    if (phone) {
      phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
    }

    const receiver = normalizeComparable(row.receiverName);
    const address = normalizeComparable(row.receiverAddress);
    if (receiver && address) {
      const addresses = receiverAddressMap.get(receiver) ?? new Set<string>();
      addresses.add(address);
      receiverAddressMap.set(receiver, addresses);
    }
  });

  const validatedRows = normalizedRows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.receiverName) errors.push("missing receiver_name");
    if (!row.receiverPhone) errors.push("missing receiver_phone");
    if (!row.receiverAddress) errors.push("missing receiver_address");
    if (!row.destinationCity) errors.push("missing destination_city");
    if (!Number.isFinite(row.weight) || row.weight <= 0) errors.push("missing or invalid weight");
    if (!Number.isInteger(row.pieces) || row.pieces <= 0) errors.push("invalid pieces");
    if (!serviceTypeValues.has(row.serviceType)) errors.push("invalid service_type");
    if (mode === "parcel_per_row" && !row.customerReference) {
      errors.push("customer_reference is required when one row equals one parcel");
    }

    const reference = normalizeComparable(row.customerReference);
    if (reference && (referenceCounts.get(reference) ?? 0) > 1) {
      warnings.push("duplicate customer_reference");
    }

    const phone = normalizePhone(row.receiverPhone);
    if (phone && (phoneCounts.get(phone) ?? 0) > 1) {
      warnings.push("same receiver phone used multiple times");
    }

    if (!row.postalCode) warnings.push("missing postal_code");
    if (!row.commodity) warnings.push("missing commodity");
    if (Number.isFinite(row.weight) && (row.weight < 0.1 || row.weight > 500)) {
      warnings.push("unusually high or low weight");
    }

    const receiver = normalizeComparable(row.receiverName);
    if (receiver && (receiverAddressMap.get(receiver)?.size ?? 0) > 1) {
      warnings.push("same receiver with multiple addresses");
    }

    return {
      rowNumber: row.rowNumber,
      data: row,
      errors,
      warnings,
      validationStatus: validationStatus(errors, warnings),
    };
  });

  return {
    mode,
    rows: validatedRows,
    summary: {
      totalRows: validatedRows.length,
      validRows: validatedRows.filter((row) => row.errors.length === 0).length,
      errorRows: validatedRows.filter((row) => row.errors.length > 0).length,
      warningRows: validatedRows.filter((row) => row.errors.length === 0 && row.warnings.length > 0)
        .length,
    },
  };
}

export function parseVendorReturnRows(text: string): VendorReturnRow[] {
  return parseDelimitedText(text).map((row) => ({
    rowNumber: row.rowNumber,
    ambaraParcelId: normalizeIdentifier(getValue(row, vendorReturnColumns.ambaraParcelId)),
    exportRowId: normalizeIdentifier(getValue(row, vendorReturnColumns.exportRowId)),
    vendorTrackingNumber: normalizeIdentifier(getValue(row, vendorReturnColumns.vendorTrackingNumber)),
    vendorName: getValue(row, vendorReturnColumns.vendorName),
    vendorServiceType: getValue(row, vendorReturnColumns.vendorServiceType),
    vendorStatus: getValue(row, vendorReturnColumns.vendorStatus),
    vendorCreatedAt: getValue(row, vendorReturnColumns.vendorCreatedAt),
    receiverName: getValue(row, vendorReturnColumns.receiverName),
    receiverPhone: getValue(row, vendorReturnColumns.receiverPhone),
    receiverAddress: getValue(row, vendorReturnColumns.receiverAddress),
    destinationCity: getValue(row, vendorReturnColumns.destinationCity),
    postalCode: getValue(row, vendorReturnColumns.postalCode),
    podUrl: getValue(row, vendorReturnColumns.podUrl),
    remarks: getValue(row, vendorReturnColumns.remarks),
  }));
}

function tokenSet(value: unknown) {
  return new Set(normalizeComparable(value).split(" ").filter(Boolean));
}

function addressSimilarity(left: string, right: string) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function bestMatch(
  candidates: MatchableBatchParcel[],
  predicate: (parcel: MatchableBatchParcel) => boolean,
) {
  return candidates.filter(predicate);
}

function buildCandidateMatches(row: VendorReturnRow, parcels: MatchableBatchParcel[]) {
  const ambaraParcelId = normalizeIdentifier(row.ambaraParcelId);
  const exportRowId = normalizeIdentifier(row.exportRowId);
  const vendorTrackingNumber = normalizeIdentifier(row.vendorTrackingNumber);
  const phone = normalizePhone(row.receiverPhone);
  const address = normalizeComparable(row.receiverAddress);
  const name = normalizeComparable(row.receiverName);
  const city = normalizeComparable(row.destinationCity);
  const postalCode = normalizeComparable(row.postalCode);

  const rules: Array<{
    method: string;
    confidence: number;
    matches: MatchableBatchParcel[];
    hardReference?: boolean;
  }> = [
    {
      method: "ambara_parcel_id",
      confidence: 100,
      matches: ambaraParcelId
        ? bestMatch(parcels, (parcel) => normalizeIdentifier(parcel.ambaraParcelId) === ambaraParcelId)
        : [],
      hardReference: Boolean(ambaraParcelId),
    },
    {
      method: "export_row_id",
      confidence: 100,
      matches: exportRowId
        ? bestMatch(parcels, (parcel) => normalizeIdentifier(parcel.exportRowId) === exportRowId)
        : [],
      hardReference: Boolean(exportRowId),
    },
    {
      method: "already_linked_vendor_tracking_number",
      confidence: 100,
      matches: vendorTrackingNumber
        ? bestMatch(
            parcels,
            (parcel) => normalizeIdentifier(parcel.vendorTrackingNumber) === vendorTrackingNumber,
          )
        : [],
    },
    {
      method: "receiver_phone_full_address",
      confidence: 95,
      matches:
        phone && address
          ? bestMatch(
              parcels,
              (parcel) =>
                normalizePhone(parcel.receiverPhone) === phone &&
                normalizeComparable(parcel.receiverAddress) === address,
            )
          : [],
    },
    {
      method: "receiver_phone_receiver_name",
      confidence: 88,
      matches:
        phone && name
          ? bestMatch(
              parcels,
              (parcel) =>
                normalizePhone(parcel.receiverPhone) === phone &&
                normalizeComparable(parcel.receiverName) === name,
            )
          : [],
    },
    {
      method: "receiver_name_city_postal_code",
      confidence: 80,
      matches:
        name && city && postalCode
          ? bestMatch(
              parcels,
              (parcel) =>
                normalizeComparable(parcel.receiverName) === name &&
                normalizeComparable(parcel.destinationCity) === city &&
                normalizeComparable(parcel.postalCode) === postalCode,
            )
          : [],
    },
  ];

  const similarAddressMatches =
    name && address
      ? parcels
          .map((parcel) => ({
            parcel,
            similarity:
              normalizeComparable(parcel.receiverName) === name
                ? addressSimilarity(parcel.receiverAddress, row.receiverAddress)
                : 0,
          }))
          .filter((match) => match.similarity >= 0.7)
      : [];

  if (similarAddressMatches.length > 0) {
    const bestSimilarity = Math.max(...similarAddressMatches.map((match) => match.similarity));
    rules.push({
      method: "receiver_name_address_similarity",
      confidence: Math.round(70 + Math.min(bestSimilarity, 1) * 15),
      matches: similarAddressMatches
        .filter((match) => match.similarity === bestSimilarity)
        .map((match) => match.parcel),
    });
  }

  return rules;
}

export function matchVendorTrackingRows(
  rows: VendorReturnRow[],
  parcels: MatchableBatchParcel[],
  options: { activeVendorTrackingNumbers?: Set<string> } = {},
): VendorTrackingMatchResult {
  const activeVendorTrackingNumbers = options.activeVendorTrackingNumbers ?? new Set<string>();
  const trackingCounts = new Map<string, number>();

  rows.forEach((row) => {
    const trackingNumber = normalizeIdentifier(row.vendorTrackingNumber);
    if (trackingNumber) {
      trackingCounts.set(trackingNumber, (trackingCounts.get(trackingNumber) ?? 0) + 1);
    }
  });

  const matches: VendorTrackingMatch[] = rows.map((row) => {
    const vendorTrackingNumber = normalizeIdentifier(row.vendorTrackingNumber);
    const errors: string[] = [];

    if (!vendorTrackingNumber) {
      errors.push("missing vendor_tracking_number");
    }

    if (vendorTrackingNumber && (trackingCounts.get(vendorTrackingNumber) ?? 0) > 1) {
      errors.push("duplicate vendor_tracking_number");
    }

    if (vendorTrackingNumber && activeVendorTrackingNumbers.has(vendorTrackingNumber)) {
      errors.push("vendor tracking already used by another active parcel");
    }

    const rules = buildCandidateMatches(row, parcels);
    const hardReferenceRule = rules.find((rule) => rule.hardReference);
    const firstMatchingRule = rules.find((rule) => rule.matches.length > 0);
    const referencedParcel =
      hardReferenceRule?.matches.length === 1 ? hardReferenceRule.matches[0] : null;
    const existingSameBatchTrackingParcel = vendorTrackingNumber
      ? parcels.find(
          (parcel) => normalizeIdentifier(parcel.vendorTrackingNumber) === vendorTrackingNumber,
        ) ?? null
      : null;

    if (hardReferenceRule && hardReferenceRule.matches.length === 0) {
      errors.push("Ambara parcel ID or export_row_id not found in selected batch");
    }

    if (
      existingSameBatchTrackingParcel &&
      referencedParcel &&
      existingSameBatchTrackingParcel.id !== referencedParcel.id
    ) {
      errors.push("vendor tracking already assigned to another parcel in this batch");
    }

    if (
      referencedParcel?.vendorTrackingNumber &&
      vendorTrackingNumber &&
      normalizeIdentifier(referencedParcel.vendorTrackingNumber) !== vendorTrackingNumber
    ) {
      errors.push("parcel already has a different vendor tracking number");
    }

    if (errors.length > 0) {
      return {
        row,
        parcel: null,
        matchStatus: "rejected" as const,
        matchMethod: firstMatchingRule?.method ?? "none",
        matchConfidence: firstMatchingRule?.confidence ?? 0,
        errors,
      };
    }

    if (!firstMatchingRule) {
      return {
        row,
        parcel: null,
        matchStatus: "unmatched" as const,
        matchMethod: "manual_review_required",
        matchConfidence: 0,
        errors: ["manual review required"],
      };
    }

    if (firstMatchingRule.matches.length > 1) {
      return {
        row,
        parcel: null,
        matchStatus: "rejected" as const,
        matchMethod: firstMatchingRule.method,
        matchConfidence: firstMatchingRule.confidence,
        errors: ["ambiguous match"],
      };
    }

    const matchStatus =
      firstMatchingRule.confidence >= 90 ? ("auto_confirm" as const) : ("review_required" as const);

    return {
      row,
      parcel: firstMatchingRule.matches[0] ?? null,
      matchStatus,
      matchMethod: firstMatchingRule.method,
      matchConfidence: firstMatchingRule.confidence,
      errors: [],
    };
  });

  return {
    matches,
    summary: {
      totalRows: rows.length,
      matchedRows: matches.filter((match) => Boolean(match.parcel)).length,
      highConfidenceRows: matches.filter((match) => match.matchConfidence >= 90 && Boolean(match.parcel))
        .length,
      mediumConfidenceRows: matches.filter(
        (match) =>
          match.matchConfidence >= 70 && match.matchConfidence < 90 && Boolean(match.parcel),
      ).length,
      unmatchedRows: matches.filter((match) => match.matchStatus === "unmatched").length,
      duplicateRows: matches.filter((match) =>
        match.errors.includes("duplicate vendor_tracking_number"),
      ).length,
      missingVendorTrackingRows: matches.filter((match) =>
        match.errors.includes("missing vendor_tracking_number"),
      ).length,
      rowsOutsideBatch: matches.filter((match) =>
        match.errors.includes("Ambara parcel ID or export_row_id not found in selected batch"),
      ).length,
    },
  };
}

export function publicDescriptionForStatus(statusCode: AmbaraStatusCode) {
  const descriptions: Record<AmbaraStatusCode, string> = {
    DRAFT: "Shipment information has been received.",
    READY_FOR_VENDOR_HANDOVER: "Shipment is being prepared for final delivery processing.",
    HANDED_TO_DELIVERY_PARTNER: "Shipment has been handed over for final delivery processing.",
    VENDOR_TRACKING_ASSIGNED: "Shipment has been registered with the delivery partner.",
    OUT_FOR_DELIVERY: "Shipment is out for delivery.",
    DELIVERED: "Shipment has been delivered successfully.",
    DELIVERY_ISSUE: "Delivery attempt could not be completed. Our team is monitoring the next update.",
    RETURN_IN_PROGRESS: "Shipment is being returned by the delivery partner.",
    ON_HOLD: "Shipment is pending further delivery update.",
  };

  return descriptions[statusCode];
}

export function labelForStatus(statusCode: AmbaraStatusCode) {
  return statusCode
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function mapVendorStatus(rawStatus: string, vendorName = "*") {
  const raw = normalizeComparable(rawStatus);
  const vendor = normalizeComparable(vendorName || "*");
  const mapping = defaultVendorStatusMappings.find((candidate) => {
    const mappingVendor = candidate.vendorName.trim().toLowerCase();
    const mappingRaw = normalizeComparable(candidate.vendorRawStatus);

    return (
      (mappingVendor === "*" || mappingVendor === vendor) &&
      (raw === mappingRaw || raw.startsWith(`${mappingRaw} `))
    );
  });

  if (!mapping) {
    return {
      statusCode: "ON_HOLD" as AmbaraStatusCode,
      publicDescription: publicDescriptionForStatus("ON_HOLD"),
      isException: false,
    };
  }

  return {
    statusCode: mapping.ambaraStatusCode,
    publicDescription: mapping.publicDescriptionTemplate,
    isException: mapping.isException,
  };
}

export function matchVendorStatusRows(
  rows: VendorReturnRow[],
  parcels: MatchableBatchParcel[],
): StatusUpdateMatch[] {
  const parcelByTracking = new Map(
    parcels
      .filter((parcel) => normalizeIdentifier(parcel.vendorTrackingNumber))
      .map((parcel) => [normalizeIdentifier(parcel.vendorTrackingNumber), parcel]),
  );
  const trackingCounts = new Map<string, number>();

  rows.forEach((row) => {
    const trackingNumber = normalizeIdentifier(row.vendorTrackingNumber);
    if (trackingNumber) {
      trackingCounts.set(trackingNumber, (trackingCounts.get(trackingNumber) ?? 0) + 1);
    }
  });

  return rows.map((row) => {
    const vendorTrackingNumber = normalizeIdentifier(row.vendorTrackingNumber);
    const errors: string[] = [];

    if (!vendorTrackingNumber) {
      errors.push("missing vendor_tracking_number");
    }

    if (vendorTrackingNumber && (trackingCounts.get(vendorTrackingNumber) ?? 0) > 1) {
      errors.push("duplicate vendor_tracking_number");
    }

    const parcel = vendorTrackingNumber ? parcelByTracking.get(vendorTrackingNumber) ?? null : null;

    if (!parcel) {
      errors.push("vendor_tracking_number not found in selected batch");
    }

    if (!row.vendorStatus) {
      errors.push("missing status");
    }

    if (errors.length > 0 || !parcel) {
      return {
        row,
        parcel: null,
        oldStatus: "",
        newStatus: null,
        publicDescription: "",
        matchStatus: errors[0] === "vendor_tracking_number not found in selected batch" ? "unmatched" : "rejected",
        errors,
      } satisfies StatusUpdateMatch;
    }

    const mapped = mapVendorStatus(row.vendorStatus, row.vendorName);

    return {
      row,
      parcel,
      oldStatus: parcel.currentStatus ?? "",
      newStatus: mapped.statusCode,
      publicDescription: mapped.publicDescription,
      matchStatus: "matched",
      errors: [],
    } satisfies StatusUpdateMatch;
  });
}

export function parseOptionalDate(value: string) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeCsvValue(value: unknown) {
  const text = normalizeText(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

export function buildVendorUploadRows(batchCode: string, parcels: VendorUploadParcel[]) {
  return parcels.map((parcel, index) => ({
    ambara_batch_id: batchCode,
    export_row_id: `${batchCode}-${String(index + 1).padStart(4, "0")}`,
    ambara_parcel_id: parcel.ambaraParcelId,
    receiver_name: parcel.receiverName,
    receiver_phone: parcel.receiverPhone,
    receiver_address: parcel.receiverAddress,
    destination_city: parcel.destinationCity,
    postal_code: parcel.postalCode ?? "",
    weight: parcel.weight,
    pieces: parcel.pieces,
    commodity: parcel.commodity ?? "",
    service_type: parcel.serviceType ?? "",
    delivery_instruction: parcel.deliveryInstruction ?? "",
    cod_amount: parcel.codAmount ?? "",
  }));
}

export function buildVendorUploadCsv(batchCode: string, parcels: VendorUploadParcel[]) {
  return toCsv(buildVendorUploadRows(batchCode, parcels));
}

export function generateAmbaraTrackingNumber(random = Math.random) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(random() * alphabet.length)] ?? "A").join(
      "",
    );

  return `AA26-${segment()}-${segment()}`;
}

export function buildAmbaraParcelId(trackingNumber: string, parcelNumber: number) {
  return `${normalizeIdentifier(trackingNumber)}-${String(parcelNumber).padStart(3, "0")}`;
}
