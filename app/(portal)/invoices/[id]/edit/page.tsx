import Link from "next/link";
import { notFound } from "next/navigation";

import { getInvoiceDraftChargeEditorData } from "@/actions/invoices";
import { InvoiceDraftChargeEditor } from "@/components/invoices/invoice-draft-charge-editor";
import { Button } from "@/components/ui/core";

type EditInvoiceDraftPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditInvoiceDraftPage({ params }: EditInvoiceDraftPageProps) {
  const { id } = await params;
  const editor = await getInvoiceDraftChargeEditorData(id);
  if (!editor) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-blue-300">DRAFT</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Edit invoice draft</h1>
          <p className="mt-1 text-slate-500">{editor.customerName}</p>
        </div>
        <Link href={`/invoices/${id}`}>
          <Button variant="secondary">Cancel editing</Button>
        </Link>
      </div>

      <InvoiceDraftChargeEditor editor={editor} />
    </div>
  );
}
