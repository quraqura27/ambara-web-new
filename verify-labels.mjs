import { createThermalLabel } from "./portal/src/lib/label-engine.js";
import fs from "fs/promises";

async function verifyLabel() {
  console.log("Generating test thermal label...");
  
  const testData = [{
    internalTrackingNo: "AAID1234567826PP",
    trackingNumber: "126-88776655",
    carrier: "GA",
    origin: "CGK",
    destination: "SIN",
    pieces: 10,
    weight: "25.5",
    serviceType: "PORT-TO-PORT"
  }];

  try {
    const pdfBytes = await createThermalLabel(testData);
    await fs.writeFile("test-label.pdf", pdfBytes);
    console.log("Success! Label saved to test-label.pdf");
  } catch (err) {
    console.error("Label generation failed:", err);
  }
}

verifyLabel();
