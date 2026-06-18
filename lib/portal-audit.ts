import { db } from "@/lib/db";
import { portalAuditLogs } from "@/lib/db/schema";

export async function recordPortalAudit(input: {
  action: string;
  entityId: number | string;
  entityType: string;
  metadata?: Record<string, unknown>;
  performedBy: number;
  reason?: string | null;
}) {
  await db.insert(portalAuditLogs).values({
    action: input.action,
    entityId: String(input.entityId),
    entityType: input.entityType,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    performedBy: input.performedBy,
    reason: input.reason?.trim() || null,
  });
}
