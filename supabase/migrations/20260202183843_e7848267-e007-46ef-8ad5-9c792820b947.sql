-- Drop the existing view
DROP VIEW IF EXISTS public.online_players_public;

-- Recreate the view without security_invoker (uses security definer by default)
-- This allows users to see other players through the view while base table remains protected
CREATE VIEW public.online_players_public AS
  SELECT 
    id,
    player_name,
    banner_id,
    trophies,
    level,
    is_online,
    last_seen,
    created_at
  FROM public.online_players;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.online_players_public TO authenticated;
GRANT SELECT ON public.online_players_public TO anon;