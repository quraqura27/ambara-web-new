"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, Card, Input } from "@/components/ui/core";
import type { CustomerActionState, CustomerFormValues } from "@/actions/customers";

type CustomerFormProps = {
  action: (state: CustomerActionState, formData: FormData) => Promise<CustomerActionState>;
  cancelHref: string;
  description: string;
  showDuplicateConfirmation?: boolean;
  submitLabel: string;
  title: string;
  values?: Partial<CustomerFormValues>;
};

const fieldClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30";

export function CustomerForm({
  action,
  cancelHref,
  description,
  showDuplicateConfirmation = false,
  submitLabel,
  title,
  values,
}: CustomerFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const currentValues = state.values ?? values;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-slate-500">{description}</p>
      </div>

      <Card className="p-8">
        <form action={formAction} className="space-y-6" key={JSON.stringify(state.values ?? {})}>
          {state.formError ? <div aria-live="polite" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{state.formError}</div> : null}
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Full Name
              </span>
              <Input
                defaultValue={currentValues?.fullName ?? ""}
                name="fullName"
                placeholder="Jane Doe"
                required={!(currentValues?.companyName ?? "").trim()}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Company Name
              </span>
              <Input
                defaultValue={currentValues?.companyName ?? ""}
                name="companyName"
                placeholder="Ambara Trading"
              />
            </label>
          </div>

          {showDuplicateConfirmation ? <label className="flex items-start gap-3 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-4 text-sm text-slate-300"><input className="mt-1" name="confirmDuplicate" type="checkbox" value="yes" /><span>Confirm this is an intentional separate customer if the server finds matching contact or company data.</span></label> : null}

          <div className="grid gap-6 md:grid-cols-[140px_1fr_1fr]">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Invoice Code
              </span>
              <Input
                defaultValue={currentValues?.invoiceCode ?? ""}
                maxLength={3}
                name="invoiceCode"
                pattern="[A-Za-z]{3}"
                placeholder="SNB"
                required
                title="Use exactly 3 letters."
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Email
              </span>
              <Input
                defaultValue={currentValues?.email ?? ""}
                name="email"
                placeholder="ops@company.com"
                type="email"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Phone
              </span>
              <Input
                defaultValue={currentValues?.phone ?? ""}
                name="phone"
                placeholder="+62 812 3456 7890"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Customer Type
              </span>
              <select
                className={fieldClassName}
                defaultValue={currentValues?.type ?? "b2b"}
                name="type"
              >
                <option value="b2b">B2B</option>
                <option value="retail">Retail</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Address
              </span>
              <textarea
                className={`${fieldClassName} min-h-28 resize-y`}
                defaultValue={currentValues?.address ?? ""}
                name="address"
                placeholder="Street, city, province, postal code"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-6 sm:flex-row sm:justify-end">
            <Link href={cancelHref}>
              <Button className="w-full sm:w-auto" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button className="w-full sm:w-auto" disabled={pending} type="submit">
              {pending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
