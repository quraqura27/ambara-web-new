"use server";

import { createHash, randomUUID } from "node:crypto";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { portalAuditLogs, shipmentDocuments, shipments } from "@/lib/db/schema";
import {
  shipmentDocumentTypes,
  validateDocumentFile,
  type ShipmentDocumentType,
} from "@/lib/documents/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { canManageDocuments, canViewDocuments } from "@/lib/portal-roles";
import { getR2BucketName, getR2Client } from "@/lib/r2";
import { normalizePublicTrackingInput } from "@/lib/tracking/public-events";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireDocumentViewer() {
  const user = await requirePortalUser();
  if (!canViewDocuments(user)) redirect("/dashboard?error=forbidden");
  return user;
}

async function requireDocumentManager() {
  const user = await requirePortalUser();
  if (!canManageDocuments(user)) redirect("/documents?error=forbidden");
  return user;
}

async function shipmentForDocuments(trackingNumber: string) {
  const normalized = normalizePublicTrackingInput(trackingNumber);
  const [shipment] = await db
    .select({ id: shipments.id, trackingNumber: shipments.trackingNumber, voidedAt: shipments.voidedAt })
    .from(shipments)
    .where(or(eq(shipments.trackingNumber, normalized), eq(shipments.internalTrackingNo, normalized)))
    .limit(1);
  return shipment ?? null;
}

export async function getShipmentDocuments(trackingNumber: string) {
  await requireDocumentViewer();
  const shipment = await shipmentForDocuments(trackingNumber);
  if (!shipment) return null;
  const rows = await db
    .select()
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.shipmentId, shipment.id))
    .orderBy(desc(shipmentDocuments.uploadedAt));
  return { rows, shipment };
}

export async function getDocumentsPage(options: { search?: string; type?: string } = {}) {
  await requireDocumentViewer();
  const conditions = [eq(shipmentDocuments.status, "current")];
  if (options.type && shipmentDocumentTypes.includes(options.type as ShipmentDocumentType)) conditions.push(eq(shipmentDocuments.docType, options.type));
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(shipmentDocuments.fileName, pattern),
      ilike(shipments.trackingNumber, pattern),
      ilike(shipments.internalTrackingNo, pattern),
      ilike(shipments.customerName, pattern),
    )!);
  }
  return db
    .select({
      customerName: shipments.customerName,
      docType: shipmentDocuments.docType,
      fileName: shipmentDocuments.fileName,
      fileSize: shipmentDocuments.fileSize,
      id: shipmentDocuments.id,
      trackingNumber: shipments.trackingNumber,
      uploadedAt: shipmentDocuments.uploadedAt,
      version: shipmentDocuments.version,
    })
    .from(shipmentDocuments)
    .innerJoin(shipments, eq(shipmentDocuments.shipmentId, shipments.id))
    .where(and(...conditions))
    .orderBy(desc(shipmentDocuments.uploadedAt))
    .limit(250);
}

