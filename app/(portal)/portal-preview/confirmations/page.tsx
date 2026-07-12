import { notFound } from "next/navigation";

import { ConfirmationPreview } from "@/components/portal/confirmation-preview";

export default function ConfirmationPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-white/5 pb-5">
        <p className="text-xs font-semibold uppercase text-emerald-300">Interaction preview</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Destructive confirmations</h1>
      </header>
      <ConfirmationPreview />
    </div>
  );
}
