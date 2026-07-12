ALTER TABLE staff_accounts
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;

ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check
  CHECK (role IN ('superadmin', 'admin', 'operations', 'finance', 'viewer'));

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by integer;

CREATE INDEX IF NOT EXISTS customers_archived_at_idx
  ON customers (archived_at);

CREATE TABLE IF NOT EXISTS portal_login_attempts (
  throttle_key text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_login_attempts_blocked_idx
  ON portal_login_attempts (blocked_until);

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS operational_stage text NOT NULL DEFAULT 'intake',
  ADD COLUMN IF NOT EXISTS hs_code text,
  ADD COLUMN IF NOT EXISTS incoterm text,
  ADD COLUMN IF NOT EXISTS clearance_mode text,
  ADD COLUMN IF NOT EXISTS cargo_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS document_readiness text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS assigned_to integer,
  ADD COLUMN IF NOT EXISTS blocker text,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS action_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS volumetric_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS customs_review_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS regulated_cargo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS readiness_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS readiness_updated_by integer;

ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_operational_stage_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_operational_stage_check
  CHECK (operational_stage IN (
    'intake', 'booking', 'pickup', 'origin_handling', 'flight_ready', 'in_transit',
    'customs_review', 'destination_handling', 'last_mile', 'completed', 'on_hold'
  ));
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_document_readiness_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_document_readiness_check
  CHECK (document_readiness IN ('not_ready', 'collecting', 'review', 'ready', 'exception'));
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_clearance_mode_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_clearance_mode_check
  CHECK (clearance_mode IS NULL OR clearance_mode IN (
    'not_required', 'consignee', 'broker', 'ambara_coordination'
  ));

CREATE INDEX IF NOT EXISTS shipments_operational_queue_idx
  ON shipments (operational_stage, action_due_at);

CREATE INDEX IF NOT EXISTS shipments_document_readiness_idx
  ON shipments (document_readiness);

CREATE TABLE IF NOT EXISTS shipment_packages (
  id serial PRIMARY KEY,
  shipment_id integer NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  package_number integer NOT NULL,
  pieces integer NOT NULL DEFAULT 1,
  length_cm numeric NOT NULL CHECK (length_cm > 0),
  width_cm numeric NOT NULL CHECK (width_cm > 0),
  height_cm numeric NOT NULL CHECK (height_cm > 0),
  gross_weight_kg numeric CHECK (gross_weight_kg IS NULL OR gross_weight_kg > 0),
  volumetric_weight_kg numeric NOT NULL CHECK (volumetric_weight_kg > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shipment_packages_shipment_number_unique_idx
  ON shipment_packages (shipment_id, package_number);
CREATE INDEX IF NOT EXISTS shipment_packages_shipment_idx
  ON shipment_packages (shipment_id);

CREATE TABLE IF NOT EXISTS shipment_operational_tasks (
  id serial PRIMARY KEY,
  shipment_id integer NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  task_type text NOT NULL DEFAULT 'next_action',
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  owner_id integer,
  blocker text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by integer,
  created_by integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shipment_operational_tasks DROP CONSTRAINT IF EXISTS shipment_operational_tasks_status_check;
ALTER TABLE shipment_operational_tasks ADD CONSTRAINT shipment_operational_tasks_status_check
  CHECK (status IN ('open', 'in_progress', 'blocked', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS shipment_operational_tasks_queue_idx
  ON shipment_operational_tasks (status, due_at);
CREATE INDEX IF NOT EXISTS shipment_operational_tasks_shipment_idx
  ON shipment_operational_tasks (shipment_id);
CREATE INDEX IF NOT EXISTS shipment_operational_tasks_owner_idx
  ON shipment_operational_tasks (owner_id, status);

CREATE TABLE IF NOT EXISTS quote_requests (
  id serial PRIMARY KEY,
  reference_number text NOT NULL,
  freight_type text,
  origin text NOT NULL,
  destination text NOT NULL,
  ready_date date,
  incoterms text,
  cargo_description text,
  weight_kg numeric,
  volume_cbm numeric,
  num_packages integer,
  cargo_value_usd numeric,
  needs_insurance text,
  special_requirements text,
  contact_name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS assigned_to integer,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE quote_requests
SET status = CASE lower(coalesce(status, 'new'))
  WHEN 'pending' THEN 'new'
  WHEN 'in_review' THEN 'reviewing'
  WHEN 'review' THEN 'reviewing'
  WHEN 'accepted' THEN 'won'
  WHEN 'rejected' THEN 'lost'
  WHEN 'new' THEN 'new'
  WHEN 'reviewing' THEN 'reviewing'
  WHEN 'quoted' THEN 'quoted'
  WHEN 'won' THEN 'won'
  WHEN 'lost' THEN 'lost'
  WHEN 'closed' THEN 'closed'
  ELSE 'new'
END;

ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;
ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_status_check
  CHECK (status IN ('new', 'reviewing', 'quoted', 'won', 'lost', 'closed'));

CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_reference_unique_idx
  ON quote_requests (reference_number);
CREATE INDEX IF NOT EXISTS quote_requests_queue_idx
  ON quote_requests (status, due_at);

CREATE TABLE IF NOT EXISTS documents (
  id serial PRIMARY KEY,
  shipment_id integer NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_by integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS mime_type text NOT NULL DEFAULT 'application/pdf',
  ADD COLUMN IF NOT EXISTS checksum_sha256 text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS supersedes_document_id integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by integer;

WITH ranked_documents AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY shipment_id, doc_type
      ORDER BY uploaded_at ASC NULLS FIRST, id ASC
    )::integer AS calculated_version,
    row_number() OVER (
      PARTITION BY shipment_id, doc_type
      ORDER BY uploaded_at DESC NULLS LAST, id DESC
    ) AS newest_rank
  FROM documents
)
UPDATE documents AS document
SET
  version = ranked.calculated_version,
  status = CASE
    WHEN document.archived_at IS NOT NULL THEN 'archived'
    WHEN ranked.newest_rank = 1 THEN 'current'
    ELSE 'superseded'
  END
FROM ranked_documents AS ranked
WHERE document.id = ranked.id;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('current', 'superseded', 'archived'));

CREATE UNIQUE INDEX IF NOT EXISTS documents_shipment_type_version_unique_idx
  ON documents (shipment_id, doc_type, version);
CREATE INDEX IF NOT EXISTS documents_shipment_status_idx
  ON documents (shipment_id, status);

COMMENT ON COLUMN shipments.operational_stage IS 'Internal workflow stage; never exposed through public tracking.';
COMMENT ON COLUMN shipments.cargo_risks IS 'Internal multi-value cargo risk classification.';
COMMENT ON COLUMN documents.status IS 'current, superseded, or archived. Files are retained for audit history.';
