import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface Clan {
  id: string;
  name: string;
  description: string | null;
  badge_emoji: string;
  leader_id: string;
  created_at: string;
  member_count: number;
  min_trophies: number;
  is_open: boolean;
}

export interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  player_name: string;
  role: 'leader' | 'co-leader' | 'elder' | 'member';
  joined_at: string;
}

export interface ClanMessage {
  id: string;
  clan_id: string;
  user_id: string;
  player_name: string;
  message: string;
  created_at: string;
}

export function useClan(user: User | null, playerName: string, trophies: number) {
  const [userClan, setUserClan] = useState<Clan | null>(null);
  const [userMembership, setUserMembership] = useState<ClanMember | null>(null);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [clanMessages, setClanMessages] = useState<ClanMessage[]>([]);
  const [availableClans, setAvailableClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Fetch user's clan membership
  const fetchMembership = useCallback(async () => {
    if (!user) {
      setUserClan(null);
      setUserMembership(null);
      setClanMembers([]);
      setClanMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Get user's membership
    const { data: membership, error: membershipError } = await supabase
      .from('clan_members')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error fetching membership:', membershipError);
      setLoading(false);
      return;
    }

    if (!membership) {
      setUserClan(null);
      setUserMembership(null);
      setClanMembers([]);
      setClanMessages([]);
      setLoading(false);
      return;
    }

    setUserMembership(membership as ClanMember);

    // Get the clan details
    const { data: clan, error: clanError } = await supabase
      .from('clans')
      .select('*')
      .eq('id', membership.clan_id)
      .single();

    if (clanError) {
      console.error('Error fetching clan:', clanError);
    } else {
      setUserClan(clan as Clan);
    }

    // Get all clan members
    const { data: members, error: membersError } = await supabase
      .from('clan_members')
      .select('*')
      .eq('clan_id', membership.clan_id)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching members:', membersError);
    } else {
      setClanMembers(members as ClanMember[]);
    }

    setLoading(false);
  }, [user]);

  // Fetch clan messages
  const fetchMessages = useCallback(async () => {
    if (!userClan) {
      setClanMessages([]);
      return;
    }

    setMessagesLoading(true);
    const { data, error } = await supabase
      .from('clan_messages')
      .select('*')
      .eq('clan_id', userClan.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching clan messages:', error);
    } else {
      setClanMessages(data as ClanMessage[]);
    }
    setMessagesLoading(false);
  }, [userClan]);

  // Fetch available clans to join
  const fetchAvailableClans = useCallback(async () => {
    const { data, error } = await supabase
      .from('clans')
      .select('*')
      .eq('is_open', true)
      .lte('min_trophies', trophies)
      .order('member_count', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching clans:', error);
    } else {
      setAvailableClans(data as Clan[]);
    }
  }, [trophies]);

  // Create a new clan
  const createClan = useCallback(async (name: string, description: string, badgeEmoji: string, minTrophies: number = 0, isOpen: boolean = true) => {
    if (!user) return { success: false, error: 'Not logged in' };

    // Check if already in a clan
    if (userClan) {
      return { success: false, error: 'You are already in a clan. Leave your current clan first.' };
    }

    // Create the clan
    const { data: newClan, error: clanError } = await supabase
      .from('clans')
      .insert({
        name,
        description,
        badge_emoji: badgeEmoji,
        leader_id: user.id,
        min_trophies: minTrophies,
        is_open: isOpen,
        member_count: 0 // Will be updated by trigger
      })
      .select()
      .single();

    if (clanError) {
      if (clanError.code === '23505') {
        return { success: false, error: 'A clan with that name already exists' };
      }
      console.error('Error creating clan:', clanError);
      return { success: false, error: clanError.message };
    }

    // Add creator as leader
    const { error: memberError } = await supabase
      .from('clan_members')
      .insert({
        clan_id: newClan.id,
        user_id: user.id,
        player_name: playerName,
        role: 'leader'
      });

    if (memberError) {
      console.error('Error adding leader:', memberError);
      // Try to clean up the clan
      await supabase.from('clans').delete().eq('id', newClan.id);
      return { success: false, error: memberError.message };
    }

    await fetchMembership();
    return { success: true, clan: newClan as Clan };
  }, [user, userClan, playerName, fetchMembership]);

  // Join an existing clan
  const joinClan = useCallback(async (clanId: string) => {
    if (!user) return { success: false, error: 'Not logged in' };
    if (userClan) return { success: false, error: 'Already in a clan' };

    const { error } = await supabase
      .from('clan_members')
      .insert({
        clan_id: clanId,
        user_id: user.id,
        player_name: playerName,
        role: 'member'
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You are already in a clan' };
      }
      console.error('Error joining clan:', error);
      return { success: false, error: error.message };
    }

    await fetchMembership();
    return { success: true };
  }, [user, userClan, playerName, fetchMembership]);

  // Leave current clan
  const leaveClan = useCallback(async () => {
    if (!user || !userMembership) return { success: false, error: 'Not in a clan' };

    // If user is leader, they can't leave (must transfer or delete)
    if (userMembership.role === 'leader') {
      // Check if there are other members
      if (clanMembers.length > 1) {
        return { success: false, error: 'Transfer leadership or remove all members before leaving' };
      }
      // If sole member, delete the clan
      const { error: deleteError } = await supabase
        .from('clans')
        .delete()
        .eq('id', userMembership.clan_id);

      if (deleteError) {
        console.error('Error deleting clan:', deleteError);
        return { success: false, error: deleteError.message };
      }
    } else {
      // Regular member leaving
      const { error } = await supabase
        .from('clan_members')
        .delete()
        .eq('id', userMembership.id);

      if (error) {
        console.error('Error leaving clan:', error);
        return { success: false, error: error.message };
      }
    }

    setUserClan(null);
    setUserMembership(null);
    setClanMembers([]);
    setClanMessages([]);
    return { success: true };
  }, [user, userMembership, clanMembers.length]);

  // Delete clan (leader only)
  const deleteClan = useCallback(async () => {
    if (!user || !userMembership || !userClan) return { success: false, error: 'Not in a clan' };
    
    if (userMembership.role !== 'leader') {
      return { success: false, error: 'Only the leader can delete the clan' };
    }

    // First remove all members (this will trigger member_count update)
    const { error: membersError } = await supabase
      .from('clan_members')
      .delete()
      .eq('clan_id', userClan.id);

    if (membersError) {
      console.error('Error removing members:', membersError);
      return { success: false, error: membersError.message };
    }

    // Then delete the clan
    const { error: deleteError } = await supabase
      .from('clans')
      .delete()
      .eq('id', userClan.id);

    if (deleteError) {
      console.error('Error deleting clan:', deleteError);
      return { success: false, error: deleteError.message };
    }

    setUserClan(null);
    setUserMembership(null);
    setClanMembers([]);
    setClanMessages([]);
    return { success: true };
  }, [user, userMembership, userClan]);

  // Delete all clans (admin function)
  const deleteAllClans = useCallback(async () => {
    if (!user) return { success: false, error: 'Not logged in' };

    // Delete all members first (foreign key constraint)
    const { error: membersError } = await supabase
      .from('clan_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (membersError) {
      console.error('Error deleting members:', membersError);
      return { success: false, error: membersError.message };
    }

    // Delete all messages
    await supabase
      .from('clan_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete all clans
    const { error: clansError } = await supabase
      .from('clans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clansError) {
      console.error('Error deleting clans:', clansError);
      return { success: false, error: clansError.message };
    }

    setUserClan(null);
    setUserMembership(null);
    setClanMembers([]);
    setClanMessages([]);
    setAvailableClans([]);
    return { success: true };
  }, [user]);

  // Kick a member (leader/co-leader only)
  const kickMember = useCallback(async (memberId: string) => {
    if (!userMembership || !['leader', 'co-leader'].includes(userMembership.role)) {
      return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
      .from('clan_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error kicking member:', error);
      return { success: false, error: error.message };
    }

    await fetchMembership();
    return { success: true };
  }, [userMembership, fetchMembership]);

  // Promote a member
  const promoteMember = useCallback(async (memberId: string, newRole: 'co-leader' | 'elder') => {
    if (!userMembership || !['leader', 'co-leader'].includes(userMembership.role)) {
      return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
      .from('clan_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      console.error('Error promoting member:', error);
      return { success: false, error: error.message };
    }

    await fetchMembership();
    return { success: true };
  }, [userMembership, fetchMembership]);

  // Send a message to clan chat
  const sendMessage = useCallback(async (message: string) => {
    if (!user || !userClan) return false;

    const { error } = await supabase
      .from('clan_messages')
      .insert({
        clan_id: userClan.id,
        user_id: user.id,
        player_name: playerName,
        message: message.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  }, [user, userClan, playerName]);

  // Initial fetch
  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  // Fetch messages when clan changes
  useEffect(() => {
    if (userClan) {
      fetchMessages();
    }
  }, [userClan, fetchMessages]);

  // Fetch available clans when not in a clan
  useEffect(() => {
    if (!userClan && user) {
      fetchAvailableClans();
    }
  }, [userClan, user, fetchAvailableClans]);

  // Subscribe to clan messages realtime
  useEffect(() => {
    if (!userClan) return;

    const channel = supabase
      .channel(`clan_messages_${userClan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clan_messages',
          filter: `clan_id=eq.${userClan.id}`
        },
        (payload) => {
          const newMessage = payload.new as ClanMessage;
          setClanMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userClan]);

  return {
    userClan,
    userMembership,
    clanMembers,
    clanMessages,
    availableClans,
    loading,
    messagesLoading,
    createClan,
    joinClan,
    leaveClan,
    deleteClan,
    deleteAllClans,
    kickMember,
    promoteMember,
    sendMessage,
    refreshClans: fetchAvailableClans,
    refreshMembers: fetchMembership
  };
}
