import { Suspense } from "react";
import ShipmentGrid from "./ShipmentGrid";
import { getShipments, getCustomers } from "@/app/actions/shipment-actions";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Plus, 
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const [shipments, customers] = await Promise.all([
    getShipments(),
    getCustomers(),
  ]);

  // Quick Stats Logic
  const totalShipments = shipments.length;
  const inWarehouse = shipments.filter(s => s.status === "RECEIVED").length;
  const inTransit = shipments.filter(s => s.status === "DEPARTED" || s.status === "ARRIVED").length;
  const delivered = shipments.filter(s => s.status === "DELIVERED").length;

  const stats = [
    { label: "Total Active", value: totalShipments, icon: Package, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "In Warehouse", value: inWarehouse, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "In Transit", value: inTransit, icon: Truck, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Delivered", value: delivered, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
             <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">Logistics Terminal</h2>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Shipment Management</h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time oversight of global cargo movements and operational status.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
            <Filter size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="premium-card group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl rounded-full translate-x-8 -translate-y-8 group-hover:bg-blue-600/10 transition-colors" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider relative z-10">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>+12.5% vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Data View */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative glass-panel rounded-3xl overflow-hidden min-h-[600px]">
          <Suspense fallback={
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing Data Stream...</p>
            </div>
          }>
            <ShipmentGrid initialShipments={shipments} customers={customers} />
          </Suspense>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between py-6 border-t border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database Sync: Active</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Updated: Just Now</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Ambara Command Center <span className="text-slate-800">|</span> v5.0.0
        </div>
      </div>
    </div>
  );
}
