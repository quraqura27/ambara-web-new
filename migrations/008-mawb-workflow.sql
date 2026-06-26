CREATE TABLE IF NOT EXISTS mawb_documents (
  id serial PRIMARY KEY,
  idempotency_key text,
  mawb_number text NOT NULL,
  awb_prefix text NOT NULL,
  awb_serial text NOT NULL,
  carrier_code text NOT NULL,
  carrier_name text NOT NULL,
  action_mode text NOT NULL,
  service_type text NOT NULL DEFAULT 'PTP',
  agent_name text,
  shipper_name text NOT NULL,
  shipper_address text NOT NULL,
  consignee_name text NOT NULL,
  consignee_address text NOT NULL,
  shipment_customer_id integer,
  shipment_customer_name text,
  shipment_contact_phone text,
  departure_airport text NOT NULL,
  origin_iata char(3) NOT NULL,
  destination_airport text NOT NULL,
  destination_iata char(3) NOT NULL,
  routing_to_1 text,
  routing_by_1 text,
  routing_to_2 text,
  routing_by_2 text,
  flight_number text,
  flight_date date,
  executed_date date,
  executed_place text,
  currency text NOT NULL DEFAULT 'IDR',
  declared_value_for_carriage text,
  declared_value_for_customs text,
  insurance_amount text,
  pieces integer NOT NULL,
  gross_weight numeric NOT NULL,
  chargeable_weight numeric NOT NULL,
  rate numeric NOT NULL DEFAULT 0,
  weight_charge numeric NOT NULL DEFAULT 0,
  other_charges_total numeric NOT NULL DEFAULT 0,
  total_prepaid numeric NOT NULL DEFAULT 0,
  other_charges_json text NOT NULL,
  commodity text,
  goods_description text,
  handling_information text,
  nature_quantity text,
  created_by_staff integer,
  updated_by_staff integer,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS mawb_documents_mawb_number_idx
  ON mawb_documents (mawb_number);

CREATE INDEX IF NOT EXISTS mawb_documents_created_at_idx
  ON mawb_documents (created_at);

CREATE UNIQUE INDEX IF NOT EXISTS mawb_documents_idempotency_key_unique_idx
  ON mawb_documents (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND btrim(idempotency_key) <> '';

ALTER TABLE mawb_documents
  ADD COLUMN IF NOT EXISTS shipment_customer_id integer,
  ADD COLUMN IF NOT EXISTS routing_to_1 text,
  ADD COLUMN IF NOT EXISTS routing_by_1 text,
  ADD COLUMN IF NOT EXISTS routing_to_2 text,
  ADD COLUMN IF NOT EXISTS routing_by_2 text;

CREATE TABLE IF NOT EXISTS mawb_shipment_links (
  id serial PRIMARY KEY,
  mawb_document_id integer NOT NULL REFERENCES mawb_documents(id) ON DELETE CASCADE,
  shipment_id integer NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  link_mode text NOT NULL,
  copied_fields_json text,
  created_by_staff integer,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS mawb_shipment_links_document_idx
  ON mawb_shipment_links (mawb_document_id);

CREATE INDEX IF NOT EXISTS mawb_shipment_links_shipment_idx
  ON mawb_shipment_links (shipment_id);

CREATE UNIQUE INDEX IF NOT EXISTS mawb_shipment_links_unique_idx
  ON mawb_shipment_links (mawb_document_id, shipment_id);
