-- Recreate policies (some legacy names contained trailing spaces so ALTER POLICY didn't apply)

-- active_battles
DROP POLICY IF EXISTS "Participants can update their battles" ON public.active_battles;
DROP POLICY IF EXISTS "Participants can update their battles " ON public.active_battles;
DROP POLICY IF EXISTS "Participants can view their battles" ON public.active_battles;
DROP POLICY IF EXISTS "Participants can view their battles " ON public.active_battles;
DROP POLICY IF EXISTS "Users can create battles" ON public.active_battles;
DROP POLICY IF EXISTS "Users can create battles " ON public.active_battles;

CREATE POLICY "Participants can view their battles"
ON public.active_battles
FOR SELECT
TO authenticated
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Participants can update their battles"
ON public.active_battles
FOR UPDATE
TO authenticated
USING (auth.uid() = player1_id OR auth.uid() = player2_id)
WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create battles"
ON public.active_battles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- battle_requests
DROP POLICY IF EXISTS "Anyone can view battle requests" ON public.battle_requests;
DROP POLICY IF EXISTS "Anyone can view battle requests " ON public.battle_requests;
DROP POLICY IF EXISTS "Participants can view battle requests" ON public.battle_requests;
DROP POLICY IF EXISTS "Participants can view battle requests " ON public.battle_requests;
DROP POLICY IF EXISTS "Users can create battle requests" ON public.battle_requests;
DROP POLICY IF EXISTS "Users can create battle requests " ON public.battle_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.battle_requests;
DROP POLICY IF EXISTS "Users can delete their own requests " ON public.battle_requests;
DROP POLICY IF EXISTS "Users can update requests they received" ON public.battle_requests;
DROP POLICY IF EXISTS "Users can update requests they received " ON public.battle_requests;

CREATE POLICY "Participants can view battle requests"
ON public.battle_requests
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create battle requests"
ON public.battle_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests they received"
ON public.battle_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own requests"
ON public.battle_requests
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- chat_messages
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can view messages " ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages " ON public.chat_messages;

CREATE POLICY "Authenticated users can view messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- clan_members
DROP POLICY IF EXISTS "Anyone can view clan members" ON public.clan_members;
DROP POLICY IF EXISTS "Anyone can view clan members " ON public.clan_members;
DROP POLICY IF EXISTS "Leaders and co-leaders can update member roles" ON public.clan_members;
DROP POLICY IF EXISTS "Leaders and co-leaders can update member roles " ON public.clan_members;
DROP POLICY IF EXISTS "Members can leave or leaders can remove members" ON public.clan_members;
DROP POLICY IF EXISTS "Members can leave or leaders can remove members " ON public.clan_members;
DROP POLICY IF EXISTS "Users can join clans" ON public.clan_members;
DROP POLICY IF EXISTS "Users can join clans " ON public.clan_members;

CREATE POLICY "Anyone can view clan members"
ON public.clan_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join clans"
ON public.clan_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders and co-leaders can update member roles"
ON public.clan_members
FOR UPDATE
TO authenticated
USING (get_user_clan_role(auth.uid(), clan_id) = ANY (ARRAY['leader'::text, 'co-leader'::text]))
WITH CHECK (get_user_clan_role(auth.uid(), clan_id) = ANY (ARRAY['leader'::text, 'co-leader'::text]));

CREATE POLICY "Members can leave or leaders can remove members"
ON public.clan_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR get_user_clan_role(auth.uid(), clan_id) = ANY (ARRAY['leader'::text, 'co-leader'::text]));

-- clan_messages
DROP POLICY IF EXISTS "Clan members can send messages" ON public.clan_messages;
DROP POLICY IF EXISTS "Clan members can send messages " ON public.clan_messages;
DROP POLICY IF EXISTS "Clan members can view their clan messages" ON public.clan_messages;
DROP POLICY IF EXISTS "Clan members can view their clan messages " ON public.clan_messages;

CREATE POLICY "Clan members can view their clan messages"
ON public.clan_messages
FOR SELECT
TO authenticated
USING (is_user_in_clan(auth.uid(), clan_id));

CREATE POLICY "Clan members can send messages"
ON public.clan_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_user_in_clan(auth.uid(), clan_id));

-- clans
DROP POLICY IF EXISTS "Anyone can view clans" ON public.clans;
DROP POLICY IF EXISTS "Anyone can view clans " ON public.clans;
DROP POLICY IF EXISTS "Authenticated users can create clans" ON public.clans;
DROP POLICY IF EXISTS "Authenticated users can create clans " ON public.clans;
DROP POLICY IF EXISTS "Only leader can delete clan" ON public.clans;
DROP POLICY IF EXISTS "Only leader can delete clan " ON public.clans;
DROP POLICY IF EXISTS "Only leader can update clan" ON public.clans;
DROP POLICY IF EXISTS "Only leader can update clan " ON public.clans;

CREATE POLICY "Anyone can view clans"
ON public.clans
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create clans"
ON public.clans
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Only leader can update clan"
ON public.clans
FOR UPDATE
TO authenticated
USING (auth.uid() = leader_id)
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Only leader can delete clan"
ON public.clans
FOR DELETE
TO authenticated
USING (auth.uid() = leader_id);

-- online_players
DROP POLICY IF EXISTS "Users can delete their own online status" ON public.online_players;
DROP POLICY IF EXISTS "Users can delete their own online status " ON public.online_players;
DROP POLICY IF EXISTS "Users can insert their own online status" ON public.online_players;
DROP POLICY IF EXISTS "Users can insert their own online status " ON public.online_players;
DROP POLICY IF EXISTS "Users can update their own online status" ON public.online_players;
DROP POLICY IF EXISTS "Users can update their own online status " ON public.online_players;
DROP POLICY IF EXISTS "Users can view their own online status" ON public.online_players;
DROP POLICY IF EXISTS "Users can view their own online status " ON public.online_players;

CREATE POLICY "Users can view their own online status"
ON public.online_players
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own online status"
ON public.online_players
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own online status"
ON public.online_players
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own online status"
ON public.online_players
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- online_players_public (table)
DROP POLICY IF EXISTS "Authenticated users can view online players" ON public.online_players_public;
DROP POLICY IF EXISTS "Authenticated users can view online players " ON public.online_players_public;

CREATE POLICY "Authenticated users can view online players"
ON public.online_players_public
FOR SELECT
TO authenticated
USING (true);
