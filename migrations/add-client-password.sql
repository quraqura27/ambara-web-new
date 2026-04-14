-- Add password_hash column to customers table for client portal login
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL;
