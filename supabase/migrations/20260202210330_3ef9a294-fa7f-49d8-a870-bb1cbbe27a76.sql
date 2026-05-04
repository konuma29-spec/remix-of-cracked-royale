-- Create clans table
CREATE TABLE public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  badge_emoji TEXT NOT NULL DEFAULT '⚔️',
  leader_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  member_count INTEGER NOT NULL DEFAULT 1,
  min_trophies INTEGER NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT clans_name_unique UNIQUE (name)
);

-- Create clan members table
CREATE TABLE public.clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'co-leader', 'elder', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT clan_members_user_unique UNIQUE (user_id),
  CONSTRAINT clan_members_clan_user_unique UNIQUE (clan_id, user_id)
);

-- Create clan messages table (clan-specific chat)
CREATE TABLE public.clan_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster message retrieval
CREATE INDEX idx_clan_messages_clan_id ON public.clan_messages(clan_id);
CREATE INDEX idx_clan_messages_created_at ON public.clan_messages(created_at);
CREATE INDEX idx_clan_members_clan_id ON public.clan_members(clan_id);

-- Enable RLS on all tables
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is in a clan
CREATE OR REPLACE FUNCTION public.is_user_in_clan(check_user_id UUID, check_clan_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clan_members 
    WHERE user_id = check_user_id AND clan_id = check_clan_id
  )
$$;

-- Helper function to get user's clan role
CREATE OR REPLACE FUNCTION public.get_user_clan_role(check_user_id UUID, check_clan_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.clan_members 
  WHERE user_id = check_user_id AND clan_id = check_clan_id
$$;

-- RLS Policies for clans table
CREATE POLICY "Anyone can view clans"
ON public.clans FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create clans"
ON public.clans FOR INSERT
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Only leader can update clan"
ON public.clans FOR UPDATE
USING (auth.uid() = leader_id);

CREATE POLICY "Only leader can delete clan"
ON public.clans FOR DELETE
USING (auth.uid() = leader_id);

-- RLS Policies for clan_members table
CREATE POLICY "Anyone can view clan members"
ON public.clan_members FOR SELECT
USING (true);

CREATE POLICY "Users can join clans"
ON public.clan_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave or leaders can remove members"
ON public.clan_members FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.get_user_clan_role(auth.uid(), clan_id) IN ('leader', 'co-leader')
);

CREATE POLICY "Leaders and co-leaders can update member roles"
ON public.clan_members FOR UPDATE
USING (
  public.get_user_clan_role(auth.uid(), clan_id) IN ('leader', 'co-leader')
);

-- RLS Policies for clan_messages table
CREATE POLICY "Clan members can view their clan messages"
ON public.clan_messages FOR SELECT
USING (public.is_user_in_clan(auth.uid(), clan_id));

CREATE POLICY "Clan members can send messages"
ON public.clan_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  public.is_user_in_clan(auth.uid(), clan_id)
);

-- Enable realtime for clan messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_messages;

-- Function to update member count when members change
CREATE OR REPLACE FUNCTION public.update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clans SET member_count = member_count + 1 WHERE id = NEW.clan_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clans SET member_count = member_count - 1 WHERE id = OLD.clan_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update member count
CREATE TRIGGER update_clan_member_count_trigger
AFTER INSERT OR DELETE ON public.clan_members
FOR EACH ROW EXECUTE FUNCTION public.update_clan_member_count();