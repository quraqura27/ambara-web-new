ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_by integer,
  ADD COLUMN IF NOT EXISTS void_reason text,
  ADD COLUMN IF NOT EXISTS void_note text,
  ADD COLUMN IF NOT EXISTS previous_status text,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by integer,
  ADD COLUMN IF NOT EXISTS restore_reason text;

CREATE INDEX IF NOT EXISTS shipments_voided_at_idx
  ON shipments (voided_at)
  WHERE voided_at IS NOT NULL;

COMMENT ON COLUMN shipments.voided_at IS 'Active void marker. NULL means the shipment is active or has been restored.';
COMMENT ON COLUMN shipments.void_reason IS 'Structured internal reason for the most recent void action.';
COMMENT ON COLUMN shipments.void_note IS 'Optional internal detail for the most recent void action.';
COMMENT ON COLUMN shipments.previous_status IS 'Status captured immediately before the most recent void action.';
