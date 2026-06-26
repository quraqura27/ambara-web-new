import { readFile } from "node:fs/promises";
import path from "node:path";
import { deflateRawSync, inflateRawSync } from "node:zlib";

import type { MawbFormValues } from "./core.ts";
import { buildMawbTemplateValues } from "./core.ts";

const templatePath = path.join(process.cwd(), "assets/mawb/template-mawb-neutral.xlsx");

type ZipEntry = {
  comment: Buffer;
  compressedData: Buffer;
  compressionMethod: number;
  crc32: number;
  externalAttributes: number;
  extra: Buffer;
  fileName: Buffer;
  flags: number;
  internalAttributes: number;
  lastModDate: number;
  lastModTime: number;
  name: string;
  uncompressedData: Buffer;
  versionMadeBy: number;
  versionNeeded: number;
};

type CellPatch =
  | {
      kind: "number" | "text";
      value: string;
    }
  | {
      kind: "route";
      label: "by" | "to";
      value: string;
    };

type TemplateValues = ReturnType<typeof buildMawbTemplateValues>;
type WorkbookPatchContext = {
  cellStyleOverridesByRef: Map<string, Map<number, number>>;
};

const natureQuantityCell = "AS29";
const natureQuantityFontId = "9";
const normalizedPageMargins =
  '<pageMargins left="0" right="0" top="0" bottom="0.75" header="0" footer="0.31"/>';

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }

  throw new Error("Invalid XLSX template: end of central directory was not found.");
}

function parseZip(buffer: Buffer): ZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid XLSX template: central directory entry was not found.");
    }

    const versionMadeBy = buffer.readUInt16LE(offset + 4);
    const versionNeeded = buffer.readUInt16LE(offset + 6);
    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const lastModTime = buffer.readUInt16LE(offset + 12);
    const lastModDate = buffer.readUInt16LE(offset + 14);
    const crc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const internalAttributes = buffer.readUInt16LE(offset + 36);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const fileName = buffer.subarray(fileNameStart, fileNameStart + fileNameLength);
    const extra = buffer.subarray(fileNameStart + fileNameLength, fileNameStart + fileNameLength + extraLength);
    const comment = buffer.subarray(
      fileNameStart + fileNameLength + extraLength,
      fileNameStart + fileNameLength + extraLength + commentLength,
    );
    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
    const uncompressedData =
      compressionMethod === 0
        ? compressedData
        : compressionMethod === 8
          ? inflateRawSync(compressedData)
          : null;

    if (!uncompressedData) {
      throw new Error(`Invalid XLSX template: unsupported ZIP compression method ${compressionMethod}.`);
    }

    entries.push({
      comment,
      compressedData,
      compressionMethod,
      crc32: crc,
      externalAttributes,
      extra,
      fileName,
      flags,
      internalAttributes,
      lastModDate,
      lastModTime,
      name: fileName.toString("utf8"),
      uncompressedData,
      versionMadeBy,
      versionNeeded,
    });
    offset = fileNameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function writeUInt16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function writeUInt32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function buildZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const data = entry.uncompressedData;
    const compressedData = entry.compressionMethod === 0 ? data : deflateRawSync(data);
    const crc = crc32(data);
    const localOffset = offset;
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(entry.versionNeeded),
      writeUInt16(entry.flags),
      writeUInt16(entry.compressionMethod),
      writeUInt16(entry.lastModTime),
      writeUInt16(entry.lastModDate),
      writeUInt32(crc),
      writeUInt32(compressedData.length),
      writeUInt32(data.length),
      writeUInt16(entry.fileName.length),
      writeUInt16(entry.extra.length),
      entry.fileName,
      entry.extra,
    ]);
    localParts.push(localHeader, compressedData);
    offset += localHeader.length + compressedData.length;

    const centralHeader = Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(entry.versionMadeBy),
      writeUInt16(entry.versionNeeded),
      writeUInt16(entry.flags),
      writeUInt16(entry.compressionMethod),
      writeUInt16(entry.lastModTime),
      writeUInt16(entry.lastModDate),
      writeUInt32(crc),
      writeUInt32(compressedData.length),
      writeUInt32(data.length),
      writeUInt16(entry.fileName.length),
      writeUInt16(entry.extra.length),
      writeUInt16(entry.comment.length),
      writeUInt16(0),
      writeUInt16(entry.internalAttributes),
      writeUInt32(entry.externalAttributes),
      writeUInt32(localOffset),
      entry.fileName,
      entry.extra,
      entry.comment,
    ]);
    centralParts.push(centralHeader);
  }

  const centralDirectoryOffset = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const eocd = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(centralDirectoryOffset),
    writeUInt16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, eocd]);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeInlineString(patch: Extract<CellPatch, { kind: "route" }>) {
  const label = `<r><t>${patch.label}</t></r>`;
  const value = patch.value
    ? `<r><rPr><rFont val="Courier New"/><charset val="134"/><family val="3"/><color theme="1" tint="0.14996795556505021"/><sz val="10"/></rPr><t xml:space="preserve">\n\n${escapeXml(patch.value)}</t></r>`
    : "";

  return `<is>${label}${value}</is>`;
}

