import { useRef, useCallback } from 'react';
import { Position } from '@/types/game';

/**
 * Delta-based multiplayer sync for host-authoritative model with client-side prediction.
 * 
 * Host (Player 1): Runs authoritative simulation, broadcasts deltas at 10-15 TPS
 * Guest (Player 2): Runs local prediction at 60 FPS, reconciles with host state
 * 
 * Performance targets:
 * - Render loop: 60 FPS (requestAnimationFrame)
 * - Network sync: 10-15 updates per second (66-100ms intervals)
 * - Database writes: Throttled to prevent credit drain
 */

// Network sync rate (milliseconds between broadcasts)
export const SYNC_TICK_RATE = 80; // ~12.5 TPS (sweet spot between responsiveness and cost)

// What changed since last sync
export interface GameStateDelta {
  timestamp: number;
  // Only include fields that changed
  towerHealth?: Record<string, { health: number; maxHealth: number }>; // tower id -> health
  unitUpdates?: Array<{
    id: string;
    cardId: string;
    position: Position;
    health: number;
    maxHealth: number;
    isEnemy: boolean;
    state: 'idle' | 'moving' | 'attacking';
  }>;
  unitRemovals?: string[]; // IDs of units that died
  timeRemaining?: number;
  gameStatus?: 'playing' | 'player-wins' | 'enemy-wins' | 'draw';
  isSuddenDeath?: boolean;
}

// Full snapshot for initial sync or reconnection
export interface GameStateSnapshot {
  timestamp: number;
  playerTowers: Array<{ id: string; health: number; maxHealth: number }>;
  enemyTowers: Array<{ id: string; health: number; maxHealth: number }>;
  units: Array<{
    id: string;
    cardId: string;
    position: Position;
    health: number;
    maxHealth: number;
    isEnemy: boolean;
    state: 'idle' | 'moving' | 'attacking';
  }>;
  timeRemaining: number;
  gameStatus: 'playing' | 'player-wins' | 'enemy-wins' | 'draw';
  isSuddenDeath: boolean;
}

interface PreviousState {
  towerHealth: Map<string, number>;
  unitPositions: Map<string, { x: number; y: number; health: number }>;
  unitIds: Set<string>;
  timeRemaining: number;
  gameStatus: string;
}

/**
 * Hook for host to compute and broadcast deltas
 */
