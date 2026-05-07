import Link from "next/link";

import { Button, Card, Input } from "@/components/ui/core";
import type { CustomerFormValues } from "@/actions/customers";

type CustomerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  description: string;
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
  submitLabel,
  title,
  values,
}: CustomerFormProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-slate-500">{description}</p>
      </div>

      <Card className="p-8">
        <form action={action} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Full Name
              </span>
              <Input
                defaultValue={values?.fullName ?? ""}
                name="fullName"
                placeholder="Jane Doe"
                required={!(values?.companyName ?? "").trim()}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Company Name
              </span>
              <Input
                defaultValue={values?.companyName ?? ""}
                name="companyName"
                placeholder="Ambara Trading"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Email
              </span>
              <Input
                defaultValue={values?.email ?? ""}
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
                defaultValue={values?.phone ?? ""}
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
                defaultValue={values?.type ?? "b2b"}
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
                defaultValue={values?.address ?? ""}
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
            <Button className="w-full sm:w-auto" type="submit">
              {submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
