"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCrmActivity, createCrmTask, updateCrmTask, updateCrmTaskStatus } from "@/lib/crm/data";
import {
  crmTaskStatusValues,
  validateCrmActivityInput,
  validateCrmTaskInput,
  type CrmTaskStatus,
} from "@/lib/crm/core";
import { crmActionError, crmFormValues } from "@/lib/crm/form";
import type { PortalActionState } from "@/lib/forms/action-state";

type CrmFormState = PortalActionState<Record<string, string>>;

function linkedRecordPath(values: Record<string, string>) {
  if (values.entityType === "company") return `/crm/companies/${values.entityId}`;
  if (values.entityType === "contact") return `/crm/contacts/${values.entityId}`;
  if (values.entityType === "lead") return `/crm/leads/${values.entityId}`;
  if (values.entityType === "opportunity") return `/crm/opportunities/${values.entityId}`;
  return "/crm/activities";
}

export async function createCrmActivityAction(
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await createCrmActivity(validateCrmActivityInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Activity could not be created."), values };
  }
  const path = linkedRecordPath(values);
  revalidatePath("/crm");
  revalidatePath("/crm/activities");
  revalidatePath(path);
  redirect(`${path}?notice=${encodeURIComponent("Activity recorded.")}`);
}

export async function createCrmTaskAction(
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await createCrmTask(validateCrmTaskInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Task could not be created."), values };
  }
  const path = linkedRecordPath(values);
  revalidatePath("/crm");
  revalidatePath("/crm/tasks");
  revalidatePath(path);
  redirect(`${path}?notice=${encodeURIComponent("Task created.")}`);
}

function taskReturnPath(value: string) {
  if (value === "/crm/tasks") return value;
  if (/^\/crm\/(?:companies|contacts|leads|opportunities)\/\d+$/.test(value)) return value;
  return "/crm/tasks";
}

export async function updateCrmTaskAction(
  id: number,
  _previousState: CrmFormState,
  formData: FormData,
): Promise<CrmFormState> {
  const values = crmFormValues(formData);
  try {
    await updateCrmTask(id, validateCrmTaskInput(values));
  } catch (error) {
    return { formError: crmActionError(error, "Task could not be updated."), values };
  }
  revalidatePath("/crm");
  revalidatePath("/crm/tasks");
  revalidatePath(`/crm/tasks/${id}`);
  revalidatePath(linkedRecordPath(values));
  redirect(`/crm/tasks/${id}?notice=${encodeURIComponent("Task updated.")}`);
}

async function updateCrmTaskStatusAndRedirect(id: number, returnTo: string, formData: FormData) {
  const status = String(formData.get("status") ?? "") as CrmTaskStatus;
  let errorMessage: string | null = null;
  if (!crmTaskStatusValues.includes(status)) errorMessage = "Select a valid task status.";
  if (!errorMessage) {
    try {
      await updateCrmTaskStatus(id, status);
    } catch (error) {
      errorMessage = crmActionError(error, "Task status could not be updated.");
    }
  }
  const path = taskReturnPath(returnTo);
  if (errorMessage) redirect(`${path}?error=${encodeURIComponent(errorMessage)}`);
  revalidatePath("/crm");
  revalidatePath("/crm/tasks");
  revalidatePath(path);
  redirect(`${path}?notice=${encodeURIComponent("Task status updated.")}`);
}

export async function updateCrmTaskStatusAction(id: number, formData: FormData) {
  return updateCrmTaskStatusAndRedirect(id, "/crm/tasks", formData);
}

export async function updateCrmTaskStatusForRecordAction(id: number, returnTo: string, formData: FormData) {
  return updateCrmTaskStatusAndRedirect(id, returnTo, formData);
}
