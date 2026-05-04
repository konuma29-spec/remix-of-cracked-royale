-- Create a security definer function to get user_id from online_players id
-- This allows sending battle requests without exposing user_id in the public view
CREATE OR REPLACE FUNCTION public.get_user_id_for_player(player_record_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.online_players WHERE id = player_record_id
$$;