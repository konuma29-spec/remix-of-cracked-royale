import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Position } from '@/types/game';
import { GameStateDelta, GameStateSnapshot } from './useMultiplayerSync';

export interface MultiplayerBattleState {
  battleId: string;
  isPlayer1: boolean;
  opponentName: string;
  opponentBannerId: string;
  opponentLevel: number;
  status: 'waiting' | 'active' | 'finished';
  winnerId?: string;
}

export interface CardPlacement {
  cardId: string;
  cardIndex: number;
  position: Position;
  timestamp: number;
  isPlayer1: boolean;
}

// Legacy full sync (used for initial sync / reconnection)
export interface SyncedGameState {
  timestamp: number;
  playerTowers: Array<{ id: string; health: number; maxHealth: number }>;
  enemyTowers: Array<{ id: string; health: number; maxHealth: number }>;
  timeRemaining: number;
  playerElixir: number;
  enemyElixir: number;
  gameStatus: 'playing' | 'player-wins' | 'enemy-wins' | 'draw';
  isSuddenDeath?: boolean;
  // Include units for full sync
  units?: Array<{
    id: string;
    cardId: string;
    position: Position;
    health: number;
    maxHealth: number;
    isEnemy: boolean;
    state?: 'idle' | 'moving' | 'attacking';
  }>;
}

interface MultiplayerGameState {
  placements: CardPlacement[];
  lastProcessed: number;
}

// Re-export delta types for convenience
export type { GameStateDelta, GameStateSnapshot };

