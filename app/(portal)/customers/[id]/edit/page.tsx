import { getCustomerById, updateCustomerFromForm } from "@/actions/customers";
import { CustomerForm } from "@/components/portal/customer-form";
import { notFound, redirect } from "next/navigation";

import { requirePortalUser } from "@/lib/portal-auth";
import { canManageCustomers } from "@/lib/portal-roles";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customerId = Number.parseInt(id, 10);
  const user = await requirePortalUser();
  if (!canManageCustomers(user)) redirect(`/customers/${customerId}?error=forbidden`);
  const customer = Number.isNaN(customerId) ? null : await getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

  return (
    <CustomerForm
      action={updateCustomerFromForm.bind(null, customer.id)}
      cancelHref={`/customers/${customer.id}`}
      description="Update the customer profile and contact details."
      submitLabel="Save Changes"
      title={`Edit ${customer.fullName || customer.companyName || "Customer"}`}
      values={{
        address: customer.address ?? "",
        companyName: customer.companyName ?? "",
        email: customer.email ?? "",
        fullName: customer.fullName ?? "",
        invoiceCode: customer.invoiceCode ?? "",
        phone: customer.phone ?? "",
        type: customer.type === "retail" ? "retail" : "b2b",
      }}
    />
  );
}
