import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerProgress, ChestReward, DeckSlot } from '@/types/game';
import { allCards, starterCardIds } from '@/data/cards';
import { starterBannerIds, getRandomBanner } from '@/data/banners';
import { getCardLevel } from '@/lib/cardLevels';
import { EVOLUTION_SHARDS_REQUIRED, hasEvolution } from '@/data/evolutions';
import { TOWER_TROOPS, TowerTroop } from '@/data/towerTroops';

// Extended progress type with tower troop support
export interface ExtendedPlayerProgress extends PlayerProgress {
  selectedTowerTroopId: string; // Currently equipped tower troop
  unlockedTowerTroopIds: string[]; // Tower troops unlocked
  claimedTrophyRewards: number[]; // Trophy milestones already claimed
}

const STORAGE_KEY = 'clash-game-progress';

// Initialize card copies with 1 copy for starter cards (to be at level 1)
const initialCardCopies: Record<string, number> = {};
starterCardIds.forEach(id => {
  initialCardCopies[id] = 1;
});

const defaultDeckSlots: DeckSlot[] = [
  { id: 'A', name: 'Deck A', cardIds: starterCardIds.slice(0, 8) },
  { id: 'B', name: 'Deck B', cardIds: [] },
  { id: 'C', name: 'Deck C', cardIds: [] }
];

const initialProgress: ExtendedPlayerProgress = {
  ownedCardIds: [...starterCardIds],
  cardCopies: { ...initialCardCopies },
  currentDeck: starterCardIds.slice(0, 8),
  deckSlots: defaultDeckSlots,
  activeDeckId: 'A',
  wins: 0,
  losses: 0,
  chestsAvailable: 0,
  lastFreeChestDate: null,
  // Player profile defaults
  playerName: 'Player',
  bannerId: 'banner-blue',
  ownedBannerIds: [...starterBannerIds],
  gold: 100, // Starting gold
  // Tower levels - start with 1 copy each (level 1)
  towerCopies: { princess: 1, king: 1 },
  // Evolution system - start with 6 shards for testing
  evolutionShards: 6,
  unlockedEvolutions: [],
  // Wild Cards - start with 0 of each
  wildCardCounts: { common: 0, rare: 0, epic: 0, legendary: 0, champion: 0 },
  // Tower Troops - default is always available
  selectedTowerTroopId: 'default',
  unlockedTowerTroopIds: ['default'],
  // Trophy Road claimed rewards
  claimedTrophyRewards: [],
};

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function canClaimFreeChest(lastDate: string | null): boolean {
  if (!lastDate) return true;
  return lastDate !== getTodayDateString();
}

