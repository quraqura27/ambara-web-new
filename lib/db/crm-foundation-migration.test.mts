import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  migration020Columns,
  migration020Constraints,
  migration020Indexes,
  migration020Tables,
} = require("../../scripts/migrate.cjs");

const migration = readFileSync(
  new URL("../../migrations/020-crm-commercial-foundation.sql", import.meta.url),
  "utf8",
);
const runner = readFileSync(new URL("../../scripts/migrate.cjs", import.meta.url), "utf8");
const schema = readFileSync(new URL("./schema.ts", import.meta.url), "utf8");
const nextConfig = readFileSync(new URL("../../next.config.js", import.meta.url), "utf8");
const actions = [
  readFileSync(new URL("../../actions/crm-companies.ts", import.meta.url), "utf8"),
  readFileSync(new URL("../../actions/crm-leads.ts", import.meta.url), "utf8"),
  readFileSync(new URL("../../actions/crm-opportunities.ts", import.meta.url), "utf8"),
  readFileSync(new URL("../../actions/crm-activities.ts", import.meta.url), "utf8"),
].join("\n");

test("migration 020 is additive and creates the complete foundation model", () => {
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE/i);
  for (const table of [
    "crm_teams", "crm_team_members", "crm_companies", "crm_company_roles", "crm_contacts",
    "crm_leads", "crm_opportunities", "crm_activities", "crm_activity_links", "crm_tasks",
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
    assert.match(schema, new RegExp(`pgTable\\('${table}'`));
  }
  assert.match(migration, /legacy_customer_id integer REFERENCES customers\(id\) ON DELETE SET NULL/);
  assert.match(migration, /source_quote_request_id integer REFERENCES quote_requests\(id\) ON DELETE SET NULL/);
  assert.match(migration, /crm_leads_source_quote_request_unique_idx/);
  assert.match(migration, /crm_contacts_active_primary_company_unique_idx/);
  assert.match(migration, /crm_contacts_active_company_phone_unique_idx/);
  assert.match(migration, /crm_opportunities_lead_unique_idx/);
  assert.match(migration, /crm_tasks_entity_pair_check/);
  assert.match(schema, /crm_tasks_entity_pair_check/);
});

test("migration 020 expands fixed roles without allocating migration 018", () => {
  assert.match(migration, /'director', 'sales_manager', 'sales'/);
  assert.match(migration, /'customer_service', 'operations', 'finance', 'viewer'/);
  assert.doesNotMatch(migration, /migration 018|018-/i);
});

test("migration runner verifies the complete CRM object manifest", () => {
  assert.match(runner, /migration020Columns/);
  assert.match(runner, /migration020Tables/);
  assert.match(runner, /migration020Indexes/);
  assert.match(runner, /migration020Constraints/);
  assert.match(runner, /migration020RoleConstraintMissing/);
  assert.match(runner, /name\.startsWith\("020-"\)/);
  assert.match(runner, /"020-"/);
  assert.equal(migration020Tables.length, 10);
  assert.equal(migration020Columns.length, 190);
  assert.equal(migration020Indexes.length, 43);
  assert.equal(migration020Constraints.length, 79);
  assert.equal(
    new Set(migration020Columns.map(([table, column]: [string, string]) => `${table}.${column}`)).size,
    migration020Columns.length,
  );
  assert.equal(new Set(migration020Indexes).size, migration020Indexes.length);
  assert.equal(
    new Set(
      migration020Constraints.map(
        ([table, constraint]: [string, string]) => `${table}.${constraint}`,
      ),
    ).size,
    migration020Constraints.length,
  );
});

test("Drizzle check names match migration 020 constraint names", () => {
  assert.match(schema, /crm_team_members_membership_role_check/);
  assert.match(schema, /crm_opportunities_external_quotation_status_check/);
  assert.match(schema, /crm_activities_activity_type_check/);
  assert.doesNotMatch(schema, /crm_team_members_role_check/);
  assert.doesNotMatch(schema, /crm_opportunities_external_quote_status_check/);
  assert.doesNotMatch(schema, /crm_activities_type_check/);
});

test("CRM mutations delegate to the authorized server-only data layer", () => {
  assert.match(actions, /"use server"/);
  assert.match(actions, /createCrmCompany\(/);
  assert.match(actions, /convertQuoteRequestToCrmLead\(/);
  assert.match(actions, /changeCrmOpportunityStage\(/);
  assert.match(actions, /updateCrmTaskStatus\(/);
});

test("CRM routes inherit the protected portal response policy", () => {
  assert.match(nextConfig, /"\/crm\/:path\*"/);
  assert.match(nextConfig, /Content-Security-Policy/);
});
