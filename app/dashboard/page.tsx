import { getDashboardStats, getTonnageData, getRecentActivity } from "@/app/actions/dashboard-actions";
import DashboardContent from "./DashboardContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return <div>Unauthorized</div>;
    }

    // Fetch real data sequentially to avoid any concurrent session leakage issues
    const stats = await getDashboardStats().catch(() => null);
    const chartData = await getTonnageData().catch(() => []);
    const activity = await getRecentActivity().catch(() => []);

    return (
      <div className="space-y-8 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">System Overview</h2>
            <p className="text-slate-500 font-medium">Real-time Command Center • Monitoring carrier endpoints</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync Alpha</span>
          </div>
        </header>

        {/* Render the interactive content */}
        <DashboardContent stats={stats} chartData={chartData} activity={activity} />
      </div>
    );
  } catch (error) {
    console.error("Critical Dashboard Crash:", error);
    // Absolute fallback to prevent 500
    return (
      <div className="space-y-8 min-h-screen">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">System Overview</h2>
            <p className="text-slate-500 font-medium text-red-500/50 italic">Offline Mode • Connection issues detected</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl opacity-50">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sync Offline</span>
          </div>
        </header>
        <DashboardContent stats={null} chartData={[]} activity={[]} />
      </div>
    );
  }
}
