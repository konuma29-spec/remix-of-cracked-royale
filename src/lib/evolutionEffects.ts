// Evolution special effects implementation based on Clash Royale mechanics
// Each evolution has unique abilities that trigger during combat

import { Unit, Position, StatusEffect } from '@/types/game';
import { getEvolution } from '@/data/evolutions';

export interface EvolutionEffectResult {
  // Units to spawn from evolution effects
  unitsToSpawn?: Array<{
    cardId: string;
    position: Position;
    owner: 'player' | 'enemy';
    count: number;
  }>;
  // Stat modifications
  damageMultiplier?: number;
  speedMultiplier?: number;
  healthHeal?: number;
  // Status effects to apply to enemies
  statusEffectsToApply?: Array<{
    targetId: string;
    effect: StatusEffect;
  }>;
  // Shield/damage reduction
  damageReduction?: number;
  // Special flags
  shouldTriggerRage?: boolean;
  knockbackTargets?: Array<{ targetId: string; distance: number }>;
}

// Track evolution-specific state per unit
export interface EvolutionState {
  // Skeletons: spawned skeleton count
  spawnedCount?: number;
  // Knight: shield active
  shieldActive?: boolean;
  shieldHitsTaken?: number;
  // Barbarians: rage timer
  rageEndTime?: number;
  // Archers: bonus damage at range
  lastRangeBonusDamage?: number;
  // Bats: overheal amount
  currentOverheal?: number;
  // P.E.K.K.A: butterfly healing
  butterflyHealPending?: number;
  // Witch: heal from skeleton deaths
  skeletonDeathHealPending?: number;
  // Lumberjack: ghost spawned
  ghostSpawned?: boolean;
}

