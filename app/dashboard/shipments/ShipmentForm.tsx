"use client";

import { useState } from "react";
import { Save, Package, Truck, MapPin, Info, ArrowRight } from "lucide-react";
import { createShipment, updateFullShipment } from "@/app/actions/shipment-actions";

interface ShipmentFormProps {
  initialData?: any;
  customers: { id: number; fullName: string }[];
  onSuccess: () => void;
}

export default function ShipmentForm({ initialData, customers, onSuccess }: ShipmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: initialData?.customerId?.toString() || "",
    trackingNumber: initialData?.trackingNumber || "",
    internalTrackingNo: initialData?.internalTrackingNo || "",
    origin: initialData?.origin || "",
    destination: initialData?.destination || "",
    status: initialData?.status || "RECEIVED",
    serviceType: initialData?.serviceType || "PP",
    pieces: initialData?.pieces?.toString() || "1",
    weight: initialData?.weight?.toString() || "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        const result = await updateFullShipment(initialData.id, formData);
        if (result?.success) onSuccess();
        else alert(result?.error || "Update failed.");
      } else {
        const result = await createShipment(formData);
        if (result?.success) onSuccess();
        else alert(result?.error || "Creation failed.");
      }
    } catch (err: any) {
      alert(`System Error: ${err.message || "Network Timeout"}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-700";
  const labelClasses = "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Account Info Section */}
      {!initialData && (
        <div className="group">
          <label className={labelClasses}>Billing Account</label>
          <div className="relative">
             <select
               required
               value={formData.customerId}
               onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
               className={inputClasses}
             >
               <option value="">Select an account...</option>
               {customers.map((c) => (
                 <option key={c.id} value={c.id}>{c.fullName}</option>
               ))}
             </select>
          </div>
        </div>
      )}

      {/* Logistics Identifiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className={labelClasses}>Internal tracking no</label>
            <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Auto-Gen Enabled</span>
          </div>
          <input
            type="text"
            readOnly
            placeholder="AAG24ID00000000PP"
            value={formData.internalTrackingNo || "AUTO-GENERATED ON SAVE"}
            className={`${inputClasses} bg-slate-900/50 border-dashed border-slate-700 text-slate-500 cursor-not-allowed`}
          />
          <p className="text-[9px] text-slate-600 font-medium italic mt-1 ml-1">Format: [AA][YY][Country][8-digit-ID][Service]</p>
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>MAWB / Air Waybill No</label>
          <input
            type="text"
            placeholder="e.g. 126-12345678"
            value={formData.trackingNumber}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={labelClasses}>Service Class</label>
          <select
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className={inputClasses}
          >
            <option value="PP">Port-to-Port (Standard)</option>
            <option value="DO">Door-to-Door (Express)</option>
            <option value="XP">Express Air-freight</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>Current Operational Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-slate-900 border border-blue-500/30 rounded-2xl py-3 px-4 text-sm text-blue-100 focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="RECEIVED">RECEIVED (In Warehouse)</option>
            <option value="DEPARTED">DEPARTED (In Transit)</option>
            <option value="ARRIVED">ARRIVED (Destination Port)</option>
            <option value="CUSTOMS">CUSTOMS (Clearance)</option>
            <option value="DELIVERED">DELIVERED (Final Destination)</option>
          </select>
        </div>
      </div>

      {/* Logistics Specs */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={labelClasses}>Pieces (Quantity)</label>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input
              type="number"
              value={formData.pieces}
              onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
              className={`${inputClasses} pl-12`}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className={labelClasses}>Weight (KG)</label>
          <div className="relative">
            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className={`${inputClasses} pl-12`}
            />
          </div>
        </div>
      </div>

      {/* Routing Section */}
      <div className="space-y-4 pt-6 border-t border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Routing Configuration</span>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClasses}>Origin Port</label>
            <input
              required
              type="text"
              placeholder="e.g. CGK"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value.toUpperCase() })}
              className={inputClasses}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClasses}>Destination Port</label>
            <input
              required
              type="text"
              placeholder="e.g. SIN"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Processing Transaction...
            </>
          ) : (
            <>
              {initialData ? "Synchronize Updates" : "Execute Shipment Creation"}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
