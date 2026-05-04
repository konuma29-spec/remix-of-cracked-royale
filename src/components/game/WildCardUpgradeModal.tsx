import { useState } from 'react';
import { CardDefinition } from '@/types/game';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameCard } from './GameCard';
import { getCardLevel, getLevelProgress, getCopiesForNextLevel, MAX_LEVEL } from '@/lib/cardLevels';
import { getWildCard, WildCardRarity } from '@/data/wildCards';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowUp, Minus, Plus } from 'lucide-react';

interface WildCardUpgradeModalProps {
  card: CardDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  cardCopies: Record<string, number>;
  wildCardCounts: Record<string, number>;
  onUseWildCards: (cardId: string, amount: number) => boolean;
}

export function WildCardUpgradeModal({
  card,
  isOpen,
  onClose,
  cardCopies,
  wildCardCounts,
  onUseWildCards
}: WildCardUpgradeModalProps) {
  const [amount, setAmount] = useState(1);
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!card) return null;

  const rarity = card.rarity as WildCardRarity;
  const wildCard = getWildCard(rarity);
  const availableWildCards = wildCardCounts[rarity] || 0;
  const currentCopies = cardCopies[card.id] || 0;
  const currentLevel = getCardLevel(currentCopies);
  const levelProgress = getLevelProgress(currentCopies);
  const copiesNeededForNext = getCopiesForNextLevel(currentLevel);
  const copiesStillNeeded = Math.max(0, copiesNeededForNext - currentCopies);
  
  const isMaxLevel = currentLevel >= MAX_LEVEL;
  const canUpgrade = availableWildCards > 0 && !isMaxLevel;
  
  // Calculate what level we'd reach with the selected amount
  const simulatedCopies = currentCopies + amount;
  const simulatedLevel = getCardLevel(simulatedCopies);
  const wouldLevelUp = simulatedLevel > currentLevel;

  const handleUseWildCards = () => {
    if (amount <= 0 || amount > availableWildCards) return;
    
    setIsUpgrading(true);
    const success = onUseWildCards(card.id, amount);
    
    setTimeout(() => {
      setIsUpgrading(false);
      if (success) {
        setAmount(1);
        onClose();
      }
    }, 300);
  };

  const incrementAmount = () => {
    if (amount < availableWildCards) {
      setAmount(prev => prev + 1);
    }
  };

  const decrementAmount = () => {
    if (amount > 1) {
      setAmount(prev => prev - 1);
    }
  };

  const setMaxAmount = () => {
    setAmount(availableWildCards);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{card.emoji}</span>
            <span>{card.name}</span>
          </DialogTitle>
          <DialogDescription>
            Use Wild Cards to add copies and level up this card
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Card Preview */}
          <div className="relative">
            <GameCard 
              card={card} 
              size="medium" 
              level={currentLevel}
              showLevel={true}
            />
            {wouldLevelUp && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 animate-pulse">
                <ArrowUp className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Level Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold">Level {currentLevel}</span>
              {wouldLevelUp && (
                <>
                  <ArrowUp className="w-4 h-4 text-primary" />
                  <span className="text-lg font-bold text-primary">Level {simulatedLevel}</span>
                </>
              )}
            </div>
            {!isMaxLevel && (
              <div className="text-sm text-muted-foreground mt-1">
                {currentCopies}/{copiesNeededForNext} copies ({levelProgress.current}/{levelProgress.required} to next level)
              </div>
            )}
            {isMaxLevel && (
              <div className="text-sm text-primary mt-1">✨ MAX LEVEL ✨</div>
            )}
          </div>

          {/* Progress Bar */}
          {!isMaxLevel && (
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                style={{ width: `${Math.min(100, ((currentCopies + amount) / copiesNeededForNext) * 100)}%` }}
              />
            </div>
          )}

          {/* Wild Card Info */}
          {wildCard && (
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border-2",
              `bg-gradient-to-r ${wildCard.gradient} bg-opacity-20`,
              "border-border"
            )}>
              <span className="text-3xl">{wildCard.emoji}</span>
              <div className="flex-1">
                <div className="font-medium">{wildCard.name}</div>
                <div className="text-sm text-muted-foreground">
                  You have: <span className="font-bold text-foreground">{availableWildCards}</span>
                </div>
              </div>
            </div>
          )}

          {/* Amount Selector */}
          {canUpgrade && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={decrementAmount}
                disabled={amount <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <div className="text-center min-w-[80px]">
                <div className="text-2xl font-bold">{amount}</div>
                <div className="text-xs text-muted-foreground">Wild Cards</div>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={incrementAmount}
                disabled={amount >= availableWildCards}
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={setMaxAmount}
                disabled={amount === availableWildCards}
              >
                Max
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full mt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={handleUseWildCards}
              disabled={!canUpgrade || isUpgrading}
            >
              <Sparkles className="w-4 h-4" />
              {isUpgrading ? 'Upgrading...' : `Use ${amount} Wild Card${amount > 1 ? 's' : ''}`}
            </Button>
          </div>

          {!canUpgrade && availableWildCards === 0 && !isMaxLevel && (
            <p className="text-sm text-muted-foreground text-center">
              You don't have any {rarity} Wild Cards. Win battles and open chests to earn more!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
