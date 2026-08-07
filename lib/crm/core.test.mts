import assert from "node:assert/strict";
import test from "node:test";

import {
  assertOpportunityStagePrerequisites,
  assertOpportunityInitialStage,
  assertOpportunityStageTransition,
  canAccessCrmOwnedRecord,
  crmLeadStatusValues,
  crmOpportunityStageValues,
  deriveOpportunityLifecycle,
  getCrmReadScope,
  getCrmWriteScope,
  normalizeCrmCompanyName,
  validateCrmCompanyInput,
  validateCrmContactInput,
  validateCrmLeadInput,
  validateCrmOpportunityInput,
} from "./core.ts";
import { crmFormValues } from "./form.ts";

test("canonical lead and opportunity lifecycle enums stay aligned", () => {
  assert.deepEqual(crmLeadStatusValues, [
    "new", "contacted", "awaiting_information", "qualified", "disqualified", "converted", "dormant",
  ]);
  assert.deepEqual(crmOpportunityStageValues, [
    "inquiry_received", "qualification", "rate_sourcing", "costing", "quotation_draft",
    "quotation_sent", "negotiation", "verbal_confirmation", "won", "lost", "on_hold",
  ]);
});

test("company input normalizes identity and retains repeated roles", () => {
  const formData = new FormData();
  formData.set("legalName", " PT. Example Logistics ");
  formData.set("countryCode", "id");
  formData.set("email", " SALES@EXAMPLE.TEST ");
  formData.append("roles", "prospect");
  formData.append("roles", "vendor");
  formData.append("roles", "prospect");
  const company = validateCrmCompanyInput({
    ...crmFormValues(formData),
  });
  assert.equal(normalizeCrmCompanyName(company.legalName), "pt example logistics");
  assert.equal(company.countryCode, "ID");
  assert.equal(company.email, "sales@example.test");
  assert.deepEqual(company.roles, ["prospect", "vendor"]);
});

test("lead validation parses datetime-local values explicitly as WIB", () => {
  const lead = validateCrmLeadInput({
    title: "Jakarta to Singapore",
    status: "contacted",
    priority: "high",
    nextAction: "Confirm dimensions",
    actionDueAt: "2026-08-07T09:30",
  });
  assert.equal(lead.actionDueAt?.toISOString(), "2026-08-07T02:30:00.000Z");
  assert.throws(() => validateCrmLeadInput({ title: "Lead", status: "disqualified" }), /disqualification reason/i);
});

test("opportunity stage prerequisites protect sent and won stages", () => {
  assert.doesNotThrow(() => assertOpportunityStagePrerequisites("quotation_sent", "Q-100", "sent"));
  assert.doesNotThrow(() => assertOpportunityStagePrerequisites("won", "Q-100", "accepted"));
  assert.throws(() => assertOpportunityStagePrerequisites("quotation_sent", null, "not_started"), /quotation reference/i);
  assert.throws(() => assertOpportunityStagePrerequisites("won", "Q-100", "sent"), /accepted quotation/i);
  assert.throws(() => validateCrmOpportunityInput({ title: "Opportunity", stage: "negotiation" }), /quotation reference/i);
});

test("opportunity creation and transitions cannot skip controlled pipeline gates", () => {
  assert.doesNotThrow(() => assertOpportunityInitialStage("inquiry_received"));
  assert.doesNotThrow(() => assertOpportunityInitialStage("qualification"));
  assert.throws(() => assertOpportunityInitialStage("quotation_draft"), /must start/i);
  assert.doesNotThrow(() => assertOpportunityStageTransition("qualification", "rate_sourcing"));
  assert.doesNotThrow(() => assertOpportunityStageTransition("quotation_sent", "won"));
  assert.throws(() => assertOpportunityStageTransition("qualification", "quotation_draft"), /one pipeline stage/i);
  assert.throws(() => assertOpportunityStageTransition("won", "negotiation"), /terminal/i);
});

test("direct opportunities and primary contacts require explicit relationship context", () => {
  assert.throws(
    () => validateCrmOpportunityInput({ title: "Direct", stage: "qualification" }),
    /direct opportunity requires an explanation/i,
  );
  assert.doesNotThrow(() => validateCrmOpportunityInput({ title: "Direct", stage: "qualification", notes: "Director referral" }));
  assert.throws(
    () => validateCrmContactInput({ fullName: "Contact", email: "contact@example.test", isPrimary: "yes" }),
    /primary contact must be linked/i,
  );
});

test("terminal opportunity stages derive consistent status and timestamps", () => {
  const now = new Date("2026-08-07T02:00:00Z");
  assert.deepEqual(deriveOpportunityLifecycle("won", null, now), {
    status: "won", wonAt: now, lostAt: null, lostReason: null,
  });
  assert.deepEqual(deriveOpportunityLifecycle("on_hold", null, now), {
    status: "on_hold", wonAt: null, lostAt: null, lostReason: null,
  });
  assert.throws(() => deriveOpportunityLifecycle("lost", null, now), /lost reason/i);
});

test("CRM read and write scopes enforce own, team, all, and default deny", () => {
  assert.equal(getCrmReadScope({ role: "sales" }), "own");
  assert.equal(getCrmWriteScope({ role: "sales" }), "own");
  assert.equal(getCrmReadScope({ role: "sales_manager" }), "team");
  assert.equal(getCrmWriteScope({ role: "sales_manager" }), "team");
  assert.equal(getCrmReadScope({ role: "director" }), "all");
  assert.equal(getCrmWriteScope({ role: "finance" }), "none");
  assert.equal(getCrmReadScope({ role: "operations" }), "none");
  const sales = { id: 10, role: "sales" };
  const manager = { id: 20, role: "sales_manager" };
  assert.equal(canAccessCrmOwnedRecord(sales, { ownerId: 10, ownerTeamId: null }, [], "write"), true);
  assert.equal(canAccessCrmOwnedRecord(sales, { ownerId: 11, ownerTeamId: 5 }, [5], "read"), false);
  assert.equal(canAccessCrmOwnedRecord(manager, { ownerId: 11, ownerTeamId: 5 }, [5], "write"), true);
  assert.equal(canAccessCrmOwnedRecord(manager, { ownerId: 11, ownerTeamId: 6 }, [5], "read"), false);
});
