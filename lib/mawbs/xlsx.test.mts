import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { inflateRawSync } from "node:zlib";

import { parseMawbForm } from "./core.ts";
import { generateMawbWorkbook } from "./xlsx.ts";

function validForm() {
  const values = {
    actionMode: "print_only",
    agentName: "PT PLI",
    chargeableWeight: "12",
    commodity: "General cargo",
    consigneeAddress: "Consignee address",
    consigneeName: "Consignee Name",
    currency: "IDR",
    declaredValueForCarriage: "NVD",
    declaredValueForCustoms: "NCV",
    departureAirport: "JAKARTA",
    destinationAirport: "MEXICO CITY",
    destinationIata: "MEX",
    executedDate: "2026-06-26",
    executedPlace: "CGK",
    flightDate: "2026-06-27",
    flightNumber: "GA123",
    goodsDescription: "Boxed goods",
    grossWeight: "10",
    handlingInformation: "HANDLING TEST\nOCI/ID/SHP/T/TIN 0000000000000000",
    idempotencyKey: "mawb-xlsx-test-key",
    insuranceAmount: "NIL",
    mawbNumber: "126-91929552",
    natureQuantity: "NATURE TEST\nDIMS 10X10X10 / 1",
    originIata: "CGK",
    pieces: "3",
    rate: "1000",
    routingBy1: "AK",
    routingBy2: "CX",
    routingTo1: "TPE",
    routingTo2: "HKG",
    serviceType: "PTP",
    shipperAddress: "Shipper address",
    shipperName: "Shipper Name",
  };
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  [
    { amount: "10", basis: "fixed", code: "AWC", currency: "IDR" },
    { amount: "2", basis: "per_kg", code: "ZB", currency: "IDR" },
  ].forEach((line) => {
    formData.append("chargeCode", line.code);
    formData.append("chargeCurrency", line.currency);
    formData.append("chargeAmount", line.amount);
    formData.append("chargeBasis", line.basis);
  });
  return formData;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("EOCD not found");
}

function readZipEntries(buffer: Buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map<string, string>();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const name = buffer.subarray(fileNameStart, fileNameStart + fileNameLength).toString("utf8");
    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = compressionMethod === 0 ? compressedData : inflateRawSync(compressedData);
    entries.set(name, data.toString("utf8"));
    offset = fileNameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function worksheetDimensionProfile(xml: string) {
  return {
    cols: xml.match(/<cols>[\s\S]*?<\/cols>/)?.[0] ?? "",
    dimension: xml.match(/<dimension[^>]*\/>/)?.[0] ?? "",
    pageSetup: xml.match(/<pageSetup[^>]*\/>/)?.[0] ?? "",
    rowHeights: Array.from(xml.matchAll(/<row\b[^>]*\bht="[^"]+"[^>]*>/g), (match) => match[0]),
    sheetFormatPr: xml.match(/<sheetFormatPr[^>]*\/>/)?.[0] ?? "",
  };
}

function cellValue(xml: string, ref: string) {
  const match = xml.match(new RegExp(`<c\\b(?=[^>]*\\br="${ref}")[\\s\\S]*?<v>(.*?)</v>[\\s\\S]*?</c>`));
  return match?.[1] ?? "";
}

function inlineCellValue(xml: string, ref: string) {
  const cell = xml.match(
    new RegExp(`<c\\b(?=[^>]*\\br="${ref}")[^>]*>[\\s\\S]*?</c>`),
  )?.[0];
  return cell?.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
}

function cellStyleId(xml: string, ref: string) {
  const cell = xml.match(
    new RegExp(`<c\\b(?=[^>]*\\br="${ref}")[^>]*(?:/>|>[\\s\\S]*?</c>)`),
  )?.[0];
  const styleId = Number(cell?.match(/\bs="(\d+)"/)?.[1]);
  return Number.isInteger(styleId) ? styleId : null;
}

function cellXml(xml: string, ref: string) {
  return xml.match(
    new RegExp(`<c\\b(?=[^>]*\\br="${ref}")[^>]*(?:/>|>[\\s\\S]*?</c>)`),
  )?.[0] ?? "";
}

function routeValueRunSize(xml: string, ref: string) {
  const cell = cellXml(xml, ref);
  const routeValueRun = cell.match(/<r><rPr>[\s\S]*?<sz\b[^>]*\bval="([^"]+)"[\s\S]*?<\/rPr><t\b[^>]*>[\s\S]*?<\/t><\/r>/);
  return routeValueRun?.[1] ?? "";
}

function routeValueRunColor(xml: string, ref: string) {
  const cell = cellXml(xml, ref);
  return cell.match(/<r><rPr>[\s\S]*?<color\b([^>]*)\/>[\s\S]*?<\/rPr><t\b[^>]*>[\s\S]*?<\/t><\/r>/)?.[1] ?? "";
}

function styleFontId(stylesXml: string, styleId: number) {
  const cellXfs = stylesXml.match(/<cellXfs\b[^>]*>[\s\S]*?<\/cellXfs>/)?.[0] ?? "";
  const xfs = cellXfs
    .replace(/^<cellXfs\b[^>]*>/, "")
    .replace(/<\/cellXfs>$/, "")
    .split(/(?=<xf\b)/)
    .map((part) => part.trim())
    .filter((part) => part.startsWith("<xf"));
  return Number(xfs[styleId]?.match(/\bfontId="(\d+)"/)?.[1]);
}

function fontSize(stylesXml: string, fontId: number) {
  const fonts = stylesXml.match(/<fonts\b[^>]*>[\s\S]*?<\/fonts>/)?.[0] ?? "";
  const font = Array.from(fonts.matchAll(/<font>[\s\S]*?<\/font>/g), (match) => match[0])[fontId] ?? "";
  return font.match(/<sz\b[^>]*\bval="([^"]+)"/)?.[1] ?? "";
}

