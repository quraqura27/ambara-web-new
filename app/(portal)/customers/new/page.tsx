import { createCustomerFromForm } from "@/actions/customers";
import { CustomerForm } from "@/components/portal/customer-form";

import { redirect } from "next/navigation";
import { requirePortalUser } from "@/lib/portal-auth";
import { canManageCustomers } from "@/lib/portal-roles";

export default async function NewCustomerPage() {
  const user = await requirePortalUser();
  if (!canManageCustomers(user)) redirect("/customers?error=forbidden");
  return (
    <CustomerForm
      action={createCustomerFromForm}
      cancelHref="/customers"
      description="Create a new customer record for the internal directory."
      showDuplicateConfirmation
      submitLabel="Create Customer"
      title="Add Customer"
    />
  );
}
