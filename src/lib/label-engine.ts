import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import bwipjs from "bwip-js";
import fs from "fs/promises";
import path from "path";

interface LabelData {
  internalTrackingNo: string;
  trackingNumber: string; // Carrier AWB
  carrier: string;
  origin: string;
  destination: string;
  pieces: number;
  weight: string;
  serviceType: string;
}

/**
 * THERMAL LABEL ENGINE (4x6 inch)
 * Generates industrial-grade PDFs optimized for thermal printers.
 */
export async function createThermalLabel(data: LabelData[]) {
  const pdfDoc = await PDFDocument.create();
  
  // Load Logo (Public absolute path in local environment)
  let logoImage;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-thermal.png");
    const logoBuffer = await fs.readFile(logoPath);
    logoImage = await pdfDoc.embedPng(logoBuffer);
  } catch (err) {
    console.error("Logo loading failed for label generation", err);
  }

  for (const shipment of data) {
    // 100mm x 150mm approx (in points: 1 inch = 72 pts)
    // 4 inch = 288 pts
    // 6 inch = 432 pts
    const page = pdfDoc.addPage([288, 432]);
    const { width, height } = page.getSize();
    const fontPrimary = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // --- LOGO & HEADER ---
    if (logoImage) {
      const logoDims = logoImage.scale(0.08); // Scale down to fit header
      page.drawImage(logoImage, {
        x: 20,
        y: height - 50,
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    page.drawText("AMBARA GLOBALTRANS", {
      x: logoImage ? 120 : 20,
      y: height - 40,
      size: 14,
      font: fontPrimary,
    });

    // --- DIVIDER ---
    page.drawLine({
      start: { x: 20, y: height - 60 },
      end: { x: width - 20, y: height - 60 },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });

    // --- ROUTE BLOCK ---
    page.drawText("ROUTE:", { x: 20, y: height - 85, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`${shipment.origin} -> ${shipment.destination}`, {
      x: 20,
      y: height - 110,
      size: 24,
      font: fontPrimary,
    });

    // --- BARCODE BLOCK ---
    try {
      // Generate Code 128 Barcode
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: shipment.internalTrackingNo,
        scale: 3,
        height: 15,
        includetext: false,
      });
      const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
      
      page.drawImage(barcodeImage, {
        x: 30,
        y: height - 260,
        width: width - 60,
        height: 100,
      });
    } catch (err) {
      console.error("Barcode generation failed", err);
    }

    // --- TRACKING STRING ---
    const trackingText = (shipment.internalTrackingNo || "").replace(/[^A-Z0-9]/g, "");
    page.drawText(trackingText, {
      x: 30,
      y: height - 280,
      size: 16,
      font: fontPrimary,
    });

    // --- QR CODE BLOCK ---
    try {
      const qrBuffer = await bwipjs.toBuffer({
        bcid: "qrcode",
        text: trackingText,
        scale: 2,
      });
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      page.drawImage(qrImage, {
        x: width - 80,
        y: 35,
        width: 60,
        height: 60,
      });
    } catch (err) {
      console.error("QR generation failed", err);
    }

    // --- SHIPMENT DETAILS ---
    page.drawLine({ start: { x: 20, y: 140 }, end: { x: width - 20, y: 140 }, thickness: 1 });
    
    const detailsY = 120;
    page.drawText(`MAWB: ${shipment.trackingNumber || "N/A"}`, { x: 20, y: detailsY, size: 10, font: fontPrimary });
    page.drawText(`Carrier: ${shipment.carrier || "N/A"}`, { x: 160, y: detailsY, size: 10, font: fontRegular });

    page.drawText(`Pcs: ${shipment.pieces}`, { x: 20, y: detailsY - 25, size: 16, font: fontPrimary });
    page.drawText(`Weight: ${shipment.weight} KG`, { x: 120, y: detailsY - 25, size: 16, font: fontPrimary });

    page.drawText(`Service: ${shipment.serviceType || "PORT-TO-PORT"}`, {
      x: 20,
      y: 40,
      size: 10,
      font: fontPrimary,
      color: rgb(0, 0, 0),
    });

    // --- FOOTER ---
    page.drawText("PROCESSED VIA AMBARA COMMAND CENTER", {
      x: 20,
      y: 20,
      size: 6,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
