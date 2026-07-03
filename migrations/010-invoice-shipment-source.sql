ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS shipment_id integer;

DO $$
BEGIN
  ALTER TABLE invoice_line_items
    ADD CONSTRAINT fk_line_items_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE invoice_line_items
  ALTER COLUMN origin TYPE text,
  ALTER COLUMN destination TYPE text,
  ALTER COLUMN awb_number TYPE text,
  ALTER COLUMN flight_number TYPE text,
  ALTER COLUMN description TYPE text;

CREATE INDEX IF NOT EXISTS invoice_line_items_shipment_idx
  ON invoice_line_items (shipment_id)
  WHERE shipment_id IS NOT NULL;
