import { GameState, CardDefinition, Position, Unit, Tower } from '@/types/game';

const ARENA_WIDTH = 400;

interface LaneState {
  left: { playerUnits: number; playerDamage: number; playerHealth: number; enemyUnits: number; enemyDamage: number };
  right: { playerUnits: number; playerDamage: number; playerHealth: number; enemyUnits: number; enemyDamage: number };
}

// Track which lane AI last placed in to force alternation
let lastPlacedLane: 'left' | 'right' | null = null;
let consecutiveSameLane = 0;

function analyzeLanes(state: GameState): LaneState {
  const midX = ARENA_WIDTH / 2;
  
  const left = { playerUnits: 0, playerDamage: 0, playerHealth: 0, enemyUnits: 0, enemyDamage: 0 };
  const right = { playerUnits: 0, playerDamage: 0, playerHealth: 0, enemyUnits: 0, enemyDamage: 0 };
  
  state.playerUnits.forEach(u => {
    if (u.health > 0) {
      if (u.position.x < midX) {
        left.playerUnits++;
        left.playerDamage += u.damage;
        left.playerHealth += u.health;
      } else {
        right.playerUnits++;
        right.playerDamage += u.damage;
        right.playerHealth += u.health;
      }
    }
  });
  
  state.enemyUnits.forEach(u => {
    if (u.health > 0) {
      if (u.position.x < midX) {
        left.enemyUnits++;
        left.enemyDamage += u.damage;
      } else {
        right.enemyUnits++;
        right.enemyDamage += u.damage;
      }
    }
  });
  
  return { left, right };
}

function getTowerHealth(towers: Tower[], side: 'left' | 'right' | 'king'): number {
  const tower = towers.find(t => {
    if (side === 'king') return t.type === 'king';
    if (side === 'left') return t.type === 'princess' && t.position.x < ARENA_WIDTH / 2;
    return t.type === 'princess' && t.position.x > ARENA_WIDTH / 2;
  });
  return tower?.health ?? 0;
}

function getTowerMaxHealth(towers: Tower[], side: 'left' | 'right' | 'king'): number {
  const tower = towers.find(t => {
    if (side === 'king') return t.type === 'king';
    if (side === 'left') return t.type === 'princess' && t.position.x < ARENA_WIDTH / 2;
    return t.type === 'princess' && t.position.x > ARENA_WIDTH / 2;
  });
  return tower?.maxHealth ?? 100;
}

