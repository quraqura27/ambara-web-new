"use server";

import { desc, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { mawbShipmentLinks, shipments } from "@/lib/db/schema";
import { canUseMawbWorkflow } from "@/lib/mawbs/core";
import { requirePortalUser } from "@/lib/portal-auth";
import { normalizePublicTrackingInput } from "@/lib/tracking/public-events";

export async function getLinkedMawbIdForShipmentTracking(trackingNumber: string) {
  const user = await requirePortalUser();
  if (!canUseMawbWorkflow(user)) return null;

  const normalizedTracking = normalizePublicTrackingInput(trackingNumber);
  if (!normalizedTracking) return null;

  const [row] = await db
    .select({ mawbDocumentId: mawbShipmentLinks.mawbDocumentId })
    .from(shipments)
    .innerJoin(mawbShipmentLinks, eq(mawbShipmentLinks.shipmentId, shipments.id))
    .where(
      or(
        eq(shipments.trackingNumber, normalizedTracking),
        eq(shipments.internalTrackingNo, normalizedTracking),
      ),
    )
    .orderBy(desc(mawbShipmentLinks.createdAt))
    .limit(1);

  return row?.mawbDocumentId ?? null;
}