export function useHostDeltaSync() {
  const previousStateRef = useRef<PreviousState>({
    towerHealth: new Map(),
    unitPositions: new Map(),
    unitIds: new Set(),
    timeRemaining: 180,
    gameStatus: 'playing',
  });

  const computeDelta = useCallback((
    playerTowers: Array<{ id: string; health: number; maxHealth: number }>,
    enemyTowers: Array<{ id: string; health: number; maxHealth: number }>,
    playerUnits: Array<{
      id: string;
      cardId: string;
      position: Position;
      health: number;
      maxHealth: number;
      state: 'idle' | 'moving' | 'attacking';
    }>,
    enemyUnits: Array<{
      id: string;
      cardId: string;
      position: Position;
      health: number;
      maxHealth: number;
      state: 'idle' | 'moving' | 'attacking';
    }>,
    timeRemaining: number,
    gameStatus: string,
    isSuddenDeath: boolean
  ): GameStateDelta | null => {
    const prev = previousStateRef.current;
    const delta: GameStateDelta = { timestamp: Date.now() };
    let hasChanges = false;

    // Check tower health changes
    const allTowers = [...playerTowers, ...enemyTowers];
    const towerHealthChanges: Record<string, { health: number; maxHealth: number }> = {};
    
    for (const tower of allTowers) {
      const prevHealth = prev.towerHealth.get(tower.id);
      if (prevHealth === undefined || prevHealth !== tower.health) {
        towerHealthChanges[tower.id] = { health: tower.health, maxHealth: tower.maxHealth };
        prev.towerHealth.set(tower.id, tower.health);
        hasChanges = true;
      }
    }
    if (Object.keys(towerHealthChanges).length > 0) {
      delta.towerHealth = towerHealthChanges;
    }

    // Check unit changes (position moved > 5px, health changed, or new unit)
    const currentUnitIds = new Set<string>();
    const unitUpdates: GameStateDelta['unitUpdates'] = [];
    
    const allUnits = [
      ...playerUnits.map(u => ({ ...u, isEnemy: false })),
      ...enemyUnits.map(u => ({ ...u, isEnemy: true })),
    ];

    for (const unit of allUnits) {
      currentUnitIds.add(unit.id);
      const prevUnit = prev.unitPositions.get(unit.id);
      
      const positionChanged = !prevUnit || 
        Math.abs(prevUnit.x - unit.position.x) > 5 || 
        Math.abs(prevUnit.y - unit.position.y) > 5;
      const healthChanged = !prevUnit || prevUnit.health !== unit.health;
      const isNew = !prev.unitIds.has(unit.id);

      if (positionChanged || healthChanged || isNew) {
        unitUpdates.push({
          id: unit.id,
          cardId: unit.cardId,
          position: unit.position,
          health: unit.health,
          maxHealth: unit.maxHealth,
          isEnemy: unit.isEnemy,
          state: unit.state,
        });
        prev.unitPositions.set(unit.id, { 
          x: unit.position.x, 
          y: unit.position.y, 
          health: unit.health 
        });
        hasChanges = true;
      }
    }

    if (unitUpdates.length > 0) {
      delta.unitUpdates = unitUpdates;
    }

    // Check for removed units
    const removedUnits: string[] = [];
    for (const prevId of prev.unitIds) {
      if (!currentUnitIds.has(prevId)) {
        removedUnits.push(prevId);
        prev.unitPositions.delete(prevId);
        hasChanges = true;
      }
    }
    if (removedUnits.length > 0) {
      delta.unitRemovals = removedUnits;
    }
    prev.unitIds = currentUnitIds;

    // Check time (only include if changed significantly, >0.5s)
    if (Math.abs(prev.timeRemaining - timeRemaining) > 0.5) {
      delta.timeRemaining = timeRemaining;
      prev.timeRemaining = timeRemaining;
      hasChanges = true;
    }

    // Check game status
    if (prev.gameStatus !== gameStatus) {
      delta.gameStatus = gameStatus as GameStateDelta['gameStatus'];
      prev.gameStatus = gameStatus;
      hasChanges = true;
    }

    // Always include sudden death flag when it changes
    delta.isSuddenDeath = isSuddenDeath;

    return hasChanges ? delta : null;
  }, []);

  const createSnapshot = useCallback((
    playerTowers: Array<{ id: string; health: number; maxHealth: number }>,
    enemyTowers: Array<{ id: string; health: number; maxHealth: number }>,
    playerUnits: Array<{
      id: string;
      cardId: string;
      position: Position;
      health: number;
      maxHealth: number;
      state: 'idle' | 'moving' | 'attacking';
    }>,
    enemyUnits: Array<{
      id: string;
      cardId: string;
      position: Position;
      health: number;
      maxHealth: number;
      state: 'idle' | 'moving' | 'attacking';
    }>,
    timeRemaining: number,
    gameStatus: string,
    isSuddenDeath: boolean
  ): GameStateSnapshot => {
    return {
      timestamp: Date.now(),
      playerTowers,
      enemyTowers,
      units: [
        ...playerUnits.map(u => ({ ...u, isEnemy: false })),
        ...enemyUnits.map(u => ({ ...u, isEnemy: true })),
      ],
      timeRemaining,
      gameStatus: gameStatus as GameStateSnapshot['gameStatus'],
      isSuddenDeath,
    };
  }, []);

  const reset = useCallback(() => {
    previousStateRef.current = {
      towerHealth: new Map(),
      unitPositions: new Map(),
      unitIds: new Set(),
      timeRemaining: 180,
      gameStatus: 'playing',
    };
  }, []);

  return { computeDelta, createSnapshot, reset };
}

