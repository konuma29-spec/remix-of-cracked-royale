import { CardDefinition } from '@/types/game';
import { GameCard } from './GameCard';
import { cn } from '@/lib/utils';
import { getEvolution, hasEvolution } from '@/data/evolutions';

interface HandProps {
  cards: CardDefinition[];
  elixir: number;
  selectedIndex: number | null;
  onCardSelect: (index: number) => void;
  nextCard?: CardDefinition;
  cardLevels: Record<string, number>;
  cardPlayCounts?: Record<string, number>;
  unlockedEvolutions?: string[];
}

export function Hand({ cards, elixir, selectedIndex, onCardSelect, nextCard, cardLevels, cardPlayCounts = {}, unlockedEvolutions = [] }: HandProps) {
  return (
    <div className="flex gap-0.5 justify-center items-end">
      {/* Next card preview */}
      {nextCard && (
        <div className="flex flex-col items-center mr-0.5">
          <span className="text-[5px] text-muted-foreground mb-0.5">NEXT</span>
          <div className={cn(
            "w-6 h-7 rounded border border-border/50 bg-card/50 flex items-center justify-center",
            "opacity-70 scale-90"
          )}>
            <span className="text-xs">{nextCard.emoji}</span>
          </div>
        </div>
      )}
      
      {/* Hand cards */}
      {cards.map((card, index) => {
        if (!card) return null;
        
        const baseCardId = card.id.replace('evo-', '');
        const hasEvo = hasEvolution(baseCardId) && unlockedEvolutions.includes(baseCardId);
        const evolution = hasEvo ? getEvolution(baseCardId) : null;
        const cyclesRequired = evolution?.cycles || 1;
        const playCount = cardPlayCounts[card.id] || 0;
        const evoReady = hasEvo && playCount >= cyclesRequired;
        const cycleProgress = hasEvo ? Math.min(playCount, cyclesRequired) : 0;
        
          return (
          <div key={`${card.id}-${index}`} className="relative">
            <div className={cn(
              'rounded-lg transition-all duration-300 relative',
              evoReady && 'ring-2 ring-purple-400 shadow-[0_0_12px_3px_rgba(168,85,247,0.6)]'
            )}
            style={evoReady ? {
              animation: 'evo-glow-pulse 1.5s ease-in-out infinite'
            } : undefined}
            >
              <GameCard
                card={card}
                isSelected={selectedIndex === index}
                canAfford={elixir >= card.elixirCost}
                onClick={() => onCardSelect(selectedIndex === index ? -1 : index)}
                size="small"
                level={cardLevels[baseCardId] || 1}
                showLevel={true}
              />
            </div>
            
            {/* Evo cycle indicator */}
            {hasEvo && (
              <div className={cn(
                'absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-px z-20'
              )}>
                {Array.from({ length: cyclesRequired }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full border',
                      i < cycleProgress
                        ? 'bg-purple-500 border-purple-300 shadow-sm shadow-purple-400/50'
                        : 'bg-muted/60 border-purple-500/30'
                    )}
                  />
                ))}
              </div>
            )}

            {/* EVO READY flash text */}
            {evoReady && (
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20">
                <span className="text-[7px] font-black text-purple-300 uppercase tracking-wider animate-pulse"
                  style={{ textShadow: '0 0 6px rgba(168,85,247,0.8)' }}
                >
                  EVO READY
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
