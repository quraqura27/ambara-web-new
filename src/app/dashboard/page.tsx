"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  CreditCard, 
  AlertCircle,
  Clock,
  ArrowUpRight
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

const data = [
  { name: "Mon", volume: 4000, revenue: 2400 },
  { name: "Tue", volume: 3000, revenue: 1398 },
  { name: "Wed", volume: 2000, revenue: 9800 },
  { name: "Thu", volume: 2780, revenue: 3908 },
  { name: "Fri", volume: 1890, revenue: 4800 },
  { name: "Sat", volume: 2390, revenue: 3800 },
  { name: "Sun", volume: 3490, revenue: 4300 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 min-h-screen">
      {/* Header */}
      <header>
        <h2 className="text-3xl font-black text-white tracking-tight">System Overview</h2>
        <p className="text-slate-500 font-medium">Monday, April 13, 2026 • Monitoring 4 carrier endpoints</p>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Volume (MT)" 
          value="124.5" 
          change="+12.5%" 
          up={true} 
          icon={Package} 
          color="blue"
        />
        <StatCard 
          label="Active Invoices" 
          value="Rp 1.2B" 
          change="-2.4%" 
          up={false} 
          icon={CreditCard} 
          color="green"
        />
        <StatCard 
          label="Active Customers" 
          value="48" 
          change="+4" 
          up={true} 
          icon={Users} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-8 bg-[#0f0f16] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Cargo Movement Trends</h3>
              <p className="text-xs text-slate-500">Volume (KG) processed over the last 7 days</p>
            </div>
            <select className="bg-slate-900 text-xs text-slate-400 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none">
              <Last7Days />
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}}
                  dy={10}
                />
                <YAxis hide={true} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health / Activity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0f0f16] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> Recent Activity
            </h3>
            <div className="space-y-6">
              <ActivityItem text="AWB 975-25865755 processed" time="12 mins ago" user="ADMIN-001" />
              <ActivityItem text="New Customer Created: GEMASAKTI" time="45 mins ago" user="FINANCE-02" />
              <ActivityItem text="Label Printed for AMB-240413" time="1 hour ago" user="SYSTEM" />
              <ActivityItem text="R2 Storage Bucket Reached 5GB" time="2 hours ago" user="SYSTEM" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl shadow-blue-500/20 group cursor-pointer relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Security Audit</h3>
                <p className="text-lg font-black leading-tight mb-4">You have 12 new shipments pending verification.</p>
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                    Start Review <ArrowUpRight size={14} />
                </button>
            </div>
            <ShieldCheck size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Last7Days() {
  return <option>Last 7 Days</option>;
}

function StatCard({ label, value, change, up, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    green: "text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/5",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
  };

  return (
    <div className={`p-8 rounded-3xl border ${colors[color]} shadow-xl flex flex-col gap-4 group hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center justify-between">
        <div className="p-3 bg-white/5 rounded-2xl">
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${up ? "text-green-500" : "text-red-500"}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-black text-white mb-1 tracking-tight">{value}</h4>
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">{label}</p>
      </div>
    </div>
  );
}

function ShieldCheck({ className, ...props }: any) {
    return <AlertCircle className={className} {...props} />;
}

function ActivityItem({ text, time, user }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-1.5 h-10 bg-slate-800 rounded-full shrink-0 flex flex-col justify-start pt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
      </div>
      <div className="flex flex-col">
        <p className="text-xs font-medium text-slate-300">{text}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
          <span>{time}</span>
          <span>•</span>
          <span className="text-blue-500/50">{user}</span>
        </div>
      </div>
    </div>
  );
}
