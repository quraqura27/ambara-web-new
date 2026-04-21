"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight, 
  MoreVertical,
  Printer,
  FileSearch,
  User,
  ArrowUpDown,
  CheckCircle,
  Truck,
  Package,
  AlertCircle
} from "lucide-react";
import { bulkUpdateStatus } from "@/app/actions/shipment-actions";
import { getShipmentLabels } from "@/app/actions/print-actions";
import SlideOver from "@/components/SlideOver";
import ShipmentForm from "./ShipmentForm";

interface Shipment {
  id: number;
  trackingNumber: string | null;
  internalTrackingNo: string | null;
  status: string | null;
  origin: string | null;
  destination: string | null;
  serviceType: string | null;
  createdAt: Date | null;
  customerName: string | null;
}

export default function ShipmentGrid({ initialShipments, customers }: { initialShipments: Shipment[], customers: { id: number, fullName: string }[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<keyof Shipment>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      setIsUpdating(true);
      await bulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
      // Note: revalidatePath in server action refreshes the page
    } catch (err) {
      console.error("Bulk update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredShipments = initialShipments
    .filter(s => {
      const searchMatch = (s.internalTrackingNo || "").toLowerCase().includes(search.toLowerCase()) ||
                          (s.trackingNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                          (s.customerName || "").toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === "ALL" || s.status === statusFilter;
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (!valA || !valB) return 0;
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: keyof Shipment) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredShipments.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkPrint = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsUpdating(true);
      const base64 = await getShipmentLabels(selectedIds);
      
      // Trigger download
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `ambara-labels-${new Date().getTime()}.pdf`;
      link.click();

      setSelectedIds([]);
    } catch (err) {
      console.error("Printing failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSinglePrint = async (id: number) => {
    try {
      setIsUpdating(true);
      const base64 = await getShipmentLabels([id]);
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = `label-${id}.pdf`;
      link.click();
    } catch (err) {
      console.error("Printing failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Creation SlideOver */}
      <SlideOver 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="Create New Shipment"
      >
        <ShipmentForm 
          customers={customers} 
          onSuccess={() => { setIsCreateOpen(false); window.location.reload(); }} 
        />
      </SlideOver>

      {/* Editing SlideOver */}
      <SlideOver 
        isOpen={!!editingShipment} 
        onClose={() => setEditingShipment(null)} 
        title="Edit Shipment Details"
      >
        {editingShipment && (
          <ShipmentForm 
            initialData={editingShipment}
            customers={[]} // Editing doesn't need customer list
            onSuccess={() => { setEditingShipment(null); window.location.reload(); }} 
          />
        )}
      </SlideOver>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0f0f16] border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="absolute inset-0 bg-blue-600 flex items-center px-6 justify-between z-20 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white">{selectedIds.length} Shipments Selected</span>
              <div className="h-4 w-px bg-blue-400" />
              <div className="flex gap-2">
                <BulkActionButton icon={Truck} label="DEPARTED" onClick={() => handleBulkUpdate("DEPARTED")} disabled={isUpdating} />
                <BulkActionButton icon={Package} label="ARRIVED" onClick={() => handleBulkUpdate("ARRIVED")} disabled={isUpdating} />
                <BulkActionButton icon={CheckCircle} label="DELIVERED" onClick={() => handleBulkUpdate("DELIVERED")} disabled={isUpdating} />
                <div className="h-4 w-px bg-blue-400 mx-1" />
                <button 
                  onClick={handleBulkPrint}
                  disabled={isUpdating}
                  className="bg-white text-blue-600 hover:bg-white/90 disabled:opacity-50 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all shadow-lg"
                >
                  <Printer size={14} /> PRINT {selectedIds.length} LABELS
                </button>
              </div>
            </div>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-white/70 hover:text-white text-[10px] font-black tracking-widest uppercase"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Tracking, AWB, or Customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
            <Filter size={14} className="text-slate-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 outline-none uppercase tracking-wider cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="RECEIVED">Received</option>
              <option value="DEPARTED">Departed</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CUSTOMS">Customs</option>
            </select>
          </div>
          
          <button 
            onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
            className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 hover:text-white transition-colors uppercase"
          >
             Clear Filters
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden md:block" />

          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus size={14} /> New Shipment
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-[#0f0f16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredShipments.length && filteredShipments.length > 0} 
                    onChange={handleSelectAll}
                    className="accent-blue-500 rounded border-slate-700 bg-slate-900" 
                  />
                </th>
                <th className="px-4 py-4 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => toggleSort("status")}>
                  <div className="flex items-center gap-2">Status & Tracking <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => toggleSort("customerName")}>
                  <div className="flex items-center gap-2">Customer <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => toggleSort("createdAt")}>
                  <div className="flex items-center gap-2">Date <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id} className={`hover:bg-slate-800/20 transition-colors group ${selectedIds.includes(shipment.id) ? "bg-blue-500/5" : ""}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(shipment.id)} 
                      onChange={() => handleSelectRow(shipment.id)}
                      className="accent-blue-500 rounded border-slate-700 bg-slate-900" 
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={shipment.status || "RECEIVED"} />
                        <span className="text-xs font-mono font-bold text-slate-200">{shipment.internalTrackingNo || shipment.trackingNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium tracking-tight">System Matched</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors border border-slate-700/50">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{shipment.customerName || "Walk-in Client"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-bold border border-slate-700/30">{shipment.origin}</span>
                      <ChevronRight size={12} className="text-slate-600" />
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-bold border border-slate-700/30">{shipment.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-blue-500/80 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 tracking-widest">
                      {shipment.serviceType || "STANDARD"}
                    </span>
                  </td>
                  <td className="px-6 py-4" suppressHydrationWarning>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={12} />
                      <span className="text-xs font-medium">{shipment.createdAt?.toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleSinglePrint(shipment.id)}
                        disabled={isUpdating}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" 
                        title="Print Label"
                      >
                        <Printer size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors" title="View Manifest">
                        <FileSearch size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingShipment(shipment)}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Search size={48} />
                      <p className="text-sm font-medium">No shipments found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    RECEIVED: "bg-yellow-500 text-black",
    DEPARTED: "bg-blue-600 text-white",
    ARRIVED: "bg-purple-600 text-white",
    DELIVERED: "bg-green-600 text-white",
    CUSTOMS: "bg-orange-600 text-white",
  };

  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none ${styles[status] || styles.RECEIVED}`}>
      {status}
    </span>
  );
}

function BulkActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled 
}: { 
  icon: any, 
  label: string, 
  onClick: () => void, 
  disabled: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all border border-white/10"
    >
      <Icon size={14} /> {label}
    </button>
  );
}
