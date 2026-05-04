import { useState, useEffect, useCallback } from 'react';
import { allCards } from '@/data/cards';

const STORAGE_KEY = 'clash-game-card-balance';
const WIN_STREAK_THRESHOLD = 3; // Nerf after 3 consecutive wins
const NERF_PERCENTAGE = 0.10; // 10% reduction per win streak level

export interface CardPerformance {
  cardId: string;
  winStreak: number; // Consecutive games where this card dealt the most damage
  totalDamageDealt: number; // Damage dealt in current game (reset each game)
  nerfLevel: number; // How many times the card has been nerfed (stacks)
  lastNerfedStat: 'damage' | 'speed' | 'health' | 'attackSpeed' | null;
}

export interface CardBalanceState {
  performances: CardPerformance[];
  lastGameMVP: string | null; // Card that dealt most damage last game
}

const initialState: CardBalanceState = {
  performances: [],
  lastGameMVP: null
};

// Stats that can be nerfed (randomly chosen)
const NERFABLE_STATS = ['damage', 'speed', 'health', 'attackSpeed'] as const;
type NerfableStat = typeof NERFABLE_STATS[number];

function getRandomNerfStat(): NerfableStat {
  return NERFABLE_STATS[Math.floor(Math.random() * NERFABLE_STATS.length)];
}

