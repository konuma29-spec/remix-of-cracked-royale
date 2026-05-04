import { useState } from 'react';
import { allCards } from '@/data/cards';
import { wildCards, WildCardRarity } from '@/data/wildCards';
import { evolutions, getEvolution, EVOLUTION_SHARDS_REQUIRED } from '@/data/evolutions';
import { GameCard } from './GameCard';
import { Lock, Sparkles, Plus, X, Swords, Heart, Droplets } from 'lucide-react';
import { getCardLevel, getLevelProgress, MAX_LEVEL } from '@/lib/cardLevels';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { EvolutionShardsModal } from './EvolutionShardsModal';
import { CardDefinition } from '@/types/game';

interface CardCollectionProps {
  ownedCardIds: string[];
  cardCopies: Record<string, number>;
  wildCardCounts: Record<WildCardRarity, number>;
  evolutionShards: number;
  unlockedEvolutions: string[];
  onUseWildCard?: (rarity: WildCardRarity, cardId: string) => void;
  onUnlockEvolution?: (cardId: string) => boolean;
  onOpenEvolutions?: () => void;
}

const rarityConfig = {
  common: { label: 'Common', gradient: 'from-slate-500 to-slate-600', textColor: 'text-slate-300', bgColor: 'bg-slate-500' },
  rare: { label: 'Rare', gradient: 'from-orange-500 to-orange-600', textColor: 'text-orange-300', bgColor: 'bg-orange-500' },
  epic: { label: 'Epic', gradient: 'from-purple-500 to-purple-600', textColor: 'text-purple-300', bgColor: 'bg-purple-500' },
  legendary: { label: 'Legendary', gradient: 'from-amber-500 to-amber-600', textColor: 'text-amber-300', bgColor: 'bg-amber-500' },
  champion: { label: 'Champion', gradient: 'from-pink-500 to-rose-600', textColor: 'text-pink-300', bgColor: 'bg-pink-500' }
} as const;

type Rarity = keyof typeof rarityConfig;

const rarityOrder: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'champion'];

