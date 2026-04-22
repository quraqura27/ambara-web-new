"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  CreditCard, 
  Clock,
  ArrowUpRight,
  AlertCircle,
  Activity,
  ChevronRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import Link from "next/link";

interface DashboardContentProps {
  stats: any;
  chartData: any[];
  activity: any[];
}

export default function DashboardContent({ stats, chartData, activity }: DashboardContentProps) {
  return (
    <div className="space-y-10">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          href="/dashboard/shipments"
          label="Total Cargo Volume" 
          value={stats?.volume || "0.0"} 
          suffix=""
          change={stats?.volumeChange || "---"} 
          up={true} 
          icon={Package} 
          color="blue"
        />
        <StatCard 
          href="/dashboard/finance"
          label="Pending Settlement" 
          value={stats?.invoices || "Rp 0.0"} 
          change={stats?.invoiceChange || "---"} 
          up={true} 
          icon={CreditCard} 
          color="emerald"
        />
        <StatCard 
          href="/dashboard/crm"
          label="Portfolio Growth" 
          value={stats?.customers?.toString() || "0"} 
          suffix="Verified"
          change={stats?.customerChange || "---"} 
          up={true} 
          icon={Users} 
          color="purple"
        />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chart Area */}
        <div className="lg:col-span-8 glass-panel rounded-[2rem] p-8 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/0 via-blue-600/50 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Cargo Movement Dynamics</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Daily operational throughput analysis across all terminals.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all">Last 7D</button>
              <button className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all">30D</button>
            </div>
          </div>
          
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#1e293b" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 700}}
                  dy={15}
                />
                <YAxis hide={true} />
                <Tooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '16px', 
                    fontSize: '11px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Activity */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel rounded-[2rem] p-8 h-full relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" /> Operational Log
              </h3>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            
            <div className="space-y-8">
              {activity.length > 0 ? activity.map((item, i) => (
                <ActivityItem key={i} text={item.text} time={item.time} user={item.user} type={item.type} />
              )) : (
                <div className="text-center py-12 opacity-20">
                  <Package className="mx-auto mb-4" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No activity reported</p>
                </div>
              )}
            </div>

            <button className="w-full mt-10 py-3 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:border-slate-700 transition-all">
                Access System Logs
            </button>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ActionCard 
            title="Bulk Ingestion Terminal"
            description="Process multiple AWBs simultaneously using our deterministic scanning engine."
            href="/dashboard/ingest"
            icon={Package}
            btnText="Launch Scraper"
            color="blue"
          />
          <ActionCard 
            title="Financial Settlements"
            description="Reconcile carrier accounts and manage customer invoicing workflows."
            href="/dashboard/finance"
            icon={CreditCard}
            btnText="View Ledger"
            color="emerald"
          />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, change, up, icon: Icon, color, href }: any) {
  const accentColor = color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-500' : 'text-purple-500';
  const bgColor = color === 'blue' ? 'bg-blue-500/10' : color === 'emerald' ? 'bg-emerald-500/10' : 'bg-purple-500/10';

  return (
    <Link 
      href={href}
      className="premium-card relative group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-4 rounded-2xl ${bgColor} ${accentColor}`}>
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-800/50">
           <span className={`text-[10px] font-black tracking-tight ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
              {up ? '+' : '-'}{change}
           </span>
           {up ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-rose-500" />}
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline gap-2">
          <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
          {suffix && <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{suffix}</span>}
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{label}</p>
      </div>

      <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <ChevronRight size={24} className={accentColor} />
      </div>
    </Link>
  );
}

function ActivityItem({ text, time, user, type }: any) {
  return (
    <div className="flex gap-5 group/item">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full mt-1.5 border-4 border-slate-950 z-10 relative ${type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
        <div className="absolute top-4 bottom-[-32px] left-1/2 -translate-x-1/2 w-px bg-slate-800 group-last/item:hidden" />
      </div>
      <div className="flex flex-col gap-1 pb-2">
        <p className="text-xs font-bold text-slate-200 leading-relaxed group-hover/item:text-blue-400 transition-colors">{text}</p>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <span>{time}</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="text-slate-500">{user}</span>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, href, icon: Icon, btnText, color }: any) {
  const accentClass = color === 'blue' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20';
  
  return (
    <div className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-8 group">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
             <Icon size={18} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">{description}</p>
      </div>
      <Link 
        href={href}
        className={`whitespace-nowrap px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-95 ${accentClass}`}
      >
        {btnText}
      </Link>
    </div>
  );
}
