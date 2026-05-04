-- Add server-authoritative readiness + start timestamp to coordinate battle start
ALTER TABLE public.active_battles
  ADD COLUMN IF NOT EXISTS player1_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS player2_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;

-- When both players are ready and battle is waiting, flip to active atomically
CREATE OR REPLACE FUNCTION public.active_battles_autostart()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status = 'waiting' AND NEW.player1_ready = true AND NEW.player2_ready = true) THEN
    NEW.status := 'active';
    IF NEW.started_at IS NULL THEN
      NEW.started_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_active_battles_autostart ON public.active_battles;
CREATE TRIGGER trg_active_battles_autostart
BEFORE UPDATE OF player1_ready, player2_ready, status ON public.active_battles
FOR EACH ROW
EXECUTE FUNCTION public.active_battles_autostart();
