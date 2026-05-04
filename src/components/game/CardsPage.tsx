import { useState } from 'react';
import { PlayerProgress, DeckSlot } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Swords, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeckBuilder, CardBalanceInfo } from './DeckBuilder';
import { CardCollection } from './CardCollection';
import { WildCardRarity } from '@/data/wildCards';
import { ExtendedPlayerProgress } from '@/hooks/useProgression';

interface CardsPageProps {
  progress: ExtendedPlayerProgress;
  onSaveDeck: (deckId: string, cardIds: string[]) => void;
  onSetActiveDeck: (deckId: string) => void;
  onAddDeck: () => void;
  onStartBattle: () => void;
  cardBalanceInfo?: CardBalanceInfo[];
  onUseWildCard?: (rarity: WildCardRarity, cardId: string) => void;
  onSelectTowerTroop?: (troopId: string) => void;
  onUseWildCards?: (cardId: string, amount: number) => boolean;
  onUnlockEvolution?: (cardId: string) => boolean;
  onOpenEvolutions?: () => void;
}

type TabType = 'decks' | 'collection';

export function CardsPage({
  progress,
  onSaveDeck,
  onSetActiveDeck,
  onAddDeck,
  onStartBattle,
  cardBalanceInfo = [],
  onUseWildCard,
  onSelectTowerTroop,
  onUseWildCards,
  onUnlockEvolution,
  onOpenEvolutions
}: CardsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('decks');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Buttons */}
      <div className="flex gap-2 p-3 bg-card/50 border-b border-border">
        <Button
          variant={activeTab === 'decks' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'flex-1 gap-2',
            activeTab === 'decks' && 'bg-primary text-primary-foreground'
          )}
          onClick={() => setActiveTab('decks')}
        >
          <Swords className="w-4 h-4" />
          Battle Decks
        </Button>
        <Button
          variant={activeTab === 'collection' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'flex-1 gap-2',
            activeTab === 'collection' && 'bg-primary text-primary-foreground'
          )}
          onClick={() => setActiveTab('collection')}
        >
          <Library className="w-4 h-4" />
          Collection
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'decks' ? (
          <DeckBuilder
            ownedCardIds={progress.ownedCardIds}
            cardCopies={progress.cardCopies}
            deckSlots={progress.deckSlots}
            activeDeckId={progress.activeDeckId}
            onSaveDeck={onSaveDeck}
            onSetActiveDeck={onSetActiveDeck}
            onAddDeck={onAddDeck}
            onStartBattle={onStartBattle}
            onBack={() => setActiveTab('collection')}
            cardBalanceInfo={cardBalanceInfo}
            selectedTowerTroopId={progress.selectedTowerTroopId}
            unlockedTowerTroopIds={progress.unlockedTowerTroopIds}
            onSelectTowerTroop={onSelectTowerTroop}
            wildCardCounts={progress.wildCardCounts}
            onUseWildCards={onUseWildCards}
            unlockedEvolutions={progress.unlockedEvolutions}
          />
        ) : (
          <CardCollection
            ownedCardIds={progress.ownedCardIds}
            cardCopies={progress.cardCopies}
            wildCardCounts={progress.wildCardCounts as Record<WildCardRarity, number>}
            evolutionShards={progress.evolutionShards}
            unlockedEvolutions={progress.unlockedEvolutions}
            onUseWildCard={onUseWildCard}
            onUnlockEvolution={onUnlockEvolution}
            onOpenEvolutions={onOpenEvolutions}
          />
        )}
      </div>
    </div>
  );
}
