-- Stop retrying permanently failing email deliveries forever.
-- A NULL marker means retryable; a timestamp marks a terminal dead-letter row.
-- The order and its download entitlement are never changed by this migration.
ALTER TABLE email_outbox ADD COLUMN dead_lettered_at INTEGER;
