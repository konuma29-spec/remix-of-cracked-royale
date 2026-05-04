-- Create a public view that excludes sensitive user_id
CREATE VIEW public.online_players_public
WITH (security_invoker=on) AS
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
-- Excludes user_id to prevent UUID exposure

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view online players" ON public.online_players;

-- Create a restrictive SELECT policy - users can only see their own record directly
CREATE POLICY "Users can view their own online status"
  ON public.online_players
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant SELECT on the public view to authenticated and anon users
GRANT SELECT ON public.online_players_public TO authenticated;
GRANT SELECT ON public.online_players_public TO anon;