export function CardCollection({ 
  ownedCardIds, 
  cardCopies, 
  wildCardCounts,
  evolutionShards,
  unlockedEvolutions,
  onUseWildCard,
  onUnlockEvolution,
  onOpenEvolutions
}: CardCollectionProps) {
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null);
  // Filter out tower troops (0 elixir cost)
  const collectibleCards = allCards.filter(c => c.elixirCost > 0);
  const ownedCount = collectibleCards.filter(c => ownedCardIds.includes(c.id)).length;
  const totalCount = collectibleCards.length;

  const cardsByRarity = rarityOrder.map((rarity) => ({
    rarity,
    config: rarityConfig[rarity],
    cards: collectibleCards.filter((c) => c.rarity === rarity).sort((a, b) => a.name.localeCompare(b.name))
  })).filter(group => group.cards.length > 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pb-8 space-y-4">
        {/* Header Stats */}
        <div className="flex items-center justify-between bg-card/50 rounded-xl p-3 border border-border">
          <div>
            <h1 className="game-title text-2xl text-primary">Collection</h1>
            <p className="text-xs text-muted-foreground">
              {ownedCount}/{totalCount} cards unlocked
            </p>
          </div>
          
          {/* Evolution Shards Display - Clickable */}
          <button
            onClick={() => onOpenEvolutions ? onOpenEvolutions() : setShowEvolutionModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg px-3 py-2 border border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div className="text-right">
              <div className="text-sm font-bold text-purple-300">{evolutionShards}</div>
              <div className="text-[9px] text-purple-400/70">Evo Shards</div>
            </div>
          </button>
        </div>

        {/* Wild Cards Section */}
        <section className="bg-card/30 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              🃏 Wild Cards
            </h2>
          </div>
          
          <div className="grid grid-cols-5 gap-2 p-3">
            {wildCards.map((wildCard) => {
              const count = wildCardCounts[wildCard.rarity] || 0;
              const config = rarityConfig[wildCard.rarity];
              
              return (
                <div 
                  key={wildCard.id} 
                  className="flex flex-col items-center"
                >
                  {/* Wild Card Visual */}
                  <div className={cn(
                    "relative w-14 h-18 rounded-lg border-2 flex flex-col items-center justify-center",
                    "bg-gradient-to-b shadow-md",
                    config.gradient,
                    count > 0 ? "border-white/50" : "border-white/20 opacity-60"
                  )}>
                    <span className="text-2xl">🃏</span>
                    <div className={cn(
                      "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      config.bgColor,
                      "text-white border border-white/50"
                    )}>
                      {count}
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="text-[9px] text-muted-foreground mt-1 text-center font-medium">
                    {config.label}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="px-3 pb-3">
            <p className="text-[10px] text-muted-foreground text-center">
              Wild Cards can level up any card of the same rarity
            </p>
          </div>
        </section>

        {/* Cards by Rarity */}
        {cardsByRarity.map(({ rarity, config, cards }) => {
          const ownedInRarity = cards.filter(c => ownedCardIds.includes(c.id)).length;
          const wildCardCount = wildCardCounts[rarity] || 0;
          
          return (
            <section key={rarity} className="bg-card/30 border border-border rounded-xl overflow-hidden">
              {/* Rarity Header */}
              <div className={cn(
                'flex items-center justify-between px-4 py-2 bg-gradient-to-r',
                config.gradient
              )}>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  {config.label}
                </h2>
                <div className="flex items-center gap-2">
                  {wildCardCount > 0 && (
                    <span className="text-[10px] text-white/80 bg-white/20 px-1.5 py-0.5 rounded">
                      🃏 {wildCardCount}
                    </span>
                  )}
                  <span className="text-xs text-white/80 font-medium">
                    {ownedInRarity}/{cards.length}
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-4 gap-2 p-3">
                {cards.map((card) => {
                  const isLocked = !ownedCardIds.includes(card.id);
                  const copies = cardCopies[card.id] || 0;
                  const level = getCardLevel(copies);
                  const { current, required, progress: levelProgress } = getLevelProgress(copies);
                  const isMaxLevel = level >= MAX_LEVEL;
                  const evolution = getEvolution(card.id);
                  const isEvolved = unlockedEvolutions.includes(card.id);
                  const canUseWildCard = !isLocked && !isMaxLevel && wildCardCount > 0;

                  return (
                    <div key={card.id} className="relative flex flex-col items-center cursor-pointer" onClick={() => setSelectedCard(card)}>
                      {/* Card */}
                      <div className="relative">
                        <GameCard 
                          card={card} 
                          size="small" 
                          canAfford={!isLocked}
                          level={level}
                          showLevel={!isLocked}
                        />
                        
                        {/* Locked Overlay */}
                        {isLocked && (
                          <div className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-foreground bg-card/90 border border-border rounded-full px-2 py-0.5">
                              <Lock className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        )}

                        {/* Evolution Badge */}
                        {evolution && !isLocked && (
                          <div className={cn(
                            'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
                            isEvolved 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-muted border border-purple-500/50'
                          )}>
                            <Sparkles className={cn(
                              'w-2.5 h-2.5',
                              isEvolved ? 'text-white' : 'text-purple-400'
                            )} />
                          </div>
                        )}

                        {/* Wild Card Use Button */}
                        {canUseWildCard && onUseWildCard && (
                          <button
                            onClick={() => onUseWildCard(rarity, card.id)}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center border border-white/50 shadow-md transition-colors"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>

                      {/* Card Count / Progress */}
                      {!isLocked && (
                        <div className="w-full mt-1">
                          {isMaxLevel ? (
                            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded px-1.5 py-0.5">
                              <div className="text-[8px] text-center text-amber-400 font-bold">MAX</div>
                            </div>
                          ) : (
                            <div className="bg-card/50 rounded px-1 py-0.5">
                              <Progress 
                                value={levelProgress * 100} 
                                className="h-1 bg-muted"
                              />
                              <div className="text-[7px] text-center text-muted-foreground mt-0.5 font-medium">
                                {current}/{required}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Locked card count placeholder */}
                      {isLocked && (
                        <div className="w-full mt-1 bg-muted/30 rounded px-1 py-0.5">
                          <div className="text-[7px] text-center text-muted-foreground/50 font-medium">
                            0/2
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Evolution Info Footer */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-purple-300">Evolution Shards</h3>
          </div>
          <p className="text-xs text-purple-200/70">
            Collect {EVOLUTION_SHARDS_REQUIRED} shards from 5-star chests to unlock a card evolution. 
            Evolved cards gain special abilities in battle!
          </p>
          <div className="mt-2 text-[10px] text-purple-400/60">
            {unlockedEvolutions.length}/{evolutions.length} evolutions unlocked
          </div>
        </div>
      </div>

      {/* Evolution Shards Modal */}
      {showEvolutionModal && onUnlockEvolution && (
        <EvolutionShardsModal
          evolutionShards={evolutionShards}
          ownedCardIds={ownedCardIds}
          unlockedEvolutions={unlockedEvolutions}
          cardCopies={cardCopies}
          onUnlockEvolution={onUnlockEvolution}
          onClose={() => setShowEvolutionModal(false)}
        />
      )}
      {/* Card Detail Modal */}
      {selectedCard && (() => {
        const isLocked = !ownedCardIds.includes(selectedCard.id);
        const copies = cardCopies[selectedCard.id] || 0;
        const cardLevel = getCardLevel(copies);
        const rarityBorder: Record<string, string> = {
          common: 'border-slate-400',
          rare: 'border-blue-400',
          epic: 'border-purple-400',
          legendary: 'border-amber-400',
          champion: 'border-pink-400'
        };
        return (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 pr-[30%]" onClick={() => setSelectedCard(null)}>
            <div
              className={cn('bg-card border-2 rounded-2xl p-5 max-w-[280px] w-full shadow-2xl', rarityBorder[selectedCard.rarity] || 'border-border')}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button onClick={() => setSelectedCard(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-5xl">{selectedCard.emoji}</span>
                <h3 className="text-lg font-bold text-foreground">{selectedCard.name}</h3>
                <span className={cn('text-xs font-semibold capitalize px-2 py-0.5 rounded-full', rarityConfig[selectedCard.rarity as Rarity]?.bgColor || 'bg-muted', 'text-white')}>
                  {selectedCard.rarity}
                </span>
                {isLocked && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    <Lock className="w-3 h-3" /> Not yet unlocked
                  </div>
                )}
                {!isLocked && (
                  <div className="text-xs text-amber-400 font-bold">Level {cardLevel}</div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground text-center mb-4">{selectedCard.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center bg-muted/50 rounded-lg p-2">
                  <Droplets className="w-4 h-4 text-blue-400 mb-1" />
                  <span className="text-xs font-bold text-foreground">{selectedCard.elixirCost}</span>
                  <span className="text-[9px] text-muted-foreground">Elixir</span>
                </div>
                <div className="flex flex-col items-center bg-muted/50 rounded-lg p-2">
                  <Heart className="w-4 h-4 text-red-400 mb-1" />
                  <span className="text-xs font-bold text-foreground">{selectedCard.health}</span>
                  <span className="text-[9px] text-muted-foreground">HP</span>
                </div>
                <div className="flex flex-col items-center bg-muted/50 rounded-lg p-2">
                  <Swords className="w-4 h-4 text-orange-400 mb-1" />
                  <span className="text-xs font-bold text-foreground">{selectedCard.damage}</span>
                  <span className="text-[9px] text-muted-foreground">DMG</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </ScrollArea>
  );
}
