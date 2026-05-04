-- Create profiles table to store player progression data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT 'Player',
  banner_id TEXT NOT NULL DEFAULT 'banner-blue',
  gold INTEGER NOT NULL DEFAULT 100,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  trophies INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  evolution_shards INTEGER NOT NULL DEFAULT 6,
  owned_card_ids TEXT[] NOT NULL DEFAULT ARRAY['knight', 'archers', 'fireball', 'giant', 'minions', 'musketeer', 'mini-pekka', 'witch']::TEXT[],
  card_copies JSONB NOT NULL DEFAULT '{}'::JSONB,
  current_deck TEXT[] NOT NULL DEFAULT ARRAY['knight', 'archers', 'fireball', 'giant', 'minions', 'musketeer', 'mini-pekka', 'witch']::TEXT[],
  deck_slots JSONB NOT NULL DEFAULT '[]'::JSONB,
  active_deck_id TEXT NOT NULL DEFAULT 'A',
  owned_banner_ids TEXT[] NOT NULL DEFAULT ARRAY['banner-blue', 'banner-red', 'banner-green']::TEXT[],
  tower_copies JSONB NOT NULL DEFAULT '{"princess": 1, "king": 1}'::JSONB,
  unlocked_evolutions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  wild_card_counts JSONB NOT NULL DEFAULT '{"common": 0, "rare": 0, "epic": 0, "legendary": 0, "champion": 0}'::JSONB,
  selected_tower_troop_id TEXT NOT NULL DEFAULT 'default',
  unlocked_tower_troop_ids TEXT[] NOT NULL DEFAULT ARRAY['default']::TEXT[],
  claimed_trophy_rewards INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  chests_available INTEGER NOT NULL DEFAULT 1,
  last_free_chest_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Index for faster lookups
CREATE INDEX idx_profiles_player_name ON public.profiles(player_name);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, player_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'player_name', 'Player'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();