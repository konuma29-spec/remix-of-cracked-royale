-- Add unique constraint to prevent users from joining multiple clans
ALTER TABLE public.clan_members 
ADD CONSTRAINT clan_members_user_id_unique UNIQUE (user_id);