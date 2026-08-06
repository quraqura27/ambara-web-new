"use client";

import { useActionState } from "react";

import {
  crmActivityTypeValues,
  crmCompanyRoleValues,
  crmExternalQuotationStatusValues,
  crmLeadPriorityValues,
  crmLeadStatusValues,
  crmOpportunityStageValues,
  crmTaskPriorityValues,
  crmTaskStatusValues,
} from "@/lib/crm/constants";
import { toWibDateTimeLocalValue } from "@/lib/time/wib";
import { Button } from "@/components/ui/core";
import {
  CrmField,
  CrmFormSection,
  crmFieldClassName,
  crmTextareaClassName,
} from "@/components/crm/crm-ui";

type FormState = {
  fieldErrors?: Record<string, string>;
  formError?: string;
  values?: Record<string, string>;
};

type FormAction = (previousState: FormState, formData: FormData) => Promise<FormState>;
const initialFormState: FormState = {};

export type CrmStaffOption = { fullName: string; id: number; role?: string | null };
export type CrmTeamOption = { id: number; name: string };
export type CrmCompanyOption = { displayName?: string | null; id: number; legalName: string };
export type CrmLeadOption = { id: number; title: string };
export type CrmContactOption = { companyId: number | null; companyName: string | null; email: string | null; fullName: string; id: number };
export type CrmLegacyCustomerOption = { companyName: string | null; customerId: string | null; email: string | null; fullName: string | null; id: number };

type NullableDate = Date | string | number | null | undefined;

const leadSources = [
  "manual",
  "website_quote_request",
  "whatsapp",
  "email",
  "referral",
  "existing_customer",
  "overseas_agent",
  "direct_outreach",
] as const;

const freightTypes = ["air", "sea", "domestic", "customs", "door_to_door", "other"] as const;
const incoterms = ["EXW", "FCA", "FOB", "CFR", "CIF", "DDU", "DAP", "DDP"] as const;

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function opportunityStageChoices(current?: string | null) {
  if (!current) return crmOpportunityStageValues.filter((stage) => stage === "inquiry_received" || stage === "qualification");
  if (current === "won" || current === "lost") return crmOpportunityStageValues.filter((stage) => stage === current);
  if (current === "on_hold") return crmOpportunityStageValues.filter((stage) => ["on_hold", "qualification", "lost"].includes(stage));
  const active = crmOpportunityStageValues.slice(0, 8);
  const index = active.indexOf(current as (typeof active)[number]);
  const choices = new Set<string>([current, "on_hold", "lost"]);
  if (index > 0) choices.add(active[index - 1]!);
  if (index >= 0 && index < active.length - 1) choices.add(active[index + 1]!);
  if (["quotation_sent", "negotiation", "verbal_confirmation"].includes(current)) choices.add("won");
  return crmOpportunityStageValues.filter((stage) => choices.has(stage));
}

function dateValue(value: NullableDate) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function FormError({ message }: { message?: string }) {
  return message ? <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{message}</div> : null;
}

function OwnershipFields({
  ownerId,
  ownerTeamId,
  staff,
  teams,
}: {
  ownerId?: number | string | null;
  ownerTeamId?: number | string | null;
  staff: CrmStaffOption[];
  teams: CrmTeamOption[];
}) {
  return (
    <>
      <CrmField label="Owner" required>
        <select className={crmFieldClassName} defaultValue={ownerId ?? staff[0]?.id ?? ""} name="ownerId" required>
          <option disabled value="">Select an owner</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}{person.role ? ` / ${label(person.role)}` : ""}
            </option>
          ))}
        </select>
      </CrmField>
      <CrmField help="Leave blank when the record is individually owned." label="Team">
        <select className={crmFieldClassName} defaultValue={ownerTeamId ?? ""} name="ownerTeamId">
          <option value="">No team</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
      </CrmField>
    </>
  );
}

export type CrmCompanyFormValue = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  complianceNotes?: string | null;
  countryCode?: string | null;
  displayName?: string | null;
  email?: string | null;
  industry?: string | null;
  legalName?: string | null;
  legacyCustomerId?: number | string | null;
  nib?: string | null;
  notes?: string | null;
  ownerId?: number | null;
  ownerTeamId?: number | null;
  phone?: string | null;
  postalCode?: string | null;
  province?: string | null;
  roles?: Array<{ role: string } | string>;
  taxId?: string | null;
  website?: string | null;
};