function replaceCell(xml: string, ref: string, patch: CellPatch) {
  const cellOpen = `<c\\b(?=[^>]*\\br="${escapeRegExp(ref)}")[^>]*`;
  const cellPattern = new RegExp(`${cellOpen}/>|${cellOpen}>[\\s\\S]*?</c>`);
  const match = xml.match(cellPattern);
  if (!match) return xml;

  const cell = match[0];
  const opening = cell.match(/^<c\b([^>]*)\/?>/);
  if (!opening) return xml;

  const attrs = opening[1].replace(/\s*\/\s*$/, "").replace(/\s+t="[^"]*"/, "");
  const formula = cell.match(/<f\b[^>]*>[\s\S]*?<\/f>/)?.[0] ?? "";
  const escaped = patch.kind === "route" ? "" : escapeXml(patch.value);
  const replacement =
    patch.kind === "number" && patch.value === ""
      ? `<c${attrs}>${formula}</c>`
      : patch.kind === "number"
      ? `<c${attrs}>${formula}<v>${escaped}</v></c>`
      : patch.kind === "route"
        ? `<c${attrs} t="inlineStr">${routeInlineString(patch)}</c>`
      : formula
        ? `<c${attrs} t="str">${formula}<v>${escaped}</v></c>`
        : `<c${attrs} t="inlineStr"><is><t xml:space="preserve">${escaped}</t></is></c>`;

  return xml.replace(cellPattern, replacement);
}

function replaceCellStyle(xml: string, ref: string, styleOverrides: Map<number, number>) {
  if (styleOverrides.size === 0) return xml;

  const cellOpen = `<c\\b(?=[^>]*\\br="${escapeRegExp(ref)}")[^>]*`;
  const cellPattern = new RegExp(`${cellOpen}/>|${cellOpen}>[\\s\\S]*?</c>`);
  return xml.replace(cellPattern, (cell) => {
    const styleMatch = cell.match(/\bs="(\d+)"/);
    if (!styleMatch) return cell;

    const replacementStyle = styleOverrides.get(Number(styleMatch[1]));
    return replacementStyle === undefined
      ? cell
      : cell.replace(/\bs="\d+"/, `s="${replacementStyle}"`);
  });
}

function normalizePageMargins(xml: string) {
  if (/<pageMargins\b[^>]*\/>/.test(xml)) {
    return xml.replace(/<pageMargins\b[^>]*\/>/, normalizedPageMargins);
  }

  const pageSetupMatch = xml.match(/<pageSetup\b[^>]*\/>/);
  if (pageSetupMatch) {
    return xml.replace(pageSetupMatch[0], `${normalizedPageMargins}${pageSetupMatch[0]}`);
  }

  return xml.replace("</worksheet>", `${normalizedPageMargins}</worksheet>`);
}