/** Decide which lane to play in, forcing lane diversity */
function chooseLane(
  lanes: LaneState,
  enemyTowers: Tower[],
  playerTowers: Tower[]
): 'left' | 'right' | 'center' {
  const leftPlayerThreat = lanes.left.playerDamage + lanes.left.playerUnits * 5;
  const rightPlayerThreat = lanes.right.playerDamage + lanes.right.playerUnits * 5;
  
  const leftEnemyPresence = lanes.left.enemyUnits;
  const rightEnemyPresence = lanes.right.enemyUnits;
  
  const leftPrincessHp = getTowerHealth(playerTowers, 'left');
  const rightPrincessHp = getTowerHealth(playerTowers, 'right');
  const leftEnemyPrincessHp = getTowerHealth(enemyTowers, 'left');
  const rightEnemyPrincessHp = getTowerHealth(enemyTowers, 'right');
  
  // If a princess tower is down, push king through center
  if (leftEnemyPrincessHp <= 0 || rightEnemyPrincessHp <= 0) {
    // But still defend if under heavy attack
    if (leftPlayerThreat > 40) return 'left';
    if (rightPlayerThreat > 40) return 'right';
    return 'center';
  }
  
  // CRITICAL: Force lane switching if we've been stacking one lane
  if (consecutiveSameLane >= 2) {
    // Must switch lanes unless one lane has extreme threat
    const forcedLane = lastPlacedLane === 'left' ? 'right' : 'left';
    // Only override if the other lane doesn't have massive threat
    const otherLaneThreat = forcedLane === 'left' ? leftPlayerThreat : rightPlayerThreat;
    if (otherLaneThreat < 60) {
      return forcedLane;
    }
  }
  
  // Defend lane under heavy attack
  if (leftPlayerThreat > 30 && leftPlayerThreat > rightPlayerThreat * 1.5) return 'left';
  if (rightPlayerThreat > 30 && rightPlayerThreat > leftPlayerThreat * 1.5) return 'right';
  
  // Defend low-health tower
  const leftMaxHp = getTowerMaxHealth(playerTowers, 'left');
  const rightMaxHp = getTowerMaxHealth(playerTowers, 'right');
  if (leftPrincessHp > 0 && leftPrincessHp < leftMaxHp * 0.3 && leftPlayerThreat > 10) return 'left';
  if (rightPrincessHp > 0 && rightPrincessHp < rightMaxHp * 0.3 && rightPlayerThreat > 10) return 'right';
  
  // Attack the weaker enemy tower, but prefer the lane with fewer of our units (split push)
  const leftScore = (leftEnemyPresence < 2 ? 10 : 0) 
    + (leftEnemyPrincessHp < rightEnemyPrincessHp ? 15 : 0)
    + (leftPlayerThreat > 0 ? -5 : 5); // avoid stacking into player push
  const rightScore = (rightEnemyPresence < 2 ? 10 : 0) 
    + (rightEnemyPrincessHp < leftEnemyPrincessHp ? 15 : 0)
    + (rightPlayerThreat > 0 ? -5 : 5);
  
  // Add bonus for switching lanes
  const leftBonus = lastPlacedLane === 'right' ? 8 : (lastPlacedLane === 'left' ? -5 : 0);
  const rightBonus = lastPlacedLane === 'left' ? 8 : (lastPlacedLane === 'right' ? -5 : 0);
  
  return (leftScore + leftBonus) >= (rightScore + rightBonus) ? 'left' : 'right';
}

function selectBestCard(
  hand: CardDefinition[], 
  elixir: number, 
  lanes: LaneState,
  enemyTowers: Tower[],
  playerTowers: Tower[],
  targetLane: 'left' | 'right' | 'center'
): { card: CardDefinition; index: number } | null {
  const affordable = hand
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => card.elixirCost <= elixir);
  
  if (affordable.length === 0) return null;
  
  const isDefending = targetLane !== 'center' && 
    (targetLane === 'left' ? lanes.left.playerDamage : lanes.right.playerDamage) > 20;
  
  const laneThreat = targetLane === 'center' ? 0 :
    targetLane === 'left' ? lanes.left.playerDamage : lanes.right.playerDamage;
  
  const lanePlayerUnits = targetLane === 'center' ? 0 :
    targetLane === 'left' ? lanes.left.playerUnits : lanes.right.playerUnits;
  
  let bestChoice: { card: CardDefinition; idx: number; score: number } | null = null;
  
  for (const { card, idx } of affordable) {
    let score = 0;
    
    // Base value efficiency
    score += (card.health + card.damage * 5) / card.elixirCost;
    
    if (isDefending) {
      // Defense: prefer tanky units and ranged/splash
      if (card.type === 'tank' || card.type === 'mini-tank') score += 20;
      if (card.range > 80) score += 15;
      // Counter swarms with splash
      if (lanePlayerUnits >= 3 && card.range > 60) score += 20;
      // Cheap defensive units are great
      if (card.elixirCost <= 3) score += 10;
    } else {
      // Offense: build a balanced push
      const laneEnemyUnits = targetLane === 'left' ? lanes.left.enemyUnits : 
                             targetLane === 'center' ? 0 : lanes.right.enemyUnits;
      
      // If lane is empty, start with a tank from the back
      if (laneEnemyUnits === 0) {
        if (card.type === 'tank') score += 25;
        if (card.type === 'mini-tank') score += 15;
      } else {
        // Lane has support, add damage dealers behind
        if (card.range > 80) score += 20;
        if (card.moveSpeed > 0.6) score += 10;
      }
      
      // Punish opponent's weak lane
      const targetTowerHp = targetLane === 'center' ? 
        getTowerHealth(enemyTowers, 'king') :
        getTowerHealth(enemyTowers, targetLane);
      const targetMaxHp = targetLane === 'center' ?
        getTowerMaxHealth(enemyTowers, 'king') :
        getTowerMaxHealth(enemyTowers, targetLane);
      
      if (targetTowerHp < targetMaxHp * 0.4 && targetTowerHp > 0) {
        // Tower is low, send fast finishers
        if (card.moveSpeed > 0.5) score += 15;
        score += 10;
      }
    }
    
    // Elixir management: don't overspend when low
    if (elixir < 5 && card.elixirCost >= 5) score -= 15;
    // At max elixir, play something to not waste
    if (elixir >= 9) score += 5;
    
    if (!bestChoice || score > bestChoice.score) {
      bestChoice = { card, idx, score };
    }
  }
  
  return bestChoice ? { card: bestChoice.card, index: bestChoice.idx } : null;
}

