export interface Position {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: 'king' | 'princess';
  owner: 'player' | 'enemy';
  position: Position;
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  isActivated?: boolean; // King tower only attacks when activated (damaged)
  level?: number; // Tower level (1-15)
}

// Spell effect types
export type SpellEffectType = 'damage' | 'freeze' | 'slow' | 'stun' | 'knockback' | 'heal';

export interface SpellEffect {
  type: SpellEffectType;
  value: number; // damage amount, slow %, stun duration, etc.
  duration?: number; // for duration-based effects (seconds)
}

export interface CardDefinition {
  id: string;
  name: string;
  type: 'troop' | 'tank' | 'mini-tank' | 'spell' | 'building';
  elixirCost: number;
  emoji: string;
  health: number;
  damage: number;
  attackSpeed: number; // Attacks per second (higher = faster)
  moveSpeed: number; // Movement speed (higher = faster)
  range: number; // Attack range in pixels
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'champion';
  color: string;
  deployCooldown: number; // Cooldown in seconds before unit can act after spawn
  
  // Size affects visual scale and movement speed
  // 'small' = 15% faster, 'medium' = normal, 'large' = 15% slower
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  
  // Combat properties for counterplay
  isFlying: boolean; // Air units - only targetable by air-targeting units
  targetType: 'ground' | 'air' | 'both' | 'buildings'; // What this unit can attack
  splashRadius?: number; // Optional - units with splash deal damage in this radius
  count?: number; // Number of units spawned (for swarm cards like Skeletons, Goblins)
  hitSpeed?: number; // Time between attacks in seconds (alternative to attackSpeed)
  
  // Spell-specific properties
  spellRadius?: number; // Area of effect for spells
  spellEffects?: SpellEffect[]; // Effects applied by the spell
  spellDuration?: number; // Duration for lingering spells like Poison
  
  // Building-specific properties
  buildingLifetime?: number; // Lifetime in seconds before building expires
  spawnInterval?: number; // For spawner buildings - seconds between spawns
  spawnCardId?: string; // Card ID of unit to spawn
  spawnCount?: number; // Number of units to spawn each interval
  
  // Champion ability
  championAbility?: string; // Ability type ID for champions
  
  // Evolution cycle tracking (runtime only - tracks if card has cycled)
  hasEvoCycled?: boolean;
  
  // Evolution flag - indicates this is an evolved version of a card
  isEvolved?: boolean;
}

export interface Unit {
  id: string;
  cardId: string;
  owner: 'player' | 'enemy';
  position: Position;
  health: number;
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
  lastAttackTime: number;
  targetId: string | null;
  state: 'idle' | 'moving' | 'attacking';
  animationFrame: number;
  direction: 'up' | 'down';
  deployCooldown: number; // Remaining deploy cooldown before unit can act
  level: number; // Card level (1-15)
  
  // Combat properties
  isFlying: boolean;
  targetType: 'ground' | 'air' | 'both' | 'buildings';
  splashRadius?: number;
  count: number; // Number of units in this group
  
  // Size affects visual scale
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  
  // Status effects
  statusEffects: StatusEffect[];
  
  // Spawning properties (for units like Witch)
  spawnInterval?: number; // Seconds between spawns
  spawnCardId?: string; // Card ID of unit to spawn
  spawnCount?: number; // Number of units to spawn
  lastSpawnTime: number; // Last spawn timestamp
  
  // Champion ability state
  abilityState?: {
    type: string;
    lastActivationTime: number;
    isActive: boolean;
    stacks: number; // For soul summon (souls collected)
    remainingDuration: number;
    hasTriggered?: boolean; // For one-time triggers like guardian
    isDashing?: boolean; // Golden Knight is mid-dash
    dashesRemaining?: number; // Golden Knight dashes left
  };
  
  // Evolution state - true if this unit is evolved (has cycled and player unlocked evolution)
  isEvolved?: boolean;
  
  // Parent unit ID - tracks which unit spawned this one (e.g., Witch's Skeletons)
  parentId?: string;
  
  // Pancake buff from Royal Chef - stacks multiplicatively
  pancakeBuffs: number; // Number of pancake buffs received (each adds 15% to damage/health)
}

export interface StatusEffect {
  type: SpellEffectType;
  value: number;
  remainingDuration: number;
  sourceId: string; // ID of the spell/unit that applied this effect
}

