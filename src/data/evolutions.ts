// Evolution data for all cards that have evolutions in Clash Royale
// 6 evolution shards unlock an evolution for any card
// Based on official Clash Royale evolutions (excludes Mega Knight per user request)

export interface Evolution {
  cardId: string;
  name: string;
  emoji: string;
  description: string;
  // Evolution bonuses (applied as multipliers or flat bonuses)
  healthBonus: number; // Percentage increase (e.g., 0.10 = +10%)
  damageBonus: number;
  specialEffect: string; // Description of special ability
  cycles: number; // Number of cycles needed to evolve (1 or 2)
}

// All official Clash Royale evolutions (33 total, excluding Mega Knight)
export const evolutions: Evolution[] = [
  // Common evolutions
  {
    cardId: 'barbarians',
    name: 'Evolved Barbarians',
    emoji: '⚔️✨',
    description: 'Rage when attacking',
    healthBonus: 0.10,
    damageBonus: 0,
    specialEffect: '+35% attack speed and movement speed for 3s every time they attack',
    cycles: 1
  },
  {
    cardId: 'skeletons',
    name: 'Evolved Skeletons',
    emoji: '💀✨',
    description: 'Replicate when attacking',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Each attack spawns another Skeleton (max 8 Skeletons)',
    cycles: 2
  },
  {
    cardId: 'knight',
    name: 'Evolved Knight',
    emoji: '⚔️✨',
    description: 'Shield while moving',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '60% damage reduction shield while moving or deploying until first hit',
    cycles: 2
  },
  {
    cardId: 'archers',
    name: 'Evolved Archers',
    emoji: '🏹✨',
    description: 'Bonus damage at range',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '+20% range, +50% damage to enemies 4-6 tiles away',
    cycles: 2
  },
  {
    cardId: 'bomber',
    name: 'Evolved Bomber',
    emoji: '💣✨',
    description: 'Bouncing bombs',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Bombs bounce twice after initial hit (2.5 tiles apart each)',
    cycles: 2
  },
  {
    cardId: 'bats',
    name: 'Evolved Bats',
    emoji: '🦇✨',
    description: 'Heal when attacking',
    healthBonus: 0.50,
    damageBonus: 0,
    specialEffect: 'Heal on attack, can overheal to double max HP',
    cycles: 2
  },

  // Rare evolutions
  {
    cardId: 'royal-giant',
    name: 'Evolved Royal Giant',
    emoji: '🗿✨',
    description: 'Shockwave attacks',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Each attack creates a 2.5-tile knockback shockwave',
    cycles: 1
  },
  {
    cardId: 'valkyrie',
    name: 'Evolved Valkyrie',
    emoji: '🪓✨',
    description: 'Tornado on attack',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Each attack summons a Tornado pulling enemies in 5.5-tile radius',
    cycles: 2
  },
  {
    cardId: 'musketeer',
    name: 'Evolved Musketeer',
    emoji: '🎯✨',
    description: 'Sniper shots',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '3 sniper shots dealing +80% damage with infinite vertical range',
    cycles: 2
  },
  {
    cardId: 'wizard',
    name: 'Evolved Wizard',
    emoji: '🔥✨',
    description: 'Spawns with shield',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Shield that deals damage and knockback in 3-tile radius when destroyed',
    cycles: 1
  },
  {
    cardId: 'baby-dragon',
    name: 'Evolved Baby Dragon',
    emoji: '🐉✨',
    description: 'Wind burst aura',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Creates wind burst: -30% enemy speed, +50% ally speed for 5s',
    cycles: 2
  },
  {
    cardId: 'battle-ram',
    name: 'Evolved Battle Ram',
    emoji: '🐏✨',
    description: 'Repeated ramming',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Knockback on charge, double damage, repeatedly rams until destroyed. Spawns Evolved Barbarians',
    cycles: 2
  },

  // Epic evolutions
  {
    cardId: 'goblin-barrel',
    name: 'Evolved Goblin Barrel',
    emoji: '🛢️✨',
    description: 'Decoy barrel',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Spawns 2 barrels mirrored. One has real Goblins, other has weaker decoys',
    cycles: 2
  },
  {
    cardId: 'goblin-giant',
    name: 'Evolved Goblin Giant',
    emoji: '🧌✨',
    description: 'Spawns Goblins at 50% HP',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'At 50% HP, spawns a Goblin every 2.2s behind him',
    cycles: 1
  },
  {
    cardId: 'pekka',
    name: 'Evolved P.E.K.K.A',
    emoji: '🦾✨',
    description: 'Butterfly healing',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Defeating units spawns healing butterfly. Can overheal to +66% max HP',
    cycles: 1
  },
  {
    cardId: 'witch',
    name: 'Evolved Witch',
    emoji: '🧙‍♀️✨',
    description: 'Heals from Skeleton deaths',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'When her Skeletons die, Witch heals. Can overheal to 124% HP',
    cycles: 1
  },
  {
    cardId: 'electro-dragon',
    name: 'Evolved Electro Dragon',
    emoji: '🐲✨',
    description: 'Infinite chain lightning',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Lightning chains infinitely. After 3rd chain: no stun, -33% damage',
    cycles: 1
  },
  {
    cardId: 'lumberjack',
    name: 'Evolved Lumberjack',
    emoji: '🪓✨',
    description: 'Ghost on death',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Death spawns invincible Ghost that attacks until Rage expires',
    cycles: 2
  },
  {
    cardId: 'hunter',
    name: 'Evolved Hunter',
    emoji: '🔫✨',
    description: 'Net trap ability',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Throws net immobilizing troops for 3s. Grounds flying units. 5s cooldown',
    cycles: 2
  },
  {
    cardId: 'executioner',
    name: 'Evolved Executioner',
    emoji: '🪓✨',
    description: 'Close-range knockback',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Axe deals extra damage and 1.5-tile knockback within 3.5 tiles',
    cycles: 1
  },
  {
    cardId: 'inferno-dragon',
    name: 'Evolved Inferno Dragon',
    emoji: '🔥🐉✨',
    description: 'Retains damage stage',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Keeps damage stage between targets for 9s. 4th stage at 20s deals 2x damage',
    cycles: 2
  },
  {
    cardId: 'skeleton-barrel',
    name: 'Evolved Skeleton Barrel',
    emoji: '🎈💀✨',
    description: 'Double barrel drop',
    healthBonus: 0.25,
    damageBonus: 0.61,
    specialEffect: '+1 barrel. Drops at 75% HP and on death. Each spawns 7 Skeletons',
    cycles: 2
  },

  // Buildings evolutions
  {
    cardId: 'mortar',
    name: 'Evolved Mortar',
    emoji: '💥✨',
    description: 'Spawns Goblins',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '-20% attack period. Each shot spawns a Goblin where it lands',
    cycles: 2
  },
  {
    cardId: 'tesla',
    name: 'Evolved Tesla',
    emoji: '⚡✨',
    description: 'Stun pulse on deploy',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Surfaces with 6-tile radius electric pulse dealing damage and 0.5s stun',
    cycles: 2
  },
  {
    cardId: 'cannon',
    name: 'Evolved Cannon',
    emoji: '🔫✨',
    description: 'Bomb rain on deploy',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Deploys with 9 bombs raining from sky dealing damage and knockback',
    cycles: 2
  },
  {
    cardId: 'goblin-cage',
    name: 'Evolved Goblin Cage',
    emoji: '🗡️✨',
    description: 'Traps enemies',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Drags ground troops into cage. Brawler hits trapped troop every 1s, immune to damage',
    cycles: 1
  },
  {
    cardId: 'goblin-drill',
    name: 'Evolved Goblin Drill',
    emoji: '⛏️✨',
    description: 'Rotates around tower',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'At 66% and 33% HP, rotates 90° around Crown Tower spawning Goblins',
    cycles: 2
  },
  {
    cardId: 'furnace',
    name: 'Evolved Furnace',
    emoji: '🔥✨',
    description: 'Faster spawns while attacking',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'While attacking, spawn period reduced to 2.4s, alternating left/right',
    cycles: 2
  },

  // Spell evolutions
  {
    cardId: 'zap',
    name: 'Evolved Zap',
    emoji: '⚡✨',
    description: 'Expanding radius',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'After initial Zap, radius stays and grows 0.5 tiles with same stun and damage',
    cycles: 2
  },
  {
    cardId: 'giant-snowball',
    name: 'Evolved Giant Snowball',
    emoji: '❄️✨',
    description: 'Pulls instead of pushes',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '+25% slow duration. Rolls 4.5 tiles pulling all troops in its path',
    cycles: 2
  },

  // Other troop evolutions
  {
    cardId: 'firecracker',
    name: 'Evolved Firecracker',
    emoji: '🧨✨',
    description: 'Spark trail effect',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Attack leaves sparks dealing damage every 0.25s for 3s. -15% enemy speed',
    cycles: 2
  },
  {
    cardId: 'royal-recruits',
    name: 'Evolved Royal Recruits',
    emoji: '🛡️✨',
    description: 'Charge after shield breaks',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'When shield is knocked off after 2.5 tiles, charges at Very Fast with 2x damage',
    cycles: 1
  },
  {
    cardId: 'ice-spirit',
    name: 'Evolved Ice Spirit',
    emoji: '❄️✨',
    description: 'Double freeze',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '+33% splash radius. Freezes 1.1s, then again after 3s. Leaves freeze zone on death',
    cycles: 2
  },
  {
    cardId: 'wall-breakers',
    name: 'Evolved Wall Breakers',
    emoji: '💣✨',
    description: 'Continue after barrel breaks',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Barrel break deals damage. Continue running Very Fast, deal 50% damage on impact',
    cycles: 2
  },
  {
    cardId: 'dart-goblin',
    name: 'Evolved Dart Goblin',
    emoji: '🎯✨',
    description: 'Poison darts',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Attacks apply stacking poison. Level 2 at 4 hits, Level 3 at 7 hits. Poison trail',
    cycles: 2
  },
  {
    cardId: 'skeleton-army',
    name: 'Evolved Skeleton Army',
    emoji: '💀⚔️✨',
    description: 'Skeleton General',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: '+1 Skeleton. Includes General with shield. Dead Skeletons become invisible until General dies',
    cycles: 2
  },
  {
    cardId: 'royal-ghost',
    name: 'Evolved Royal Ghost',
    emoji: '👻✨',
    description: 'Spawns Souldiers',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Invisible attacks spawn 2 Souldiers with 51% damage and 6.7% HP',
    cycles: 2
  },
  {
    cardId: 'royal-hogs',
    name: 'Evolved Royal Hogs',
    emoji: '🐗✨',
    description: 'Flying start',
    healthBonus: 0,
    damageBonus: 0,
    specialEffect: 'Spawn flying. Fall damage deals 155% of normal damage on first attack',
    cycles: 2
  }
];

// Get evolution data for a specific card
export function getEvolution(cardId: string): Evolution | undefined {
  return evolutions.find(e => e.cardId === cardId);
}

// Check if a card has an available evolution
export function hasEvolution(cardId: string): boolean {
  return evolutions.some(e => e.cardId === cardId);
}

// Get all card IDs that have evolutions
export function getEvolvableCardIds(): string[] {
  return evolutions.map(e => e.cardId);
}

// Shards required to unlock an evolution
export const EVOLUTION_SHARDS_REQUIRED = 6;
