"use client";

import { ConfirmSubmitButton, TypedConfirmSubmitButton } from "@/components/portal/confirm-submit-button";
import { Card } from "@/components/ui/core";

export function ConfirmationPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">Standard confirmation</h2>
        <p className="mt-2 text-sm text-slate-500">Audit-preserving status change.</p>
        <form className="mt-5" onSubmit={(event) => event.preventDefault()}>
          <ConfirmSubmitButton
            confirmLabel="Confirm change"
            description="This preview does not submit data. Production actions run the same confirmation before server authorization."
            title="Confirm status change"
          >
            Open confirmation
          </ConfirmSubmitButton>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">Typed confirmation</h2>
        <p className="mt-2 text-sm text-slate-500">Higher-risk operational action.</p>
        <form className="mt-5" onSubmit={(event) => event.preventDefault()}>
          <TypedConfirmSubmitButton
            confirmLabel="Confirm rollback"
            confirmText="ROLLBACK"
            description="This preview does not submit data. The confirmation text must match exactly."
            title="Confirm controlled rollback"
          >
            Open typed confirmation
          </TypedConfirmSubmitButton>
        </form>
      </Card>
    </div>
  );
}
