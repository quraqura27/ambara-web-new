import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createShipmentFromForm, getCustomersForSelect } from "@/actions/shipments";
import { Button, Card, Input } from "@/components/ui/core";

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30";

export default async function NewShipmentPage() {
  const customers = await getCustomersForSelect();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Shipment</h2>
          <p className="mt-1 text-slate-500">
            Register a new shipment and optionally link it to a customer.
          </p>
        </div>
      </div>

      <Card className="p-8">
        <form action={createShipmentFromForm} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Tracking Number *
              </span>
              <Input
                name="trackingNumber"
                placeholder="e.g. AMB-8291-7492"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Shipment Title *
              </span>
              <Input
                name="title"
                placeholder="e.g. Jakarta → Singapore Express"
                required
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Origin *
              </span>
              <Input
                name="origin"
                placeholder="e.g. Jakarta, ID"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Destination *
              </span>
              <Input
                name="destination"
                placeholder="e.g. Singapore, SG"
                required
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Link to Customer (optional)
            </span>
            <select className={fieldClassName} name="customerId">
              <option value="">— No customer linked —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName || c.companyName || `Customer #${c.id}`}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-6 sm:flex-row sm:justify-end">
            <Link href="/shipments">
              <Button className="w-full sm:w-auto" type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button className="w-full sm:w-auto" type="submit">
              Create Shipment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
