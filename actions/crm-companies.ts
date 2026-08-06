"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  archiveCrmContact,
  archiveCrmCompany,
  createCrmCompany,
  createCrmContact,
  restoreCrmContact,
  restoreCrmCompany,
  updateCrmContact,
  updateCrmCompany,
} from "@/lib/crm/data";
import { crmActionError, crmFormValues } from "@/lib/crm/form";
import { validateCrmCompanyInput, validateCrmContactInput } from "@/lib/crm/core";
import type { PortalActionState } from "@/lib/forms/action-state";

type CrmFormState = PortalActionState<Record<string, string>>;

export async function createCrmCompanyAction(
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  let created: { id: number };
  try {
    created = await createCrmCompany(validateCrmCompanyInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Company could not be created."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/companies");
  redirect(`/crm/companies/${created.id}?notice=${encodeURIComponent("Company created.")}`);
}

export async function updateCrmCompanyAction(
  id: number,
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await updateCrmCompany(id, validateCrmCompanyInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Company could not be updated."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/companies");
  revalidatePath(`/crm/companies/${id}`);
  redirect(`/crm/companies/${id}?notice=${encodeURIComponent("Company updated.")}`);
}

export async function archiveCrmCompanyAction(id: number, formData: FormData) {
  let errorMessage: string | null = null;
  try {
    await archiveCrmCompany(id, String(formData.get("reason") ?? ""));
  } catch (error) {
    errorMessage = crmActionError(error, "Company could not be archived.");
  }
  if (errorMessage) redirect(`/crm/companies/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/companies");
  redirect(`/crm/companies?notice=${encodeURIComponent("Company archived.")}`);
}

export async function restoreCrmCompanyAction(id: number) {
  let errorMessage: string | null = null;
  try {
    await restoreCrmCompany(id);
  } catch (error) {
    errorMessage = crmActionError(error, "Company could not be restored.");
  }
  if (errorMessage) redirect(`/crm/companies/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/companies");
  revalidatePath(`/crm/companies/${id}`);
  redirect(`/crm/companies/${id}?notice=${encodeURIComponent("Company restored.")}`);
}

export async function createCrmContactAction(
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  let created: { id: number };
  try {
    created = await createCrmContact(validateCrmContactInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Contact could not be created."), values };
  }
  const companyId = values.companyId;
  revalidatePath("/crm/contacts");
  if (companyId) revalidatePath(`/crm/companies/${companyId}`);
  redirect(`/crm/contacts/${created.id}?notice=${encodeURIComponent("Contact created.")}`);
}

export async function updateCrmContactAction(
  id: number,
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await updateCrmContact(id, validateCrmContactInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Contact could not be updated."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/contacts");
  revalidatePath(`/crm/contacts/${id}`);
  if (values.companyId) revalidatePath(`/crm/companies/${values.companyId}`);
  redirect(`/crm/contacts/${id}?notice=${encodeURIComponent("Contact updated.")}`);
}

export async function archiveCrmContactAction(id: number, formData: FormData) {
  let errorMessage: string | null = null;
  try {
    await archiveCrmContact(id, String(formData.get("reason") ?? ""));
  } catch (error) {
    errorMessage = crmActionError(error, "Contact could not be archived.");
  }
  if (errorMessage) redirect(`/crm/contacts/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm/contacts");
  redirect(`/crm/contacts?notice=${encodeURIComponent("Contact archived.")}`);
}

export async function restoreCrmContactAction(id: number) {
  let errorMessage: string | null = null;
  try {
    await restoreCrmContact(id);
  } catch (error) {
    errorMessage = crmActionError(error, "Contact could not be restored.");
  }
  if (errorMessage) redirect(`/crm/contacts/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm/contacts");
  revalidatePath(`/crm/contacts/${id}`);
  redirect(`/crm/contacts/${id}?notice=${encodeURIComponent("Contact restored.")}`);
}