export function useCardBalance() {
  const [balanceState, setBalanceState] = useState<CardBalanceState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load card balance state:', e);
    }
    return initialState;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(balanceState));
    } catch (e) {
      console.error('Failed to save card balance state:', e);
    }
  }, [balanceState]);

  // Get or create performance record for a card
  const getCardPerformance = useCallback((cardId: string): CardPerformance => {
    const existing = balanceState.performances.find(p => p.cardId === cardId);
    if (existing) return existing;
    return {
      cardId,
      winStreak: 0,
      totalDamageDealt: 0,
      nerfLevel: 0,
      lastNerfedStat: null
    };
  }, [balanceState.performances]);

  // Track damage dealt by a card during a game
  const trackDamage = useCallback((cardId: string, damage: number) => {
    setBalanceState(prev => {
      const performances = [...prev.performances];
      const existingIdx = performances.findIndex(p => p.cardId === cardId);
      
      if (existingIdx >= 0) {
        performances[existingIdx] = {
          ...performances[existingIdx],
          totalDamageDealt: performances[existingIdx].totalDamageDealt + damage
        };
      } else {
        performances.push({
          cardId,
          winStreak: 0,
          totalDamageDealt: damage,
          nerfLevel: 0,
          lastNerfedStat: null
        });
      }
      
      return { ...prev, performances };
    });
  }, []);

  // Called when player wins - determines MVP and applies nerfs
  const processGameEnd = useCallback((playerWon: boolean, playerCardIds: string[]) => {
    if (!playerWon) {
      // On loss, reset win streaks for all player's cards
      setBalanceState(prev => {
        const performances = prev.performances.map(p => {
          if (playerCardIds.includes(p.cardId)) {
            return { ...p, winStreak: 0, totalDamageDealt: 0 };
          }
          return { ...p, totalDamageDealt: 0 };
        });
        return { ...prev, performances, lastGameMVP: null };
      });
      return null;
    }

    // Find the MVP (card that dealt most damage)
    let mvpCardId: string | null = null;
    let maxDamage = 0;

    setBalanceState(prev => {
      const performances = [...prev.performances];
      
      // Find MVP among player's cards
      for (const perf of performances) {
        if (playerCardIds.includes(perf.cardId) && perf.totalDamageDealt > maxDamage) {
          maxDamage = perf.totalDamageDealt;
          mvpCardId = perf.cardId;
        }
      }

      if (!mvpCardId || maxDamage === 0) {
        // No clear MVP, reset damage tracking
        return {
          ...prev,
          performances: performances.map(p => ({ ...p, totalDamageDealt: 0 })),
          lastGameMVP: null
        };
      }

      // Update win streaks
      const updatedPerformances = performances.map(p => {
        if (p.cardId === mvpCardId) {
          const newWinStreak = p.winStreak + 1;
          const shouldNerf = newWinStreak >= WIN_STREAK_THRESHOLD;
          
          if (shouldNerf) {
            const nerfStat = getRandomNerfStat();
            console.log(`🔧 CARD NERFED: ${mvpCardId} - ${nerfStat} reduced (nerf level ${p.nerfLevel + 1})`);
            return {
              ...p,
              winStreak: 0, // Reset streak after nerf
              totalDamageDealt: 0,
              nerfLevel: p.nerfLevel + 1,
              lastNerfedStat: nerfStat
            };
          }
          
          return { ...p, winStreak: newWinStreak, totalDamageDealt: 0 };
        }
        
        // Reset win streak for other cards (only MVP maintains streak)
        if (playerCardIds.includes(p.cardId)) {
          return { ...p, winStreak: 0, totalDamageDealt: 0 };
        }
        
        return { ...p, totalDamageDealt: 0 };
      });

      // Ensure MVP has a record if it didn't exist
      if (!updatedPerformances.find(p => p.cardId === mvpCardId)) {
        updatedPerformances.push({
          cardId: mvpCardId,
          winStreak: 1,
          totalDamageDealt: 0,
          nerfLevel: 0,
          lastNerfedStat: null
        });
      }

      return { ...prev, performances: updatedPerformances, lastGameMVP: mvpCardId };
    });

    return mvpCardId;
  }, []);

  // Get the stat modifier for a card (returns multiplier, e.g., 0.9 for 10% nerf)
  const getCardStatModifier = useCallback((cardId: string, stat: NerfableStat): number => {
    const perf = balanceState.performances.find(p => p.cardId === cardId);
    if (!perf || perf.nerfLevel === 0) return 1.0;
    
    // Each nerf level reduces all stats slightly (compounding)
    const reduction = 1 - (NERF_PERCENTAGE * perf.nerfLevel);
    return Math.max(0.5, reduction); // Cap at 50% reduction
  }, [balanceState.performances]);

  // Get balanced stats for a card
  const getBalancedCardStats = useCallback((cardId: string) => {
    const baseCard = allCards.find(c => c.id === cardId);
    if (!baseCard) return null;

    const damageModifier = getCardStatModifier(cardId, 'damage');
    const speedModifier = getCardStatModifier(cardId, 'speed');
    const healthModifier = getCardStatModifier(cardId, 'health');
    const attackSpeedModifier = getCardStatModifier(cardId, 'attackSpeed');

    return {
      ...baseCard,
      damage: Math.round(baseCard.damage * damageModifier),
      moveSpeed: Math.round(baseCard.moveSpeed * speedModifier),
      health: Math.round(baseCard.health * healthModifier),
      attackSpeed: baseCard.attackSpeed * attackSpeedModifier
    };
  }, [getCardStatModifier]);

  // Get all cards with balance info for display
  const getCardsWithBalanceInfo = useCallback(() => {
    return allCards.map(card => {
      const perf = balanceState.performances.find(p => p.cardId === card.id);
      return {
        card,
        winStreak: perf?.winStreak || 0,
        nerfLevel: perf?.nerfLevel || 0,
        lastNerfedStat: perf?.lastNerfedStat || null,
        isNerfed: (perf?.nerfLevel || 0) > 0
      };
    });
  }, [balanceState.performances]);

  // Reset all balance data
  const resetBalance = useCallback(() => {
    setBalanceState(initialState);
  }, []);

  return {
    balanceState,
    getCardPerformance,
    trackDamage,
    processGameEnd,
    getCardStatModifier,
    getBalancedCardStats,
    getCardsWithBalanceInfo,
    resetBalance
  };
}
