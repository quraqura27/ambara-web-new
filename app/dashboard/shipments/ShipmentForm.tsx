"use client";

import { useState } from "react";
import { Plus, Save, Package, Truck, MapPin } from "lucide-react";
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
    origin: initialData?.origin || "",
    destination: initialData?.destination || "",
    serviceType: initialData?.serviceType || "PP",
    pieces: initialData?.pieces?.toString() || "1",
    weight: initialData?.weight?.toString() || "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateFullShipment(initialData.id, formData);
      } else {
        await createShipment(formData);
      }
      onSuccess();
    } catch (err) {
      console.error("Form submission failed:", err);
      alert("Error saving shipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection (Only for New) */}
      {!initialData && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Customer</label>
          <select
            required
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          >
            <option value="">Choose Billing Account...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Cargo Logistics Block */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MAWB Number (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 126-12345678"
            value={formData.trackingNumber}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Type</label>
          <select
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          >
            <option value="PP">Port-to-Port (Standard)</option>
            <option value="DO">Door-to-Door (Express)</option>
            <option value="XP">Express Air-freight</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pieces</label>
          <input
            type="number"
            value={formData.pieces}
            onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Weight (KG)</label>
          <input
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Origin & Destination Block */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-blue-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Route Configuration</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            type="text"
            placeholder="Origin (e.g. CGK)"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value.toUpperCase() })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
          <input
            required
            type="text"
            placeholder="Destination (e.g. SIN)"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {loading ? "Processing..." : initialData ? "Update Shipment" : "Create Shipment"}
          {!loading && <Save size={18} />}
        </button>
      </div>
    </form>
  );
}