function patchWorksheet(
  xml: string,
  patches: Record<string, CellPatch>,
  context: WorkbookPatchContext,
) {
  const patched = Object.entries(patches).reduce(
    (current, [ref, patch]) => replaceCell(current, ref, patch),
    xml,
  );
  const styled = Array.from(context.cellStyleOverridesByRef.entries()).reduce(
    (current, [ref, styleOverrides]) => replaceCellStyle(current, ref, styleOverrides),
    patched,
  );
  return normalizePageMargins(
    styled,
  );
}

function collectCellStyleIds(entries: readonly ZipEntry[], refs: readonly string[]) {
  const styleIdsByRef = new Map<string, Set<number>>();
  const cellPatterns = refs.map((ref) => {
    const cellOpen = `<c\\b(?=[^>]*\\br="${escapeRegExp(ref)}")[^>]*`;
    return {
      ref,
      pattern: new RegExp(`${cellOpen}/>|${cellOpen}>[\\s\\S]*?</c>`),
    };
  });

  for (const entry of entries) {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name)) continue;

    const xml = entry.uncompressedData.toString("utf8");
    for (const { pattern, ref } of cellPatterns) {
      const cell = xml.match(pattern)?.[0];
      const styleId = Number(cell?.match(/\bs="(\d+)"/)?.[1]);
      if (Number.isInteger(styleId)) {
        const existing = styleIdsByRef.get(ref) ?? new Set<number>();
        existing.add(styleId);
        styleIdsByRef.set(ref, existing);
      }
    }
  }

  return styleIdsByRef;
}

function splitXfs(xml: string) {
  return xml
    .split(/(?=<xf\b)/)
    .map((part) => part.trim())
    .filter((part) => part.startsWith("<xf"));
}

function addOrReplaceFontId(xf: string, fontId: string) {
  const replacement = /\bfontId=/.test(xf)
    ? xf.replace(/\bfontId="\d+"/, `fontId="${fontId}"`)
    : xf.replace("<xf", `<xf fontId="${fontId}"`);

  if (/\bapplyFont=/.test(replacement)) {
    return replacement.replace(/\bapplyFont="[^"]*"/, 'applyFont="1"');
  }

  return replacement.endsWith("/>")
    ? replacement.replace(/\/>$/, ' applyFont="1"/>')
    : replacement.replace(/>$/, ' applyFont="1">');
}

function patchStyles(xml: string, styleIdsByRef: Map<string, Set<number>>) {
  const cellXfsMatch = xml.match(/<cellXfs\b[^>]*\bcount="(\d+)"[^>]*>([\s\S]*?)<\/cellXfs>/);
  if (!cellXfsMatch) return { cellStyleOverridesByRef: new Map<string, Map<number, number>>(), xml };

  const xfs = splitXfs(cellXfsMatch[2]);
  const overridesByRef = new Map<string, Map<number, number>>();
  const clonedStyleIds = new Map<string, number>();
  const additions: string[] = [];
  const requests = [
    { fontId: natureQuantityFontId, refs: [natureQuantityCell] },
  ];

  for (const request of requests) {
    for (const ref of request.refs) {
      const overrides = overridesByRef.get(ref) ?? new Map<number, number>();
      for (const styleId of styleIdsByRef.get(ref) ?? []) {
        const xf = xfs[styleId];
        if (!xf) continue;

        const fontMatch = xf.match(/\bfontId="(\d+)"/);
        if (fontMatch?.[1] === request.fontId) {
          overrides.set(styleId, styleId);
          continue;
        }

        const cloneKey = `${styleId}:${request.fontId}`;
        let replacementStyleId = clonedStyleIds.get(cloneKey);
        if (replacementStyleId === undefined) {
          replacementStyleId = xfs.length + additions.length;
          clonedStyleIds.set(cloneKey, replacementStyleId);
          additions.push(addOrReplaceFontId(xf, request.fontId));
        }
        overrides.set(styleId, replacementStyleId);
      }
      if (overrides.size > 0) overridesByRef.set(ref, overrides);
    }
  }

  if (additions.length === 0) return { cellStyleOverridesByRef: overridesByRef, xml };

  const nextCount = xfs.length + additions.length;
  const nextCellXfs = cellXfsMatch[0]
    .replace(/\bcount="\d+"/, `count="${nextCount}"`)
    .replace("</cellXfs>", `${additions.join("")}</cellXfs>`);

  return {
    cellStyleOverridesByRef: overridesByRef,
    xml: xml.replace(cellXfsMatch[0], nextCellXfs),
  };
}