export function useMultiplayerBattle(
  user: User | null,
  battleId: string | null,
  playerName: string,
  playerBannerId: string,
  playerLevel: number
) {
  const [battleState, setBattleState] = useState<MultiplayerBattleState | null>(null);
  const [pendingOpponentPlacements, setPendingOpponentPlacements] = useState<CardPlacement[]>([]);
  const [syncedGameState, setSyncedGameState] = useState<SyncedGameState | null>(null);
  const [pendingDeltas, setPendingDeltas] = useState<GameStateDelta[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<GameStateSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const lastProcessedTimestampRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const battleStateRef = useRef<MultiplayerBattleState | null>(null);
  
  useEffect(() => {
    battleStateRef.current = battleState;
  }, [battleState]);

  const createBattle = useCallback(async (
    opponentId: string,
    opponentName: string,
    opponentBannerId: string,
    opponentLevel: number,
    isChallenger: boolean
  ): Promise<string | null> => {
    if (!user) return null;

    if (isChallenger) {
      const { data, error } = await supabase
        .from('active_battles')
        .insert({
          player1_id: user.id,
          player2_id: opponentId,
          player1_name: playerName,
          player2_name: opponentName,
          player1_banner_id: playerBannerId,
          player2_banner_id: opponentBannerId,
          player1_level: playerLevel,
          player2_level: opponentLevel,
          // Server-authoritative start: both players must mark ready; DB trigger flips to 'active'
          status: 'waiting',
          game_state: {
            placements: [],
            lastProcessed: 0
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create battle:', error);
        return null;
      }

      return data.id;
    }

    return null;
  }, [user, playerName, playerBannerId, playerLevel]);

  // Mark this player as ready in the shared authoritative battle record.
  // When both are ready, the DB trigger flips status -> 'active' atomically.
  const markReady = useCallback(async (): Promise<boolean> => {
    if (!user || !battleId) return false;

    try {
      // Prefer already-known role, otherwise derive from DB.
      let isPlayer1: boolean | null = battleStateRef.current?.isPlayer1 ?? null;

      if (isPlayer1 === null) {
        const { data, error } = await supabase
          .from('active_battles')
          .select('player1_id, player2_id')
          .eq('id', battleId)
          .single();

        if (error || !data) {
          console.error('Failed to mark ready (lookup battle role):', error);
          return false;
        }

        isPlayer1 = data.player1_id === user.id;
      }

      const update = isPlayer1 ? { player1_ready: true } : { player2_ready: true };

      const { error } = await supabase
        .from('active_battles')
        // Types may lag immediately after migration; cast to avoid TS rejecting new columns.
        .update(update as unknown as Record<string, never>)
        .eq('id', battleId);

      if (error) {
        console.error('Failed to mark ready:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Failed to mark ready:', e);
      return false;
    }
  }, [user, battleId]);

  const joinBattle = useCallback(async (id: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('active_battles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Failed to join battle:', error);
      return;
    }

    const isPlayer1 = data.player1_id === user.id;
    
    setBattleState({
      battleId: data.id,
      isPlayer1,
      opponentName: isPlayer1 ? data.player2_name : data.player1_name,
      opponentBannerId: isPlayer1 ? data.player2_banner_id : data.player1_banner_id,
      opponentLevel: isPlayer1 ? data.player2_level : data.player1_level,
      status: data.status as 'waiting' | 'active' | 'finished',
      winnerId: data.winner_id || undefined
    });
  }, [user]);

  // Send card placement via broadcast only (no DB write during active gameplay for performance)
  const sendCardPlacement = useCallback(async (
    cardId: string,
    cardIndex: number,
    position: Position
  ) => {
    if (!battleState || !user) return;

    const placement: CardPlacement = {
      cardId,
      cardIndex,
      position: { x: position.x, y: position.y },
      timestamp: Date.now(),
      isPlayer1: battleState.isPlayer1
    };

    // Send via broadcast for instant delivery — no DB round-trip
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'card_placement',
        payload: placement
      });
    }
  }, [battleState, user]);

  // Sync game state via broadcast only (no database write for speed)
  // Now supports both full snapshots and deltas
  const syncGameState = useCallback((state: SyncedGameState) => {
    if (!battleState || !battleState.isPlayer1) return;

    // Use broadcast for instant delivery - no database round-trip
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'game_state_sync',
        payload: state
      });
    }
  }, [battleState]);

  // NEW: Send delta updates for efficient sync (preferred over full state)
  const syncDelta = useCallback((delta: GameStateDelta) => {
    if (!battleState || !battleState.isPlayer1) return;

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'game_delta_sync',
        payload: delta
      });
    }
  }, [battleState]);

  // Send full snapshot (for initial sync or reconnection)
  const syncSnapshot = useCallback((snapshot: GameStateSnapshot) => {
    if (!battleState || !battleState.isPlayer1) return;

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'game_snapshot_sync',
        payload: snapshot
      });
    }
  }, [battleState]);

  const reportGameEnd = useCallback(async (winnerId: string | null) => {
    if (!battleState) return;

    // Broadcast game end instantly
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'game_end',
        payload: { winnerId }
      });
    }

    await supabase
      .from('active_battles')
      .update({
        status: 'finished',
        winner_id: winnerId
      })
      .eq('id', battleState.battleId);
  }, [battleState]);

  // Process placements from database (for reconnection)
  const processGameStateUpdate = useCallback((newData: Record<string, unknown>) => {
    const gameState = newData.game_state as unknown as MultiplayerGameState | null;
    
    const currentBattleState = battleStateRef.current;
    if (!currentBattleState || !gameState) return;

    const allPlacements = gameState.placements || [];
    const opponentPlacements = allPlacements.filter(
      p => p.isPlayer1 !== currentBattleState.isPlayer1 &&
           p.timestamp > lastProcessedTimestampRef.current
    );

    if (opponentPlacements.length > 0) {
      lastProcessedTimestampRef.current = Math.max(
        ...opponentPlacements.map(p => p.timestamp)
      );
      setPendingOpponentPlacements(prev => [...prev, ...opponentPlacements]);
    }

    if (newData.status === 'active') {
      setBattleState(prev => {
        // If this is player1 (host) and we just became active, broadcast to player2
        if (prev && prev.status !== 'active' && prev.isPlayer1 && broadcastChannelRef.current) {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'battle_start',
            payload: {}
          });
        }
        return prev ? {
          ...prev,
          status: 'active'
        } : null;
      });
    }

    if (newData.status === 'finished') {
      setBattleState(prev => prev ? {
        ...prev,
        status: 'finished',
        winnerId: (newData.winner_id as string) || undefined
      } : null);
    }
  }, []);

  // Subscribe to battle updates
  useEffect(() => {
    if (!battleId || !user) return;

    joinBattle(battleId);

    let pollTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Create broadcast channel for instant communication
    const broadcastChannel = supabase
      .channel(`battle-broadcast:${battleId}`)
      .on('broadcast', { event: 'card_placement' }, (payload) => {
        const placement = payload.payload as CardPlacement;
        const currentBattleState = battleStateRef.current;
        
        if (!currentBattleState) return;
        
        // Only process opponent's placements
        if (placement.isPlayer1 !== currentBattleState.isPlayer1) {
          if (placement.timestamp > lastProcessedTimestampRef.current) {
            lastProcessedTimestampRef.current = placement.timestamp;
            setPendingOpponentPlacements(prev => [...prev, placement]);
          }
        }
      })
      .on('broadcast', { event: 'battle_start' }, () => {
        // Instantly transition to 'active' when the host broadcasts battle start
        setBattleState(prev => prev ? {
          ...prev,
          status: 'active'
        } : null);
      })
      .on('broadcast', { event: 'game_state_sync' }, (payload) => {
        const state = payload.payload as SyncedGameState;
        const currentBattleState = battleStateRef.current;
        
        // Only Player 2 receives synced state
        if (currentBattleState && !currentBattleState.isPlayer1) {
          setSyncedGameState(state);
        }
      })
      .on('broadcast', { event: 'game_delta_sync' }, (payload) => {
        const delta = payload.payload as GameStateDelta;
        const currentBattleState = battleStateRef.current;
        
        // Only Player 2 receives delta updates
        if (currentBattleState && !currentBattleState.isPlayer1) {
          setPendingDeltas(prev => [...prev, delta]);
        }
      })
      .on('broadcast', { event: 'game_snapshot_sync' }, (payload) => {
        const snapshot = payload.payload as GameStateSnapshot;
        const currentBattleState = battleStateRef.current;
        
        // Only Player 2 receives snapshots
        if (currentBattleState && !currentBattleState.isPlayer1) {
          setLatestSnapshot(snapshot);
          // Clear pending deltas when a full snapshot arrives
          setPendingDeltas([]);
        }
      })
      .on('broadcast', { event: 'game_end' }, (payload) => {
        const { winnerId } = payload.payload as { winnerId: string | null };
        setBattleState(prev => prev ? {
          ...prev,
          status: 'finished',
          winnerId: winnerId || undefined
        } : null);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    broadcastChannelRef.current = broadcastChannel;

    // Database channel for persistence/reconnection
    const dbChannel = supabase
      .channel(`battle-db:${battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_battles',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          processGameStateUpdate(payload.new as Record<string, unknown>);
        }
      )
      .subscribe();

    channelRef.current = dbChannel;

    // Poll for 'active' status transition (DB trigger sets this).
    // STOP polling once active — broadcast handles all gameplay sync.
    const pollForUpdates = async () => {
      const currentStatus = battleStateRef.current?.status;
      
      // Once active, stop polling — broadcast channel handles everything
      if (currentStatus === 'active') {
        return;
      }
      
      try {
        const { data } = await supabase
          .from('active_battles')
          .select('*')
          .eq('id', battleId)
          .single();

        if (data) {
          processGameStateUpdate(data as unknown as Record<string, unknown>);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      // Only continue polling while waiting for 'active'
      if (battleStateRef.current?.status !== 'active') {
        pollTimeoutId = setTimeout(pollForUpdates, 200);
      }
    };

    pollForUpdates();

    return () => {
      if (pollTimeoutId) clearTimeout(pollTimeoutId);
      broadcastChannel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [battleId, user, joinBattle, processGameStateUpdate]);

  const consumePlacement = useCallback(() => {
    setPendingOpponentPlacements(prev => prev.slice(1));
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.unsubscribe();
      broadcastChannelRef.current = null;
    }
    setBattleState(null);
    setPendingOpponentPlacements([]);
    setSyncedGameState(null);
    setPendingDeltas([]);
    setLatestSnapshot(null);
    setIsConnected(false);
    lastProcessedTimestampRef.current = 0;
  }, []);

  // Helper to consume a delta after processing
  const consumeDelta = useCallback(() => {
    setPendingDeltas(prev => prev.slice(1));
  }, []);

  // Helper to clear snapshot after applying
  const clearSnapshot = useCallback(() => {
    setLatestSnapshot(null);
  }, []);

  return {
    battleState,
    isConnected,
    pendingOpponentPlacements,
    syncedGameState,
    pendingDeltas,
    latestSnapshot,
    createBattle,
    joinBattle,
    markReady,
    sendCardPlacement,
    syncGameState,
    syncDelta,
    syncSnapshot,
    reportGameEnd,
    consumePlacement,
    consumeDelta,
    clearSnapshot,
    disconnect
  };
}