// Apply evolution effects on attack
export function applyEvolutionOnAttack(
  unit: Unit,
  target: { id: string; position: Position; isFlying: boolean },
  evolutionState: Map<string, EvolutionState>,
  currentTime: number
): EvolutionEffectResult {
  if (!unit.isEvolved) return {};
  
  const evolution = getEvolution(unit.cardId);
  if (!evolution) return {};

  const state = evolutionState.get(unit.id) || {};
  const result: EvolutionEffectResult = {};

  switch (unit.cardId) {
    case 'barbarians':
      // Evolved Barbarians: Rage when attacking (+35% attack/move speed for 3s)
      state.rageEndTime = currentTime + 3000;
      result.speedMultiplier = 1.35;
      result.shouldTriggerRage = true;
      break;

    case 'skeletons':
      // Evolved Skeletons: Each attack spawns another Skeleton (max 8)
      const currentSpawned = state.spawnedCount || 0;
      if (currentSpawned < 8) {
        result.unitsToSpawn = [{
          cardId: 'skeletons',
          position: { 
            x: unit.position.x + (Math.random() - 0.5) * 20, 
            y: unit.position.y + (Math.random() - 0.5) * 20 
          },
          owner: unit.owner,
          count: 1
        }];
        state.spawnedCount = currentSpawned + 1;
      }
      break;

    case 'archers':
      // Evolved Archers: +50% damage to enemies 4-6 tiles away (160-240 pixels)
      const distance = Math.sqrt(
        Math.pow(target.position.x - unit.position.x, 2) + 
        Math.pow(target.position.y - unit.position.y, 2)
      );
      if (distance >= 160 && distance <= 240) {
        result.damageMultiplier = 1.5;
      }
      break;

    case 'bomber':
      // Evolved Bomber: Bombs bounce twice after initial hit
      // This is a visual effect - we simulate with extra damage applications
      // (Simplified: 3x total damage as bounces)
      result.damageMultiplier = 1.5; // Represents bounce damage
      break;

    case 'bats':
      // Evolved Bats: Heal on attack, can overheal to double max HP
      const healAmount = Math.floor(unit.damage * 0.3);
      result.healthHeal = healAmount;
      // Track overheal
      if (unit.health >= unit.maxHealth) {
        const newOverheal = Math.min(
          (state.currentOverheal || 0) + healAmount,
          unit.maxHealth // Max overheal = double HP
        );
        state.currentOverheal = newOverheal;
      }
      break;

    case 'royal-giant':
      // Evolved Royal Giant: Each attack creates knockback shockwave
      result.knockbackTargets = [{ targetId: target.id, distance: 100 }]; // 2.5 tiles
      break;

    case 'valkyrie':
      // Evolved Valkyrie: Each attack pulls enemies in (tornado effect)
      // Simplified: applies slow effect as "pull"
      result.statusEffectsToApply = [{
        targetId: target.id,
        effect: {
          type: 'slow',
          value: 0.5, // 50% slow
          remainingDuration: 1.5,
          sourceId: unit.id
        }
      }];
      break;

    case 'musketeer':
      // Evolved Musketeer: Sniper shots deal +80% damage
      // Simplified: every 3rd shot is a sniper shot
      const shotCount = (state.spawnedCount || 0) + 1;
      state.spawnedCount = shotCount;
      if (shotCount % 3 === 0) {
        result.damageMultiplier = 1.8;
      }
      break;

    case 'electro-dragon':
      // Evolved Electro Dragon: Infinite chain lightning (simplified)
      result.damageMultiplier = 1.2; // Represents chain damage
      break;

    case 'hunter':
      // Evolved Hunter: Throws net immobilizing troops for 3s
      if (!target.isFlying || true) { // Net grounds flying units too
        result.statusEffectsToApply = [{
          targetId: target.id,
          effect: {
            type: 'stun',
            value: 1,
            remainingDuration: 3.0,
            sourceId: unit.id
          }
        }];
      }
      break;

    case 'executioner':
      // Evolved Executioner: Close-range knockback (within 3.5 tiles)
      const execDistance = Math.sqrt(
        Math.pow(target.position.x - unit.position.x, 2) + 
        Math.pow(target.position.y - unit.position.y, 2)
      );
      if (execDistance <= 140) { // 3.5 tiles
        result.damageMultiplier = 1.3;
        result.knockbackTargets = [{ targetId: target.id, distance: 60 }];
      }
      break;

    case 'firecracker':
      // Evolved Firecracker: Spark trail deals damage over time
      result.statusEffectsToApply = [{
        targetId: target.id,
        effect: {
          type: 'damage',
          value: Math.floor(unit.damage * 0.2), // 20% damage per tick
          remainingDuration: 3.0,
          sourceId: unit.id
        }
      }];
      break;

    case 'dart-goblin':
      // Evolved Dart Goblin: Poison darts with stacking damage
      const poisonStacks = (state.spawnedCount || 0) + 1;
      state.spawnedCount = poisonStacks;
      const poisonDamage = Math.floor(unit.damage * (poisonStacks >= 7 ? 0.3 : poisonStacks >= 4 ? 0.2 : 0.1));
      if (poisonDamage > 0) {
        result.statusEffectsToApply = [{
          targetId: target.id,
          effect: {
            type: 'damage',
            value: poisonDamage,
            remainingDuration: 2.0,
            sourceId: unit.id
          }
        }];
      }
      break;

    case 'royal-ghost':
      // Evolved Royal Ghost: Invisible attacks spawn Souldiers
      if (Math.random() < 0.5) { // 50% chance per attack
        result.unitsToSpawn = [{
          cardId: 'skeletons', // Souldiers are skeleton-like
          position: { 
            x: unit.position.x + (Math.random() - 0.5) * 30, 
            y: unit.position.y + (Math.random() - 0.5) * 30 
          },
          owner: unit.owner,
          count: 2
        }];
      }
      break;
  }

  evolutionState.set(unit.id, state);
  return result;
}

// Apply evolution effects on spawn/deploy
export function applyEvolutionOnSpawn(
  unit: Unit,
  evolutionState: Map<string, EvolutionState>
): EvolutionEffectResult {
  if (!unit.isEvolved) return {};
  
  const evolution = getEvolution(unit.cardId);
  if (!evolution) return {};

  const state = evolutionState.get(unit.id) || {};
  const result: EvolutionEffectResult = {};

  switch (unit.cardId) {
    case 'knight':
      // Evolved Knight: Shield while moving (60% damage reduction until first hit)
      state.shieldActive = true;
      state.shieldHitsTaken = 0;
      result.damageReduction = 0.6;
      break;

    case 'wizard':
      // Evolved Wizard: Spawns with shield that deals damage when destroyed
      state.shieldActive = true;
      state.shieldHitsTaken = 0;
      result.damageReduction = 0.4;
      break;

    case 'royal-recruits':
      // Evolved Royal Recruits: Charge after shield breaks
      state.shieldActive = true;
      state.shieldHitsTaken = 0;
      break;

    case 'royal-hogs':
      // Evolved Royal Hogs: Spawn flying, first attack deals 155% damage
      state.spawnedCount = 0; // Track first attack
      break;

    case 'ice-spirit':
      // Evolved Ice Spirit: Double freeze effect
      state.spawnedCount = 0; // Track freeze applications
      break;
  }

  evolutionState.set(unit.id, state);
  return result;
}

