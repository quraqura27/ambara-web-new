"use client";

import { useActionState } from "react";

import {
  resetCustomerPortalPassword,
  type CustomerCredentialActionState,
} from "@/actions/customers";
import { ConfirmSubmitButton } from "@/components/portal/confirm-submit-button";
import { Input } from "@/components/ui/core";

const initialState: CustomerCredentialActionState = {};

export function CustomerCredentialForm({ customerId }: { customerId: number }) {
  const action = resetCustomerPortalPassword.bind(null, customerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.formError ? <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">{state.formError}</p> : null}
      {state.success ? <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200" role="status">{state.success}</p> : null}
      <Input autoComplete="new-password" maxLength={128} minLength={8} name="password" placeholder="New client password" required type="password" />
      <Input autoComplete="new-password" maxLength={128} minLength={8} name="passwordConfirmation" placeholder="Confirm client password" required type="password" />
      <ConfirmSubmitButton
        confirmLabel="Reset password"
        description="Existing client sessions will be revoked immediately. Shipment and customer records are not changed."
        disabled={pending}
        title="Reset client password?"
        variant="secondary"
      >
        {pending ? "Resetting..." : "Reset Client Password"}
      </ConfirmSubmitButton>
    </form>
  );
}