function replaceTextBody(block: string, textValue: string) {
  const txBody = block.match(/<xdr:txBody>[\s\S]*?<\/xdr:txBody>/)?.[0];
  if (!txBody) return block;

  const bodyPr = txBody.match(/<a:bodyPr\b[\s\S]*?<\/a:bodyPr>/)?.[0] ?? "<a:bodyPr/>";
  const listStyle = txBody.match(/<a:lstStyle\b[\s\S]*?\/>/)?.[0] ?? "<a:lstStyle/>";
  const runProperties =
    txBody.match(/<a:rPr\b[\s\S]*?<\/a:rPr>/)?.[0] ??
    '<a:rPr lang="en-ID" sz="1100"><a:latin typeface="Courier New"/><a:cs typeface="Courier New"/></a:rPr>';
  const lines = textValue.split(/\r?\n/);
  const paragraphs = (lines.length > 0 ? lines : [""]).map(
    (line) =>
      `<a:p><a:pPr algn="ctr"/><a:r>${runProperties}<a:t xml:space="preserve">${escapeXml(line)}</a:t></a:r></a:p>`,
  );

  return block.replace(
    /<xdr:txBody>[\s\S]*?<\/xdr:txBody>/,
    `<xdr:txBody>${bodyPr}${listStyle}${paragraphs.join("")}</xdr:txBody>`,
  );
}

function replaceMatchingTextBox(
  xml: string,
  predicate: (block: string) => boolean,
  textValue: string,
) {
  return xml.replace(
    /<xdr:(oneCellAnchor|twoCellAnchor|absoluteAnchor)>[\s\S]*?<\/xdr:\1>/g,
    (block) => (predicate(block) ? replaceTextBody(block, textValue) : block),
  );
}

function removeMatchingTextBox(xml: string, predicate: (block: string) => boolean) {
  return xml.replace(
    /<xdr:(oneCellAnchor|twoCellAnchor|absoluteAnchor)>[\s\S]*?<\/xdr:\1>/g,
    (block) => (predicate(block) ? "" : block),
  );
}

function patchDrawing(xml: string, values: TemplateValues) {
  const withHandling = replaceMatchingTextBox(
    xml,
    (block) => block.includes("CARGO MUST FLY") || block.includes("OCI/ID/SHP"),
    values.handlingInformationText,
  );
  const withOtherCharges = replaceMatchingTextBox(
    withHandling,
    (block) => block.includes("AWC IDR") && (block.includes("MYC") || block.includes("FCC") || block.includes("FIC")),
    values.otherChargesText,
  );

  return removeMatchingTextBox(
    withOtherCharges,
    (block) => block.includes("COURIER SHIPMENT") || block.includes("HS CODE") || block.includes("DIMS"),
  );
}

function text(value: string): CellPatch {
  return { kind: "text", value };
}

function route(label: "by" | "to", value: string): CellPatch {
  const prefix = `${label}\n\n`;
  return {
    kind: "route",
    label,
    value: value.startsWith(prefix) ? value.slice(prefix.length) : "",
  };
}

function number(value: string): CellPatch {
  return { kind: "number", value };
}

