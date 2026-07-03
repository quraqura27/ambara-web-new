import fs from "fs/promises";
import path from "path";

import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";

import { getInvoiceBankAccount } from "./bank-accounts.ts";
import {
  buildInvoicePdfFilename,
  formatCurrencyAmount,
  numberValue,
  terbilangRupiah,
} from "./core.ts";

type InvoicePdfInvoice = {
  amountDue: number | string | null;
  bankAccount: string | null;
  currency: string | null;
  customerAddressSnapshot: string | null;
  customerCode: string | null;
  customerNameSnapshot: string | null;
  customerNpwpSnapshot: string | null;
  dueDate: string | null;
  invoiceDate: string | null;
  invoiceNumber: string;
  netPayable: number | string | null;
  paymentTerms: string | null;
  period: string | null;
  pphAmount: number | string | null;
  status: string | null;
  subtotal: number | string | null;
  total: number | string | null;
  vatAmount: number | string | null;
};

type InvoicePdfLine = {
  awbNumber: string | null;
  chargeableWeight: number | string | null;
  description: string | null;
  destination: string | null;
  flightNumber: string | null;
  id: string;
  lineTotal: number | string | null;
  lineType: string;
  origin: string | null;
  pieces: number | null;
  pricePerKg: number | string | null;
  shipmentDate: string | null;
};

type InvoicePdfDeduction = {
  amount: number | string | null;
  description: string;
  id: string;
};

export type InvoicePdfInput = {
  assetBaseUrl?: string;
  deductions: InvoicePdfDeduction[];
  invoice: InvoicePdfInvoice;
  lines: InvoicePdfLine[];
  verificationUrl: string;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 42;
const contentWidth = pageWidth - margin * 2;
const invoiceTableColumns = [22, 38, 44, 68, 76, 56, 26, 45, 18, 42, 18, 58];

function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayDate(value: string | null | undefined, long = false) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: long ? "long" : "short",
      year: "numeric",
    })
    .replace(/ /g, long ? " " : "-");
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: { color?: ReturnType<typeof rgb>; font: PDFFont; size: number },
) {
  page.drawText(safeText(text), {
    color: options.color ?? rgb(0, 0, 0),
    font: options.font,
    size: options.size,
    x,
    y,
  });
}

function drawRightText(page: PDFPage, text: string, rightX: number, y: number, font: PDFFont, size: number) {
  const value = safeText(text);
  page.drawText(value, {
    font,
    size,
    x: rightX - font.widthOfTextAtSize(value, size),
    y,
  });
}