export function CrmCompanyForm({
  action,
  canEditCompliance = false,
  company: initialCompany,
  legacyCustomers = [],
  staff,
  submitLabel,
  teams,
}: {
  action: FormAction;
  canEditCompliance?: boolean;
  company?: CrmCompanyFormValue | null;
  legacyCustomers?: CrmLegacyCustomerOption[];
  staff: CrmStaffOption[];
  submitLabel: string;
  teams: CrmTeamOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const company = { ...initialCompany, ...state.values };
  const selectedRoles = new Set(
    state.values?.roles
      ? state.values.roles.split(",").filter(Boolean)
      : (initialCompany?.roles ?? ["prospect"]).map((item) => typeof item === "string" ? item : item.role),
  );
  return (
    <form action={formAction} className="space-y-6" key={JSON.stringify(state.values ?? {})}>
      <FormError message={state.formError} />
      <CrmFormSection description="Keep one neutral organization record even when it has several commercial roles." title="Company identity">
        <CrmField label="Legal company name" required>
          <input className={crmFieldClassName} defaultValue={company?.legalName ?? ""} maxLength={240} name="legalName" required />
        </CrmField>
        <CrmField label="Trading or display name">
          <input className={crmFieldClassName} defaultValue={company?.displayName ?? ""} maxLength={240} name="displayName" />
        </CrmField>
        <CrmField label="Industry">
          <input className={crmFieldClassName} defaultValue={company?.industry ?? ""} maxLength={160} name="industry" />
        </CrmField>
        <CrmField help="Use the two-letter ISO code, for example ID or SG." label="Country code" required>
          <input className={crmFieldClassName} defaultValue={company?.countryCode ?? "ID"} maxLength={2} minLength={2} name="countryCode" required />
        </CrmField>
        <CrmField className="sm:col-span-2" help="Optional compatibility bridge to the existing Customer portal record. Linking does not copy or overwrite either record." label="Existing customer account">
          <select className={crmFieldClassName} defaultValue={company?.legacyCustomerId ?? ""} name="legacyCustomerId">
            <option value="">Not linked to a legacy customer</option>
            {legacyCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.companyName || customer.fullName || `Customer #${customer.id}`}{customer.customerId ? ` · ${customer.customerId}` : ""}{customer.email ? ` · ${customer.email}` : ""}
              </option>
            ))}
          </select>
        </CrmField>
        <CrmField className="sm:col-span-2" label="Company roles">
          <span className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {crmCompanyRoleValues.map((role) => (
              <span className="flex items-center gap-2 text-sm text-slate-300" key={role}>
                <input defaultChecked={selectedRoles.has(role)} name="roles" type="checkbox" value={role} />
                {label(role)}
              </span>
            ))}
          </span>
        </CrmField>
      </CrmFormSection>

      <CrmFormSection title="Contact and registration">
        <CrmField label="General email"><input className={crmFieldClassName} defaultValue={company?.email ?? ""} maxLength={320} name="email" type="email" /></CrmField>
        <CrmField label="General phone"><input className={crmFieldClassName} defaultValue={company?.phone ?? ""} maxLength={80} name="phone" /></CrmField>
        <CrmField label="Website"><input className={crmFieldClassName} defaultValue={company?.website ?? ""} maxLength={500} name="website" placeholder="https://" type="url" /></CrmField>
        {canEditCompliance ? <CrmField label="Tax / NPWP number"><input className={crmFieldClassName} defaultValue={company?.taxId ?? ""} maxLength={100} name="taxId" /></CrmField> : null}
        {canEditCompliance ? <CrmField label="NIB / registration number"><input className={crmFieldClassName} defaultValue={company?.nib ?? ""} maxLength={100} name="nib" /></CrmField> : null}
      </CrmFormSection>

      <CrmFormSection title="Address">
        <CrmField className="sm:col-span-2" label="Address line 1"><input className={crmFieldClassName} defaultValue={company?.addressLine1 ?? ""} maxLength={300} name="addressLine1" /></CrmField>
        <CrmField className="sm:col-span-2" label="Address line 2"><input className={crmFieldClassName} defaultValue={company?.addressLine2 ?? ""} maxLength={300} name="addressLine2" /></CrmField>
        <CrmField label="City"><input className={crmFieldClassName} defaultValue={company?.city ?? ""} maxLength={120} name="city" /></CrmField>
        <CrmField label="Province / state"><input className={crmFieldClassName} defaultValue={company?.province ?? ""} maxLength={120} name="province" /></CrmField>
        <CrmField label="Postal code"><input className={crmFieldClassName} defaultValue={company?.postalCode ?? ""} maxLength={30} name="postalCode" /></CrmField>
      </CrmFormSection>

      <CrmFormSection description="Compliance notes are internal and must never be returned by customer-facing APIs." title="Ownership and internal context">
        <OwnershipFields ownerId={company?.ownerId} ownerTeamId={company?.ownerTeamId} staff={staff} teams={teams} />
        {canEditCompliance ? <CrmField className="sm:col-span-2" label="Compliance notes"><textarea className={crmTextareaClassName} defaultValue={company?.complianceNotes ?? ""} maxLength={5000} name="complianceNotes" /></CrmField> : null}
        <CrmField className="sm:col-span-2" label="Internal notes"><textarea className={crmTextareaClassName} defaultValue={company?.notes ?? ""} maxLength={5000} name="notes" /></CrmField>
      </CrmFormSection>

      <div className="flex justify-end"><Button disabled={pending} type="submit">{pending ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}