function buildSheetPatches(values: TemplateValues) {
  const common: Record<string, CellPatch> = {
    A1: number(values.A1),
    A3: text(values.A3),
    A4: text(values.A4),
    A8: text(values.A8),
    A9: text(values.A9),
    A14: text(values.A14),
    A19: text(values.A19),
    A20: text(values.A20),
    A23: text(values.A23),
    A29: number(values.A29),
    AA29: number(values.AA29),
    AH21: text(values.AH21),
    AI29: number(values.AI29),
    AN2: text(values.AN2),
    AS29: text(values.AS29),
    AV21: text(values.AV21),
    BE21: text(values.BE21),
    D1: text(values.D1),
    D21: text(values.D21),
    D29: number(values.D29),
    G1: number(values.G1),
    R23: text(values.R23),
    S29: number(values.S29),
    V20: route("to", values.V20),
    Y20: route("by", values.Y20),
    Z23: number(values.Z23),
    AB20: route("to", values.AB20),
    AE20: route("by", values.AE20),
    AT1: text(`${values.A1}-${values.G1}`),
  };

  const sheets: Record<string, Record<string, CellPatch>> = {};

  for (let sheet = 1; sheet <= 5; sheet += 1) {
    sheets[`xl/worksheets/sheet${sheet}.xml`] = {
      ...common,
      A38: number(values.A38),
      A46: number(values.A46),
      A50: number(values.A50),
      AC52: number(values.AC52),
      AO52: text(values.AO52),
      AO54: text(values.AO54),
    };
  }

  sheets["xl/worksheets/sheet6.xml"] = {
    ...common,
    A41: number(values.A38),
    A49: number(values.A46),
    A53: number(values.A50),
    AC55: number(values.AC52),
    AO55: text(values.AO52),
    AO57: text(values.AO54),
  };

  for (let sheet = 7; sheet <= 10; sheet += 1) {
    sheets[`xl/worksheets/sheet${sheet}.xml`] = {
      ...common,
      A36: number(values.A38),
      A44: number(values.A46),
      A48: number(values.A50),
      AC50: number(values.AC52),
      AO50: text(values.AO52),
      AO52: text(values.AO54),
    };
  }

  return sheets;
}

export async function generateMawbWorkbook(input: MawbFormValues) {
  const template = await readFile(templatePath);
  const templateValues = buildMawbTemplateValues(input);
  const sheetPatches = buildSheetPatches(templateValues);
  const parsedEntries = parseZip(template);
  const styleIdsByRef = collectCellStyleIds(parsedEntries, [natureQuantityCell]);
  const stylesEntry = parsedEntries.find((entry) => entry.name === "xl/styles.xml");
  const stylesPatch = stylesEntry
    ? patchStyles(stylesEntry.uncompressedData.toString("utf8"), styleIdsByRef)
    : { cellStyleOverridesByRef: new Map<string, Map<number, number>>(), xml: "" };
  const context: WorkbookPatchContext = { cellStyleOverridesByRef: stylesPatch.cellStyleOverridesByRef };
  const entries = parsedEntries.map((entry) => {
    if (entry.name === "xl/styles.xml") {
      return {
        ...entry,
        uncompressedData: Buffer.from(stylesPatch.xml, "utf8"),
      };
    }

    const patches = sheetPatches[entry.name];
    if (patches) {
      return {
        ...entry,
        uncompressedData: Buffer.from(
          patchWorksheet(entry.uncompressedData.toString("utf8"), patches, context),
          "utf8",
        ),
      };
    }

    if (/^xl\/drawings\/drawing\d+\.xml$/.test(entry.name)) {
      return {
        ...entry,
        uncompressedData: Buffer.from(
          patchDrawing(entry.uncompressedData.toString("utf8"), templateValues),
          "utf8",
        ),
      };
    }

    return entry;
  });

  return buildZip(entries);
}

export function buildMawbWorkbookFilename(mawbNumber: string) {
  return `MAWB-${mawbNumber.replace(/[^A-Z0-9-]/gi, "_")}.xlsx`;
}
