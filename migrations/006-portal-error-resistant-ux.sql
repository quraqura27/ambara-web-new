-- Error-resistant portal foundation.
-- Additive only. Apply to Preview/staging before Production.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS unlinked_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS shipments_idempotency_key_unique_idx
  ON shipments (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) <> '';

ALTER TABLE tracking_events
  ADD COLUMN IF NOT EXISTS corrected_event_id INTEGER,
  ADD COLUMN IF NOT EXISTS correction_reason TEXT;

ALTER TABLE bulk_shipment_import_jobs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS bulk_shipment_import_jobs_idempotency_unique_idx
  ON bulk_shipment_import_jobs (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) <> '';

ALTER TABLE bulk_update_jobs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS bulk_update_jobs_idempotency_unique_idx
  ON bulk_update_jobs (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) <> '';

CREATE TABLE IF NOT EXISTS portal_audit_logs (
  id            SERIAL PRIMARY KEY,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  performed_by  INTEGER NOT NULL,
  reason        TEXT,
  metadata_json TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portal_audit_logs_entity_idx
  ON portal_audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS portal_audit_logs_user_idx
  ON portal_audit_logs (performed_by, created_at);

CREATE TABLE IF NOT EXISTS portal_ux_events (
  id          SERIAL PRIMARY KEY,
  event_name  TEXT NOT NULL,
  category    TEXT,
  route       TEXT,
  user_id     INTEGER NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portal_ux_events_name_idx
  ON portal_ux_events (event_name, created_at);

CREATE INDEX IF NOT EXISTS portal_ux_events_user_idx
  ON portal_ux_events (user_id, created_at);
