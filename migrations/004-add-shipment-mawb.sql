-- Store carrier MAWB separately from the unique shipment tracking number.
-- Do not make this index unique: multiple CN/house shipment rows can share one MAWB.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS mawb TEXT;

CREATE INDEX IF NOT EXISTS idx_shipments_mawb
  ON shipments (mawb)
  WHERE mawb IS NOT NULL
    AND btrim(mawb) <> '';
