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
    invoices: "Rp 0",
    customers: 0,
    volumeChange: "0%",
    invoiceChange: "0%",
    customerChange: "0%",
    volumeUp: true,
    invoiceUp: true,
    customerUp: true,
  };

  try {
    console.log("DB_CONNECTION_HOST:", process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);

    // 1. Core Portfolio Metrics (ABSOLUTE TOTALS - RAW SQL BYPASS)
    const [totalShipmentsResult, totalVolumeResult] = await Promise.all([
      db.execute(sql`SELECT count(*) as total FROM shipments`),
      db.execute(sql`SELECT SUM(CAST(chargeable_weight AS NUMERIC)) as total FROM awbs`)
    ]);
    
    console.log("RAW_VOLUME_RESULT_KEYS:", Object.keys(totalVolumeResult));
    
    // @ts-ignore - db.execute returns a different structure
    const volTotal = parseFloat(totalVolumeResult.rows?.[0]?.total || totalVolumeResult?.[0]?.total || "0");
    // @ts-ignore
    const countTotal = parseInt(totalShipmentsResult.rows?.[0]?.total || totalShipmentsResult?.[0]?.total || "0");
    
    console.log("PARSED_VOLUME:", volTotal);
    console.log("PARSED_COUNT:", countTotal);
    
    // 2. Trend Metrics (Monthly Comparison)
    const [currentShipments, prevShipments, currentVolume, prevVolume] = await Promise.all([
      db.select({ total: count() }).from(shipments).where(gte(shipments.createdAt, startOfMonth)),
      db.select({ total: count() }).from(shipments).where(and(gte(shipments.createdAt, startOfPrevMonth), lte(shipments.createdAt, endOfPrevMonth))),
      db.select({ total: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(gte(awbs.createdAt, startOfMonth)),
      db.select({ total: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(and(gte(awbs.createdAt, startOfPrevMonth), lte(awbs.createdAt, endOfPrevMonth)))
    ]);

    const [totalInvResult, currentInv, prevInv] = await Promise.all([
      db.select({ total: sum(invoices.totalAmount) }).from(invoices),
      db.select({ total: sum(invoices.totalAmount) }).from(invoices).where(sql`${invoices.createdAt} >= ${startOfMonth}`),
      db.select({ total: sum(invoices.totalAmount) }).from(invoices).where(sql`${invoices.createdAt} >= ${startOfPrevMonth} AND ${invoices.createdAt} <= ${endOfPrevMonth}`)
    ]);

    const [totalCustResult, currentCust, prevCust] = await Promise.all([
      db.select({ total: count() }).from(customers),
      db.select({ total: count() }).from(customers).where(sql`${customers.createdAt} >= ${startOfCurrentMonth}`),
      db.select({ total: count() }).from(customers).where(sql`${customers.createdAt} >= ${startOfPreviousMonth} AND ${customers.createdAt} <= ${endOfPreviousMonth}`)
    ]);

    console.log("DASHBOARD_STATS_START");
    console.log("TOTAL_VOLUME_RAW:", totalVolumeResult[0]?.total);
    console.log("TOTAL_SHIPMENTS_RAW:", totalShipmentsResult[0]?.total);

    console.log("PARSED_VOLUME:", volTotal);
    console.log("PARSED_COUNT:", countTotal);

    // Dynamic Unit Selection
    if (volTotal >= 1000) {
      stats.volume = (volTotal / 1000).toFixed(2) + " MT";
    } else {
      stats.volume = volTotal.toFixed(0) + " KG";
    }

    stats.customers = countTotal;

    const volCurr = Number(currentVolume[0]?.total || 0);
    const volPrev = Number(prevVolume[0]?.total || 0);
    
    stats.volumeChange = calculatePercentageChange(volCurr, volPrev);
    stats.volumeUp = volCurr >= volPrev;

    // 3. Process Invoices (Currency) - Value is ABSOLUTE total
    const invTotal = Number(totalInvResult[0]?.total || 0);
    const invCurr = Number(currentInv[0]?.total || 0);
    const invPrev = Number(prevInv[0]?.total || 0);
    stats.invoices = formatCurrency(invTotal);
    stats.invoiceChange = calculatePercentageChange(invCurr, invPrev);
    stats.invoiceUp = invCurr >= invPrev;

    // 4. Process Customers - Value is ABSOLUTE total
    const custTotal = Number(totalCustResult[0]?.total || 0);
    const custCurr = Number(currentCust[0]?.total || 0);
    const custPrev = Number(prevCust[0]?.total || 0);
    stats.customers = custTotal;
    stats.customerChange = calculatePercentageChange(custCurr, custPrev);
    stats.customerUp = custCurr >= custPrev;

  } catch (e) {
    console.error("Dashboard Stats Fail:", e);
  }

  return stats;
}

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${Math.abs(change).toFixed(1)}%`;
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)}M`;
  return `Rp ${amount.toLocaleString()}`;
}

export async function getTonnageData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyVolume = await Promise.all(last7Days.map(async (date) => {
    const result = await db.select({ total: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` })
      .from(awbs)
      .where(sql`DATE(${awbs.createdAt}) = ${date}`);
    
    return {
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      volume: Number(result[0]?.total || 0)
    };
  }));

  return dailyVolume;
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