function selectPlacementPosition(
  card: CardDefinition,
  targetLane: 'left' | 'right' | 'center',
  lanes: LaneState,
  isDefending: boolean
): Position {
  let targetX: number;
  
  if (targetLane === 'center') {
    targetX = ARENA_WIDTH / 2 + (Math.random() - 0.5) * 40;
  } else if (targetLane === 'left') {
    targetX = 80 + Math.random() * 40; // 80-120
  } else {
    targetX = ARENA_WIDTH - 120 + Math.random() * 40; // 280-320
  }
  
  targetX = Math.max(40, Math.min(ARENA_WIDTH - 40, targetX));
  
  // Y positioning based on role
  let targetY: number;
  if (isDefending) {
    // Place defensively near own towers
    if (card.type === 'tank' || card.type === 'mini-tank') {
      targetY = 120 + Math.random() * 30;
    } else {
      targetY = 100 + Math.random() * 30;
    }
  } else {
    // Offensive placement
    if (card.type === 'tank') {
      targetY = 190 + Math.random() * 30; // Tanks start from back for push buildup
    } else if (card.range > 80) {
      targetY = 150 + Math.random() * 20; // Ranged behind tanks
    } else {
      targetY = 165 + Math.random() * 30;
    }
  }
  
  return { x: targetX, y: targetY };
}

export interface AIDecision {
  shouldPlay: boolean;
  cardIndex?: number;
  position?: Position;
  card?: CardDefinition;
}

export function makeAIDecision(state: GameState, lastPlayTime: number): AIDecision {
  const now = performance.now();
  const timeSinceLastPlay = now - lastPlayTime;
  
  // Faster reaction time: 1.5-3 seconds between plays
  const minDelay = 1500 + Math.random() * 1500;
  if (timeSinceLastPlay < minDelay) {
    return { shouldPlay: false };
  }
  
  // Don't play if elixir too low (but be more aggressive at 4+)
  if (state.enemyElixir < 3) {
    return { shouldPlay: false };
  }
  
  // Smart elixir management: wait for value plays but don't leak
  if (state.enemyElixir < 7 && Math.random() < 0.2) {
    return { shouldPlay: false };
  }
  
  const lanes = analyzeLanes(state);
  
  // Choose lane strategically (forces lane diversity)
  const targetLane = chooseLane(lanes, state.enemyTowers, state.playerTowers);
  
  const isDefending = targetLane !== 'center' &&
    (targetLane === 'left' ? lanes.left.playerDamage : lanes.right.playerDamage) > 20;
  
  const selection = selectBestCard(
    state.enemyHand, state.enemyElixir, lanes, 
    state.enemyTowers, state.playerTowers, targetLane
  );
  
  if (!selection) {
    return { shouldPlay: false };
  }
  
  const position = selectPlacementPosition(selection.card, targetLane, lanes, isDefending);
  
  // Track lane for diversity
  const actualLane = targetLane === 'center' ? (Math.random() < 0.5 ? 'left' : 'right') : targetLane;
  if (actualLane === lastPlacedLane) {
    consecutiveSameLane++;
  } else {
    consecutiveSameLane = 0;
  }
  lastPlacedLane = actualLane;
  
  return {
    shouldPlay: true,
    cardIndex: selection.index,
    position,
    card: selection.card
  };
}