export async function uploadShipmentDocument(trackingNumber: string, formData: FormData) {
  const user = await requireDocumentManager();
  const shipment = await shipmentForDocuments(trackingNumber);
  if (!shipment) throw new Error("Shipment was not found.");
  if (shipment.voidedAt) throw new Error("Voided shipments are read-only.");
  const docType = text(formData, "docType") as ShipmentDocumentType;
  if (!shipmentDocumentTypes.includes(docType)) throw new Error("Select a valid document type.");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Select a document to upload.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validated = validateDocumentFile({ bytes, fileName: file.name, mimeType: file.type, size: file.size });
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const [latest] = await db
    .select({ id: shipmentDocuments.id, version: shipmentDocuments.version })
    .from(shipmentDocuments)
    .where(and(eq(shipmentDocuments.shipmentId, shipment.id), eq(shipmentDocuments.docType, docType)))
    .orderBy(desc(shipmentDocuments.version))
    .limit(1);
  const version = (latest?.version ?? 0) + 1;
  const objectKey = `documents/${shipment.id}/${docType}/${randomUUID()}-${validated.fileName}`;
  const r2 = getR2Client();
  const bucket = getR2BucketName();
  await r2.send(new PutObjectCommand({
    Body: bytes,
    Bucket: bucket,
    ContentType: validated.mimeType,
    Key: objectKey,
    Metadata: {
      checksum,
      "document-type": docType,
      "shipment-id": String(shipment.id),
      version: String(version),
    },
  }));

  const now = new Date();
  const queries: BatchItem<"pg">[] = [];
  if (latest) queries.push(db.update(shipmentDocuments).set({ status: "superseded" }).where(eq(shipmentDocuments.id, latest.id)));
  queries.push(
    db.insert(shipmentDocuments).values({
      checksumSha256: checksum,
      docType,
      fileName: validated.fileName,
      fileSize: file.size,
      fileUrl: objectKey,
      mimeType: validated.mimeType,
      note: text(formData, "note") || null,
      shipmentId: shipment.id,
      status: "current",
      supersedesDocumentId: latest?.id ?? null,
      uploadedAt: now,
      uploadedBy: user.id,
      version,
    }),
    db.insert(portalAuditLogs).values({
      action: "shipment.document_uploaded",
      createdAt: now,
      entityId: String(shipment.id),
      entityType: "shipment",
      metadataJson: JSON.stringify({ checksum, docType, fileName: validated.fileName, version }),
      performedBy: user.id,
    }),
  );
  try {
    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  } catch (error) {
    try { await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })); } catch {}
    throw error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/documents");
  revalidatePath("/operations");
  revalidatePath(`/shipments/${shipment.trackingNumber}`);
  redirect(`/shipments/${encodeURIComponent(shipment.trackingNumber)}?notice=${encodeURIComponent(`Uploaded ${validated.fileName} v${version}.`)}`);
}

export async function archiveShipmentDocument(documentId: number, trackingNumber: string, formData: FormData) {
  const user = await requireDocumentManager();
  const [document] = await db
    .select({ fileName: shipmentDocuments.fileName, id: shipmentDocuments.id, shipmentId: shipmentDocuments.shipmentId, status: shipmentDocuments.status })
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.id, documentId))
    .limit(1);
  if (!document || document.status === "archived") throw new Error("Document is not available.");
  if (text(formData, "confirmationCode") !== document.fileName || text(formData, "confirmed") !== "yes") throw new Error("Type the exact file name to archive this document.");
  const reason = text(formData, "reason");
  if (!reason) throw new Error("Archive reason is required.");
  const now = new Date();
  await db.batch([
    db.update(shipmentDocuments).set({ archivedAt: now, archivedBy: user.id, status: "archived" }).where(eq(shipmentDocuments.id, document.id)),
    db.update(shipments).set({ documentReadiness: "not_ready", readinessUpdatedAt: now, readinessUpdatedBy: user.id, updatedAt: now }).where(and(eq(shipments.id, document.shipmentId), sql`not exists (select 1 from documents where shipment_id = ${document.shipmentId} and id <> ${document.id} and status = 'current')`)),
    db.insert(portalAuditLogs).values({ action: "shipment.document_archived", createdAt: now, entityId: String(document.shipmentId), entityType: "shipment", metadataJson: JSON.stringify({ documentId, fileName: document.fileName }), performedBy: user.id, reason }),
  ]);
  revalidatePath("/documents");
  revalidatePath(`/shipments/${trackingNumber}`);
}

export async function getDocumentDownload(documentId: number) {
  await requireDocumentViewer();
  const [document] = await db
    .select({ fileName: shipmentDocuments.fileName, fileUrl: shipmentDocuments.fileUrl, mimeType: shipmentDocuments.mimeType, status: shipmentDocuments.status })
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.id, documentId))
    .limit(1);
  if (!document || document.status === "archived") return null;
  const safeDownloadName = document.fileName.replace(/["\\\r\n]/g, "-");
  return getSignedUrl(getR2Client(), new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: document.fileUrl,
    ResponseContentDisposition: `attachment; filename="${safeDownloadName}"`,
    ResponseContentType: document.mimeType,
  }), { expiresIn: 300 });
}
