import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Coins, Sparkles, Star } from 'lucide-react';
import { ChestReward as ChestRewardType } from '@/types/game';
import { allCards } from '@/data/cards';
import { cn } from '@/lib/utils';

interface BulkChestRewardProps {
  chestCount: number;
  rewards: ChestRewardType[];
  onClose: () => void;
}

export function BulkChestReward({ chestCount, rewards, onClose }: BulkChestRewardProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Aggregate all rewards
  const totalGold = rewards.reduce((sum, r) => sum + (r.goldEarned || 0), 0);
  const totalStars = rewards.reduce((sum, r) => sum + (r.stars || 0), 0);
  const totalEvolutionShards = rewards.reduce((sum, r) => sum + (r.evolutionShards || 0), 0);

  // Aggregate cards by cardId
  const cardCounts: Record<string, { count: number; isNew: boolean }> = {};
  rewards.forEach(reward => {
    reward.cards.forEach(card => {
      if (!cardCounts[card.cardId]) {
        cardCounts[card.cardId] = { count: 0, isNew: card.isNew };
      }
      cardCounts[card.cardId].count++;
      if (card.isNew) cardCounts[card.cardId].isNew = true;
    });
  });

  // Aggregate wild cards by rarity
  const wildCardCounts: Record<string, number> = {};
  rewards.forEach(reward => {
    reward.wildCards?.forEach(wc => {
      wildCardCounts[wc.rarity] = (wildCardCounts[wc.rarity] || 0) + wc.count;
    });
  });

  // Aggregate tower cards
  const towerCardCounts: Record<string, number> = {};
  rewards.forEach(reward => {
    reward.towerCards?.forEach(tc => {
      towerCardCounts[tc.towerId] = (towerCardCounts[tc.towerId] || 0) + tc.count;
    });
  });

  // Aggregate banners
  const banners = rewards.map(r => r.bannerId).filter(Boolean) as string[];

  const cardEntries = Object.entries(cardCounts);
  const wildCardEntries = Object.entries(wildCardCounts);
  const towerCardEntries = Object.entries(towerCardCounts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div 
        className={cn(
          "bg-gradient-to-b from-[#1a3a5c] to-[#0d2840] rounded-2xl border-2 border-amber-500/50 shadow-2xl w-[90%] max-w-md max-h-[80vh] overflow-hidden flex flex-col transition-all duration-500",
          isAnimating ? "scale-90 opacity-0" : "scale-100 opacity-100"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-amber-600 to-amber-800 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">
              {chestCount} Chests Opened!
            </h2>
          </div>
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: Math.min(5, Math.round(totalStars / chestCount)) }).map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            ))}
          </div>
        </div>

        {/* Rewards Summary */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Gold */}
          {totalGold > 0 && (
            <div className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Gold</span>
              </div>
              <span className="text-2xl font-bold text-amber-400">+{totalGold}</span>
            </div>
          )}

          {/* Evolution Shards */}
          {totalEvolutionShards > 0 && (
            <div className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-purple-400 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Evolution Shards</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">+{totalEvolutionShards}</span>
            </div>
          )}

          {/* Cards */}
          {cardEntries.length > 0 && (
            <div className="bg-black/30 rounded-xl p-3 border border-cyan-500/30">
              <h3 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <span>Cards</span>
                <span className="text-cyan-400">({cardEntries.reduce((sum, [, data]) => sum + data.count, 0)} total)</span>
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {cardEntries.slice(0, 12).map(([cardId, data]) => {
                  const card = allCards.find(c => c.id === cardId);
                  if (!card) return null;
                  return (
                    <div 
                      key={cardId}
                      className={cn(
                        "relative aspect-square rounded-lg flex flex-col items-center justify-center p-1",
                        "bg-gradient-to-b from-gray-700 to-gray-900 border",
                        data.isNew ? "border-green-400" : "border-gray-600"
                      )}
                    >
                      <span className="text-2xl">{card.emoji}</span>
                      <span className="absolute bottom-0.5 right-0.5 text-xs font-bold text-white bg-black/60 px-1 rounded">
                        x{data.count}
                      </span>
                      {data.isNew && (
                        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-green-400 bg-black/60 px-1 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {cardEntries.length > 12 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  +{cardEntries.length - 12} more cards
                </p>
              )}
            </div>
          )}

          {/* Wild Cards */}
          {wildCardEntries.length > 0 && (
            <div className="bg-black/30 rounded-xl p-3 border border-pink-500/30">
              <h3 className="text-sm font-bold text-pink-300 mb-2">Wild Cards</h3>
              <div className="flex flex-wrap gap-2">
                {wildCardEntries.map(([rarity, count]) => (
                  <div 
                    key={rarity}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-600/30 to-purple-600/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-xl">🃏</span>
                    <span className="text-white capitalize">{rarity}</span>
                    <span className="font-bold text-pink-300">x{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tower Cards */}
          {towerCardEntries.length > 0 && (
            <div className="bg-black/30 rounded-xl p-3 border border-blue-500/30">
              <h3 className="text-sm font-bold text-blue-300 mb-2">Tower Cards</h3>
              <div className="flex flex-wrap gap-2">
                {towerCardEntries.map(([towerId, count]) => (
                  <div 
                    key={towerId}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-xl">{towerId === 'king' ? '👑' : '🏰'}</span>
                    <span className="text-white capitalize">{towerId}</span>
                    <span className="font-bold text-blue-300">x{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banners */}
          {banners.length > 0 && (
            <div className="bg-black/30 rounded-xl p-3 border border-yellow-500/30">
              <h3 className="text-sm font-bold text-yellow-300 mb-2">Banners Unlocked</h3>
              <div className="flex flex-wrap gap-2">
                {banners.map((bannerId, i) => (
                  <div 
                    key={i}
                    className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-white">🎌 {bannerId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OK Button */}
        <div className="p-4 bg-gradient-to-t from-[#0a1525] to-transparent">
          <Button
            onClick={onClose}
            className="w-full h-12 text-lg font-bold bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 border-b-4 border-green-900 rounded-xl"
          >
            Collect All!
          </Button>
        </div>
      </div>
    </div>
  );
}
