import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Hook to handle battle reconnection on page refresh or device switch.
 * Checks for active battles where the user is a participant and returns
 * the battle ID if found, allowing the user to rejoin.
 */
export interface ActiveBattleInfo {
  battleId: string;
  isHost: boolean;
  opponentName: string;
  status: string;
  startedAt: string | null;
}

export function useBattleReconnect(user: User | null) {
  const [activeBattle, setActiveBattle] = useState<ActiveBattleInfo | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check for existing active battle
  const checkForActiveBattle = useCallback(async () => {
    if (!user) {
      setIsChecking(false);
      setActiveBattle(null);
      return;
    }

    try {
      // Look for battles where user is player1 or player2, status is 'waiting' or 'active'
      const { data, error } = await supabase
        .from('active_battles')
        .select('id, player1_id, player1_name, player2_id, player2_name, status, started_at')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking for active battle:', error);
        setIsChecking(false);
        return;
      }

      if (data) {
        const isHost = data.player1_id === user.id;
        const opponentName = isHost ? data.player2_name : data.player1_name;
        
        setActiveBattle({
          battleId: data.id,
          isHost,
          opponentName,
          status: data.status,
          startedAt: data.started_at,
        });
      } else {
        setActiveBattle(null);
      }
    } catch (e) {
      console.error('Failed to check for active battle:', e);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  // Clear active battle (when user explicitly leaves)
  const clearActiveBattle = useCallback(async () => {
    if (!user || !activeBattle) return;

    try {
      // Mark battle as finished when abandoning
      await supabase
        .from('active_battles')
        .update({ status: 'finished' })
        .eq('id', activeBattle.battleId);

      setActiveBattle(null);
    } catch (e) {
      console.error('Failed to clear active battle:', e);
    }
  }, [user, activeBattle]);

  // Subscribe to battle status changes
  useEffect(() => {
    if (!user || !activeBattle) return;

    const channel = supabase
      .channel(`battle_reconnect_${activeBattle.battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_battles',
          filter: `id=eq.${activeBattle.battleId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'finished') {
            setActiveBattle(null);
          } else if (newStatus !== activeBattle.status) {
            setActiveBattle(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, activeBattle?.battleId, activeBattle?.status]);

  // Initial check on mount
  useEffect(() => {
    checkForActiveBattle();
  }, [checkForActiveBattle]);

  return {
    activeBattle,
    isChecking,
    checkForActiveBattle,
    clearActiveBattle,
  };
}
