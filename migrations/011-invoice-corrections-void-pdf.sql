ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS invoice_code text;

DO $$
DECLARE
  customer_record record;
  base_code text;
  candidate_code text;
  attempt integer;
BEGIN
  FOR customer_record IN
    SELECT
      id,
      upper(coalesce(company_name, full_name, customer_id, 'CUS')) AS source_name
    FROM customers
    WHERE invoice_code IS NULL OR btrim(invoice_code) = ''
    ORDER BY id
  LOOP
    base_code := regexp_replace(customer_record.source_name, '(^|[[:space:][:punct:]])(PT|CV|TBK|LTD|INC|PERSERO)([[:space:][:punct:]]|$)', ' ', 'g');
    base_code := regexp_replace(base_code, '[^A-Z]', '', 'g');
    base_code := rpad(substring(base_code from 1 for 3), 3, 'X');
    attempt := 0;

    LOOP
      IF attempt = 0 THEN
        candidate_code := base_code;
      ELSIF attempt <= 26 THEN
        candidate_code := substring(base_code from 1 for 2) || chr(64 + attempt);
      ELSIF attempt <= 702 THEN
        candidate_code := substring(base_code from 1 for 1)
          || chr(65 + ((attempt - 27) / 26))
          || chr(65 + ((attempt - 27) % 26));
      ELSE
        candidate_code := chr(65 + (((attempt - 703) / 676) % 26))
          || chr(65 + (((attempt - 703) / 26) % 26))
          || chr(65 + ((attempt - 703) % 26));
      END IF;

      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM customers
        WHERE invoice_code = candidate_code
          AND id <> customer_record.id
      );

      attempt := attempt + 1;
      IF attempt > 18278 THEN
        RAISE EXCEPTION 'Unable to allocate invoice code for customer %', customer_record.id;
      END IF;
    END LOOP;

    UPDATE customers
    SET invoice_code = candidate_code
    WHERE id = customer_record.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS customers_invoice_code_unique_idx
  ON customers (invoice_code)
  WHERE invoice_code IS NOT NULL
    AND btrim(invoice_code) <> '';
