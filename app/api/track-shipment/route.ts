import { NextRequest, NextResponse } from "next/server";
import { desc, eq, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { shipments, trackingUpdates } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function normalizeTrackingInput(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const compact = compactTrackingValue(trimmed);

  return {
    trimmed,
    uppercase: trimmed.toUpperCase(),
    compact,
    compactUppercase: compact.toUpperCase(),
  };
}

function getTrackingQuery(searchParams: URLSearchParams) {
  for (const key of ["id", "tracking", "trackingNumber"]) {
    const value = searchParams.get(key);

    if (value?.trim()) {
      return value;
    }
  }

  return null;
}

function compactTrackingValue(value: string) {
  return value.replace(/[\s-]/g, "");
}

function normalizedColumn(
  column: typeof shipments.internalTrackingNo | typeof shipments.trackingNumber,
) {
  return sql<string>`upper(replace(replace(${column}, ' ', ''), '-', ''))`;
}

function humanizeStatus(status: string | null | undefined) {
  if (!status) {
    return "Tracking updated";
  }

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function GET(request: NextRequest) {
  const trackingInput = getTrackingQuery(request.nextUrl.searchParams);
  const normalized = normalizeTrackingInput(trackingInput);

  if (!normalized) {
    return NextResponse.json(
      { error: "Tracking number is required" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(
        or(
          eq(shipments.internalTrackingNo, normalized.trimmed),
          eq(shipments.internalTrackingNo, normalized.uppercase),
          eq(shipments.internalTrackingNo, normalized.compact),
          eq(shipments.internalTrackingNo, normalized.compactUppercase),
          eq(shipments.trackingNumber, normalized.trimmed),
          eq(shipments.trackingNumber, normalized.uppercase),
          eq(shipments.trackingNumber, normalized.compact),
          eq(shipments.trackingNumber, normalized.compactUppercase),
          eq(normalizedColumn(shipments.internalTrackingNo), normalized.compactUppercase),
          eq(normalizedColumn(shipments.trackingNumber), normalized.compactUppercase),
        ),
      )
      .limit(1);

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404, headers: noStoreHeaders },
      );
    }

    const updates = await db
      .select()
      .from(trackingUpdates)
      .where(eq(trackingUpdates.shipmentId, shipment.id))
      .orderBy(desc(trackingUpdates.timestamp));

    return NextResponse.json(
      {
        shipment: {
          id: shipment.id,
          tracking_number: shipment.internalTrackingNo ?? shipment.trackingNumber,
          internal_tracking_no: shipment.internalTrackingNo,
          legacy_tracking_number: shipment.trackingNumber,
          title: shipment.title,
          status: shipment.status,
          origin: shipment.origin,
          destination: shipment.destination,
          service_type: shipment.serviceType,
          goods_description: shipment.goodsDescription,
          origin_iata: shipment.originIata,
          destination_iata: shipment.destinationIata,
          total_pcs: shipment.totalPcs,
          weight_kg: shipment.weightKg,
          chargeable_weight: shipment.chargeableWeight,
          cargo_type: shipment.cargoType,
          commodity: shipment.commodity,
          is_damaged: shipment.isDamaged,
          delivered_at: serializeDate(shipment.deliveredAt),
          created_at: serializeDate(shipment.createdAt),
          updated_at: serializeDate(shipment.updatedAt),
        },
        events: updates.map((update) => {
          const label = update.description?.trim() || humanizeStatus(update.status);

          return {
            status: update.status,
            label,
            description: update.description,
            location: update.location,
            event_time: serializeDate(update.timestamp),
          };
        }),
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
