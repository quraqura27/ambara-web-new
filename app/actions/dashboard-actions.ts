"use server";

import { db } from "@/lib/db";
import { shipments, invoices, customers, awbs } from "@/lib/db/schema";
import { count, sum, desc, sql, eq, gte, and, lte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  let stats = {
    volume: "0.0",
    volumeChange: "0%",
    volumeUp: true,
  };

  try {
    const [
      totalVolumeResult,
      currentVolume,
      prevVolume,
    ] = await Promise.all([
      db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs),
      db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(gte(awbs.createdAt, startOfMonth)),
      db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(and(gte(awbs.createdAt, startOfPrevMonth), lte(awbs.createdAt, endOfPrevMonth))),
    ]);

    const volTotal = parseFloat(totalVolumeResult[0]?.value || "0");

    // Dynamic Unit Selection
    if (volTotal >= 1000) {
      stats.volume = (volTotal / 1000).toFixed(2) + " MT";
    } else {
      stats.volume = volTotal.toFixed(0) + " KG";
    }

    const volCurr = Number(currentVolume[0]?.value || 0);
    const volPrev = Number(prevVolume[0]?.value || 0);
    stats.volumeChange = calculatePercentageChange(volCurr, volPrev);
    stats.volumeUp = volCurr >= volPrev;

  } catch (e) {
    console.error("DASHBOARD DB ERROR (getDashboardStats):", e);
    // Return safe fallback instead of throwing 500 error
    return stats;
  }

  return stats;
}

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${Math.abs(change).toFixed(1)}%`;
}

export async function getTonnageData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const oldestDateStr = last7Days[0];

  try {
    const results = await db.select({
      date: sql<string>`DATE(${awbs.createdAt})`,
      total: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))`
    })
    .from(awbs)
    .where(gte(awbs.createdAt, new Date(oldestDateStr + "T00:00:00.000Z")))
    .groupBy(sql`DATE(${awbs.createdAt})`);

    const dailyVolume = last7Days.map((dateStr) => {
      const match = results.find(r => {
        const rDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
        return rDate === dateStr;
      });
      
      return {
        name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        volume: Number(match?.total || 0)
      };
    });

    return dailyVolume;
  } catch (e) {
    console.error("DASHBOARD DB ERROR (getTonnageData):", e);
    return last7Days.map((dateStr) => ({
      name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
      volume: 0
    }));
  }
}

export async function getRecentActivity() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const lastShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt)).limit(5);
    return lastShipments.map(s => ({
      text: `Shipment ${s.trackingNumber || s.internalTrackingNo || "AAG-TEMP"} status: ${s.status}`,
      time: "Updated Recently",
      user: "SYSTEM",
      type: s.status === 'DELIVERED' ? 'success' : 'info'
    }));
  } catch (e) {
    return [];
  }
}
