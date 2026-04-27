import Link from "next/link";
import { ArrowRight, Globe, MapPin, Package, Plus, Search, Truck } from "lucide-react";

import { searchShipmentByTracking } from "@/actions/shipments";
import { Button, Card, Input } from "@/components/ui/core";

export default function ShipmentsSearchPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 py-12">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-600/20 bg-blue-600/10 text-blue-400 shadow-xl shadow-blue-500/10">
          <Package className="h-10 w-10" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">Track a Shipment</h2>
        <p className="mx-auto max-w-md text-slate-500">
          Search by tracking number to see the current status, mock timeline, and linked
          customer profile.
        </p>
        <Link href="/shipments/new">
          <Button className="mt-2 gap-2" type="button" variant="secondary">
            <Plus className="h-4 w-4" /> Create New Shipment
          </Button>
        </Link>
      </div>

      <Card className="p-8">
        <form action={searchShipmentByTracking} className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <Input
              className="h-14 pl-12 text-lg font-medium"
              name="trackingNumber"
              placeholder="e.g. AMB-8291-7492"
              required
            />
          </div>
          <Button className="h-14 gap-2 px-8 text-base font-bold" type="submit">
            Track Now <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400">
              <Truck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold">Deterministic Mock Tracking</h4>
            <p className="text-xs leading-relaxed text-slate-500">
              MVP mode uses a predictable tracking provider so the same number always
              returns the same status and history.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400">
              <Globe className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold">Provider-Ready Architecture</h4>
            <p className="text-xs leading-relaxed text-slate-500">
              The tracking layer is isolated so a live carrier or aggregator can replace the
              mock provider later.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400">
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold">Linked Customer Context</h4>
            <p className="text-xs leading-relaxed text-slate-500">
              Each shipment page shows who owns the package so operations can resolve issues
              without switching tools.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