export function CrmContactForm({
  action,
  companyId,
  companies = [],
  contact: initialContact,
  staff,
  submitLabel = "Add contact",
  teams,
}: {
  action: FormAction;
  companyId?: number | null;
  companies?: CrmCompanyOption[];
  contact?: {
    companyId?: number | string | null;
    fullName?: string | null;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    isPrimary?: boolean | string | null;
    notes?: string | null;
    ownerId?: number | string | null;
    ownerTeamId?: number | string | null;
  } | null;
  staff: CrmStaffOption[];
  submitLabel?: string;
  teams: CrmTeamOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const contact = { ...initialContact, ...state.values };
  const fixedCompany = companyId !== undefined;
  const isPrimary = state.values
    ? state.values.isPrimary === "yes" || state.values.isPrimary === "true"
    : Boolean(initialContact?.isPrimary);
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" key={JSON.stringify(state.values ?? {})}>
      <div className="sm:col-span-2"><FormError message={state.formError} /></div>
      {fixedCompany ? <input name="companyId" type="hidden" value={companyId ?? ""} /> : (
        <CrmField className="sm:col-span-2" label="Company">
          <select className={crmFieldClassName} defaultValue={contact?.companyId ?? ""} name="companyId">
            <option value="">Not linked to a company</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName || company.legalName}</option>)}
          </select>
        </CrmField>
      )}
      <CrmField className="sm:col-span-2" label="Full name" required>
        <input className={crmFieldClassName} defaultValue={contact?.fullName ?? ""} maxLength={240} name="fullName" required />
      </CrmField>
      <CrmField label="Job title"><input className={crmFieldClassName} defaultValue={contact?.jobTitle ?? ""} maxLength={160} name="jobTitle" /></CrmField>
      <CrmField label="Email"><input className={crmFieldClassName} defaultValue={contact?.email ?? ""} maxLength={320} name="email" type="email" /></CrmField>
      <CrmField label="Phone"><input className={crmFieldClassName} defaultValue={contact?.phone ?? ""} maxLength={80} name="phone" /></CrmField>
      <CrmField label="WhatsApp"><input className={crmFieldClassName} defaultValue={contact?.whatsapp ?? ""} maxLength={80} name="whatsapp" /></CrmField>
      <OwnershipFields ownerId={contact?.ownerId} ownerTeamId={contact?.ownerTeamId} staff={staff} teams={teams} />
      <CrmField className="sm:col-span-2" label="Contact notes"><textarea className={crmTextareaClassName} defaultValue={contact?.notes ?? ""} maxLength={5000} name="notes" /></CrmField>
      <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
        <input defaultChecked={isPrimary} name="isPrimary" type="checkbox" value="yes" /> Primary company contact
      </label>
      <div className="sm:col-span-2"><Button disabled={pending} type="submit">{pending ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}

