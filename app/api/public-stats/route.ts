import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { shipments } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ON_TIME_RATE = 99.2;
const COUNTRIES_SERVED = 52;

function numericValue(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  const [stats] = await db
    .select({
      totalChargeableKg: sql<string>`COALESCE(SUM(${shipments.chargeableWeight}), 0)`,
    })
    .from(shipments);

  const totalChargeableKg = numericValue(stats?.totalChargeableKg);
  const tonsExact = totalChargeableKg / 1000;

  return NextResponse.json({
    tonsShipped: Math.round(tonsExact),
    tonsShippedExact: Number(tonsExact.toFixed(3)),
    totalChargeableKg: Number(totalChargeableKg.toFixed(2)),
    onTimeRate: ON_TIME_RATE,
    countriesServed: COUNTRIES_SERVED,
  });
}
