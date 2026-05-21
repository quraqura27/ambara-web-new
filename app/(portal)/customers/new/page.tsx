import { createCustomerFromForm } from "@/actions/customers";
import { CustomerForm } from "@/components/portal/customer-form";

export default function NewCustomerPage() {
  return (
    <CustomerForm
      action={createCustomerFromForm}
      cancelHref="/customers"
      description="Create a new customer record for the internal directory."
      submitLabel="Create Customer"
      title="Add Customer"
    />
  );
}
