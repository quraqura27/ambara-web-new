import { db } from "@/lib/db";
import { shipments, customers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { 
  Package, 
  Printer,
  CheckCircle2,
  Clock,
  Truck
} from "lucide-react";
import ShipmentGrid from "./ShipmentGrid";

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

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cargo Operations</h2>
          <p className="text-sm text-slate-500">Managing {allShipments.length} active shipments in the current cycle.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border border-slate-700">
            <Printer size={16} /> Bulk Print Labels
          </button>
        </div>
      </header>

      {/* Stats Quick-Look */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard icon={Clock} label="RECEIVED" count={12} color="text-yellow-500" bg="bg-yellow-500/10" />
        <StatusCard icon={Truck} label="DEPARTED" count={8} color="text-blue-500" bg="bg-blue-500/10" />
        <StatusCard icon={Package} label="ARRIVED" count={15} color="text-purple-500" bg="bg-purple-500/10" />
        <StatusCard icon={CheckCircle2} label="DELIVERED" count={42} color="text-green-500" bg="bg-green-500/10" />
      </div>

      <ShipmentGrid initialShipments={allShipments} customers={allCustomers} />
    </div>
  );
}

function StatusCard({ icon: Icon, label, count, color, bg }: any) {
  return (
    <div className={`p-4 rounded-2xl border border-slate-800/50 ${bg} flex flex-col gap-2 shadow-sm`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={color} />
        <span className="text-[10px] font-black text-slate-400 tracking-widest">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{count}</span>
    </div>
  );
}
