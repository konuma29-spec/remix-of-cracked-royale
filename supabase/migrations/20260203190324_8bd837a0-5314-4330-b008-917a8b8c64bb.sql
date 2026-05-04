-- Tighten RLS policies to authenticated users only (removes anonymous-role access)
ALTER POLICY "Participants can update their battles" ON public.active_battles TO authenticated;
ALTER POLICY "Participants can view their battles" ON public.active_battles TO authenticated;
ALTER POLICY "Users can create battles" ON public.active_battles TO authenticated;

-- Battle requests: restrict SELECT to participants (and authenticated only)
DROP POLICY IF EXISTS "Anyone can view battle requests" ON public.battle_requests;
CREATE POLICY "Participants can view battle requests"
ON public.battle_requests
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

ALTER POLICY "Users can create battle requests" ON public.battle_requests TO authenticated;
ALTER POLICY "Users can delete their own requests" ON public.battle_requests TO authenticated;
ALTER POLICY "Users can update requests they received" ON public.battle_requests TO authenticated;

-- Chat messages
ALTER POLICY "Authenticated users can view messages" ON public.chat_messages TO authenticated;
ALTER POLICY "Users can insert their own messages" ON public.chat_messages TO authenticated;

-- Clans / clan chat
ALTER POLICY "Anyone can view clan members" ON public.clan_members TO authenticated;
ALTER POLICY "Leaders and co-leaders can update member roles" ON public.clan_members TO authenticated;
ALTER POLICY "Members can leave or leaders can remove members" ON public.clan_members TO authenticated;
ALTER POLICY "Users can join clans" ON public.clan_members TO authenticated;

ALTER POLICY "Clan members can view their clan messages" ON public.clan_messages TO authenticated;
ALTER POLICY "Clan members can send messages" ON public.clan_messages TO authenticated;

ALTER POLICY "Anyone can view clans" ON public.clans TO authenticated;
ALTER POLICY "Authenticated users can create clans" ON public.clans TO authenticated;
ALTER POLICY "Only leader can delete clan" ON public.clans TO authenticated;
ALTER POLICY "Only leader can update clan" ON public.clans TO authenticated;

-- Online presence
ALTER POLICY "Users can delete their own online status" ON public.online_players TO authenticated;
ALTER POLICY "Users can insert their own online status" ON public.online_players TO authenticated;
ALTER POLICY "Users can update their own online status" ON public.online_players TO authenticated;
ALTER POLICY "Users can view their own online status" ON public.online_players TO authenticated;

-- Replace SECURITY DEFINER public view with a regular table kept in sync by triggers
DROP VIEW IF EXISTS public.online_players_public;

CREATE TABLE IF NOT EXISTS public.online_players_public (
  id uuid PRIMARY KEY,
  banner_id text,
  created_at timestamp with time zone,
  is_online boolean,
  last_seen timestamp with time zone,
  level integer,
  player_name text,
  trophies integer
);

-- Backfill from source table
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

ALTER TABLE public.online_players_public ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view online players" ON public.online_players_public;
CREATE POLICY "Authenticated users can view online players"
ON public.online_players_public
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.sync_online_players_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.online_players_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.online_players_public (id, banner_id, created_at, is_online, last_seen, level, player_name, trophies)
  VALUES (NEW.id, NEW.banner_id, NEW.created_at, NEW.is_online, NEW.last_seen, NEW.level, NEW.player_name, NEW.trophies)
  ON CONFLICT (id) DO UPDATE
  SET banner_id = EXCLUDED.banner_id,
      is_online = EXCLUDED.is_online,
      last_seen = EXCLUDED.last_seen,
      level = EXCLUDED.level,
      player_name = EXCLUDED.player_name,
      trophies = EXCLUDED.trophies;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_online_players_public_insupd ON public.online_players;
CREATE TRIGGER trg_sync_online_players_public_insupd
AFTER INSERT OR UPDATE ON public.online_players
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_players_public();

DROP TRIGGER IF EXISTS trg_sync_online_players_public_del ON public.online_players;
CREATE TRIGGER trg_sync_online_players_public_del
AFTER DELETE ON public.online_players
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_players_public();
