import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { deleteCustomerAndRedirect, getCustomerById } from "@/actions/customers";
import {
  linkTrackingToCustomer,
  unlinkTrackingFromCustomer,
} from "@/actions/shipments";
import { Button, Card, Input } from "@/components/ui/core";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customerId = Number.parseInt(id, 10);
  const customer = Number.isNaN(customerId) ? null : await getCustomerById(customerId);

  if (!customer) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <Users className="mb-4 h-16 w-16 text-slate-800" />
        <h2 className="text-2xl font-bold">Customer Not Found</h2>
        <p className="mt-2 text-slate-500">
          The record you are looking for does not exist or has been removed.
        </p>
        <Link className="mt-6" href="/customers">
          <Button variant="secondary">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  const linkTrackingAction = linkTrackingToCustomer.bind(null, customer.id);
  const deleteCustomerAction = deleteCustomerAndRedirect.bind(null, customer.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button className="h-auto rounded-full p-2" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {customer.fullName || customer.companyName}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <p className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-400">
              {customer.type || "b2b"}
            </p>
            <p className="text-xs text-slate-500">
              Member since{" "}
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
              Profile Information
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="rounded-xl border border-white/5 bg-slate-900 p-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Email Address</p>
                  <p className="text-sm font-semibold">{customer.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="rounded-xl border border-white/5 bg-slate-900 p-3 text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone Number</p>
                  <p className="text-sm font-semibold">{customer.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="rounded-xl border border-white/5 bg-slate-900 p-3 text-slate-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Address</p>
                  <p className="text-sm font-semibold leading-relaxed">
                    {customer.address || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3 border-t border-white/5 pt-8">
              <Link href={`/customers/${customer.id}/edit`}>
                <Button className="w-full" variant="secondary">
                  Edit Profile
                </Button>
              </Link>
              <form action={deleteCustomerAction}>
                <Button className="w-full" type="submit" variant="danger">
                  Delete Customer
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Link Tracking Number
              </h3>
              <span className="text-xs text-slate-500">
                {customer.shipments.length} linked shipment
                {customer.shipments.length === 1 ? "" : "s"}
              </span>
            </div>
            <form action={linkTrackingAction} className="flex flex-col gap-3 md:flex-row">
              <Input
                className="md:flex-1"
                name="trackingNumber"
                placeholder="Enter tracking number"
                required
              />
              <Button className="gap-2" type="submit">
                <Plus className="h-4 w-4" /> Link Tracking
              </Button>
            </form>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Linked Shipments
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {customer.shipments.map((shipment) => {
              const unlinkAction = unlinkTrackingFromCustomer.bind(
                null,
                customer.id,
                shipment.id,
              );

              return (
                <Card
                  key={shipment.id}
                  className="group p-5 transition-all hover:border-blue-500/30"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                          Tracking #
                        </p>
                        <p className="text-sm font-bold text-white transition-colors group-hover:text-blue-400">
                          {shipment.trackingNumber}
                        </p>
                      </div>
                    </div>
                    <Link href={`/shipments/${shipment.trackingNumber}`}>
                      <Button className="h-auto rounded-full p-2" variant="ghost">
                        <ExternalLink className="h-4 w-4 text-slate-600 transition-colors group-hover:text-white" />
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex flex-col">
                      <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-tight ${
                          shipment.status === "delivered"
                            ? "text-emerald-500"
                            : shipment.status === "in_transit"
                              ? "text-amber-500"
                              : shipment.status === "exception"
                                ? "text-rose-400"
                                : "text-blue-400"
                        }`}
                      >
                        <div
                          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            shipment.status === "delivered"
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                              : shipment.status === "in_transit"
                                ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                : shipment.status === "exception"
                                  ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                                  : "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                          }`}
                        />
                        {shipment.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        Last Update
                      </span>
                      <span className="text-xs text-slate-400">
                        {shipment.updatedAt
                          ? new Date(shipment.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <form action={unlinkAction} className="mt-4">
                    <Button className="w-full gap-2" type="submit" variant="ghost">
                      <Trash2 className="h-4 w-4" /> Unlink Shipment
                    </Button>
                  </form>
                </Card>
              );
            })}

            {customer.shipments.length === 0 && (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-white/5 py-12 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-slate-800" />
                <p className="font-medium text-slate-500">No tracking numbers linked</p>
                <p className="mt-1 text-xs text-slate-700">
                  Add a shipment above to start tracking for this customer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