function pageMargins(xml: string) {
  return xml.match(/<pageMargins\b[^>]*\/>/)?.[0] ?? "";
}

test("generates a 10-sheet workbook while preserving template dimensions", async () => {
  const template = await readFile(path.join(process.cwd(), "assets/mawb/template-mawb-neutral.xlsx"));
  const generated = await generateMawbWorkbook(parseMawbForm(validForm()));
  const templateEntries = readZipEntries(template);
  const generatedEntries = readZipEntries(generated);

  for (let sheet = 1; sheet <= 10; sheet += 1) {
    const name = `xl/worksheets/sheet${sheet}.xml`;
    const templateSheet = templateEntries.get(name);
    const generatedSheet = generatedEntries.get(name);
    assert.ok(templateSheet, `${name} exists in template`);
    assert.ok(generatedSheet, `${name} exists in generated workbook`);
    assert.deepEqual(
      worksheetDimensionProfile(generatedSheet),
      worksheetDimensionProfile(templateSheet),
      `${name} keeps column widths, row heights, dimension, and page setup`,
    );
  }

  for (const [name, xml] of generatedEntries) {
    if (name.endsWith(".xml")) {
      assert.doesNotMatch(xml, /<c\b[^>]*\/\s+t="/, `${name} does not add attributes after a self-closing cell`);
    }
  }

  assert.equal(
    inlineCellValue(generatedEntries.get("xl/worksheets/sheet1.xml") ?? "", "AS29"),
    "NATURE TEST\nDIMS 10X10X10 / 1",
  );
  assert.equal(
    inlineCellValue(generatedEntries.get("xl/worksheets/sheet1.xml") ?? "", "AN2"),
    "Garuda Indonesia",
  );
  assert.equal(cellValue(generatedEntries.get("xl/worksheets/sheet1.xml") ?? "", "A46"), "30");
  assert.equal(cellValue(generatedEntries.get("xl/worksheets/sheet1.xml") ?? "", "A50"), "12030");
  assert.equal(cellValue(generatedEntries.get("xl/worksheets/sheet6.xml") ?? "", "A49"), "30");
  assert.equal(cellValue(generatedEntries.get("xl/worksheets/sheet10.xml") ?? "", "A44"), "30");
});

test("normalizes print margins and route/nature font sizes across all copies", async () => {
  const generated = await generateMawbWorkbook(parseMawbForm(validForm()));
  const generatedEntries = readZipEntries(generated);
  const stylesXml = generatedEntries.get("xl/styles.xml") ?? "";

  for (let sheet = 1; sheet <= 10; sheet += 1) {
    const worksheet = generatedEntries.get(`xl/worksheets/sheet${sheet}.xml`) ?? "";
    const styleId = cellStyleId(worksheet, "AS29");
    assert.equal(
      pageMargins(worksheet),
      '<pageMargins left="0" right="0" top="0" bottom="0.75" header="0" footer="0.31"/>',
      `sheet${sheet} margins are normalized`,
    );
    assert.notEqual(styleId, null, `sheet${sheet} AS29 has a style`);
    assert.equal(
      fontSize(stylesXml, styleFontId(stylesXml, styleId ?? 0)),
      "9",
      `sheet${sheet} AS29 uses a 9pt font`,
    );

    for (const ref of ["V20", "Y20", "AB20", "AE20"]) {
      const routeStyleId = cellStyleId(worksheet, ref);
      assert.notEqual(routeStyleId, null, `sheet${sheet} ${ref} has a style`);
      assert.equal(
        fontSize(stylesXml, styleFontId(stylesXml, routeStyleId ?? 0)),
        "6",
        `sheet${sheet} ${ref} keeps the 6pt label style`,
      );
      assert.equal(
        routeValueRunSize(worksheet, ref),
        "10",
        `sheet${sheet} ${ref} filled value uses a 10pt rich-text run`,
      );
      assert.equal(
        routeValueRunColor(worksheet, ref),
        ' theme="1" tint="0.14996795556505021"',
        `sheet${sheet} ${ref} filled value uses the normal fillable text color`,
      );
    }
  }
});

test("patches MAWB drawing text boxes and removes duplicate nature quantity box", async () => {
  const generated = await generateMawbWorkbook(parseMawbForm(validForm()));
  const generatedEntries = readZipEntries(generated);
  const drawing1 = generatedEntries.get("xl/drawings/drawing1.xml") ?? "";
  const drawing10 = generatedEntries.get("xl/drawings/drawing10.xml") ?? "";

  assert.ok(drawing1.includes("HANDLING TEST"));
  assert.equal(drawing1.includes("NATURE TEST"), false);
  assert.ok(inlineCellValue(generatedEntries.get("xl/worksheets/sheet1.xml") ?? "", "AS29").includes("NATURE TEST"));
  assert.ok(drawing1.includes("AWC IDR 10"));
  assert.ok(drawing1.includes("ZB IDR 2"));
  assert.equal(drawing1.includes("FIC"), false);
  assert.equal(drawing10.includes("FCC IDR 533"), false);
  assert.ok(drawing10.includes("AWC IDR 10"));
});
