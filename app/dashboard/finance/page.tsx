"use client";

import { 
  FileText, 
  Download, 
  Filter, 
  Plus, 
  Search,
  DollarSign,
  TrendingUp,
  Clock
} from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Finance Terminal</h2>
          <p className="text-slate-400 mt-1">Invoice generation and ledger management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-slate-700">
            <Download size={16} /> Export CSV
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Outstanding" 
          value="$128,430.00" 
          trend="+12% from last month"
          icon={<DollarSign className="text-blue-400" size={24} />}
        />
        <KPICard 
          title="Revenue (MTD)" 
          value="$45,200.00" 
          trend="+5.4% growth"
          icon={<TrendingUp className="text-emerald-400" size={24} />}
        />
        <KPICard 
          title="Pending Approval" 
          value="12 Invoices" 
          trend="Review required"
          icon={<Clock className="text-amber-400" size={24} />}
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-[#0f0f16] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search Invoices..." 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors border border-slate-700">
              <Filter size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Displaying:</span>
            <select className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none">
              <option>Recent Invoices</option>
              <option>Overdue</option>
              <option>Drafts</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/20">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Invoice ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Due Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {/* Placeholder rows */}
              <InvoiceRow id="INV-2026-001" customer="Global Logistics Corp" amount="$12,400.00" date="May 12, 2026" status="PAID" statusColor="text-emerald-400 bg-emerald-500/10" />
              <InvoiceRow id="INV-2026-002" customer="Indo Air Charter" amount="$8,200.50" date="May 15, 2026" status="PENDING" statusColor="text-amber-400 bg-amber-500/10" />
              <InvoiceRow id="INV-2026-003" customer="Artha Sea Freight" amount="$22,100.00" date="April 28, 2026" status="OVERDUE" statusColor="text-red-400 bg-red-500/10" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: any }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex items-start justify-between group hover:border-slate-700 transition-all">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
        <p className="text-[10px] font-medium text-slate-400">{trend}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700 group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
  );
}

function InvoiceRow({ id, customer, amount, date, status, statusColor }: any) {
  return (
    <tr className="hover:bg-slate-800/20 transition-colors group">
      <td className="px-6 py-4">
        <span className="text-xs font-mono text-blue-400 font-bold">{id}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-slate-200 font-medium">{customer}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-white font-bold">{amount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-slate-400">{date}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border border-current ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-500 hover:text-white transition-colors">
          <FileText size={18} />
        </button>
      </td>
    </tr>
  );
}
