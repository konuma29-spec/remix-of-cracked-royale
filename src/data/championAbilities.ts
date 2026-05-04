// Champion Ability Definitions - Accurate to Clash Royale
// Each champion has a unique active ability that costs elixir to use

export type ChampionAbilityType = 
  | 'dash-chain'      // Golden Knight - Dashing Dash
  | 'cloak'           // Archer Queen - Cloaking Cape
  | 'soul-summon'     // Skeleton King - Soul Summoning
  | 'drill'           // Mighty Miner - Explosive Escape
  | 'guardian'        // Little Prince - Royal Rescue
  | 'reflect'         // Monk - Pensive Protection

export interface ChampionAbility {
  id: ChampionAbilityType;
  name: string;
  description: string;
  elixirCost: number; // Elixir cost to activate the ability
  cooldown: number; // Seconds between ability activations
  duration?: number; // Duration of the ability effect in seconds
  triggerCondition: 'active' | 'passive-active'; // Active = manual, passive-active = collects then activates
  // Specific ability parameters
  maxDashes?: number; // Golden Knight
  dashRange?: number; // Golden Knight dash range in tiles
  damageBoost?: number; // Archer Queen damage multiplier
  maxSouls?: number; // Skeleton King max souls
  skeletonsPerSoul?: number; // How many skeletons spawn
  bombDamage?: number; // Mighty Miner bomb
  guardianHealth?: number; // Little Prince guardian
  damageReduction?: number; // Monk damage reduction
  reflectDamage?: boolean; // Monk reflects projectiles
}

export const CHAMPION_ABILITIES: Record<string, ChampionAbility> = {
  'golden-knight': {
    id: 'dash-chain',
    name: 'Dashing Dash',
    description: 'Dashes between up to 10 enemies, dealing damage and being invincible during dashes',
    elixirCost: 1,
    cooldown: 8,
    triggerCondition: 'active',
    maxDashes: 10,
    dashRange: 5.5 // tiles
  },
  'archer-queen': {
    id: 'cloak',
    name: 'Cloaking Cape',
    description: 'Becomes invisible and gains increased attack speed for 3.5 seconds',
    elixirCost: 1,
    cooldown: 17,
    duration: 3.5,
    triggerCondition: 'active',
    damageBoost: 1.5 // 50% more damage during cloak
  },
  'skeleton-king': {
    id: 'soul-summon',
    name: 'Soul Summoning',
    description: 'Collects souls from nearby fallen enemies. Activate to spawn skeletons (6-16 based on souls)',
    elixirCost: 2,
    cooldown: 0, // No cooldown, but needs souls
    triggerCondition: 'passive-active',
    maxSouls: 16,
    skeletonsPerSoul: 1
  },
  'mighty-miner': {
    id: 'drill',
    name: 'Explosive Escape',
    description: 'Burrows to target location and drops a bomb dealing area damage',
    elixirCost: 1,
    cooldown: 15,
    triggerCondition: 'active',
    bombDamage: 332
  },
  'little-prince': {
    id: 'guardian',
    name: 'Royal Rescue',
    description: 'Summons the Guardian who charges forward, knocking back and damaging enemies',
    elixirCost: 3,
    cooldown: 0, // Can use whenever have elixir
    triggerCondition: 'active',
    guardianHealth: 1600
  },
  'monk': {
    id: 'reflect',
    name: 'Pensive Protection',
    description: 'Reflects incoming projectiles and reduces damage taken by 65% for 4 seconds',
    elixirCost: 1,
    cooldown: 17,
    duration: 4,
    triggerCondition: 'active',
    damageReduction: 0.65,
    reflectDamage: true
  }
};

export function getChampionAbility(cardId: string): ChampionAbility | null {
  return CHAMPION_ABILITIES[cardId] || null;
}

// Ability state tracking for units
export interface ChampionAbilityState {
  type: ChampionAbilityType;
  lastActivationTime: number;
  isActive: boolean;
  stacks: number; // For soul-summon tracking (souls collected)
  remainingDuration: number;
  hasTriggered: boolean; // For one-time triggers
  dashesRemaining?: number; // Golden Knight dashes left
  isDashing?: boolean; // Golden Knight is mid-dash
}

export function createAbilityState(cardId: string): ChampionAbilityState | null {
  const ability = getChampionAbility(cardId);
  if (!ability) return null;
  
  return {
    type: ability.id,
    lastActivationTime: 0,
    isActive: false,
    stacks: 0, // Souls for skeleton king
    remainingDuration: 0,
    hasTriggered: false,
    dashesRemaining: ability.id === 'dash-chain' ? ability.maxDashes : undefined,
    isDashing: false
  };
}
