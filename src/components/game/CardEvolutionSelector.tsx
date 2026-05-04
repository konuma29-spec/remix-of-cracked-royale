import { CardDefinition } from '@/types/game';
import { getEvolution, hasEvolution } from '@/data/evolutions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameCard } from './GameCard';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardEvolutionSelectorProps {
  card: CardDefinition;
  isOpen: boolean;
  onClose: () => void;
  onSelectNormal: () => void;
  onSelectEvolution: () => void;
  cardLevel: number;
}

export function CardEvolutionSelector({
  card,
  isOpen,
  onClose,
  onSelectNormal,
  onSelectEvolution,
  cardLevel
}: CardEvolutionSelectorProps) {
  const evolution = getEvolution(card.id);
  
  if (!evolution) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <span>Choose Version</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Select which version of {card.name} to add to your deck
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Normal Version */}
            <button
              onClick={onSelectNormal}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border bg-card/50 hover:border-primary hover:bg-card transition-all"
            >
              <GameCard 
                card={card} 
                size="medium"
                level={cardLevel}
                showLevel={true}
              />
              <div className="text-center">
                <p className="font-medium text-sm">{card.name}</p>
                <p className="text-xs text-muted-foreground">Normal</p>
              </div>
            </button>

            {/* Evolution Version */}
            <button
              onClick={onSelectEvolution}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent hover:border-amber-400 hover:from-amber-500/20 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
              <div className="relative">
                <GameCard 
                  card={{
                    ...card,
                    name: `Evo ${card.name}`,
                    emoji: evolution.emoji
                  }} 
                  size="medium"
                  level={cardLevel}
                  showLevel={true}
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-center relative">
                <p className="font-medium text-sm text-amber-400">{evolution.name}</p>
                <p className="text-xs text-amber-300/70">Evolution</p>
              </div>
            </button>
          </div>

          {/* Evolution Effect Description */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Evolution Effect</span>
            </div>
            <p className="text-xs text-muted-foreground">{evolution.specialEffect}</p>
            <p className="text-[10px] text-amber-300/60 mt-1">Activates every {evolution.cycles} cycle{evolution.cycles > 1 ? 's' : ''}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
