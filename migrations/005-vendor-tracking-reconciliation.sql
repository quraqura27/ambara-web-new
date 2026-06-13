-- Batch-based vendor tracking reconciliation workflow.
-- Additive migration: extends existing shipments and preserves legacy tracking_events compatibility.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS customer_reference TEXT;

CREATE TABLE IF NOT EXISTS parcels (
  id                  SERIAL PRIMARY KEY,
  shipment_id         INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  ambara_parcel_id    TEXT NOT NULL UNIQUE,
  parcel_number       INTEGER NOT NULL,
  receiver_name       TEXT NOT NULL,
  receiver_phone      TEXT NOT NULL,
  receiver_address    TEXT NOT NULL,
  destination_city    TEXT NOT NULL,
  postal_code         TEXT,
  weight              NUMERIC NOT NULL,
  pieces              INTEGER NOT NULL DEFAULT 1,
  service_type        TEXT,
  commodity           TEXT,
  delivery_instruction TEXT,
  cod_amount          NUMERIC,
  current_status      TEXT NOT NULL DEFAULT 'DRAFT',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS parcels_shipment_id_idx ON parcels (shipment_id);
CREATE INDEX IF NOT EXISTS parcels_ambara_parcel_id_idx ON parcels (ambara_parcel_id);
CREATE INDEX IF NOT EXISTS parcels_current_status_idx ON parcels (current_status);
CREATE INDEX IF NOT EXISTS parcels_receiver_phone_idx ON parcels (receiver_phone);

CREATE TABLE IF NOT EXISTS delivery_batches (
  id                  SERIAL PRIMARY KEY,
  batch_code          TEXT NOT NULL UNIQUE,
  vendor_name         TEXT NOT NULL,
  vendor_service_type TEXT,
  handover_date       DATE,
  sla_deadline        TIMESTAMP,
  batch_status        TEXT NOT NULL DEFAULT 'DRAFT',
  total_parcels       INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  last_checked_at     TIMESTAMP,
  last_checked_by     INTEGER,
  next_check_due_at   TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delivery_batches_status_idx ON delivery_batches (batch_status);
CREATE INDEX IF NOT EXISTS delivery_batches_batch_code_idx ON delivery_batches (batch_code);
CREATE INDEX IF NOT EXISTS delivery_batches_sla_deadline_idx ON delivery_batches (sla_deadline);

CREATE TABLE IF NOT EXISTS parcel_vendor_tracking (
  id                     SERIAL PRIMARY KEY,
  parcel_id              INTEGER NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  delivery_batch_id      INTEGER NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
  vendor_name            TEXT NOT NULL,
  vendor_tracking_number TEXT,
  vendor_tracking_url    TEXT,
  vendor_reference_number TEXT,
  export_row_id          TEXT,
  match_method           TEXT,
  match_confidence       INTEGER,
  last_vendor_status     TEXT,
  last_vendor_event_time TIMESTAMP,
  pod_url                TEXT,
  receiver_name          TEXT,
  matched_at             TIMESTAMP,
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS parcel_vendor_tracking_parcel_idx ON parcel_vendor_tracking (parcel_id);
CREATE INDEX IF NOT EXISTS parcel_vendor_tracking_batch_idx ON parcel_vendor_tracking (delivery_batch_id);
CREATE UNIQUE INDEX IF NOT EXISTS parcel_vendor_tracking_vendor_tracking_unique_idx
  ON parcel_vendor_tracking (vendor_tracking_number)
  WHERE vendor_tracking_number IS NOT NULL AND btrim(vendor_tracking_number) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS parcel_vendor_tracking_export_row_unique_idx
  ON parcel_vendor_tracking (export_row_id)
  WHERE export_row_id IS NOT NULL AND btrim(export_row_id) <> '';

CREATE TABLE IF NOT EXISTS tracking_events (
  id                   SERIAL PRIMARY KEY,
  shipment_id          INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  parcel_id            INTEGER REFERENCES parcels(id) ON DELETE CASCADE,
  status_code          TEXT NOT NULL DEFAULT 'pending',
  status               TEXT,
  label                TEXT NOT NULL,
  public_description   TEXT,
  description          TEXT,
  internal_note        TEXT,
  location             TEXT,
  event_time           TIMESTAMP NOT NULL DEFAULT NOW(),
  source               TEXT NOT NULL DEFAULT 'manual',
  visible_to_customer  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           INTEGER,
  state                TEXT DEFAULT 'done',
  created_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tracking_events_shipment_id_idx ON tracking_events (shipment_id);
CREATE INDEX IF NOT EXISTS tracking_events_parcel_id_idx ON tracking_events (parcel_id);
CREATE INDEX IF NOT EXISTS tracking_events_event_time_idx ON tracking_events (event_time);
CREATE INDEX IF NOT EXISTS tracking_events_visible_idx ON tracking_events (visible_to_customer);

CREATE TABLE IF NOT EXISTS vendor_status_mapping (
  id                          SERIAL PRIMARY KEY,
  vendor_name                 TEXT NOT NULL DEFAULT '*',
  vendor_raw_status           TEXT NOT NULL,
  ambara_status_code          TEXT NOT NULL,
  public_description_template TEXT,
  is_exception                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_status_mapping_unique_idx
  ON vendor_status_mapping (vendor_name, vendor_raw_status);

INSERT INTO vendor_status_mapping
  (vendor_name, vendor_raw_status, ambara_status_code, public_description_template, is_exception)
VALUES
  ('*', 'Paket dibawa kurir', 'OUT_FOR_DELIVERY', 'Shipment is out for delivery.', FALSE),
  ('*', 'With delivery courier', 'OUT_FOR_DELIVERY', 'Shipment is out for delivery.', FALSE),
  ('*', 'Out for Delivery', 'OUT_FOR_DELIVERY', 'Shipment is out for delivery.', FALSE),
  ('*', 'Delivered', 'DELIVERED', 'Shipment has been delivered successfully.', FALSE),
  ('*', 'Diterima oleh', 'DELIVERED', 'Shipment has been delivered successfully.', FALSE),
  ('*', 'Penerima tidak di tempat', 'DELIVERY_ISSUE', 'Delivery attempt could not be completed. Our team is monitoring the next update.', TRUE),
  ('*', 'Receiver unavailable', 'DELIVERY_ISSUE', 'Delivery attempt could not be completed. Our team is monitoring the next update.', TRUE),
  ('*', 'Bad address', 'DELIVERY_ISSUE', 'Delivery attempt could not be completed. Our team is monitoring the next update.', TRUE),
  ('*', 'Return in progress', 'RETURN_IN_PROGRESS', 'Shipment is being returned by the delivery partner.', TRUE)
ON CONFLICT (vendor_name, vendor_raw_status) DO NOTHING;

CREATE TABLE IF NOT EXISTS bulk_shipment_import_jobs (
  id                SERIAL PRIMARY KEY,
  uploaded_filename TEXT,
  total_rows        INTEGER NOT NULL DEFAULT 0,
  valid_rows        INTEGER NOT NULL DEFAULT 0,
  error_rows        INTEGER NOT NULL DEFAULT 0,
  warning_rows      INTEGER NOT NULL DEFAULT 0,
  created_shipments INTEGER NOT NULL DEFAULT 0,
  created_parcels   INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_by        INTEGER,
  created_at        TIMESTAMP DEFAULT NOW(),
  completed_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bulk_shipment_import_items (
  id                 SERIAL PRIMARY KEY,
  import_job_id      INTEGER NOT NULL REFERENCES bulk_shipment_import_jobs(id) ON DELETE CASCADE,
  row_number         INTEGER NOT NULL,
  shipment_id        INTEGER REFERENCES shipments(id) ON DELETE SET NULL,
  parcel_id          INTEGER REFERENCES parcels(id) ON DELETE SET NULL,
  customer_reference TEXT,
  receiver_name      TEXT,
  validation_status  TEXT NOT NULL,
  error_message      TEXT,
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bulk_shipment_import_items_job_idx
  ON bulk_shipment_import_items (import_job_id);

CREATE TABLE IF NOT EXISTS bulk_update_jobs (
  id                SERIAL PRIMARY KEY,
  delivery_batch_id INTEGER REFERENCES delivery_batches(id) ON DELETE SET NULL,
  update_type       TEXT NOT NULL,
  source            TEXT NOT NULL,
  uploaded_filename TEXT,
  total_rows        INTEGER NOT NULL DEFAULT 0,
  matched_rows      INTEGER NOT NULL DEFAULT 0,
  unmatched_rows    INTEGER NOT NULL DEFAULT 0,
  duplicate_rows    INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_by        INTEGER,
  created_at        TIMESTAMP DEFAULT NOW(),
  completed_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS bulk_update_jobs_batch_idx ON bulk_update_jobs (delivery_batch_id);

CREATE TABLE IF NOT EXISTS bulk_update_items (
  id                     SERIAL PRIMARY KEY,
  bulk_update_job_id     INTEGER NOT NULL REFERENCES bulk_update_jobs(id) ON DELETE CASCADE,
  parcel_id              INTEGER REFERENCES parcels(id) ON DELETE SET NULL,
  vendor_tracking_number TEXT,
  old_status             TEXT,
  new_status             TEXT,
  vendor_raw_status      TEXT,
  event_time             TIMESTAMP,
  receiver_name          TEXT,
  pod_url                TEXT,
  match_status           TEXT NOT NULL,
  error_message          TEXT,
  created_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bulk_update_items_job_idx ON bulk_update_items (bulk_update_job_id);
CREATE INDEX IF NOT EXISTS bulk_update_items_parcel_idx ON bulk_update_items (parcel_id);
