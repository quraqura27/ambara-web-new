"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  archiveCrmOpportunity,
  changeCrmOpportunityStage,
  createCrmOpportunity,
  restoreCrmOpportunity,
  updateCrmOpportunity,
} from "@/lib/crm/data";
import {
  crmOpportunityStageValues,
  validateCrmOpportunityInput,
  type CrmOpportunityStage,
} from "@/lib/crm/core";
import { crmActionError, crmFormValues } from "@/lib/crm/form";
import type { PortalActionState } from "@/lib/forms/action-state";

type CrmFormState = PortalActionState<Record<string, string>>;

export async function createCrmOpportunityAction(
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  let created: { id: number };
  try {
    created = await createCrmOpportunity(validateCrmOpportunityInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Opportunity could not be created."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/opportunities");
  revalidatePath("/crm/pipeline");
  redirect(`/crm/opportunities/${created.id}?notice=${encodeURIComponent("Opportunity created.")}`);
}

export async function updateCrmOpportunityAction(
  id: number,
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await updateCrmOpportunity(id, validateCrmOpportunityInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Opportunity could not be updated."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/opportunities");
  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/opportunities/${id}`);
  redirect(`/crm/opportunities/${id}?notice=${encodeURIComponent("Opportunity updated.")}`);
}

export async function changeCrmOpportunityStageAction(id: number, formData: FormData) {
  const stage = String(formData.get("stage") ?? "") as CrmOpportunityStage;
  let errorMessage: string | null = null;
  if (!crmOpportunityStageValues.includes(stage)) errorMessage = "Select a valid opportunity stage.";
  if (!errorMessage) {
    try {
      await changeCrmOpportunityStage(id, stage, String(formData.get("lostReason") ?? "") || null);
    } catch (error) {
      errorMessage = crmActionError(error, "Opportunity stage could not be changed.");
    }
  }
  if (errorMessage) redirect(`/crm/opportunities/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/opportunities");
  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/opportunities/${id}`);
  redirect(`/crm/opportunities/${id}?notice=${encodeURIComponent("Opportunity stage updated.")}`);
}

export async function archiveCrmOpportunityAction(id: number, formData: FormData) {
  let errorMessage: string | null = null;
  try {
    await archiveCrmOpportunity(id, String(formData.get("reason") ?? ""));
  } catch (error) {
    errorMessage = crmActionError(error, "Opportunity could not be archived.");
  }
  if (errorMessage) redirect(`/crm/opportunities/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/opportunities");
  revalidatePath("/crm/pipeline");
  redirect(`/crm/opportunities?notice=${encodeURIComponent("Opportunity archived.")}`);
}

export async function restoreCrmOpportunityAction(id: number) {
  let errorMessage: string | null = null;
  try {
    await restoreCrmOpportunity(id);
  } catch (error) {
    errorMessage = crmActionError(error, "Opportunity could not be restored.");
  }
  if (errorMessage) redirect(`/crm/opportunities/${id}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/opportunities");
  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/opportunities/${id}`);
  redirect(`/crm/opportunities/${id}?notice=${encodeURIComponent("Opportunity restored.")}`);
}
