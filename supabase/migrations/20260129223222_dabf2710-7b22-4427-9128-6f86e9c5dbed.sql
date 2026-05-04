-- Create online players table to track who's online
CREATE TABLE public.online_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  banner_id TEXT NOT NULL DEFAULT 'blue-banner',
  trophies INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create battle requests table for friendly matches
CREATE TABLE public.battle_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  from_player_name TEXT NOT NULL,
  to_player_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 seconds')
);

-- Create active battles table for multiplayer games
CREATE TABLE public.active_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL,
  player2_id UUID NOT NULL,
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  player1_banner_id TEXT NOT NULL DEFAULT 'blue-banner',
  player2_banner_id TEXT NOT NULL DEFAULT 'blue-banner',
  player1_level INTEGER NOT NULL DEFAULT 1,
  player2_level INTEGER NOT NULL DEFAULT 1,
  game_state JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.online_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_battles ENABLE ROW LEVEL SECURITY;

-- RLS policies for online_players
CREATE POLICY "Anyone can view online players"
  ON public.online_players FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own online status"
  ON public.online_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own online status"
  ON public.online_players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own online status"
  ON public.online_players FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for battle_requests
CREATE POLICY "Anyone can view battle requests"
  ON public.battle_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create battle requests"
  ON public.battle_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests they received"
  ON public.battle_requests FOR UPDATE
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own requests"
  ON public.battle_requests FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- RLS policies for active_battles
CREATE POLICY "Participants can view their battles"
  ON public.active_battles FOR SELECT
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Participants can update their battles"
  ON public.active_battles FOR UPDATE
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create battles"
  ON public.active_battles FOR INSERT
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_battles;

-- Create function to auto-expire old battle requests
CREATE OR REPLACE FUNCTION public.cleanup_expired_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.battle_requests
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$;