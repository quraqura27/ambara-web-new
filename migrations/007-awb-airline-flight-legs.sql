-- Airline-aware AWB metadata and ordered shipment flight legs.
-- Additive only. Existing shipment rows remain valid without backfill.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS awb_airline_prefix TEXT,
  ADD COLUMN IF NOT EXISTS awb_airline_name TEXT,
  ADD COLUMN IF NOT EXISTS awb_airline_unresolved BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS shipments_awb_airline_prefix_idx
  ON shipments (awb_airline_prefix)
  WHERE awb_airline_prefix IS NOT NULL AND btrim(awb_airline_prefix) <> '';

CREATE TABLE IF NOT EXISTS shipment_flight_legs (
  id                    SERIAL PRIMARY KEY,
  shipment_id           INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  sequence              INTEGER NOT NULL,
  airline_designator    TEXT NOT NULL,
  flight_number         TEXT NOT NULL,
  operational_suffix    TEXT,
  airline_name          TEXT NOT NULL,
  airline_unresolved    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT shipment_flight_legs_sequence_positive CHECK (sequence > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS shipment_flight_legs_shipment_sequence_unique_idx
  ON shipment_flight_legs (shipment_id, sequence);

CREATE INDEX IF NOT EXISTS shipment_flight_legs_shipment_idx
  ON shipment_flight_legs (shipment_id);

CREATE INDEX IF NOT EXISTS shipment_flight_legs_designator_idx
  ON shipment_flight_legs (airline_designator);
