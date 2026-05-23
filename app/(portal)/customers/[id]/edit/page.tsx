import { getCustomerById, updateCustomerFromForm } from "@/actions/customers";
import { CustomerForm } from "@/components/portal/customer-form";
import { notFound } from "next/navigation";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customerId = Number.parseInt(id, 10);
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
        phone: customer.phone ?? "",
        type: customer.type === "retail" ? "retail" : "b2b",
      }}
    />
  );
}
