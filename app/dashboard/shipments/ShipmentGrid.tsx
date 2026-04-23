"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  ArrowUpDown, 
  MoreVertical, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Package,
  Calendar,
  MapPin,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import ShipmentForm from "./ShipmentForm";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { deleteShipment } from "@/app/actions/shipment-actions";

interface ShipmentGridProps {
  initialShipments: any[];
  customers: any[];
  totalCount: number;
  page: number;
  limit: number;
}

export default function ShipmentGrid({ initialShipments, customers, totalCount, page, limit }: ShipmentGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredShipments = useMemo(() => {
    return initialShipments.filter((s) => {
      const matchesSearch = 
        s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.internalTrackingNo?.toLowerCase().includes(search.toLowerCase()) ||
        s.origin?.toLowerCase().includes(search.toLowerCase()) ||
        s.destination?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [initialShipments, search, filterStatus]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredShipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShipments.map(s => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (confirm("Permanently delete this shipment? This action cannot be undone.")) {
      const res = await deleteShipment(id);
      if (res.success) {
        setSelectedIds(prev => prev.filter(i => i !== id));
        router.refresh();
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Permanently delete ${selectedIds.length} shipments?`)) {
      alert("Bulk delete feature is being synchronized with the database...");
    }
  };

  const handleExport = () => {
    const headers = ["Internal ID", "MAWB", "Origin", "Destination", "Status", "Service", "Weight", "Pieces", "Shipper", "Consignee", "Created"];
    const rows = filteredShipments.map(s => [
      s.internalTrackingNo,
      s.trackingNumber || "N/A",
      s.origin,
      s.destination,
      s.status,
      s.serviceType,
      s.weight,
      s.pieces,
      s.shipper || "",
      s.consignee || "",
      format(new Date(s.createdAt), "yyyy-MM-dd")
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ambara_shipments_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "RECEIVED": return "bg-amber-400/10 text-amber-400 border-amber-400/20";
      case "DEPARTED": return "bg-blue-400/10 text-blue-400 border-blue-400/20";
      case "ARRIVED": return "bg-purple-400/10 text-purple-400 border-purple-400/20";
      case "CUSTOMS": return "bg-rose-400/10 text-rose-400 border-rose-400/20";
      case "DELIVERED": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
      default: return "bg-slate-400/10 text-slate-400 border-slate-400/20";
    }
  };

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
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full bg-[#0f172a]/30">
      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-600 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-white uppercase tracking-widest">{selectedIds.length} Shipments Selected</span>
            <div className="h-4 w-px bg-white/20" />
            <button className="text-xs font-bold text-white/80 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
              <Edit2 size={14} /> Update Status
            </button>
            <button 
              onClick={handleExport}
              className="text-xs font-bold text-white/80 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-black text-white uppercase tracking-widest transition-all"
            >
              Delete Selected
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight className="rotate-45" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Grid Toolbar */}
      <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by Tracking, Route, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-slate-300"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500/50"
          >
            <option value="ALL">All Status</option>
            <option value="RECEIVED">Received</option>
            <option value="DEPARTED">Departed</option>
            <option value="ARRIVED">Arrived</option>
            <option value="CUSTOMS">Customs</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="p-2.5 bg-slate-900 text-slate-500 border border-slate-800 rounded-xl hover:text-white transition-all"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            New Shipment
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-800/50 bg-slate-900/40">
              <th className="px-6 py-4 text-left w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredShipments.length && filteredShipments.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
                />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Tracking <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Route <MapPin size={12} />
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Status <Clock size={12} />
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Cargo <Package size={12} />
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Created <Calendar size={12} />
                </div>
              </th>
              <th className="px-6 py-4 text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filteredShipments.map((shipment) => (
              <tr key={shipment.id} className={`group hover:bg-blue-600/5 transition-colors ${selectedIds.includes(shipment.id) ? 'bg-blue-600/10' : ''}`}>
                <td className="px-6 py-5">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(shipment.id)}
                    onChange={() => toggleSelect(shipment.id)}
                    className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                      {shipment.trackingNumber || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      {shipment.internalTrackingNo}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                       <span className="text-xs font-bold text-slate-300">{shipment.origin}</span>
                       <div className="h-4 w-px bg-slate-800 my-0.5" />
                       <span className="text-xs font-bold text-slate-300">{shipment.destination}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-800 rotate-12 mx-2" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Air-Freight</span>
                      <span className="text-xs font-medium text-slate-400">Direct Route</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${getStatusStyle(shipment.status)}`}>
                    {shipment.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{shipment.pieces} PCS</span>
                    <span className="text-[10px] text-slate-500 font-medium">{shipment.weight} KG Total</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-medium text-slate-400">
                    {format(new Date(shipment.createdAt), "MMM dd, yyyy")}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingShipment(shipment)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(shipment.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredShipments.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800">
              <Search size={32} className="text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 tracking-tight">No shipments found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="p-6 border-t border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rows per page:</span>
            <select 
              value={limit}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set('limit', e.target.value);
                params.set('page', '1');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black text-slate-300 focus:outline-none"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', (page - 1).toString());
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="p-2 border border-slate-800 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, Math.ceil(totalCount / limit)) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', pageNum.toString());
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    page === pageNum 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button 
            disabled={page >= Math.ceil(totalCount / limit)}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', (page + 1).toString());
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="p-2 border border-slate-800 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {(isAdding || editingShipment) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            onClick={() => { setIsAdding(false); setEditingShipment(null); }}
          />
          <div className="relative w-full max-w-xl glass-panel rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/40">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {editingShipment ? "Modify Shipment" : "Register Shipment"}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {editingShipment ? "Update existing cargo records." : "Create a new logistics entry."}
                </p>
              </div>
              <button 
                onClick={() => { setIsAdding(false); setEditingShipment(null); }}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ChevronRight size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-8">
              <ShipmentForm 
                initialData={editingShipment}
                customers={customers}
                onSuccess={() => {
                  setIsAdding(false);
                  setEditingShipment(null);
                  router.refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
