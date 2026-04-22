import { getDashboardStats, getTonnageData, getRecentActivity } from "@/app/actions/dashboard-actions";
import { auth } from "@clerk/nextjs/server";
import DashboardContent from "./DashboardContent";
import { ShieldCheck, Activity, Globe } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  // 1. Fetch Stats via Server Actions
  const [stats, chartData, activity] = await Promise.all([
    getDashboardStats(),
    getTonnageData(),
    getRecentActivity()
  ]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header with Visual Polish */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
             <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Operational Overview</h2>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Command Center</h1>
          <p className="text-slate-500 mt-2 font-medium max-w-lg">Monitoring global cargo flow, carrier endpoints, and financial settlement performance.</p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global Link: ACTIVE</span>
          </div>
          <button className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-600/5">
             <Globe size={20} />
          </button>
        </div>
      </header>

      <DashboardContent stats={stats} chartData={chartData} activity={activity} />

      {/* Quick Access Footer Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/50">
        <div className="flex items-center gap-4 text-slate-500">
           <ShieldCheck size={16} className="text-blue-500" />
           <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encryption Enabled</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 md:justify-center">
           <Activity size={16} className="text-emerald-500" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Latency: 42ms to Jakarta Hub</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 md:justify-end">
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">AAG-OPS-v5.0.0-PROD</span>
        </div>
      </div>
    </div>
  );
}
