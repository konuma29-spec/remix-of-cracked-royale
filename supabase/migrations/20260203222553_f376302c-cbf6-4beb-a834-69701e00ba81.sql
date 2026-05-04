-- Allow server-authoritative ready->active handshake statuses
-- Existing check constraint currently rejects 'waiting'
DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'active_battles'
    AND c.contype = 'c'
    AND c.conname = 'active_battles_status_check'
  LIMIT 1;

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.active_battles DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.active_battles
  ADD CONSTRAINT active_battles_status_check
  CHECK (status IN ('waiting','active','finished'));
