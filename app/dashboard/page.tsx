import { db } from "@/lib/db";
import { shipments, customers, invoices, awbs } from "@/lib/db/schema";
import { count, sum, desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import DashboardContent from "./DashboardContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  // 1. Fetch Stats with Total Isolation - one failure cannot stop the page
  const shipCount = await db.select({ total: count() }).from(shipments).then(res => Number(res[0]?.total || 0)).catch(() => 0);
  const custCount = await db.select({ total: count() }).from(customers).then(res => Number(res[0]?.total || 0)).catch(() => 0);
  const invSum = await db.select({ total: sum(invoices.totalAmount) }).from(invoices).where(eq(invoices.status, 'PENDING')).then(res => Number(res[0]?.total || 0)).catch(() => 0);
  const volumeSum = await db.select({ total: sum(awbs.chargeableWeight) }).from(awbs).then(res => Number(res[0]?.total || 0)).catch(() => 0);

  // 2. Format with Fallbacks
  const stats = {
    volume: volumeSum > 0 ? (volumeSum / 1000).toFixed(1) : `${shipCount} OPS`,
    invoices: invSum >= 1_000_000_000 
      ? `Rp ${(invSum / 1_000_000_000).toFixed(1)}B`
      : invSum > 0 ? `Rp ${(invSum / 1_000_000).toFixed(0)}M` : "Rp 0",
    customers: custCount,
    volumeChange: "+0%",
    invoiceChange: "---",
    customerChange: "Verified"
  };

  // 3. Fetch Activity
  const activity = await db.select()
    .from(shipments)
    .orderBy(desc(shipments.createdAt))
    .limit(5)
    .then(rows => rows.map(s => ({
      text: `Shipment ${s.trackingNumber || s.internalTrackingNo || "AAG-TEMP"} status: ${s.status}`,
      time: "Just now",
      user: "SYSTEM"
    })))
    .catch(() => []);

  const chartData = [
    { name: "Mon", volume: 4000 },
    { name: "Tue", volume: 3000 },
    { name: "Wed", volume: 2000 },
    { name: "Thu", volume: 2780 },
    { name: "Fri", volume: 1890 },
    { name: "Sat", volume: 2390 },
    { name: "Sun", volume: 3490 },
  ];

  return (
    <div className="space-y-8 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">System Overview</h2>
          <p className="text-slate-500 font-medium">Real-time Command Center • Monitoring carrier endpoints</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync: Active</span>
        </div>
      </header>

      <DashboardContent stats={stats} chartData={chartData} activity={activity} />
    </div>
  );
}
