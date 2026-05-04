// Card leveling system - similar to Clash Royale
// Level requirements double each level: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384

// Copies required to REACH each level (cumulative)
// Level 1: 0 copies (start)
// Level 2: 2 copies
// Level 3: 4 copies (2 + 2)
// Level 4: 8 copies (4 + 4)
// Level 5: 16 copies
// Level 6: 32 copies
// Level 7: 64 copies
// Level 8: 128 copies
// Level 9: 256 copies
// Level 10: 512 copies
// Level 11: 1024 copies
// Level 12: 2048 copies
// Level 13: 4096 copies
// Level 14: 8192 copies
// Level 15: 16384 copies (max level)

export const MAX_LEVEL = 15;

// Copies needed to reach each level (index = level - 1)
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  2,      // Level 2
  4,      // Level 3
  8,      // Level 4
  16,     // Level 5
  32,     // Level 6
  64,     // Level 7
  128,    // Level 8
  256,    // Level 9
  512,    // Level 10
  1024,   // Level 11
  2048,   // Level 12
  4096,   // Level 13
  8192,   // Level 14
  16384,  // Level 15
];

/**
 * Calculate the level of a card based on the number of copies collected
 */
export function getCardLevel(copies: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (copies >= LEVEL_THRESHOLDS[i]) {
      return i + 1; // Level is 1-indexed
    }
  }
  return 1;
}

/**
 * Get copies required for the next level
 */
export function getCopiesForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return LEVEL_THRESHOLDS[currentLevel]; // Next level threshold
}

/**
 * Get progress towards the next level (0-1)
 */
export function getLevelProgress(copies: number): { current: number; required: number; progress: number } {
  const level = getCardLevel(copies);
  
  if (level >= MAX_LEVEL) {
    return { current: 0, required: 0, progress: 1 };
  }
  
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level];
  const copiesInLevel = copies - currentThreshold;
  const copiesNeeded = nextThreshold - currentThreshold;
  
  return {
    current: copiesInLevel,
    required: copiesNeeded,
    progress: copiesInLevel / copiesNeeded
  };
}

/**
 * Get stat multiplier based on level
 * Each level adds ~10% to stats (compound)
 */
export function getLevelMultiplier(level: number): number {
  return Math.pow(1.1, level - 1);
}

/**
 * Apply level scaling to a stat value
 */
export function scaleStatByLevel(baseStat: number, level: number): number {
  return Math.floor(baseStat * getLevelMultiplier(level));
}
