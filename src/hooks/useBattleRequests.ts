import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface BattleRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_player_name: string;
  to_player_name: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
}

export function useBattleRequests(user: User | null, playerName: string) {
  const [incomingRequests, setIncomingRequests] = useState<BattleRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<BattleRequest[]>([]);
  const [acceptedBattle, setAcceptedBattle] = useState<BattleRequest | null>(null);

  // Send a battle request using player record id (not user_id for security)
  const sendBattleRequest = useCallback(async (
    toPlayerRecordId: string,
    toPlayerName: string
  ): Promise<boolean> => {
    if (!user) return false;

    // Look up the user_id using the database function
    const { data: targetUserId, error: lookupError } = await supabase
      .rpc('get_user_id_for_player', { player_record_id: toPlayerRecordId });

    if (lookupError || !targetUserId) {
      console.error('Failed to lookup player:', lookupError);
      return false;
    }

    const { error } = await supabase
      .from('battle_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: targetUserId,
        from_player_name: playerName,
        to_player_name: toPlayerName,
        status: 'pending'
      });

    return !error;
  }, [user, playerName]);

  // Accept a battle request
  const acceptRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('battle_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('to_user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setAcceptedBattle(data as BattleRequest);
      return true;
    }
    return false;
  }, [user]);

  // Decline a battle request
  const declineRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('battle_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    return !error;
  }, [user]);

  // Cancel an outgoing request
  const cancelRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('battle_requests')
      .delete()
      .eq('id', requestId)
      .eq('from_user_id', user.id);

    return !error;
  }, [user]);

  // Clear accepted battle
  const clearAcceptedBattle = useCallback(() => {
    setAcceptedBattle(null);
  }, []);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!user) return;

    // Fetch incoming pending requests
    const { data: incoming } = await supabase
      .from('battle_requests')
      .select('*')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString());

    if (incoming) {
      setIncomingRequests(incoming as BattleRequest[]);
    }

    // Fetch outgoing pending requests
    const { data: outgoing } = await supabase
      .from('battle_requests')
      .select('*')
      .eq('from_user_id', user.id)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString());

    if (outgoing) {
      setOutgoingRequests(outgoing as BattleRequest[]);
    }
  }, [user]);

  // Subscribe to battle request changes
  useEffect(() => {
    if (!user) return;

    fetchRequests();

    const channel = supabase
      .channel('battle_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_requests',
          filter: `to_user_id=eq.${user.id}`
        },
        (payload) => {
          // Check if a request we sent was accepted
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as BattleRequest;
            if (updated.status === 'accepted') {
              setAcceptedBattle(updated);
            }
          }
          fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_requests',
          filter: `from_user_id=eq.${user.id}`
        },
        (payload) => {
          // Check if a request we sent was accepted
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as BattleRequest;
            if (updated.status === 'accepted') {
              setAcceptedBattle(updated);
            }
          }
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchRequests]);

  return {
    incomingRequests,
    outgoingRequests,
    acceptedBattle,
    sendBattleRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    clearAcceptedBattle
  };
}
