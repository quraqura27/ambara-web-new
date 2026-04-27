CREATE TABLE IF NOT EXISTS tracking_updates (
  id serial PRIMARY KEY,
  shipment_id integer NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  description text NOT NULL,
  location text,
  "timestamp" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracking_updates_shipment_id_idx
  ON tracking_updates (shipment_id);

CREATE INDEX IF NOT EXISTS tracking_updates_timestamp_idx
  ON tracking_updates ("timestamp" DESC);