export type CrmLeadFormValue = {
  actionDueAt?: NullableDate;
  cargoDescription?: string | null;
  commodity?: string | null;
  companyId?: number | null;
  contactId?: number | null;
  destination?: string | null;
  disqualificationReason?: string | null;
  freightType?: string | null;
  incoterm?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  numPackages?: number | null;
  origin?: string | null;
  ownerId?: number | null;
  ownerTeamId?: number | null;
  priority?: string | null;
  readyDate?: NullableDate;
  source?: string | null;
  status?: string | null;
  title?: string | null;
  volumeCbm?: string | number | null;
  weightKg?: string | number | null;
};

export function CrmLeadForm({
  action,
  companies,
  contacts = [],
  lead: initialLead,
  staff,
  submitLabel,
  teams,
}: {
  action: FormAction;
  companies: CrmCompanyOption[];
  contacts?: CrmContactOption[];
  lead?: CrmLeadFormValue | null;
  staff: CrmStaffOption[];
  submitLabel: string;
  teams: CrmTeamOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const lead = { ...initialLead, ...state.values };
  const converted = lead?.status === "converted";
  return (
    <form action={formAction} className="space-y-6" key={JSON.stringify(state.values ?? {})}>
      <FormError message={state.formError} />
      <CrmFormSection description="Capture enough freight context to qualify the inquiry without forcing unavailable cargo data." title="Lead and source">
        <CrmField className="sm:col-span-2" label="Lead title" required><input className={crmFieldClassName} defaultValue={lead?.title ?? ""} maxLength={240} name="title" placeholder="Company — route or service need" required /></CrmField>
        <CrmField label="Company"><select className={crmFieldClassName} defaultValue={lead?.companyId ?? ""} name="companyId"><option value="">Not linked yet</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.displayName || company.legalName}</option>)}</select></CrmField>
        <CrmField label="Contact"><select className={crmFieldClassName} defaultValue={lead?.contactId ?? ""} name="contactId"><option value="">Not linked yet</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}{contact.companyName ? ` · ${contact.companyName}` : ""}</option>)}</select></CrmField>
        <CrmField label="Lead source" required><select className={crmFieldClassName} defaultValue={lead?.source ?? "manual"} name="source" required>{leadSources.map((source) => <option key={source} value={source}>{label(source)}</option>)}</select></CrmField>
        <CrmField help={converted ? "Converted is terminal in this release." : undefined} label="Status" required>{converted ? <><input name="status" type="hidden" value="converted" /><input className={crmFieldClassName} disabled value="Converted" /></> : <select className={crmFieldClassName} defaultValue={lead?.status ?? "new"} name="status" required>{crmLeadStatusValues.filter((status) => status !== "converted").map((status) => <option key={status} value={status}>{label(status)}</option>)}</select>}</CrmField>
        <CrmField label="Priority" required><select className={crmFieldClassName} defaultValue={lead?.priority ?? "normal"} name="priority" required>{crmLeadPriorityValues.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}</select></CrmField>
        <OwnershipFields ownerId={lead?.ownerId} ownerTeamId={lead?.ownerTeamId} staff={staff} teams={teams} />
      </CrmFormSection>

      <CrmFormSection title="Freight requirement">
        <CrmField label="Service"><select className={crmFieldClassName} defaultValue={lead?.freightType ?? ""} name="freightType"><option value="">Select later</option>{freightTypes.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></CrmField>
        <CrmField label="Target shipment date"><input className={crmFieldClassName} defaultValue={dateValue(lead?.readyDate)} name="readyDate" type="date" /></CrmField>
        <CrmField label="Origin"><input className={crmFieldClassName} defaultValue={lead?.origin ?? ""} maxLength={200} name="origin" /></CrmField>
        <CrmField label="Destination"><input className={crmFieldClassName} defaultValue={lead?.destination ?? ""} maxLength={200} name="destination" /></CrmField>
        <CrmField label="Commodity"><input className={crmFieldClassName} defaultValue={lead?.commodity ?? ""} maxLength={240} name="commodity" /></CrmField>
        <CrmField label="Incoterm"><select className={crmFieldClassName} defaultValue={lead?.incoterm ?? ""} name="incoterm"><option value="">Not confirmed</option>{incoterms.map((value) => <option key={value} value={value}>{value}</option>)}</select></CrmField>
        <CrmField label="Packages"><input className={crmFieldClassName} defaultValue={lead?.numPackages ?? ""} min="0" name="numPackages" step="1" type="number" /></CrmField>
        <CrmField label="Gross / chargeable weight (kg)"><input className={crmFieldClassName} defaultValue={lead?.weightKg ?? ""} min="0" name="weightKg" step="0.001" type="number" /></CrmField>
        <CrmField label="Volume (CBM)"><input className={crmFieldClassName} defaultValue={lead?.volumeCbm ?? ""} min="0" name="volumeCbm" step="0.001" type="number" /></CrmField>
        <CrmField className="sm:col-span-2" label="Cargo description"><textarea className={crmTextareaClassName} defaultValue={lead?.cargoDescription ?? ""} maxLength={5000} name="cargoDescription" /></CrmField>
      </CrmFormSection>

      <CrmFormSection description="An open lead should always have one clear next action and due time." title="Follow-up">
        <CrmField label="Next action"><input className={crmFieldClassName} defaultValue={lead?.nextAction ?? ""} maxLength={240} name="nextAction" /></CrmField>
        <CrmField label="Due (WIB)"><input className={crmFieldClassName} defaultValue={toWibDateTimeLocalValue(lead?.actionDueAt)} name="actionDueAt" type="datetime-local" /></CrmField>
        <CrmField className="sm:col-span-2" label="Internal notes"><textarea className={crmTextareaClassName} defaultValue={lead?.notes ?? ""} maxLength={5000} name="notes" /></CrmField>
        <CrmField className="sm:col-span-2" help="Required when status is Disqualified; ignored for other statuses." label="Disqualification reason"><input className={crmFieldClassName} defaultValue={lead?.disqualificationReason ?? ""} maxLength={1000} name="disqualificationReason" /></CrmField>
      </CrmFormSection>

      <div className="flex justify-end"><Button disabled={pending} type="submit">{pending ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}

export type CrmOpportunityFormValue = {
  actionDueAt?: NullableDate;
  cargoDescription?: string | null;
  commodity?: string | null;
  companyId?: number | null;
  currency?: string | null;
  destination?: string | null;
  estimatedValue?: string | number | null;
  expectedCloseDate?: NullableDate;
  externalQuotationReference?: string | null;
  externalQuotationStatus?: string | null;
  externalQuotationUrl?: string | null;
  freightType?: string | null;
  incoterm?: string | null;
  leadId?: number | null;
  lostReason?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  origin?: string | null;
  ownerId?: number | null;
  ownerTeamId?: number | null;
  primaryContactId?: number | null;
  probability?: number | null;
  stage?: string | null;
  status?: string | null;
  title?: string | null;
  volumeCbm?: string | number | null;
  weightKg?: string | number | null;
};

export function CrmOpportunityForm({
  action,
  companies,
  contacts = [],
  leads,
  opportunity: initialOpportunity,
  sourceLeadLocked = false,
  staff,
  submitLabel,
  teams,
}: {
  action: FormAction;
  companies: CrmCompanyOption[];
  contacts?: CrmContactOption[];
  leads: CrmLeadOption[];
  opportunity?: CrmOpportunityFormValue | null;
  sourceLeadLocked?: boolean;
  staff: CrmStaffOption[];
  submitLabel: string;
  teams: CrmTeamOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const opportunity = { ...initialOpportunity, ...state.values };
  const selectedLead = leads.find((lead) => String(lead.id) === String(opportunity?.leadId));
  return (
    <form action={formAction} className="space-y-6" key={JSON.stringify(state.values ?? {})}>
      <FormError message={state.formError} />
      <CrmFormSection title="Opportunity">
        <CrmField className="sm:col-span-2" label="Opportunity title" required><input className={crmFieldClassName} defaultValue={opportunity?.title ?? ""} maxLength={240} name="title" required /></CrmField>
        <CrmField label="Company"><select className={crmFieldClassName} defaultValue={opportunity?.companyId ?? ""} name="companyId"><option value="">Not linked</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.displayName || company.legalName}</option>)}</select></CrmField>
        <CrmField label="Primary contact"><select className={crmFieldClassName} defaultValue={opportunity?.primaryContactId ?? ""} name="primaryContactId"><option value="">Not linked</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}{contact.companyName ? ` · ${contact.companyName}` : ""}</option>)}</select></CrmField>
        <CrmField help={sourceLeadLocked ? "The source Lead is immutable after creation." : "Direct opportunities require an explanation in Internal notes."} label="Source lead">{sourceLeadLocked ? <><input name="leadId" type="hidden" value={String(opportunity?.leadId ?? "")} /><input className={crmFieldClassName} disabled value={selectedLead?.title || `Lead #${opportunity?.leadId}`} /></> : <select className={crmFieldClassName} defaultValue={opportunity?.leadId ?? ""} name="leadId"><option value="">Direct opportunity</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.title}</option>)}</select>}</CrmField>
        <CrmField label="Pipeline stage" required><select className={crmFieldClassName} defaultValue={opportunity?.stage ?? "qualification"} name="stage" required>{opportunityStageChoices(initialOpportunity?.stage).map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</select></CrmField>
        <CrmField label="Probability (%)"><input className={crmFieldClassName} defaultValue={opportunity?.probability ?? 20} max="100" min="0" name="probability" required type="number" /></CrmField>
        <CrmField label="Expected close date"><input className={crmFieldClassName} defaultValue={dateValue(opportunity?.expectedCloseDate)} name="expectedCloseDate" type="date" /></CrmField>
        <CrmField label="Estimated selling value"><input className={crmFieldClassName} defaultValue={opportunity?.estimatedValue ?? ""} min="0" name="estimatedValue" step="0.01" type="number" /></CrmField>
        <CrmField label="Currency"><input className={crmFieldClassName} defaultValue={opportunity?.currency ?? "IDR"} maxLength={3} minLength={3} name="currency" required /></CrmField>
        <OwnershipFields ownerId={opportunity?.ownerId} ownerTeamId={opportunity?.ownerTeamId} staff={staff} teams={teams} />
      </CrmFormSection>

      <CrmFormSection title="Freight requirement">
        <CrmField label="Service"><select className={crmFieldClassName} defaultValue={opportunity?.freightType ?? ""} name="freightType"><option value="">Select later</option>{freightTypes.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></CrmField>
        <CrmField label="Origin"><input className={crmFieldClassName} defaultValue={opportunity?.origin ?? ""} maxLength={200} name="origin" /></CrmField>
        <CrmField label="Destination"><input className={crmFieldClassName} defaultValue={opportunity?.destination ?? ""} maxLength={200} name="destination" /></CrmField>
        <CrmField label="Commodity"><input className={crmFieldClassName} defaultValue={opportunity?.commodity ?? ""} maxLength={240} name="commodity" /></CrmField>
        <CrmField label="Incoterm"><select className={crmFieldClassName} defaultValue={opportunity?.incoterm ?? ""} name="incoterm"><option value="">Not confirmed</option>{incoterms.map((value) => <option key={value} value={value}>{value}</option>)}</select></CrmField>
        <CrmField label="Weight (kg)"><input className={crmFieldClassName} defaultValue={opportunity?.weightKg ?? ""} min="0" name="weightKg" step="0.001" type="number" /></CrmField>
        <CrmField label="Volume (CBM)"><input className={crmFieldClassName} defaultValue={opportunity?.volumeCbm ?? ""} min="0" name="volumeCbm" step="0.001" type="number" /></CrmField>
        <CrmField className="sm:col-span-2" label="Cargo description"><textarea className={crmTextareaClassName} defaultValue={opportunity?.cargoDescription ?? ""} maxLength={5000} name="cargoDescription" /></CrmField>
      </CrmFormSection>

      <CrmFormSection description="This is a reference bridge only; it does not store confidential supplier costing." title="External quotation">
        <CrmField label="Quotation reference"><input className={crmFieldClassName} defaultValue={opportunity?.externalQuotationReference ?? ""} maxLength={160} name="externalQuotationReference" /></CrmField>
        <CrmField label="Quotation status"><select className={crmFieldClassName} defaultValue={opportunity?.externalQuotationStatus ?? "not_started"} name="externalQuotationStatus">{crmExternalQuotationStatusValues.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></CrmField>
        <CrmField className="sm:col-span-2" label="Quotation link"><input className={crmFieldClassName} defaultValue={opportunity?.externalQuotationUrl ?? ""} maxLength={1000} name="externalQuotationUrl" placeholder="https://" type="url" /></CrmField>
      </CrmFormSection>

      <CrmFormSection title="Follow-up and outcome">
        <CrmField label="Next action"><input className={crmFieldClassName} defaultValue={opportunity?.nextAction ?? ""} maxLength={240} name="nextAction" /></CrmField>
        <CrmField label="Due (WIB)"><input className={crmFieldClassName} defaultValue={toWibDateTimeLocalValue(opportunity?.actionDueAt)} name="actionDueAt" type="datetime-local" /></CrmField>
        <CrmField className="sm:col-span-2" help="Required when the opportunity is lost." label="Lost reason"><input className={crmFieldClassName} defaultValue={opportunity?.lostReason ?? ""} maxLength={500} name="lostReason" /></CrmField>
        <CrmField className="sm:col-span-2" label="Internal notes"><textarea className={crmTextareaClassName} defaultValue={opportunity?.notes ?? ""} maxLength={5000} name="notes" /></CrmField>
      </CrmFormSection>

      <div className="flex justify-end"><Button disabled={pending} type="submit">{pending ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}

export function CrmActivityForm({
  action,
  entityId,
  entityType,
  staff,
  teams = [],
}: {
  action: FormAction;
  entityId: number | string;
  entityType: string;
  staff: CrmStaffOption[];
  teams?: CrmTeamOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const activity = state.values ?? {};
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" key={JSON.stringify(state.values ?? {})}>
      <div className="sm:col-span-2"><FormError message={state.formError} /></div>
      <CrmField label="Activity type" required><select className={crmFieldClassName} defaultValue={activity.activityType ?? "note"} name="activityType" required>{crmActivityTypeValues.filter((value) => value !== "status_change").map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></CrmField>
      <CrmField className="sm:col-span-2" label="Subject" required><input className={crmFieldClassName} defaultValue={activity.subject ?? ""} maxLength={240} name="subject" required /></CrmField>
      <CrmField className="sm:col-span-2" label="Details"><textarea className={crmTextareaClassName} defaultValue={activity.details ?? ""} maxLength={5000} name="details" /></CrmField>
      <CrmField label="Occurred at (WIB)"><input className={crmFieldClassName} defaultValue={activity.occurredAt ?? ""} name="occurredAt" type="datetime-local" /></CrmField>
      <OwnershipFields ownerId={activity.ownerId} ownerTeamId={activity.ownerTeamId} staff={staff} teams={teams} />
      <input name="entityType" type="hidden" value={entityType} /><input name="entityId" type="hidden" value={String(entityId)} />
      <div className="sm:col-span-2"><Button disabled={pending} type="submit">{pending ? "Recording…" : "Log activity"}</Button></div>
    </form>
  );
}

export function CrmTaskForm({
  action,
  entityId,
  entityType,
  staff,
  submitLabel = "Create task",
  task: initialTask,
  teams = [],
}: {
  action: FormAction;
  entityId: number | string;
  entityType: string;
  staff: CrmStaffOption[];
  submitLabel?: string;
  task?: {
    details?: string | null;
    dueAt?: NullableDate;
    ownerId?: number | string | null;
    ownerTeamId?: number | string | null;
    priority?: string | null;
    status?: string | null;
    subject?: string | null;
  } | null;
  teams?: CrmTeamOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const task = { ...initialTask, ...state.values };
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" key={JSON.stringify(state.values ?? {})}>
      <div className="sm:col-span-2"><FormError message={state.formError} /></div>
      <CrmField className="sm:col-span-2" label="Task" required><input className={crmFieldClassName} defaultValue={task?.subject ?? ""} maxLength={240} name="subject" required /></CrmField>
      <CrmField label="Status" required><select className={crmFieldClassName} defaultValue={task?.status ?? "open"} name="status" required>{crmTaskStatusValues.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></CrmField>
      <CrmField label="Priority" required><select className={crmFieldClassName} defaultValue={task?.priority ?? "normal"} name="priority" required>{crmTaskPriorityValues.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></CrmField>
      <CrmField label="Due (WIB)"><input className={crmFieldClassName} defaultValue={toWibDateTimeLocalValue(task?.dueAt)} name="dueAt" type="datetime-local" /></CrmField>
      <OwnershipFields ownerId={task?.ownerId} ownerTeamId={task?.ownerTeamId} staff={staff} teams={teams} />
      <CrmField className="sm:col-span-2" label="Details"><textarea className={crmTextareaClassName} defaultValue={task?.details ?? ""} maxLength={5000} name="details" /></CrmField>
      <input name="entityType" type="hidden" value={entityType} /><input name="entityId" type="hidden" value={String(entityId)} />
      <div className="sm:col-span-2"><Button disabled={pending} type="submit">{pending ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}