/**
 * Hook for guest to reconcile local prediction with host state
 */
export function useGuestReconciliation(arenaHeight: number) {
  const lastHostUpdateRef = useRef<number>(0);
  const interpolationBufferRef = useRef<Map<string, { 
    targetX: number; 
    targetY: number; 
    targetHealth: number;
    startX: number;
    startY: number;
    startHealth: number;
    progress: number;
  }>>(new Map());

  // Mirror position for perspective swap (Y-axis only)
  const mirrorPosition = useCallback((pos: Position): Position => {
    return { x: pos.x, y: arenaHeight - pos.y };
  }, [arenaHeight]);

  // Apply interpolation for smooth unit movement
  const interpolateUnits = useCallback((
    localUnits: Array<{ id: string; position: Position; health: number }>,
    deltaTime: number
  ) => {
    const buffer = interpolationBufferRef.current;
    const interpolationSpeed = 8; // Higher = faster catch-up

    return localUnits.map(unit => {
      const interp = buffer.get(unit.id);
      if (!interp) return unit;

      // Advance interpolation
      interp.progress = Math.min(1, interp.progress + deltaTime * interpolationSpeed);
      
      // Lerp towards target
      const newX = interp.startX + (interp.targetX - interp.startX) * interp.progress;
      const newY = interp.startY + (interp.targetY - interp.startY) * interp.progress;
      const newHealth = Math.round(interp.startHealth + (interp.targetHealth - interp.startHealth) * interp.progress);

      // Clear buffer entry when done
      if (interp.progress >= 1) {
        buffer.delete(unit.id);
      }

      return {
        ...unit,
        position: { x: newX, y: newY },
        health: newHealth,
      };
    });
  }, []);

  // Queue interpolation targets from host update
  const queueInterpolation = useCallback((
    unitId: string,
    currentPos: Position,
    targetPos: Position,
    currentHealth: number,
    targetHealth: number
  ) => {
    interpolationBufferRef.current.set(unitId, {
      targetX: targetPos.x,
      targetY: targetPos.y,
      targetHealth,
      startX: currentPos.x,
      startY: currentPos.y,
      startHealth: currentHealth,
      progress: 0,
    });
  }, []);

  const shouldApplyHostUpdate = useCallback((): boolean => {
    const now = Date.now();
    // Throttle host updates to max 20 per second (50ms) for smooth interpolation
    if (now - lastHostUpdateRef.current < 50) {
      return false;
    }
    lastHostUpdateRef.current = now;
    return true;
  }, []);

  const reset = useCallback(() => {
    lastHostUpdateRef.current = 0;
    interpolationBufferRef.current.clear();
  }, []);

  return { 
    mirrorPosition, 
    interpolateUnits, 
    queueInterpolation, 
    shouldApplyHostUpdate,
    reset 
  };
}

/**
 * Hook for throttling sync broadcasts to save credits while maintaining gameplay feel.
 * Uses a tick accumulator pattern to ensure consistent 10-15 TPS regardless of frame rate.
 */
export function useSyncRateLimiter() {
  const lastBroadcastRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  const shouldBroadcast = useCallback((deltaTime: number): boolean => {
    accumulatorRef.current += deltaTime * 1000; // Convert to ms
    
    if (accumulatorRef.current >= SYNC_TICK_RATE) {
      accumulatorRef.current = accumulatorRef.current % SYNC_TICK_RATE; // Keep remainder
      lastBroadcastRef.current = Date.now();
      return true;
    }
    return false;
  }, []);

  const forceBroadcast = useCallback((): boolean => {
    const now = Date.now();
    // Allow forced broadcast if at least 50ms has passed (important events)
    if (now - lastBroadcastRef.current >= 50) {
      lastBroadcastRef.current = now;
      accumulatorRef.current = 0;
      return true;
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    lastBroadcastRef.current = 0;
    accumulatorRef.current = 0;
  }, []);

  return { shouldBroadcast, forceBroadcast, reset };
}