function drawCenteredText(page: PDFPage, text: string, centerX: number, y: number, font: PDFFont, size: number) {
  const value = safeText(text);
  page.drawText(value, {
    font,
    size,
    x: centerX - font.widthOfTextAtSize(value, size) / 2,
    y,
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safeText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawCell(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: PDFFont,
  size: number,
  align: "left" | "center" | "right" = "left",
) {
  page.drawRectangle({
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.75,
    height,
    width,
    x,
    y,
  });
  const value = safeText(text);
  let actualSize = size;
  let textWidth = font.widthOfTextAtSize(value, actualSize);
  while (textWidth > width - 8 && actualSize > 5.5) {
    actualSize -= 0.5;
    textWidth = font.widthOfTextAtSize(value, actualSize);
  }
  const textX =
    align === "right"
      ? x + width - textWidth - 4
      : align === "center"
        ? x + (width - textWidth) / 2
        : x + 4;
  drawText(page, value, Math.max(x + 3, textX), y + height / 2 - actualSize / 2 + 1, {
    font,
    size: actualSize,
  });
}

function drawSummaryRow(
  page: PDFPage,
  label: string,
  value: number | string | null,
  y: number,
  currency: string,
  fonts: { bold: PDFFont; regular: PDFFont },
  strong = false,
) {
  const labelWidth = tableColumnWidth(0, 10);
  const currencyWidth = invoiceTableColumns[10]!;
  const amountWidth = invoiceTableColumns[11]!;
  drawCell(page, label, margin, y, labelWidth, 20, fonts.bold, 9, "right");
  drawCell(page, currency === "IDR" ? "Rp" : currency, margin + labelWidth, y, currencyWidth, 20, fonts.regular, 9);
  drawCell(
    page,
    formatCurrencyAmount(value, currency),
    margin + labelWidth + currencyWidth,
    y,
    amountWidth,
    20,
    strong ? fonts.bold : fonts.regular,
    9,
    "right",
  );
}

function tableColumnWidth(startIndex: number, endIndex: number) {
  return invoiceTableColumns
    .slice(startIndex, endIndex)
    .reduce((sum, width) => sum + width, 0);
}

export function buildInvoicePdfDownloadName(invoice: InvoicePdfInvoice) {
  return buildInvoicePdfFilename({
    customerCode: invoice.customerCode,
    customerName: invoice.customerNameSnapshot,
    invoiceDate: invoice.invoiceDate,
    invoiceNumber: invoice.invoiceNumber,
  });
}

async function loadLogoBuffer(assetBaseUrl?: string) {
  try {
    return await fs.readFile(path.join(process.cwd(), "public", "logo-thermal.png"));
  } catch {
    const baseUrl = assetBaseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.ambaraartha.com";
    const response = await fetch(new URL("/logo-thermal.png", baseUrl));
    if (!response.ok) {
      throw new Error(`Unable to load invoice logo: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function generateInvoicePdf(input: InvoicePdfInput) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const logoBuffer = await loadLogoBuffer(input.assetBaseUrl);
  const logoImage = await pdfDoc.embedPng(logoBuffer);
  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, { margin: 1, width: 220 });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64");
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const fonts = { bold, regular };
  const currency = input.invoice.currency || "IDR";
  const bank = getInvoiceBankAccount(input.invoice.bankAccount);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const logoWidth = 240;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
  page.drawImage(logoImage, { height: logoHeight, width: logoWidth, x: margin, y: y - logoHeight });
  drawRightText(page, "Jl. Cengkareng Golf Club, RT 001/010", pageWidth - margin, y - 12, regular, 10);
  drawRightText(page, "Pajang, Benda, Kota Tangerang", pageWidth - margin, y - 28, regular, 10);
  drawRightText(page, "Banten", pageWidth - margin, y - 44, regular, 10);
  y -= 92;

  if (input.invoice.status === "voided") {
    page.drawRectangle({
      borderColor: rgb(0.8, 0, 0),
      borderWidth: 2,
      height: 28,
      width: contentWidth,
      x: margin,
      y: y - 4,
    });
    drawText(page, "VOIDED", pageWidth / 2 - 42, y + 5, { color: rgb(0.8, 0, 0), font: bold, size: 18 });
    y -= 42;
  }

  drawText(page, "INVOICE", pageWidth / 2 - 36, y, { font: bold, size: 18 });
  page.drawLine({
    end: { x: pageWidth / 2 + 36, y: y - 3 },
    start: { x: pageWidth / 2 - 36, y: y - 3 },
    thickness: 1,
  });
  y -= 50;

  drawText(page, "BILL TO:", margin, y, { font: regular, size: 10 });
  drawText(page, input.invoice.customerNameSnapshot ?? "-", margin, y - 20, { font: bold, size: 11 });
  let billY = y - 38;
  for (const line of (input.invoice.customerAddressSnapshot ?? "").split("\n").filter(Boolean)) {
    drawText(page, line, margin, billY, { font: regular, size: 10 });
    billY -= 16;
  }
  if (input.invoice.customerNpwpSnapshot) {
    drawText(page, `NPWP: ${input.invoice.customerNpwpSnapshot}`, margin, billY, { font: regular, size: 10 });
  }

  const metaX = pageWidth - margin - 210;
  drawCell(page, "Invoice No", metaX, y - 8, 105, 22, bold, 10);
  drawCell(page, "Date", metaX + 105, y - 8, 105, 22, bold, 10);
  drawCell(page, input.invoice.invoiceNumber, metaX, y - 30, 105, 22, regular, 10);
  drawCell(page, displayDate(input.invoice.invoiceDate), metaX + 105, y - 30, 105, 22, regular, 10);
  drawCell(page, input.invoice.period ? "Period" : "Payment Terms", metaX, y - 52, 105, 22, bold, 10);
  drawCell(page, "Due Date", metaX + 105, y - 52, 105, 22, bold, 10);
  drawCell(page, input.invoice.period || input.invoice.paymentTerms || "CASH", metaX, y - 74, 105, 22, regular, 10);
  drawCell(page, displayDate(input.invoice.dueDate), metaX + 105, y - 74, 105, 22, regular, 10);
  y -= 120;

  const columns = invoiceTableColumns;
  const headers = [
    { span: 1, text: "No" },
    { span: 1, text: "ORI" },
    { span: 1, text: "DES" },
    { span: 1, text: "Shipment Date" },
    { span: 1, text: "AWB No" },
    { span: 1, text: "Flight No" },
    { span: 1, text: "Pcs" },
    { span: 1, text: "CAW" },
    { span: 2, text: "Price" },
    { span: 2, text: "Total Amount" },
  ];
  function drawTableHeader() {
    let x = margin;
    let columnIndex = 0;
    headers.forEach((header) => {
      const width = tableColumnWidth(columnIndex, columnIndex + header.span);
      drawCell(page, header.text, x, y, width, 22, bold, 8.5, "center");
      x += width;
      columnIndex += header.span;
    });
    y -= 22;
  }
  function ensureSpace(required: number, repeatTableHeader = false, minBottomY = 150) {
    if (y - required > minBottomY) return;
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    if (repeatTableHeader) drawTableHeader();
  }

  drawTableHeader();
  input.lines.forEach((line, index) => {
    ensureSpace(22, true);
    const values =
      line.lineType === "awb"
        ? [
            String(index + 1),
            line.origin || "-",
            line.destination || "-",
            displayDate(line.shipmentDate),
            line.awbNumber || "-",
            line.flightNumber || "-",
            line.pieces ?? "-",
            line.chargeableWeight ?? "-",
            currency === "IDR" ? "Rp" : currency,
            formatCurrencyAmount(line.pricePerKg, currency),
            currency === "IDR" ? "Rp" : currency,
            formatCurrencyAmount(line.lineTotal, currency),
          ]
        : [
            String(index + 1),
            "",
            "",
            "",
            line.description || "Service",
            "",
            "",
            "",
            "",
            "",
            currency === "IDR" ? "Rp" : currency,
            formatCurrencyAmount(line.lineTotal, currency),
          ];
    let x = margin;
    values.forEach((value, colIndex) => {
      drawCell(
        page,
        String(value),
        x,
        y,
        columns[colIndex]!,
        22,
        colIndex === 8 || colIndex === 9 ? regular : regular,
        8.5,
        colIndex === 0 || colIndex === 6 || colIndex === 8 || colIndex === 10
          ? "center"
          : colIndex >= 7
            ? "right"
            : "left",
      );
      x += columns[colIndex]!;
    });
    y -= 22;
  });

  for (const deduction of input.deductions) {
    ensureSpace(22, true);
    let x = margin;
    const values = [
      "",
      "",
      "",
      "",
      deduction.description,
      "",
      "",
      "",
      "",
      "",
      `-${currency === "IDR" ? "Rp" : currency}`,
      formatCurrencyAmount(deduction.amount, currency),
    ];
    values.forEach((value, colIndex) => {
      drawCell(
        page,
        value,
        x,
        y,
        columns[colIndex]!,
        22,
        regular,
        8.5,
        colIndex === 10 ? "center" : colIndex === 11 ? "right" : "left",
      );
      x += columns[colIndex]!;
    });
    y -= 22;
  }

  ensureSpace(88);
  drawSummaryRow(page, "Subtotal", input.invoice.subtotal, y, currency, fonts);
  y -= 20;
  if (numberValue(input.invoice.vatAmount) > 0) {
    drawSummaryRow(page, "VAT 1.1%", input.invoice.vatAmount, y, currency, fonts);
    y -= 20;
  }
  drawSummaryRow(page, "Total Due", input.invoice.amountDue, y, currency, fonts, true);
  y -= 20;
  if (numberValue(input.invoice.pphAmount) > 0) {
    drawSummaryRow(page, "PPh 23 (2%)", input.invoice.pphAmount, y, currency, fonts);
    y -= 20;
    drawSummaryRow(page, "Net Payable", input.invoice.netPayable, y, currency, fonts, true);
    y -= 20;
  }

  y -= 28;
  const amountWords = currency === "IDR" ? terbilangRupiah(input.invoice.netPayable) : "";
  drawText(page, `# ${amountWords}`, margin, y, { font: italic, size: 9 });

  y -= 44;
  ensureSpace(190, false, 58);
  const stampWidth = 150;
  const stampCenterX = pageWidth - margin - stampWidth / 2;
  const qrSize = 110;
  const qrX = stampCenterX - qrSize / 2;
  const labelX = margin;
  const valueX = margin + 96;
  [
    ["Bank Name", bank.title],
    ["SWIFT", bank.swift],
    ["Branch", bank.branch],
    ["Name", bank.name],
    ["Account No", bank.accountNo],
  ].forEach(([label, value], index) => {
    const rowY = y - index * 16;
    drawText(page, label, labelX, rowY, { font: bold, size: 10 });
    drawText(page, ":", labelX + 76, rowY, { font: bold, size: 10 });
    drawText(page, value, valueX, rowY, { font: bold, size: 10 });
  });
  wrapText(
    "If you have any question regarding this invoice, please contact finance@ambaraartha.com",
    regular,
    10,
    qrX - margin - 18,
  ).forEach((line, index) => {
    drawText(page, line, margin, y - 100 - index * 14, {
      font: regular,
      size: 10,
    });
  });
  drawCenteredText(page, `Tangerang, ${displayDate(input.invoice.invoiceDate, true)}`, stampCenterX, y, regular, 10);
  page.drawImage(qrImage, { height: qrSize, width: qrSize, x: qrX, y: y - 120 });
  drawCenteredText(page, "System Generated Invoice", stampCenterX, y - 138, bold, 8.5);
  drawCenteredText(page, "Scan to verify - no wet signature required", stampCenterX, y - 153, regular, 7.5);
  drawCenteredText(page, "FINANCE DEPARTMENT", stampCenterX, y - 172, bold, 11);

  const footerText = `Invoice No ${input.invoice.invoiceNumber}`;
  for (const renderedPage of pdfDoc.getPages()) {
    drawText(renderedPage, footerText, margin, 28, { color: rgb(0.45, 0.45, 0.45), font: regular, size: 8 });
  }

  return pdfDoc.save();
}
