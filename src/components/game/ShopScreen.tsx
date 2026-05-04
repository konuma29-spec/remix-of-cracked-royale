import { useState } from 'react';
import { ShopState } from '@/types/game';
import { allCards } from '@/data/cards';
import { cn } from '@/lib/utils';
import { Clock, Gift, Coins, ChevronRight, Check } from 'lucide-react';

interface ShopScreenProps {
  shopState: ShopState;
  gold: number;
  ownedCardIds: string[];
  onPurchase: (itemId: string, price: number, cardId: string) => void;
  onClaimFreebie: (itemId: string, cardId: string) => void;
  onBack: () => void;
  timeUntilRefresh: string;
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-orange-400 to-orange-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-amber-500'
};

const RARITY_BORDER = {
  common: 'border-gray-400',
  rare: 'border-orange-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400'
};

export function ShopScreen({
  shopState,
  gold,
  ownedCardIds,
  onPurchase,
  onClaimFreebie,
  onBack,
  timeUntilRefresh
}: ShopScreenProps) {
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  const handlePurchase = (itemId: string, price: number, cardId: string, isFreebie: boolean) => {
    if (isFreebie) {
      onClaimFreebie(itemId, cardId);
    } else {
      if (gold >= price) {
        setPurchaseAnimation(itemId);
        setTimeout(() => setPurchaseAnimation(null), 500);
        onPurchase(itemId, price, cardId);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Header */}
      <div className="relative">
        {/* Awning stripes */}
        <div className="h-16 bg-gradient-to-b from-sky-400 to-sky-500 relative overflow-hidden">
          <div className="absolute inset-0 flex">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-full",
                  i % 2 === 0 ? "bg-white/30" : "bg-transparent"
                )}
              />
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-sky-600" />
        </div>
        
        {/* Title banner */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-b from-sky-500 to-sky-600 px-8 py-2 rounded-b-xl shadow-lg border-x-4 border-b-4 border-sky-700">
          <h1 
            className="text-2xl font-black text-white drop-shadow-lg"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            Shop
          </h1>
        </div>
      </div>

      {/* Gold and Timer bar */}
      <div className="mx-4 mt-10 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl p-3 shadow-lg border-2 border-amber-300 flex justify-between items-center">
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 rounded-lg shadow-md">
          <Coins className="w-6 h-6 text-yellow-200" />
          <span className="text-white font-black text-xl">{gold}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-5 h-5" />
          <span className="font-bold">{timeUntilRefresh}</span>
        </div>
      </div>

      {/* Shop items grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Daily Freebie - First item */}
        {shopState.items.filter(item => item.isFreebie).map(item => {
          const card = allCards.find(c => c.id === item.cardId);
          if (!card) return null;
          const isOwned = ownedCardIds.includes(item.cardId);
          
          return (
            <button
              key={item.id}
              onClick={() => !item.isPurchased && handlePurchase(item.id, 0, item.cardId, true)}
              disabled={item.isPurchased}
              className={cn(
                "w-full p-4 rounded-2xl transition-all",
                "bg-gradient-to-br from-emerald-400 to-emerald-600",
                "border-4 border-emerald-300",
                "shadow-lg",
                item.isPurchased ? "opacity-50" : "hover:scale-[1.02] active:scale-[0.98]",
                purchaseAnimation === item.id && "animate-pulse"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={cn(
                    "w-20 h-24 rounded-xl flex items-center justify-center text-4xl",
                    "bg-gradient-to-br shadow-inner border-2",
                    RARITY_COLORS[card.rarity],
                    RARITY_BORDER[card.rarity]
                  )}>
                    {card.emoji}
                  </div>
                  {!isOwned && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      NEW
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-white" />
                    <span className="text-white font-bold text-lg">Daily Freebie</span>
                  </div>
                  <p className="text-emerald-100 font-medium">{card.name}</p>
                  <p className="text-emerald-200 text-sm capitalize">{card.rarity}</p>
                </div>
                
                {item.isPurchased ? (
                  <div className="bg-white/20 rounded-full p-2">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="bg-white text-emerald-600 font-black px-4 py-2 rounded-xl shadow-md">
                    FREE
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Regular shop items - 3x2 grid style */}
        <div className="grid grid-cols-3 gap-3">
          {shopState.items.filter(item => !item.isFreebie).map(item => {
            const card = allCards.find(c => c.id === item.cardId);
            if (!card) return null;
            const canAfford = gold >= item.price;
            const isOwned = ownedCardIds.includes(item.cardId);
            
            return (
              <button
                key={item.id}
                onClick={() => !item.isPurchased && canAfford && handlePurchase(item.id, item.price, item.cardId, false)}
                disabled={item.isPurchased || !canAfford}
                className={cn(
                  "p-3 rounded-2xl transition-all flex flex-col items-center",
                  "bg-gradient-to-b from-sky-400 to-sky-500",
                  "border-4 border-sky-300",
                  "shadow-lg",
                  item.isPurchased ? "opacity-50" : 
                    canAfford ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-70",
                  purchaseAnimation === item.id && "animate-pulse"
                )}
              >
                {/* Card preview */}
                <div className="relative mb-2">
                  <div className={cn(
                    "w-16 h-20 rounded-lg flex items-center justify-center text-3xl",
                    "bg-gradient-to-br shadow-inner border-2",
                    RARITY_COLORS[card.rarity],
                    RARITY_BORDER[card.rarity]
                  )}>
                    {item.isPurchased ? (
                      <Check className="w-8 h-8 text-white" />
                    ) : (
                      card.emoji
                    )}
                  </div>
                  {!isOwned && !item.isPurchased && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1 py-0.5 rounded-full">
                      NEW
                    </div>
                  )}
                </div>
                
                <p className="text-white font-bold text-xs text-center truncate w-full">
                  {card.name}
                </p>
                
                {/* Price */}
                {!item.isPurchased && (
                  <div className={cn(
                    "flex items-center gap-1 mt-2 px-2 py-1 rounded-lg",
                    canAfford ? "bg-amber-400" : "bg-gray-400"
                  )}>
                    <Coins className="w-4 h-4 text-amber-700" />
                    <span className="font-black text-amber-800 text-sm">{item.price}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation hint */}
      <div className="p-4 flex justify-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <span className="text-sm">Swipe right for Cards</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
