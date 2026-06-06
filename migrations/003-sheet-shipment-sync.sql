-- Sheet-to-database shipment sync foundation.
-- Apply to a reviewed local/test database first. Do not run against production
-- until duplicate checks and rollout timing are approved.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS shipper_phone TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT internal_tracking_no
      FROM shipments
      WHERE internal_tracking_no IS NOT NULL
        AND btrim(internal_tracking_no) <> ''
      GROUP BY internal_tracking_no
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'Cannot create unique index: duplicate internal_tracking_no values exist';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS shipments_internal_tracking_no_unique_idx
  ON shipments (internal_tracking_no)
  WHERE internal_tracking_no IS NOT NULL
    AND btrim(internal_tracking_no) <> '';
