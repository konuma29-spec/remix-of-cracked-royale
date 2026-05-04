import { useState, useEffect, useCallback } from 'react';
import { ShopState, ShopItem } from '@/types/game';
import { allCards } from '@/data/cards';

const SHOP_STORAGE_KEY = 'clash-game-shop';
const SHOP_ITEMS_COUNT = 6; // 1 freebie + 5 purchasable

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getCardPrice(rarity: string): number {
  switch (rarity) {
    case 'common': return 50;
    case 'rare': return 100;
    case 'epic': return 200;
    case 'legendary': return 500;
    default: return 100;
  }
}

function generateShopItems(ownedCardIds: string[]): ShopItem[] {
  const items: ShopItem[] = [];
  const usedCardIds = new Set<string>();
  
  // Filter to only troop/tank/mini-tank cards (not spells/buildings for simplicity)
  const availableCards = allCards.filter(c => 
    ['troop', 'tank', 'mini-tank'].includes(c.type)
  );
  
  // Find unowned cards
  const unownedCards = availableCards.filter(c => !ownedCardIds.includes(c.id));
  
  // First item is always the daily freebie
  // Pick a random card for freebie
  const freebiePool = availableCards.filter(c => !usedCardIds.has(c.id));
  const freebieCard = freebiePool[Math.floor(Math.random() * freebiePool.length)];
  if (freebieCard) {
    items.push({
      id: 'freebie',
      cardId: freebieCard.id,
      price: 0,
      isFreebie: true,
      isPurchased: false
    });
    usedCardIds.add(freebieCard.id);
  }
  
  // Ensure at least one unowned card is in the shop (if any exist)
  if (unownedCards.length > 0) {
    const unownedNotUsed = unownedCards.filter(c => !usedCardIds.has(c.id));
    if (unownedNotUsed.length > 0) {
      const guaranteedUnowned = unownedNotUsed[Math.floor(Math.random() * unownedNotUsed.length)];
      const card = allCards.find(c => c.id === guaranteedUnowned.id)!;
      items.push({
        id: `shop-${items.length}`,
        cardId: guaranteedUnowned.id,
        price: getCardPrice(card.rarity),
        isFreebie: false,
        isPurchased: false
      });
      usedCardIds.add(guaranteedUnowned.id);
    }
  }
  
  // Fill remaining slots with random cards
  while (items.length < SHOP_ITEMS_COUNT) {
    const remainingPool = availableCards.filter(c => !usedCardIds.has(c.id));
    if (remainingPool.length === 0) break;
    
    const randomCard = remainingPool[Math.floor(Math.random() * remainingPool.length)];
    items.push({
      id: `shop-${items.length}`,
      cardId: randomCard.id,
      price: getCardPrice(randomCard.rarity),
      isFreebie: false,
      isPurchased: false
    });
    usedCardIds.add(randomCard.id);
  }
  
  return items;
}

export function useShop(ownedCardIds: string[]) {
  const [shopState, setShopState] = useState<ShopState>(() => {
    try {
      const saved = localStorage.getItem(SHOP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if shop needs to refresh (new day)
        if (parsed.lastRefreshDate !== getTodayDateString()) {
          return {
            items: generateShopItems(ownedCardIds),
            lastRefreshDate: getTodayDateString()
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load shop:', e);
    }
    
    return {
      items: generateShopItems(ownedCardIds),
      lastRefreshDate: getTodayDateString()
    };
  });

  // Save shop state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(shopState));
    } catch (e) {
      console.error('Failed to save shop:', e);
    }
  }, [shopState]);

  // Check for daily refresh
  useEffect(() => {
    if (shopState.lastRefreshDate !== getTodayDateString()) {
      setShopState({
        items: generateShopItems(ownedCardIds),
        lastRefreshDate: getTodayDateString()
      });
    }
  }, [ownedCardIds, shopState.lastRefreshDate]);

  const purchaseItem = useCallback((itemId: string): boolean => {
    const item = shopState.items.find(i => i.id === itemId);
    if (!item || item.isPurchased) return false;
    
    setShopState(prev => ({
      ...prev,
      items: prev.items.map(i => 
        i.id === itemId ? { ...i, isPurchased: true } : i
      )
    }));
    
    return true;
  }, [shopState.items]);

  const getTimeUntilRefresh = useCallback((): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }, []);

  return {
    shopState,
    purchaseItem,
    getTimeUntilRefresh
  };
}
