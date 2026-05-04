import { allCards } from '@/data/cards';
import { GameCard } from './GameCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { getCardLevel, getLevelProgress, MAX_LEVEL } from '@/lib/cardLevels';
import { Progress } from '@/components/ui/progress';

interface CardGalleryProps {
  ownedCardIds: string[];
  cardCopies: Record<string, number>;
  onBack: () => void;
}

const rarityOrder = ['common', 'rare', 'epic', 'legendary'] as const;

export function CardGallery({ ownedCardIds, cardCopies, onBack }: CardGalleryProps) {
  const ownedCount = ownedCardIds.length;
  const totalCount = allCards.length;

  const cardsByRarity = rarityOrder.map((rarity) => ({
    rarity,
    cards: allCards.filter((c) => c.rarity === rarity)
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 gap-6">
      <header className="w-full max-w-md flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <h1 className="game-title text-3xl text-primary leading-tight">Collection</h1>
          <p className="text-sm text-muted-foreground">
            Unlocked {ownedCount}/{totalCount} cards
          </p>
        </div>
      </header>

      <main className="w-full max-w-md flex flex-col gap-6">
        {cardsByRarity.map(({ rarity, cards }) => (
          <section key={rarity} className="bg-card/30 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold capitalize text-foreground">{rarity}</h2>
              <span className="text-xs text-muted-foreground">
                {cards.filter((c) => ownedCardIds.includes(c.id)).length}/{cards.length}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {cards.map((card) => {
                const isLocked = !ownedCardIds.includes(card.id);
                const copies = cardCopies[card.id] || 0;
                const level = getCardLevel(copies);
                const { current, required, progress } = getLevelProgress(copies);
                const isMaxLevel = level >= MAX_LEVEL;
                
                return (
                  <div key={card.id} className="relative flex flex-col items-center">
                    <GameCard 
                      card={card} 
                      size="small" 
                      canAfford={!isLocked} 
                      level={level}
                      showLevel={!isLocked}
                    />
                    {isLocked ? (
                      <div className="absolute inset-0 rounded-lg bg-background/40 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-semibold text-foreground bg-card/80 border border-border rounded-full px-2 py-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </div>
                      </div>
                    ) : (
                      <div className="w-full mt-1">
                        {isMaxLevel ? (
                          <div className="text-[8px] text-center text-amber-400 font-semibold">MAX</div>
                        ) : (
                          <>
                            <Progress 
                              value={progress * 100} 
                              className="h-1 bg-muted"
                            />
                            <div className="text-[7px] text-center text-muted-foreground mt-0.5">
                              {current}/{required}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
