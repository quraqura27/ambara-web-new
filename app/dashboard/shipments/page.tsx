import { db } from "@/lib/db";
import { shipments, customers, awbs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { 
  Package, 
  Printer,
  CheckCircle2,
  Clock,
  Truck
} from "lucide-react";
import ShipmentGrid from "./ShipmentGrid";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  // Fetch real data from your Neon DB
  const allShipments = await db.select({
    id: shipments.id,
    trackingNumber: shipments.trackingNumber,
    internalTrackingNo: shipments.internalTrackingNo,
    status: shipments.status,
    origin: shipments.origin,
    destination: shipments.destination,
    serviceType: shipments.serviceType,
    createdAt: shipments.createdAt,
    customerName: customers.fullName,
    pieces: awbs.pieces,
    weight: awbs.chargeableWeight,
    customerId: shipments.customerId,
  })
  .from(shipments)
  .leftJoin(customers, eq(shipments.customerId, customers.id))
  .leftJoin(awbs, eq(shipments.id, awbs.shipmentId))
  .orderBy(desc(shipments.createdAt))
  .limit(100);

  const allCustomers = await db.select({
    id: customers.id,
    fullName: customers.fullName
  })
  .from(customers)
  .orderBy(customers.fullName);

  // Dynamic Status Calculations
  const stats = {
    RECEIVED: allShipments.filter(s => s.status === "RECEIVED").length,
    DEPARTED: allShipments.filter(s => s.status === "DEPARTED").length,
    ARRIVED: allShipments.filter(s => s.status === "ARRIVED").length,
    DELIVERED: allShipments.filter(s => s.status === "DELIVERED").length,
  };

  return (
    <div className="space-y-8">
      <header 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}
      >
        <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 className="text-2xl font-bold text-white tracking-tight ambara-heading-section" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Cargo Operations</h2>
          <p className="text-sm text-slate-400" style={{ fontSize: '14px', color: '#94a3b8' }}>
            Managing <span className="text-blue-400 font-semibold" style={{ color: '#60a5fa', fontWeight: 600 }}>{allShipments.length}</span> active shipments in the current cycle.
          </p>
        </div>
        <div className="flex gap-3" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border border-slate-700"
            style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', border: '1px solid #334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> Bulk Print Labels
          </button>
        </div>
      </header>

      {/* Stats Quick-Look */}
      <div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 ambara-grid-shell"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <StatusCard icon={Clock} label="RECEIVED" count={stats.RECEIVED} color="text-yellow-500" bg="bg-yellow-500/10" style={{ backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308' }} />
        <StatusCard icon={Truck} label="DEPARTED" count={stats.DEPARTED} color="text-blue-500" bg="bg-blue-500/10" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }} />
        <StatusCard icon={Package} label="ARRIVED" count={stats.ARRIVED} color="text-purple-500" bg="bg-purple-500/10" style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7' }} />
        <StatusCard icon={CheckCircle2} label="DELIVERED" count={stats.DELIVERED} color="text-green-500" bg="bg-green-500/10" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }} />
      </div>

      <ShipmentGrid initialShipments={allShipments} customers={allCustomers} />
    </div>
  );
}

function StatusCard({ icon: Icon, label, count, color, bg, style }: any) {
  return (
    <div 
      className={`p-4 rounded-2xl border border-slate-800/50 ${bg} flex flex-col gap-2 shadow-sm ambara-card-shell`}
      style={{ 
        padding: '16px', 
        borderRadius: '16px', 
        border: '1px solid rgba(30,41,59,0.5)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        backgroundColor: style?.backgroundColor || '#0f0f16'
      }}
    >
      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} className={color} style={{ color: style?.color }} />
        <span className="text-[10px] font-black text-slate-400 tracking-widest" style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <span className="text-2xl font-bold text-white" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{count}</span>
    </div>
  );
}