export interface Building {
  id: string;
  cardId: string;
  owner: 'player' | 'enemy';
  position: Position;
  health: number;
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  range: number;
  lastAttackTime: number;
  targetType: 'ground' | 'air' | 'both' | 'buildings';
  targetId?: string; // ID of the tower/building being targeted (for siege buildings)
  
  // Building-specific
  lifetime: number; // Remaining lifetime in seconds
  maxLifetime: number;
  isSpawner: boolean;
  spawnInterval?: number;
  spawnCardId?: string;
  spawnCount?: number;
  lastSpawnTime: number;
  splashRadius?: number;
}

export interface ActiveSpell {
  id: string;
  cardId: string;
  owner: 'player' | 'enemy';
  position: Position;
  radius: number;
  effects: SpellEffect[];
  remainingDuration: number; // 0 for instant spells
  damage: number;
  hasAppliedInstant: boolean; // For instant damage spells
}

export interface PlacementZone {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  isActive: boolean;
  reason: 'default' | 'tower-destroyed';
}

export interface GameState {
  playerElixir: number;
  enemyElixir: number;
  playerTowers: Tower[];
  enemyTowers: Tower[];
  playerUnits: Unit[];
  enemyUnits: Unit[];
  playerBuildings: Building[];
  enemyBuildings: Building[];
  activeSpells: ActiveSpell[];
  playerDeck: CardDefinition[];
  playerHand: CardDefinition[];
  enemyDeck: CardDefinition[];
  enemyHand: CardDefinition[];
  timeRemaining: number;
  gameStatus: 'playing' | 'player-wins' | 'enemy-wins' | 'draw';
  selectedCardIndex: number | null;
  isSuddenDeath: boolean;
  playerPlacementZones: PlacementZone[];
  enemyPlacementZones: PlacementZone[];
  playerCardCooldowns: number[]; // Remaining cooldown time for each hand slot (in seconds)
  enemyCardCooldowns: number[];
}

export interface DeckSlot {
  id: string;
  name: string;
  cardIds: string[];
}

export interface PlayerProgress {
  ownedCardIds: string[];
  cardCopies: Record<string, number>; // Track copies of each card for leveling
  currentDeck: string[];
  deckSlots: DeckSlot[];
  activeDeckId: string;
  wins: number;
  losses: number;
  chestsAvailable: number;
  lastFreeChestDate: string | null; // ISO date string for daily free chest
  // Player profile
  playerName: string;
  bannerId: string; // ID of currently equipped banner
  ownedBannerIds: string[]; // Banners unlocked from chests
  // Currency
  gold: number;
  // Tower levels - Princess and King towers level up by collecting tower cards
  towerCopies: Record<string, number>; // 'princess' | 'king' -> copies collected
  // Evolution system
  evolutionShards: number; // Shards collected (6 unlocks one evolution)
  unlockedEvolutions: string[]; // Card IDs with unlocked evolutions
  // Wild Cards - can be used to upgrade any card of the same rarity
  wildCardCounts: Record<string, number>; // 'common' | 'rare' | 'epic' | 'legendary' | 'champion' -> count
}

// Shop item for daily refreshing shop
export interface ShopItem {
  id: string;
  cardId: string;
  price: number;
  isFreebie: boolean;
  isPurchased: boolean;
}

export interface ShopState {
  items: ShopItem[];
  lastRefreshDate: string; // ISO date string for daily refresh
}

// Card balance tracking for dynamic nerfs
export interface CardBalanceData {
  cardId: string;
  winStreak: number;
  nerfLevel: number;
  lastNerfedStat: 'damage' | 'speed' | 'health' | 'attackSpeed' | null;
}

export interface ChestReward {
  cards: { cardId: string; isNew: boolean }[];
  towerCards?: { towerId: string; count: number }[]; // Tower cards for leveling towers
  bannerId?: string; // Optional banner unlock from chest
  goldEarned?: number; // Gold earned from chest
  stars?: number; // Number of stars earned during chest opening (1-5)
  evolutionShards?: number; // Evolution shards (only from 5-star chests)
  wildCards?: { rarity: string; count: number }[]; // Wild cards earned from chest
  towerTroopUnlock?: string; // Tower troop ID unlocked from chest
}

// Available banners in the game
export interface Banner {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'champion';
  color: string;
}