export function useProgression() {
  const [progress, setProgress] = useState<ExtendedPlayerProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Merge starter cards with any existing owned cards to ensure all 8 starters exist
        const existingOwned = parsed.ownedCardIds || [];
        const mergedOwned = [...new Set([...starterCardIds, ...existingOwned])];
        parsed.ownedCardIds = mergedOwned;
        
        // Migration: add deck slots if missing
        if (!parsed.deckSlots) {
          parsed.deckSlots = defaultDeckSlots.map((slot, idx) => ({
            ...slot,
            cardIds: idx === 0 ? (parsed.currentDeck || starterCardIds.slice(0, 8)) : []
          }));
          parsed.activeDeckId = 'A';
        }
        
        // Migration: add lastFreeChestDate if missing
        if (parsed.lastFreeChestDate === undefined) {
          parsed.lastFreeChestDate = null;
        }
        
        // Migration: add player profile fields if missing
        if (!parsed.playerName) {
          parsed.playerName = 'Player';
        }
        if (!parsed.bannerId) {
          parsed.bannerId = 'banner-blue';
        }
        if (!parsed.ownedBannerIds) {
          parsed.ownedBannerIds = [...starterBannerIds];
        }
        
        // Migration: add gold if missing
        if (parsed.gold === undefined) {
          parsed.gold = 100;
        }
        
        // Migration: add cardCopies if missing
        if (!parsed.cardCopies) {
          parsed.cardCopies = { ...initialCardCopies };
          // Initialize all owned cards with 1 copy
          mergedOwned.forEach((id: string) => {
            if (!parsed.cardCopies[id]) {
              parsed.cardCopies[id] = 1;
            }
          });
        }
        
        // Migration: add towerCopies if missing
        if (!parsed.towerCopies) {
          parsed.towerCopies = { princess: 1, king: 1 };
        }
        
        // Migration: add evolution system if missing - give 6 shards
        if (parsed.evolutionShards === undefined || parsed.evolutionShards < 6) {
          parsed.evolutionShards = 6;
        }
        if (!parsed.unlockedEvolutions) {
          parsed.unlockedEvolutions = [];
        }
        
        // Migration: add wild card counts if missing
        if (!parsed.wildCardCounts) {
          parsed.wildCardCounts = { common: 0, rare: 0, epic: 0, legendary: 0, champion: 0 };
        }
        
        // Migration: add tower troop fields if missing
        if (!parsed.selectedTowerTroopId) {
          parsed.selectedTowerTroopId = 'default';
        }
        if (!parsed.unlockedTowerTroopIds) {
          parsed.unlockedTowerTroopIds = ['default'];
        }
        if (!parsed.claimedTrophyRewards) {
          parsed.claimedTrophyRewards = [];
        }
        
        // Ensure currentDeck syncs with active deck slot
        const activeSlot = parsed.deckSlots.find((s: DeckSlot) => s.id === parsed.activeDeckId);
        if (activeSlot && activeSlot.cardIds.length === 8) {
          parsed.currentDeck = activeSlot.cardIds;
        } else {
          // Fallback to starter deck if active slot is invalid
          const validDeck = (parsed.currentDeck || []).filter((id: string) => mergedOwned.includes(id));
          if (validDeck.length !== 8) {
            parsed.currentDeck = starterCardIds.slice(0, 8);
          } else {
            parsed.currentDeck = validDeck;
          }
        }
        
        // Check and grant daily free chest
        if (canClaimFreeChest(parsed.lastFreeChestDate)) {
          parsed.chestsAvailable = (parsed.chestsAvailable || 0) + 1;
          parsed.lastFreeChestDate = getTodayDateString();
        }
        
        return parsed as ExtendedPlayerProgress;
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    
    // For new players, give them the first free chest
    return {
      ...initialProgress,
      chestsAvailable: 1,
      lastFreeChestDate: getTodayDateString()
    };
  });

  // Keep an always-up-to-date ref for synchronous reads inside callbacks.
  const progressRef = useRef<ExtendedPlayerProgress>(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [progress]);

  const updateDeck = useCallback((newDeck: string[]) => {
    if (newDeck.length !== 8) return;
    setProgress(prev => {
      const updatedSlots = prev.deckSlots.map(slot =>
        slot.id === prev.activeDeckId ? { ...slot, cardIds: newDeck } : slot
      );
      return {
        ...prev,
        currentDeck: newDeck,
        deckSlots: updatedSlots
      };
    });
  }, []);

  const setActiveDeck = useCallback((deckId: string) => {
    setProgress(prev => {
      const slot = prev.deckSlots.find(s => s.id === deckId);
      const newCurrentDeck = slot && slot.cardIds.length === 8 ? slot.cardIds : prev.currentDeck;
      return {
        ...prev,
        activeDeckId: deckId,
        currentDeck: newCurrentDeck
      };
    });
  }, []);

  const updateDeckSlot = useCallback((deckId: string, cardIds: string[]) => {
    setProgress(prev => {
      const updatedSlots = prev.deckSlots.map(slot =>
        slot.id === deckId ? { ...slot, cardIds } : slot
      );
      const isActiveDeck = prev.activeDeckId === deckId;
      return {
        ...prev,
        deckSlots: updatedSlots,
        currentDeck: isActiveDeck && cardIds.length === 8 ? cardIds : prev.currentDeck
      };
    });
  }, []);

  const addDeckSlot = useCallback(() => {
    setProgress(prev => {
      const nextId = String(prev.deckSlots.length + 1);
      const newSlot: DeckSlot = {
        id: nextId,
        name: `Deck ${nextId}`,
        cardIds: []
      };
      return {
        ...prev,
        deckSlots: [...prev.deckSlots, newSlot]
      };
    });
  }, []);

  const recordWin = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      wins: prev.wins + 1,
      chestsAvailable: prev.chestsAvailable + 1
    }));
  }, []);

  const recordLoss = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      losses: prev.losses + 1
    }));
  }, []);

  const openChest = useCallback((starCount: number = 1, skipInventoryCheck: boolean = false): ChestReward | null => {
    const prog = progressRef.current;

    // Skip inventory check for trophy road rewards (they're claimed directly)
    if (!skipInventoryCheck && prog.chestsAvailable <= 0) return null;

    const rewards: ChestReward = { cards: [], towerCards: [], goldEarned: 0, stars: starCount, evolutionShards: 0, wildCards: [] };
    const unownedCards = allCards.filter(c => 
      !prog.ownedCardIds.includes(c.id) && 
      c.elixirCost > 0 // Filter out tower troops (0 elixir cost)
    );
    
    // EVOLUTION SHARDS: Only from 5-star chests - guaranteed 1-3 shards
    if (starCount === 5) {
      rewards.evolutionShards = 1 + Math.floor(Math.random() * 3); // 1-3 shards
    }
    
    // WILD CARDS: Chance to get wild cards based on stars
    // Higher stars = more wild cards and higher rarity possible
    const wildCardChance = 0.15 + (starCount * 0.1); // 25% to 65% based on stars
    if (Math.random() < wildCardChance) {
      const rarities: ('common' | 'rare' | 'epic' | 'legendary' | 'champion')[] = ['common', 'rare', 'epic', 'legendary', 'champion'];
      // Determine rarity based on stars
      let maxRarityIndex = Math.min(starCount - 1, 4); // 1 star = common max, 5 star = champion possible
      const rarityIndex = Math.floor(Math.random() * (maxRarityIndex + 1));
      const selectedRarity = rarities[rarityIndex];
      
      // Count based on rarity (common = 5-10, rare = 3-6, epic = 1-3, legendary = 1-2, champion = 1)
      let count = 1;
      switch (selectedRarity) {
        case 'common': count = 5 + Math.floor(Math.random() * 6); break;
        case 'rare': count = 3 + Math.floor(Math.random() * 4); break;
        case 'epic': count = 1 + Math.floor(Math.random() * 3); break;
        case 'legendary': count = 1 + Math.floor(Math.random() * 2); break;
        case 'champion': count = 1; break;
      }
      
      rewards.wildCards!.push({ rarity: selectedRarity, count });
    }
    
    // Base new card chance increases with stars: 30% base + 10% per star
    const newCardChance = 0.3 + (starCount * 0.1);
    
    // Banner chance increases with stars: 20% base + 15% per star
    const bannerChance = 0.2 + (starCount * 0.15);
    const bannerReward = getRandomBanner(prog.ownedBannerIds);
    if (bannerReward && Math.random() < bannerChance) {
      rewards.bannerId = bannerReward.id;
    }
    
    // Tower card chance: 40% for 3+ stars, 60% for 5 stars
    const towerCardChance = starCount >= 5 ? 0.6 : starCount >= 3 ? 0.4 : 0.2;
    if (Math.random() < towerCardChance) {
      // Give 1-3 tower cards based on stars
      const towerCardCount = Math.min(3, Math.floor(starCount / 2) + 1);
      const towerType = Math.random() < 0.7 ? 'princess' : 'king'; // Princess more common
      rewards.towerCards!.push({ towerId: towerType, count: towerCardCount });
    }
    
    // Tower Troop unlock chance - separate from tower cards
    // Higher chance for tower troops, weighted by rarity
    const towerTroopChance = starCount >= 4 ? 0.5 : starCount >= 2 ? 0.35 : 0.2;
    if (Math.random() < towerTroopChance) {
      const unlockedTroopIds = prog.unlockedTowerTroopIds || ['default'];
      // Filter out already unlocked troops (except default which is always unlocked)
      const availableTroops = TOWER_TROOPS.filter(t => 
        t.id !== 'default' && !unlockedTroopIds.includes(t.id)
      );
      
      if (availableTroops.length > 0) {
        // Weight by rarity - common/rare much more likely than epic/legendary
        const weightedTroops: typeof availableTroops = [];
        availableTroops.forEach(troop => {
          let weight = 1;
          switch (troop.rarity) {
            case 'common': weight = 10; break;
            case 'rare': weight = 8; break;     // Cannoneer - high weight
            case 'epic': weight = 5; break;     // Dagger Duchess - medium-high weight
            case 'legendary': weight = 1; break;
          }
          for (let i = 0; i < weight; i++) {
            weightedTroops.push(troop);
          }
        });
        
        const randomTroop = weightedTroops[Math.floor(Math.random() * weightedTroops.length)];
        if (randomTroop) {
          rewards.towerTroopUnlock = randomTroop.id;
        }
      }
    }
    
    // Gold: 500-1125 range, stars increase the average
    const baseGold = 500;
    const maxExtraGold = 625;
    const starBonus = (starCount / 5) * maxExtraGold * 0.6;
    const randomGold = Math.floor(Math.random() * (maxExtraGold - starBonus));
    rewards.goldEarned = Math.floor(baseGold + starBonus + randomGold);
    
    // Card count: 1-5 cards based on stars
    const cardCount = Math.min(5, Math.max(1, starCount));
    
    // Filter cards by rarity based on stars (exclude tower troops with 0 elixir)
    const getAvailableCards = (owned: boolean) => {
      const pool = owned 
        ? allCards.filter(c => prog.ownedCardIds.includes(c.id) && c.elixirCost > 0) 
        : unownedCards;
      if (starCount >= 4) {
        const rarePool = pool.filter(c => c.rarity === 'epic' || c.rarity === 'legendary');
        if (rarePool.length > 0 && Math.random() < 0.5) return rarePool;
      }
      if (starCount >= 2) {
        const rarePool = pool.filter(c => c.rarity !== 'common');
        if (rarePool.length > 0 && Math.random() < 0.3 + starCount * 0.1) return rarePool;
      }
      return pool;
    };
    
    const localUnownedCards = [...unownedCards];
    for (let i = 0; i < cardCount; i++) {
      const availableUnowned = getAvailableCards(false).filter(c => localUnownedCards.some(u => u.id === c.id));
      if (availableUnowned.length > 0 && Math.random() < newCardChance) {
        const randomIndex = Math.floor(Math.random() * availableUnowned.length);
        const newCard = availableUnowned[randomIndex];
        rewards.cards.push({ cardId: newCard.id, isNew: true });
        const unownedIdx = localUnownedCards.findIndex(c => c.id === newCard.id);
        if (unownedIdx !== -1) localUnownedCards.splice(unownedIdx, 1);
      } else {
        const availableOwned = getAvailableCards(true);
        if (availableOwned.length > 0) {
          const ownedIndex = Math.floor(Math.random() * availableOwned.length);
          rewards.cards.push({ cardId: availableOwned[ownedIndex].id, isNew: false });
        } else {
          const ownedIndex = Math.floor(Math.random() * prog.ownedCardIds.length);
          rewards.cards.push({ cardId: prog.ownedCardIds[ownedIndex], isNew: false });
        }
      }
    }

    // Update progress with new cards, banner, gold, and card copies
    const newOwnedIds = [...prog.ownedCardIds];
    const newCardCopies = { ...prog.cardCopies };
    
    rewards.cards.forEach(reward => {
      if (reward.isNew && !newOwnedIds.includes(reward.cardId)) {
        newOwnedIds.push(reward.cardId);
        newCardCopies[reward.cardId] = 1; // First copy
      } else {
        // Add a copy to existing card
        newCardCopies[reward.cardId] = (newCardCopies[reward.cardId] || 0) + 1;
      }
    });
    
    const newOwnedBanners = [...prog.ownedBannerIds];
    if (rewards.bannerId && !newOwnedBanners.includes(rewards.bannerId)) {
      newOwnedBanners.push(rewards.bannerId);
    }
    
    // Update tower copies
    const newTowerCopies = { ...prog.towerCopies };
    if (rewards.towerCards && rewards.towerCards.length > 0) {
      rewards.towerCards.forEach(tc => {
        newTowerCopies[tc.towerId] = (newTowerCopies[tc.towerId] || 0) + tc.count;
      });
    }
    
    // Update wild card counts
    const newWildCardCounts = { ...prog.wildCardCounts };
    if (rewards.wildCards && rewards.wildCards.length > 0) {
      rewards.wildCards.forEach(wc => {
        newWildCardCounts[wc.rarity] = (newWildCardCounts[wc.rarity] || 0) + wc.count;
      });
    }
    
    // Unlock tower troop if rewarded
    const newUnlockedTowerTroopIds = [...(prog.unlockedTowerTroopIds || ['default'])];
    if (rewards.towerTroopUnlock && !newUnlockedTowerTroopIds.includes(rewards.towerTroopUnlock)) {
      newUnlockedTowerTroopIds.push(rewards.towerTroopUnlock);
    }

    setProgress(prev => ({
      ...prev,
      ownedCardIds: newOwnedIds,
      cardCopies: newCardCopies,
      ownedBannerIds: newOwnedBanners,
      towerCopies: newTowerCopies,
      wildCardCounts: newWildCardCounts,
      unlockedTowerTroopIds: newUnlockedTowerTroopIds,
      gold: prev.gold + (rewards.goldEarned || 0),
      evolutionShards: prev.evolutionShards + (rewards.evolutionShards || 0),
      // Only decrement chest counter if this is a regular chest (not trophy road)
      chestsAvailable: skipInventoryCheck ? prev.chestsAvailable : prev.chestsAvailable - 1
    }));

    return rewards;
  }, []);

  const updatePlayerName = useCallback((name: string) => {
    setProgress(prev => ({
      ...prev,
      playerName: name
    }));
  }, []);

  const updateBanner = useCallback((bannerId: string) => {
    setProgress(prev => ({
      ...prev,
      bannerId
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(initialProgress);
  }, []);

  const addGold = useCallback((amount: number) => {
    setProgress(prev => ({
      ...prev,
      gold: prev.gold + amount
    }));
  }, []);

  const spendGold = useCallback((amount: number): boolean => {
    if (progress.gold < amount) return false;
    setProgress(prev => ({
      ...prev,
      gold: prev.gold - amount
    }));
    return true;
  }, [progress.gold]);

  const addCard = useCallback((cardId: string) => {
    setProgress(prev => {
      if (prev.ownedCardIds.includes(cardId)) return prev;
      return {
        ...prev,
        ownedCardIds: [...prev.ownedCardIds, cardId]
      };
    });
  }, []);

  // Unlock evolution for a card (costs 6 shards)
  const unlockEvolution = useCallback((cardId: string): boolean => {
    // Check if card has an evolution available
    if (!hasEvolution(cardId)) return false;
    
    // Check if already unlocked
    if (progress.unlockedEvolutions.includes(cardId)) return false;
    
    // Check if player has enough shards
    if (progress.evolutionShards < EVOLUTION_SHARDS_REQUIRED) return false;
    
    setProgress(prev => ({
      ...prev,
      evolutionShards: prev.evolutionShards - EVOLUTION_SHARDS_REQUIRED,
      unlockedEvolutions: [...prev.unlockedEvolutions, cardId]
    }));
    
    return true;
  }, [progress.evolutionShards, progress.unlockedEvolutions]);

  // Select a tower troop
  const selectTowerTroop = useCallback((troopId: string) => {
    // Check if unlocked
    if (!progress.unlockedTowerTroopIds.includes(troopId)) return false;
    
    setProgress(prev => ({
      ...prev,
      selectedTowerTroopId: troopId
    }));
    return true;
  }, [progress.unlockedTowerTroopIds]);

  // Unlock a tower troop (called when player wins from chest, etc.)
  const unlockTowerTroop = useCallback((troopId: string) => {
    if (progress.unlockedTowerTroopIds.includes(troopId)) return false;
    
    setProgress(prev => ({
      ...prev,
      unlockedTowerTroopIds: [...prev.unlockedTowerTroopIds, troopId]
    }));
    return true;
  }, [progress.unlockedTowerTroopIds]);

  // Claim a trophy road reward (marks as claimed, but doesn't add to chest inventory
  // since the chest is opened directly in TrophyRoad component)
  const claimTrophyReward = useCallback((trophyMilestone: number): boolean => {
    const currentTrophies = progress.wins * 30;
    
    // Check if already claimed or not yet reached
    if (progress.claimedTrophyRewards.includes(trophyMilestone)) return false;
    if (currentTrophies < trophyMilestone) return false;
    
    // Mark as claimed (chest will be opened directly in UI)
    setProgress(prev => ({
      ...prev,
      claimedTrophyRewards: [...prev.claimedTrophyRewards, trophyMilestone]
    }));
    
    return true;
  }, [progress.wins, progress.claimedTrophyRewards]);

  // Use wild cards to add copies to a card
  const useWildCards = useCallback((cardId: string, amount: number): boolean => {
    // Get the card to determine its rarity
    const card = allCards.find(c => c.id === cardId);
    if (!card) return false;
    
    const rarity = card.rarity;
    const availableWildCards = progress.wildCardCounts[rarity] || 0;
    
    // Check if player has enough wild cards
    if (availableWildCards < amount) return false;
    
    // Check if player owns the card
    if (!progress.ownedCardIds.includes(cardId)) return false;
    
    setProgress(prev => ({
      ...prev,
      cardCopies: {
        ...prev.cardCopies,
        [cardId]: (prev.cardCopies[cardId] || 0) + amount
      },
      wildCardCounts: {
        ...prev.wildCardCounts,
        [rarity]: (prev.wildCardCounts[rarity] || 0) - amount
      }
    }));
    
    return true;
  }, [progress.wildCardCounts, progress.ownedCardIds]);

  return {
    progress,
    updateDeck,
    setActiveDeck,
    updateDeckSlot,
    addDeckSlot,
    recordWin,
    recordLoss,
    openChest,
    updatePlayerName,
    updateBanner,
    resetProgress,
    addGold,
    spendGold,
    addCard,
    unlockEvolution,
    selectTowerTroop,
    unlockTowerTroop,
    claimTrophyReward,
    useWildCards
  };
}
