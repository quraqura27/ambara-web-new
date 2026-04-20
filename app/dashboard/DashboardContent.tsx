"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  CreditCard, 
  Clock,
  ArrowUpRight,
  AlertCircle
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
    <div className="space-y-8 pb-12">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          href="/dashboard/shipments"
          label="Total Volume (MT)" 
          value={stats?.volume || "0.0"} 
          change={stats?.volumeChange || "---"} 
          up={true} 
          icon={Package} 
          color="blue"
        />
        <StatCard 
          href="/dashboard/finance"
          label="Active Invoices" 
          value={stats?.invoices || "Rp 0.0"} 
          change={stats?.invoiceChange || "---"} 
          up={false} 
          icon={CreditCard} 
          color="green"
        />
        <StatCard 
          href="/dashboard/crm"
          label="Active Customers" 
          value={stats?.customers?.toString() || "0"} 
          change={stats?.customerChange || "---"} 
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
              <p className="text-xs text-slate-500">Volume (KG) processed over time</p>
            </div>
            <select className="bg-slate-900 text-xs font-bold text-slate-400 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none cursor-pointer hover:border-slate-500 transition-all">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Year to Date</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                <Clock size={16} className="text-blue-500" /> System Activity
            </h3>
            <div className="space-y-6">
              {activity.length > 0 ? activity.map((item, i) => (
                <ActivityItem key={i} text={item.text} time={item.time} user={item.user} />
              )) : (
                <div className="text-center py-8 opacity-20">
                  <Package className="mx-auto mb-2" size={32} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No activity logged</p>
                </div>
              )}
            </div>
          </div>

          <Link 
            href="/dashboard/shipments"
            className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl shadow-blue-500/20 group relative overflow-hidden"
          >
            <div className="relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Operational Audit</h3>
                <p className="text-lg font-black leading-tight mb-4">You have shipments pending status updates.</p>
                <div className="inline-flex bg-white/20 group-hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all items-center gap-2">
                    Review Portal <ArrowUpRight size={14} />
                </div>
            </div>
            <AlertCircle size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, up, icon: Icon, color, href }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    green: "text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/5",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
  };

  return (
    <Link 
      href={href}
      className={`p-8 rounded-3xl border ${colors[color]} shadow-xl flex flex-col gap-4 group hover:scale-[1.02] transition-transform relative overflow-hidden`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="p-3 bg-white/5 rounded-2xl">
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${up ? "text-green-500" : "text-red-500"}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-3xl font-black text-white mb-1 tracking-tight">{value}</h4>
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">{label}</p>
      </div>
      <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
        <ArrowUpRight size={48} />
      </div>
    </Link>
  );
}

function ActivityItem({ text, time, user }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-1.5 h-10 bg-slate-800 rounded-full shrink-0 flex flex-col justify-start pt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
      </div>
      <div className="flex flex-col">
        <p className="text-xs font-medium text-slate-300 line-clamp-1">{text}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
          <span>{time}</span>
          <span>•</span>
          <span className="text-blue-500/50">{user}</span>
        </div>
      </div>
    </div>
  );
}
