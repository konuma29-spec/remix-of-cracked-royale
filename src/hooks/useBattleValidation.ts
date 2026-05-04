import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TowerState {
  id: string;
  health: number;
  maxHealth: number;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Hook for server-side validation of critical battle events.
 * 
 * The host calls these methods to validate events through the Edge Function.
 * Non-critical events (unit movement, attacks) are handled client-side for performance.
 * Critical events (tower destruction, game end) are validated server-side to prevent cheating.
 */
export function useBattleValidation(battleId: string | null) {
  const pendingValidationsRef = useRef<Map<string, Promise<ValidationResult>>>(new Map());
  
  const validate = useCallback(async (
    eventType: 'tower_damage' | 'game_end' | 'card_placement',
    payload: Record<string, unknown>
  ): Promise<ValidationResult> => {
    if (!battleId) return { valid: false, reason: 'No battle ID' };

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { valid: false, reason: 'Not authenticated' };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/validate-battle-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ battleId, eventType, payload }),
        }
      );

      if (!response.ok) {
        console.warn('Validation request failed:', response.status);
        return { valid: true }; // Fail open for gameplay continuity
      }

      return await response.json() as ValidationResult;
    } catch (error) {
      console.warn('Validation error (failing open):', error);
      return { valid: true }; // Fail open to prevent gameplay disruption
    }
  }, [battleId]);

  // Validate card placement (fire-and-forget, don't block gameplay)
  const validateCardPlacement = useCallback((
    cardId: string,
    elixirCost: number,
    currentElixir: number,
    position: { x: number; y: number }
  ) => {
    const key = `placement-${Date.now()}`;
    const promise = validate('card_placement', {
      cardId,
      elixirCost,
      currentElixir,
      position,
    });
    pendingValidationsRef.current.set(key, promise);
    promise.then(result => {
      pendingValidationsRef.current.delete(key);
      if (!result.valid) {
        console.warn(`🚫 Invalid card placement: ${result.reason}`);
      }
    });
  }, [validate]);

  // Validate game end (blocking - must confirm before recording result)
  const validateGameEnd = useCallback(async (
    winnerId: string | null,
    playerTowers: TowerState[],
    enemyTowers: TowerState[],
    timeRemaining: number
  ): Promise<ValidationResult> => {
    return validate('game_end', {
      winnerId,
      playerTowers,
      enemyTowers,
      timeRemaining,
    });
  }, [validate]);

  // Validate tower damage (fire-and-forget)
  const validateTowerDamage = useCallback((
    towerId: string,
    damageAmount: number,
    sourceCardId?: string
  ) => {
    validate('tower_damage', { towerId, damageAmount, sourceCardId });
  }, [validate]);

  return {
    validateCardPlacement,
    validateGameEnd,
    validateTowerDamage,
  };
}
