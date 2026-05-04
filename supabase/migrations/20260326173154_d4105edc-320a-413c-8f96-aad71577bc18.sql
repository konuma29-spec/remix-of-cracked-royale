
-- Create the missing trigger to sync online_players to online_players_public
CREATE TRIGGER sync_online_players_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.online_players
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_online_players_public();

-- Backfill any existing online_players data into the public table
INSERT INTO public.online_players_public (id, banner_id, created_at, is_online, last_seen, level, player_name, trophies)
SELECT id, banner_id, created_at, is_online, last_seen, level, player_name, trophies
FROM public.online_players
ON CONFLICT (id) DO UPDATE
SET banner_id = EXCLUDED.banner_id,
    is_online = EXCLUDED.is_online,
    last_seen = EXCLUDED.last_seen,
    level = EXCLUDED.level,
    player_name = EXCLUDED.player_name,
    trophies = EXCLUDED.trophies;
