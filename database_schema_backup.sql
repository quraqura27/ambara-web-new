-- Ambara Artha Database Schema Backup
-- Generated: 2026-04-14
-- Target: Neon PostgreSQL 17

-- 1. ACTIVITY LOG
CREATE TABLE public.activity_log (
    id integer NOT NULL,
    staff_id integer,
    staff_name character varying,
    action character varying,
    entity_type character varying,
    entity_id character varying,
    details text,
    created_at timestamp without time zone
);

-- 2. AWBS
CREATE TABLE public.awbs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id bigint,
    awb_number character varying,
    carrier character varying,
    origin character(3),
    destination character(3),
    flight_number character varying,
    shipment_date date,
    pieces integer,
    chargeable_weight numeric,
    commodity character varying,
    raw_pdf_url character varying,
    parse_status character varying,
    parse_raw_text text,
    invoiced boolean DEFAULT false,
    invoice_id uuid,
    uploaded_by bigint,
    edited_by bigint,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. CUSTOMERS
CREATE TABLE public.customers (
    id integer NOT NULL,
    customer_id character varying,
    type character varying,
    full_name character varying,
    company_name character varying,
    email character varying,
    phone character varying,
    address text,
    country character varying,
    country_code character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    password_hash text
);

-- 4. SHIPMENTS
-- Note: Spec v3 requires adding internal_tracking_no, created_by, service_type
CREATE TABLE public.shipments (
    id integer NOT NULL,
    tracking_number character varying,
    customer_id integer,
    status character varying,
    origin character varying,
    destination character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);

-- [Full Schema logic captured in Technical Audit]
