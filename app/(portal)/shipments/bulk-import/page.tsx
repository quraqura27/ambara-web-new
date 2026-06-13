import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

import {
  getRecentBulkShipmentImportJobs,
  rollbackBulkShipmentImportJob,
} from "@/actions/vendor-tracking";
import { BulkImportForm } from "@/components/vendor-tracking/bulk-import-form";
import { Button, Card, cn } from "@/components/ui/core";

type BulkImportPageProps = {
  searchParams?: Promise<{ error?: string; notice?: string }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function MessageBanner({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {error || notice}
    </div>
  );
}

export default async function BulkShipmentImportPage({ searchParams }: BulkImportPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const jobs = await getRecentBulkShipmentImportJobs();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button className="h-auto rounded-full p-2" type="button" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bulk Shipment Import</h2>
          <p className="mt-1 text-slate-500">
            Preview rows, create shipments and parcels, and keep import audit records.
          </p>
        </div>
      </div>

      <MessageBanner error={resolvedSearchParams?.error} notice={resolvedSearchParams?.notice} />
      <BulkImportForm />

      <Card className="p-0">
        <div className="border-b border-white/5 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Recent Import Jobs
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Job</th>
                <th className="px-6 py-4">File</th>
                <th className="px-6 py-4">Rows</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.map((job) => {
                const rollbackAction = rollbackBulkShipmentImportJob.bind(null, job.id);
                const canRollback = job.status === "completed" && job.createdParcels > 0;

                return (
                  <tr key={job.id} className="align-top">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{job.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">
                        {job.uploadedFilename || "pasted-table.csv"}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(job.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {job.validRows} valid / {job.errorRows} errors / {job.warningRows} warnings
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {job.createdShipments} shipments / {job.createdParcels} parcels
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-blue-300">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={rollbackAction}>
                        <Button
                          className="gap-2"
                          disabled={!canRollback}
                          type="submit"
                          variant="danger"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Roll Back
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No import jobs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
