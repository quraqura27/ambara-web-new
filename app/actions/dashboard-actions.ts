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
    // 1. Core Portfolio Metrics
    const [totalShipmentsResult, totalVolumeResult] = await Promise.all([
      db.select({ value: count() }).from(shipments),
      db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs)
    ]);
    
    const volTotal = parseFloat(totalVolumeResult[0]?.value || "0");
    const countTotal = Number(totalShipmentsResult[0]?.value || 0);
    
    // 2. Trend Metrics (Monthly Comparison)
    const [currentVolume, prevVolume, currentInv, prevInv, currentCust, prevCust] = await Promise.all([
      db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(gte(awbs.createdAt, startOfMonth)),
      db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(and(gte(awbs.createdAt, startOfPrevMonth), lte(awbs.createdAt, endOfPrevMonth))),
      db.select({ value: sql<string>`SUM("total")` }).from(invoices).where(sql`"invoice_date" >= ${startOfMonth}`),
      db.select({ value: sql<string>`SUM("total")` }).from(invoices).where(sql`"invoice_date" >= ${startOfPrevMonth} AND "invoice_date" <= ${endOfPrevMonth}`),
      db.select({ value: count() }).from(customers).where(gte(customers.createdAt, startOfCurrentMonth)),
      db.select({ value: count() }).from(customers).where(and(gte(customers.createdAt, startOfPreviousMonth), lte(customers.createdAt, endOfPreviousMonth)))
    ]);

    const [totalInvResult, totalCustResult] = await Promise.all([
      db.select({ value: sql<string>`SUM("total")` }).from(invoices),
      db.select({ value: count() }).from(customers)
    ]);

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

    // 3. Process Invoices (Currency)
    const invTotal = Number(totalInvResult[0]?.value || 0);
    const invCurr = Number(currentInv[0]?.value || 0);
    const invPrev = Number(prevInv[0]?.value || 0);
    stats.invoices = formatCurrency(invTotal);
    stats.invoiceChange = calculatePercentageChange(invCurr, invPrev);
    stats.invoiceUp = invCurr >= invPrev;

    // 4. Process Customers
    const custTotal = Number(totalCustResult[0]?.value || 0);
    const custCurr = Number(currentCust[0]?.value || 0);
    const custPrev = Number(prevCust[0]?.value || 0);
    stats.customers = custTotal;
    stats.customerChange = calculatePercentageChange(custCurr, custPrev);
    stats.customerUp = custCurr >= custPrev;

  } catch (e) {
    console.error("DASHBOARD DB ERROR:", e);
    throw e;
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
