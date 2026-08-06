-- Ambara CRM commercial foundation.
-- Additive only: this migration does not backfill legacy customers or quote requests.

ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check
  CHECK (role IN (
    'superadmin', 'admin', 'director', 'sales_manager', 'sales',
    'customer_service', 'operations', 'finance', 'viewer'
  ));

CREATE TABLE IF NOT EXISTS crm_teams (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  manager_id integer REFERENCES staff_accounts(id) ON DELETE SET NULL,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_teams_active_name_unique_idx
  ON crm_teams (lower(btrim(name))) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_teams_manager_idx ON crm_teams (manager_id);
CREATE INDEX IF NOT EXISTS crm_teams_archived_idx ON crm_teams (archived_at);

CREATE TABLE IF NOT EXISTS crm_team_members (
  id serial PRIMARY KEY,
  team_id integer NOT NULL REFERENCES crm_teams(id) ON DELETE CASCADE,
  staff_account_id integer NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
  membership_role text NOT NULL DEFAULT 'member'
    CHECK (membership_role IN ('member', 'manager')),
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_team_members_active_unique_idx
  ON crm_team_members (team_id, staff_account_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_team_members_staff_idx
  ON crm_team_members (staff_account_id, archived_at);

CREATE TABLE IF NOT EXISTS crm_companies (
  id serial PRIMARY KEY,
  legacy_customer_id integer REFERENCES customers(id) ON DELETE SET NULL,
  legal_name text NOT NULL,
  display_name text,
  normalized_name text NOT NULL,
  email text,
  phone text,
  website text,
  tax_id text,
  nib text,
  industry text,
  address_line_1 text,
  address_line_2 text,
  city text,
  province text,
  postal_code text,
  country_code char(2) NOT NULL DEFAULT 'ID',
  compliance_notes text,
  notes text,
  owner_id integer NOT NULL REFERENCES staff_accounts(id),
  owner_team_id integer REFERENCES crm_teams(id) ON DELETE SET NULL,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_legacy_customer_unique_idx
  ON crm_companies (legacy_customer_id) WHERE legacy_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_companies_normalized_name_idx
  ON crm_companies (normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_active_name_country_unique_idx
  ON crm_companies (normalized_name, country_code) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_active_tax_id_unique_idx
  ON crm_companies (country_code, lower(btrim(tax_id)))
  WHERE archived_at IS NULL AND tax_id IS NOT NULL AND btrim(tax_id) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_active_nib_unique_idx
  ON crm_companies (country_code, lower(btrim(nib)))
  WHERE archived_at IS NULL AND nib IS NOT NULL AND btrim(nib) <> '';
CREATE INDEX IF NOT EXISTS crm_companies_owner_idx
  ON crm_companies (owner_id, archived_at);
CREATE INDEX IF NOT EXISTS crm_companies_team_idx
  ON crm_companies (owner_team_id, archived_at);
CREATE INDEX IF NOT EXISTS crm_companies_email_idx
  ON crm_companies (lower(btrim(email))) WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE TABLE IF NOT EXISTS crm_company_roles (
  id serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'prospect', 'customer', 'vendor', 'overseas_agent', 'airline',
    'shipping_line', 'trucker', 'customs_broker', 'other'
  )),
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_company_roles_active_unique_idx
  ON crm_company_roles (company_id, role) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_company_roles_role_idx
  ON crm_company_roles (role, archived_at);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id serial PRIMARY KEY,
  company_id integer REFERENCES crm_companies(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  job_title text,
  email text,
  phone text,
  whatsapp text,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  owner_id integer NOT NULL REFERENCES staff_accounts(id),
  owner_team_id integer REFERENCES crm_teams(id) ON DELETE SET NULL,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_contacts_company_idx
  ON crm_contacts (company_id, archived_at);
CREATE INDEX IF NOT EXISTS crm_contacts_owner_idx
  ON crm_contacts (owner_id, archived_at);
CREATE INDEX IF NOT EXISTS crm_contacts_team_idx
  ON crm_contacts (owner_team_id, archived_at);
CREATE INDEX IF NOT EXISTS crm_contacts_email_idx
  ON crm_contacts (lower(btrim(email))) WHERE email IS NOT NULL AND btrim(email) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_active_company_email_unique_idx
  ON crm_contacts (company_id, lower(btrim(email)))
  WHERE archived_at IS NULL AND company_id IS NOT NULL AND email IS NOT NULL AND btrim(email) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_active_company_phone_unique_idx
  ON crm_contacts (company_id, btrim(phone))
  WHERE archived_at IS NULL AND company_id IS NOT NULL AND phone IS NOT NULL AND btrim(phone) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_active_company_whatsapp_unique_idx
  ON crm_contacts (company_id, btrim(whatsapp))
  WHERE archived_at IS NULL AND company_id IS NOT NULL AND whatsapp IS NOT NULL AND btrim(whatsapp) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_active_primary_company_unique_idx
  ON crm_contacts (company_id)
  WHERE archived_at IS NULL AND company_id IS NOT NULL AND is_primary = true;

CREATE TABLE IF NOT EXISTS crm_leads (
  id serial PRIMARY KEY,
  source_quote_request_id integer REFERENCES quote_requests(id) ON DELETE SET NULL,
  company_id integer REFERENCES crm_companies(id) ON DELETE SET NULL,
  contact_id integer REFERENCES crm_contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'awaiting_information', 'qualified', 'disqualified', 'converted', 'dormant')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  freight_type text,
  origin text,
  destination text,
  ready_date date,
  cargo_description text,
  commodity text,
  incoterm text,
  num_packages integer,
  weight_kg numeric(14,3),
  volume_cbm numeric(14,3),
  notes text,
  owner_id integer NOT NULL REFERENCES staff_accounts(id),
  owner_team_id integer REFERENCES crm_teams(id) ON DELETE SET NULL,
  next_action text,
  action_due_at timestamptz,
  qualified_at timestamptz,
  disqualified_at timestamptz,
  disqualification_reason text,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_source_quote_request_unique_idx
  ON crm_leads (source_quote_request_id) WHERE source_quote_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_leads_queue_idx
  ON crm_leads (status, priority, action_due_at);
CREATE INDEX IF NOT EXISTS crm_leads_owner_idx
  ON crm_leads (owner_id, status, archived_at);
CREATE INDEX IF NOT EXISTS crm_leads_team_idx
  ON crm_leads (owner_team_id, status, archived_at);
CREATE INDEX IF NOT EXISTS crm_leads_company_idx
  ON crm_leads (company_id, archived_at);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id serial PRIMARY KEY,
  lead_id integer REFERENCES crm_leads(id) ON DELETE SET NULL,
  company_id integer REFERENCES crm_companies(id) ON DELETE SET NULL,
  primary_contact_id integer REFERENCES crm_contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'won', 'lost', 'on_hold')),
  stage text NOT NULL DEFAULT 'qualification'
    CHECK (stage IN (
      'inquiry_received', 'qualification', 'rate_sourcing', 'costing',
      'quotation_draft', 'quotation_sent', 'negotiation', 'verbal_confirmation',
      'won', 'lost', 'on_hold'
    )),
  probability integer NOT NULL DEFAULT 20 CHECK (probability BETWEEN 0 AND 100),
  estimated_value numeric(18,2),
  currency char(3) NOT NULL DEFAULT 'IDR',
  expected_close_date date,
  freight_type text,
  origin text,
  destination text,
  cargo_description text,
  commodity text,
  incoterm text,
  weight_kg numeric(14,3),
  volume_cbm numeric(14,3),
  external_quotation_reference text,
  external_quotation_url text,
  external_quotation_status text NOT NULL DEFAULT 'not_started'
    CHECK (external_quotation_status IN ('not_started', 'draft', 'sent', 'accepted', 'rejected', 'expired')),
  notes text,
  owner_id integer NOT NULL REFERENCES staff_accounts(id),
  owner_team_id integer REFERENCES crm_teams(id) ON DELETE SET NULL,
  next_action text,
  action_due_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_opportunities_pipeline_idx
  ON crm_opportunities (status, stage, expected_close_date);
CREATE INDEX IF NOT EXISTS crm_opportunities_owner_idx
  ON crm_opportunities (owner_id, status, archived_at);
CREATE INDEX IF NOT EXISTS crm_opportunities_team_idx
  ON crm_opportunities (owner_team_id, status, archived_at);
CREATE INDEX IF NOT EXISTS crm_opportunities_company_idx
  ON crm_opportunities (company_id, archived_at);
CREATE INDEX IF NOT EXISTS crm_opportunities_lead_idx
  ON crm_opportunities (lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_opportunities_lead_unique_idx
  ON crm_opportunities (lead_id) WHERE lead_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_activities (
  id serial PRIMARY KEY,
  activity_type text NOT NULL
    CHECK (activity_type IN ('note', 'call', 'email', 'meeting', 'whatsapp', 'status_change')),
  subject text NOT NULL,
  details text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  owner_id integer NOT NULL REFERENCES staff_accounts(id),
  owner_team_id integer REFERENCES crm_teams(id) ON DELETE SET NULL,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_activities_timeline_idx
  ON crm_activities (occurred_at, archived_at);
CREATE INDEX IF NOT EXISTS crm_activities_owner_idx
  ON crm_activities (owner_id, occurred_at);
CREATE INDEX IF NOT EXISTS crm_activities_team_idx
  ON crm_activities (owner_team_id, occurred_at);

CREATE TABLE IF NOT EXISTS crm_activity_links (
  id serial PRIMARY KEY,
  activity_id integer NOT NULL REFERENCES crm_activities(id) ON DELETE CASCADE,
  entity_type text NOT NULL
    CHECK (entity_type IN ('company', 'contact', 'lead', 'opportunity', 'quote_request', 'shipment')),
  entity_id text NOT NULL,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_activity_links_active_unique_idx
  ON crm_activity_links (activity_id, entity_type, entity_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_activity_links_entity_idx
  ON crm_activity_links (entity_type, entity_id, archived_at);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id serial PRIMARY KEY,
  subject text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  completed_by integer REFERENCES staff_accounts(id),
  owner_id integer NOT NULL REFERENCES staff_accounts(id),
  owner_team_id integer REFERENCES crm_teams(id) ON DELETE SET NULL,
  entity_type text CHECK (
    entity_type IS NULL OR entity_type IN ('company', 'contact', 'lead', 'opportunity', 'quote_request', 'shipment')
  ),
  entity_id text,
  created_by integer NOT NULL REFERENCES staff_accounts(id),
  updated_by integer NOT NULL REFERENCES staff_accounts(id),
  archived_at timestamptz,
  archived_by integer REFERENCES staff_accounts(id),
  archive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_tasks_entity_pair_check CHECK (
    (entity_type IS NULL AND entity_id IS NULL) OR
    (entity_type IS NOT NULL AND entity_id IS NOT NULL AND btrim(entity_id) <> '')
  )
);

CREATE INDEX IF NOT EXISTS crm_tasks_queue_idx
  ON crm_tasks (status, due_at, priority);
CREATE INDEX IF NOT EXISTS crm_tasks_owner_idx
  ON crm_tasks (owner_id, status, due_at);
CREATE INDEX IF NOT EXISTS crm_tasks_team_idx
  ON crm_tasks (owner_team_id, status, due_at);
CREATE INDEX IF NOT EXISTS crm_tasks_entity_idx
  ON crm_tasks (entity_type, entity_id);
