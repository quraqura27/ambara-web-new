"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  archiveCrmLead,
  convertQuoteRequestToCrmLead,
  createCrmLead,
  restoreCrmLead,
  updateCrmLead,
} from "@/lib/crm/data";
import { validateCrmLeadInput } from "@/lib/crm/core";
import { crmActionError, crmFormValues } from "@/lib/crm/form";
import type { PortalActionState } from "@/lib/forms/action-state";

type CrmFormState = PortalActionState<Record<string, string>>;

export async function createCrmLeadAction(
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  let created: { id: number };
  try {
    created = await createCrmLead(validateCrmLeadInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Lead could not be created."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  redirect(`/crm/leads/${created.id}?notice=${encodeURIComponent("Lead created.")}`);
}

export async function updateCrmLeadAction(
  id: number,
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await updateCrmLead(id, validateCrmLeadInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Lead could not be updated."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${id}`);
  redirect(`/crm/leads/${id}?notice=${encodeURIComponent("Lead updated.")}`);
}

export async function archiveCrmLeadAction(id: number, formData: FormData) {
  let errorMessage: string | null = null;
  try {
    await archiveCrmLead(id, String(formData.get("reason") ?? ""));
  } catch (error) {
    errorMessage = crmActionError(error, "Lead could not be archived.");
  }
  if (errorMessage) redirect(`/crm/leads/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  redirect(`/crm/leads?notice=${encodeURIComponent("Lead archived.")}`);
}

export async function restoreCrmLeadAction(id: number) {
  let errorMessage: string | null = null;
  try {
    await restoreCrmLead(id);
  } catch (error) {
    errorMessage = crmActionError(error, "Lead could not be restored.");
  }
  if (errorMessage) redirect(`/crm/leads/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${id}`);
  redirect(`/crm/leads/${id}?notice=${encodeURIComponent("Lead restored.")}`);
}

export async function convertQuoteRequestToCrmLeadAction(quoteRequestId: number) {
  let result: { id: number; alreadyConverted: boolean } | null = null;
  let errorMessage: string | null = null;
  try {
    result = await convertQuoteRequestToCrmLead(quoteRequestId);
  } catch (error) {
    errorMessage = crmActionError(error, "Quote request could not be converted.");
  }
  if (errorMessage) redirect(`/quotes/${quoteRequestId}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  revalidatePath(`/quotes/${quoteRequestId}`);
  redirect(`/crm/leads/${result!.id}?notice=${encodeURIComponent(result!.alreadyConverted ? "Quote request was already linked to this lead." : "Quote request converted to a CRM lead.")}`);
}
