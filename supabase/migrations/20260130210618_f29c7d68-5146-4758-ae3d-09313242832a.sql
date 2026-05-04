-- Drop and recreate the view WITHOUT security_invoker so it bypasses base table RLS
DROP VIEW IF EXISTS public.online_players_public;

CREATE VIEW public.online_players_public AS
  SELECT 
    id,
    player_name,
    banner_id,
    trophies,
    level,
    last_seen,
    is_online,
    created_at
  FROM public.online_players;

-- Grant access to the view
GRANT SELECT ON public.online_players_public TO authenticated;
GRANT SELECT ON public.online_players_public TO anon;