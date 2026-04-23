"use server";

import { db } from "@/lib/db";
import { awbs, shipments, customers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { r2, BUCKET_NAME } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PDFDocument } from "pdf-lib";
import { eq, ilike } from "drizzle-orm";

/**
 * UPLOAD & PROCESS AWB (Spec v3)
 * Orchestrates: PDF Optimization -> S3 Upload -> Scrape -> DB Write
 */
export async function uploadAndProcessAWB(formData: FormData) {
  try {
    const sessionAuth = await auth();
    const userId = sessionAuth.userId || (formData.get("uploaderId") as string);
    if (!userId) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file uploaded" };

    let buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `awbs/${Date.now()}-${file.name}`;

    // 1. PDF Optimization (v15.2 Optimized)
    // - Extracts only the first page
    // - Removes redundant metadata/objects to compress size
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const newPdfDoc = await PDFDocument.create();
      
      // Copy the first page
      const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
      newPdfDoc.addPage(firstPage);
      
      // Save as a fresh, optimized buffer
      const optimizedBytes = await newPdfDoc.save({ useObjectStreams: true });
      buffer = Buffer.from(optimizedBytes);
    } catch (err) {
      console.error("PDF Optimization failed, falling back to original:", err);
    }

    // 2. Upload to Cloudflare R2
    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            "uploaded-by": userId,
            "retention": "5-years",
            "optimized": "true"
          }
        })
      );
    } catch (err: any) {
      console.error("Cloudflare R2 Upload Failed:", err);
      return { success: false, error: `R2 Upload Failed: ${err.message}` };
    }

    // We use an internal API proxy instead of a Presigned URL to avoid
    // strict Cloudflare R2 CORS policies blocking browser PDF workers.
    const fileUrl = `/api/pdf?file=${encodeURIComponent(fileName)}`;

    // 3. Return the R2 URL to allow client-side parsing
    return {
      success: true,
      url: fileUrl,
      fileName: file.name
    };
  } catch (err: any) {
    console.error("UPLOAD_AWB_CRASH:", err);
    return { success: false, error: `Server Crash during upload: ${err.message}` };
  }
}

/**
 * SAVE SCRAPED DATA (v3.3 Bridge - Revised)
 * Commits the scraper results and auto-provisions a tracking shipment.
 * Now distinguishes between Billing Customer (paying) and Shipper/Consignee (manifest).
 */
export async function saveScrapedAWB(data: any, billingCustomerId?: number, clientUserId?: string) {
  try {
    const sessionAuth = await auth();
    const userId = sessionAuth.userId || clientUserId;
    if (!userId) return { success: false, error: "Unauthorized" };

    // 1. Resolve Billing Customer (The payer)
    // If not provided, we fallback to a search or placeholder (though UI should enforce choice)
    let customerId = billingCustomerId;
    if (!customerId) {
      customerId = await findOrCreateCustomer("General Walk-in", "b2b");
    }

    const billingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId)
    });

    // 2. Resolve Manifest Identities for CRM Memory
    const shipperId = await findOrCreateCustomer(data.shipper || "Unknown Shipper", "SHIPPER");
    const consigneeId = await findOrCreateCustomer(data.consignee || "Unknown Consignee", "CONSIGNEE");

    // 3. Create the Tracking Shipment record
    // Formula: [AA][Country][8-Random][YY][Service]
    // Country code is strictly from the BILLING CUSTOMER profile
    const countryCode = billingCustomer?.countryCode || "ID"; 
    const internalTrx = generateInternalTrackingNo(countryCode, "PP");

    const result = await db.transaction(async (tx) => {
      const [newShipment] = await tx.insert(shipments).values({
        internalTrackingNo: internalTrx,
        trackingNumber: data.awbNumber || `MANUAL-${Date.now()}`,
        title: data.awbNumber ? `AWB: ${data.awbNumber}` : "Manual Entry",
        customerId: customerId,
        status: "RECEIVED",
        origin: data.origin,
        destination: data.destination,
        serviceType: "PP", // Default to Port-to-Port
        createdBy: userId,
      }).returning();

      // 4. Insert the AWB manifest and link to Shipment + CRM IDs
      const [newAwb] = await tx.insert(awbs).values({
        awbNumber: data.awbNumber,
        carrier: data.airline,
        origin: data.origin,
        destination: data.destination,
        pieces: parseInt(data.pieces) || 0,
        chargeableWeight: data.weight?.toString() || "0",
        shipper: data.shipper, // Raw text from manifest
        consignee: data.consignee, // Raw text from manifest
        shipperId: shipperId, // Link to CRM
        consigneeId: consigneeId, // Link to CRM
        commodity: data.commodity || "General Cargo",
        flightNumber: data.flightNumber,
        shipmentDate: data.flightDate,
        rawPdfUrl: data.url || data.rawPdfUrl,
        uploadedBy: userId,
        shipmentId: newShipment.id, 
      }).returning();

      return { awb: newAwb, shipment: newShipment };
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, ...result };
  } catch (error: any) {
    console.error("SAVE_AWB_CRASH:", error);
    return { success: false, error: error.message || "Failed to save AWB to database." };
  }
}

/**
 * CRM MEMORY: Find or Create Customer
 * Deduplicates by name and specific type (b2b, shipper, consignee)
 */
async function findOrCreateCustomer(name: string, type: string) {
  const cleanName = name.trim();
  const existing = await db.select().from(customers)
    .where(ilike(customers.fullName, cleanName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new CRM profile if missing
  const [newCustomer] = await db.insert(customers).values({
    fullName: cleanName,
    type: type as any,
    countryCode: "ID", // Default to ID for new profiles during ingestion
  }).returning();

  return newCustomer.id;
}

/**
 * 16-CHAR TRACKING FORMULA
 * [AA][Country][8-Random][YY][Service]
 */
function generateInternalTrackingNo(country: string, service: string) {
  const prefix = "AA";
  const year = "26"; // 2026 per systemic timestamp
  const countryCode = (country || "ID").slice(0, 2).toUpperCase();
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  const svc = service.slice(0, 2).toUpperCase();

  // Formula: [AA][YY][Country][8-digit-ID][Service] = 16 chars
  return `${prefix}${year}${countryCode}${random8}${svc}`.replace(/[^A-Z0-9]/g, "");
}
