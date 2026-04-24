import { db } from "./lib/db";
import { awbs, shipments } from "./lib/db/schema";
import { sql, gte, and, lte, desc } from "drizzle-orm";

async function test() {
  console.log("Testing DB Queries...");
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    console.log("1. Total Volume");
    const [totalVolumeResult] = await db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs);
    console.log("Total:", totalVolumeResult);

    console.log("2. Current Month");
    const [currentVolume] = await db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(gte(awbs.createdAt, startOfMonth));
    console.log("Current:", currentVolume);

    console.log("3. Previous Month");
    const [prevVolume] = await db.select({ value: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))` }).from(awbs).where(and(gte(awbs.createdAt, startOfPrevMonth), lte(awbs.createdAt, endOfPrevMonth)));
    console.log("Prev:", prevVolume);

    console.log("4. Tonnage Data");
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const oldestDateStr = last7Days[0];
    const results = await db.select({
      date: sql<string>`DATE(${awbs.createdAt})`,
      total: sql<string>`SUM(CAST(${awbs.chargeableWeight} AS NUMERIC))`
    })
    .from(awbs)
    .where(gte(awbs.createdAt, new Date(oldestDateStr + "T00:00:00.000Z")))
    .groupBy(sql`DATE(${awbs.createdAt})`);
    console.log("Tonnage:", results);

    console.log("5. Activity");
    const lastShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt)).limit(5);
    console.log("Activity:", lastShipments.length);

    console.log("All success!");
  } catch(e) {
    console.error("FAILED:");
    console.error(e);
  }
}

test();
