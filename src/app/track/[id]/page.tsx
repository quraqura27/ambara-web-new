"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Ship, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { getPublicShipment } from "@/app/actions/shipment-actions";
import { format } from "date-fns";

export default function PublicTrackingPage({ params }: { params: { id: string } }) {
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicShipment(params.id);
        if (data) {
          setShipment(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const statusSteps = [
    { label: "RECEIVED", icon: <Package size={18} />, desc: "Cargo accepted at origin warehouse" },
    { label: "DEPARTED", icon: <Ship size={18} />, desc: "In transit to destination port" },
    { label: "ARRIVED", icon: <Truck size={18} />, desc: "Reached destination port / hub" },
    { label: "CUSTOMS", icon: <AlertCircle size={18} />, desc: "Clearing local regulatory checks" },
    { label: "DELIVERED", icon: <CheckCircle2 size={18} />, desc: "Final handover to consignee" }
  ];

  const currentIdx = statusSteps.findIndex(s => s.label === shipment?.status);

  if (loading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  if (error || !shipment) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2 font-mono">TRACKING ID NOT FOUND</h2>
        <p className="text-slate-500 mb-6">We couldn't find a shipment with the code <span className="text-white font-bold">{params.id}</span>. Please verify your tracking number.</p>
        <a href="/" className="bg-blue-600 px-8 py-3 rounded-full font-bold text-sm hover:hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">RETURN TO HOME</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Premium Gradient Header */}
      <div className="h-64 bg-gradient-to-b from-blue-600/20 to-transparent border-b border-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase mb-4">AMBARA TRACKING SYSTEM</h1>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 italic">#{shipment.internalTrackingNo}</h2>
        <p className="text-slate-500 font-mono text-sm">Last Update: {format(new Date(shipment.updatedAt), "PPP p")}</p>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-6 pb-24">
        {/* Core Status Card */}
        <div className="bg-[#0f0f16]/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6">
            <div className="bg-blue-600/10 border border-blue-500/30 px-4 py-1 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{shipment.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">ORIGIN</span>
              <p className="text-3xl font-black text-white">{shipment.origin}</p>
            </div>
            <div className="flex items-center justify-center text-slate-700">
               <ArrowRight size={32} className="hidden md:block" />
            </div>
            <div className="space-y-1 md:text-right">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">DESTINATION</span>
              <p className="text-3xl font-black text-white">{shipment.destination}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pt-8 pb-12">
            <div className="absolute top-8 left-4 bottom-12 w-0.5 bg-slate-800" />
            <div className="space-y-12">
              {statusSteps.map((step, idx) => {
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                
                return (
                  <div key={step.label} className={`relative pl-12 flex gap-4 transition-all ${isPast || isCurrent ? "opacity-100" : "opacity-30"}`}>
                    <div className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${
                      isCurrent ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30 animate-pulse" : 
                      isPast ? "bg-slate-900 border-blue-600 text-blue-500" : 
                      "bg-slate-900 border-slate-800 text-slate-700"
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className={`font-bold tracking-tight ${isCurrent ? "text-white text-lg" : "text-slate-400"}`}>
                        {step.label}
                      </h4>
                      <p className="text-xs text-slate-600 max-w-sm">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cargo Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-800/50 pt-8">
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">PIECES</span>
                <span className="text-xl font-bold text-white">{shipment.cargo?.pieces || "-"} CTN</span>
             </div>
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">WEIGHT</span>
                <span className="text-xl font-bold text-white">{shipment.cargo?.weight || "-"} KG</span>
             </div>
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">CARRIER</span>
                <span className="text-xl font-bold text-white uppercase tracking-tighter">{shipment.cargo?.carrier || "N/A"}</span>
             </div>
             <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">SERVICE</span>
                <span className="text-xl font-bold text-blue-500 font-mono tracking-tighter">{shipment.serviceType || "PORT-TO-PORT"}</span>
             </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
           <p className="text-xs text-slate-600 flex items-center justify-center gap-2">
             <Clock size={12} /> Data synchronized with Ambara Globaltrans Hub
           </p>
        </div>
      </div>
    </div>
  );
}