// Apply evolution effects on taking damage
export function applyEvolutionOnDamage(
  unit: Unit,
  damageAmount: number,
  evolutionState: Map<string, EvolutionState>,
  currentTime: number
): EvolutionEffectResult {
  if (!unit.isEvolved) return {};
  
  const evolution = getEvolution(unit.cardId);
  if (!evolution) return {};

  const state = evolutionState.get(unit.id) || {};
  const result: EvolutionEffectResult = {};

  switch (unit.cardId) {
    case 'knight':
      // Evolved Knight: Shield breaks on first hit
      if (state.shieldActive) {
        result.damageReduction = 0.6;
        state.shieldActive = false;
      }
      break;

    case 'wizard':
      // Evolved Wizard: Shield explodes when destroyed
      if (state.shieldActive && unit.health - damageAmount <= unit.maxHealth * 0.5) {
        state.shieldActive = false;
        // Shield explosion deals damage in radius (handled elsewhere)
        result.knockbackTargets = []; // Would populate with nearby enemies
      }
      break;

    case 'goblin-giant':
      // Evolved Goblin Giant: Spawns Goblins at 50% HP
      const threshold = unit.maxHealth * 0.5;
      if (unit.health > threshold && unit.health - damageAmount <= threshold) {
        result.unitsToSpawn = [{
          cardId: 'goblins',
          position: { 
            x: unit.position.x - 15, 
            y: unit.position.y + 10 
          },
          owner: unit.owner,
          count: 1
        }];
      }
      break;

    case 'royal-recruits':
      // Evolved Royal Recruits: Charge when shield breaks
      if (state.shieldActive && damageAmount >= 50) { // Shield hit
        state.shieldHitsTaken = (state.shieldHitsTaken || 0) + 1;
        if (state.shieldHitsTaken >= 2) {
          state.shieldActive = false;
          result.speedMultiplier = 2.0; // Very Fast charge
          result.damageMultiplier = 2.0; // 2x damage on charge
        }
      }
      break;
  }

  evolutionState.set(unit.id, state);
  return result;
}

// Apply evolution effects on unit death
export function applyEvolutionOnDeath(
  unit: Unit,
  evolutionState: Map<string, EvolutionState>,
  currentTime: number
): EvolutionEffectResult {
  if (!unit.isEvolved) return {};
  
  const evolution = getEvolution(unit.cardId);
  if (!evolution) return {};

  const result: EvolutionEffectResult = {};

  switch (unit.cardId) {
    case 'lumberjack':
      // Evolved Lumberjack: Death spawns invincible Ghost
      result.unitsToSpawn = [{
        cardId: 'skeletons', // Ghost represented as skeleton
        position: unit.position,
        owner: unit.owner,
        count: 1
      }];
      result.shouldTriggerRage = true; // Rage spell effect
      break;

    case 'ice-spirit':
      // Evolved Ice Spirit: Leaves freeze zone on death
      result.statusEffectsToApply = []; // Would freeze nearby enemies
      break;
  }

  // Clean up evolution state
  evolutionState.delete(unit.id);
  
  return result;
}

// Check if unit should get rage bonus from evolution state
export function getEvolutionRageBonus(
  unit: Unit,
  evolutionState: Map<string, EvolutionState>,
  currentTime: number
): { speedMultiplier: number; attackSpeedMultiplier: number } {
  const state = evolutionState.get(unit.id);
  if (!state) return { speedMultiplier: 1, attackSpeedMultiplier: 1 };

  // Barbarians rage effect
  if (unit.cardId === 'barbarians' && state.rageEndTime && currentTime < state.rageEndTime) {
    return { speedMultiplier: 1.35, attackSpeedMultiplier: 1.35 };
  }

  return { speedMultiplier: 1, attackSpeedMultiplier: 1 };
}

// Get evolution damage reduction (shields)
export function getEvolutionDamageReduction(
  unit: Unit,
  evolutionState: Map<string, EvolutionState>
): number {
  if (!unit.isEvolved) return 0;
  
  const state = evolutionState.get(unit.id);
  if (!state) return 0;

  // Knight's moving shield
  if (unit.cardId === 'knight' && state.shieldActive && unit.state === 'moving') {
    return 0.6; // 60% reduction
  }

  // Wizard's spawn shield
  if (unit.cardId === 'wizard' && state.shieldActive) {
    return 0.4; // 40% reduction
  }

  return 0;
}
