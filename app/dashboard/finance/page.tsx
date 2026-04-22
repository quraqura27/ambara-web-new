"use client";

import { 
  FileText, 
  Download, 
  Filter, 
  Plus, 
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
             <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Financial Terminal</h2>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Settlement Management</h1>
          <p className="text-slate-500 mt-2 font-medium max-w-lg">Reconcile carrier accounts, track receivables, and execute billing cycles.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
            <Download size={16} />
            Export Ledger
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            <Plus size={18} />
            New Invoice
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <KPICard 
          title="Total Receivables" 
          value="Rp 1.42B" 
          trend="+12.4% vs last Q"
          up={true}
          icon={<DollarSign className="text-blue-500" size={24} />}
          color="blue"
        />
        <KPICard 
          title="Settled (MTD)" 
          value="Rp 425.8M" 
          trend="84.2% Collection Rate"
          up={true}
          icon={<CheckCircle2 className="text-emerald-500" size={24} />}
          color="emerald"
        />
        <KPICard 
          title="Pending Approval" 
          value="14 Invoices" 
          trend="Avg. 2.4 days delay"
          up={false}
          icon={<Clock className="text-amber-500" size={24} />}
          color="amber"
        />
      </div>

      {/* Main Ledger Table */}
      <div className="glass-panel rounded-[2rem] overflow-hidden group">
        <div className="p-8 border-b border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/20">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-blue-400 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Filter by ID, Customer, or Reference..." 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-2.5 pl-12 pr-4 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <button className="p-2.5 bg-slate-900 text-slate-500 rounded-xl hover:text-white transition-all border border-slate-800">
              <Filter size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sort:</span>
               <select className="bg-transparent text-xs text-slate-300 font-black uppercase focus:outline-none cursor-pointer">
                 <option>Recent Activity</option>
                 <option>High Value</option>
                 <option>Overdue First</option>
               </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/40">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Counterparty</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Settlement Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Maturity Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              <InvoiceRow id="INV-2026-084" customer="Global Logistics Artha" amount="Rp 42,500,000" date="May 24, 2026" status="PAID" />
              <InvoiceRow id="INV-2026-085" customer="Indo Air Charter Solutions" amount="Rp 128,200,000" date="May 28, 2026" status="PENDING" />
              <InvoiceRow id="INV-2026-086" customer="Artha Sea Freight Hub" amount="Rp 8,900,000" date="May 15, 2026" status="OVERDUE" />
              <InvoiceRow id="INV-2026-087" customer="SkyLink Logistics ID" amount="Rp 214,000,000" date="June 02, 2026" status="DRAFT" />
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-900/20 border-t border-slate-800/50 flex items-center justify-between">
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Ledger v5.0</span>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Stream Verified</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, up, icon, color }: any) {
  const accentColor = color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-500' : 'text-amber-500';
  const bgColor = color === 'blue' ? 'bg-blue-500/10' : color === 'emerald' ? 'bg-emerald-500/10' : 'bg-amber-500/10';

  return (
    <div className="premium-card group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">{title}</p>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-4">{value}</h3>
          <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
            {up ? <TrendingUp size={12} /> : <AlertCircle size={12} />}
            {trend}
          </div>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center border border-slate-800/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function InvoiceRow({ id, customer, amount, date, status }: any) {
  const statusStyles: any = {
    PAID: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    OVERDUE: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    DRAFT: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  return (
    <tr className="hover:bg-blue-600/5 transition-colors group">
      <td className="px-8 py-5">
        <span className="text-xs font-black text-blue-400 group-hover:text-blue-300 transition-colors tracking-tight font-mono">{id}</span>
      </td>
      <td className="px-8 py-5">
        <span className="text-sm font-bold text-slate-200 tracking-tight">{customer}</span>
      </td>
      <td className="px-8 py-5 text-right">
        <span className="text-sm font-black text-white tracking-tighter">{amount}</span>
      </td>
      <td className="px-8 py-5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{date}</span>
      </td>
      <td className="px-8 py-5">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            <FileText size={18} />
          </button>
          <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            <MoreVertical size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
