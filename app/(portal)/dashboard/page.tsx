import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

import { getDashboardStats } from "@/actions/shipments";
import { Card } from "@/components/ui/core";

type StatCardProps = {
  color: string;
  icon: typeof Users;
  title: string;
  trend: string;
  value: number;
};

function StatCard({ color, icon: Icon, title, trend, value }: StatCardProps) {
  return (
    <Card className="group relative p-6">
      <div
        className={`absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br ${color} opacity-[0.03] blur-3xl transition-opacity group-hover:opacity-[0.08]`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
            {title}
          </p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900 p-3 text-slate-100 transition-transform group-hover:scale-110">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-500">
        <TrendingUp className="h-3 w-3 text-green-400" />
        <span>{trend}</span>
        <span className="ml-auto flex cursor-default items-center gap-1 text-blue-400">
          Live Snapshot <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
        <p className="mt-1 text-slate-500">
          Customer and shipment metrics from the Ambara operations portal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          color="from-blue-500 to-indigo-500"
          icon={Users}
          title="Total Customers"
          trend="Directory records"
          value={stats.totalCustomers}
        />
        <StatCard
          color="from-amber-500 to-orange-500"
          icon={Clock}
          title="In Transit"
          trend="Actively moving"
          value={stats.activeShipments}
        />
        <StatCard
          color="from-emerald-500 to-teal-500"
          icon={CheckCircle2}
          title="Delivered"
          trend="Completed shipments"
          value={stats.deliveredShipments}
        />
        <StatCard
          color="from-red-500 to-rose-500"
          icon={AlertCircle}
          title="Exceptions"
          trend="Needs follow-up"
          value={stats.exceptionShipments}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex h-[400px] flex-col items-center justify-center border-dashed border-white/10 bg-transparent p-6 lg:col-span-2">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <TrendingUp className="h-8 w-8 text-slate-700" />
          </div>
          <p className="font-medium text-slate-500">Shipment Volume Chart</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-700">
            Reserved for a later analytics phase
          </p>
        </Card>

        <Card className="p-6">
          <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-500">
            MVP Coverage
          </h4>
          <div className="space-y-6">
            {[
              "Customer CRUD is available through directory and detail views.",
              "Tracking numbers can be linked or unlinked from customer records.",
              "Shipment lookup resolves to a dedicated tracking detail page.",
              "Dashboard counts reflect the currently stored shipment statuses.",
            ].map((item) => (
              <div key={item} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/5">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-sm text-slate-400">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
