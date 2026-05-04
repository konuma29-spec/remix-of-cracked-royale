import { useState, useEffect, useRef, useMemo } from 'react';
import { CardDefinition, DeckSlot } from '@/types/game';
import { allCards } from '@/data/cards';
import { GameCard } from './GameCard';
import { TowerTroopSelector } from './TowerTroopSelector';
import { WildCardUpgradeModal } from './WildCardUpgradeModal';
import { CardEvolutionSelector } from './CardEvolutionSelector';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Swords, Check, X, Info, ArrowLeft, Plus, TrendingDown, Search } from 'lucide-react';
import { getCardLevel, getLevelMultiplier } from '@/lib/cardLevels';
import { hasEvolution, getEvolution } from '@/data/evolutions';

export interface CardBalanceInfo {
  cardId: string;
  nerfLevel: number;
  winStreak: number;
  lastNerfedStat: 'damage' | 'speed' | 'health' | 'attackSpeed' | null;
}

interface DeckBuilderProps {
  ownedCardIds: string[];
  cardCopies: Record<string, number>;
  deckSlots: DeckSlot[];
  activeDeckId: string;
  onSaveDeck: (deckId: string, cardIds: string[]) => void;
  onSetActiveDeck: (deckId: string) => void;
  onAddDeck: () => void;
  onStartBattle: () => void;
  onBack?: () => void;
  cardBalanceInfo?: CardBalanceInfo[];
  // Tower troop props
  selectedTowerTroopId?: string;
  unlockedTowerTroopIds?: string[];
  onSelectTowerTroop?: (troopId: string) => void;
  // Wild card props
  wildCardCounts?: Record<string, number>;
  onUseWildCards?: (cardId: string, amount: number) => boolean;
  // Evolution props
  unlockedEvolutions?: string[];
}

export function DeckBuilder({ 
  ownedCardIds, 
  cardCopies,
  deckSlots, 
  activeDeckId,
  onSaveDeck, 
  onSetActiveDeck,
  onAddDeck,
  onStartBattle,
  onBack,
  cardBalanceInfo = [],
  selectedTowerTroopId = 'default',
  unlockedTowerTroopIds = ['default'],
  onSelectTowerTroop,
  wildCardCounts = {},
  onUseWildCards,
  unlockedEvolutions = []
}: DeckBuilderProps) {
  const [editingDeckId, setEditingDeckId] = useState<string>(activeDeckId);
  const currentSlot = deckSlots.find(s => s.id === editingDeckId);
  const [selectedDeck, setSelectedDeck] = useState<string[]>(currentSlot?.cardIds || []);
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [upgradeModalCard, setUpgradeModalCard] = useState<CardDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [evolutionSelectorCard, setEvolutionSelectorCard] = useState<CardDefinition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard navigation for scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      const scrollAmount = 100;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync when switching deck tabs
  useEffect(() => {
    const slot = deckSlots.find(s => s.id === editingDeckId);
    setSelectedDeck(slot?.cardIds || []);
  }, [editingDeckId, deckSlots]);

  const ownedCards = allCards.filter(c => ownedCardIds.includes(c.id));
  
  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return ownedCards;
    const query = searchQuery.toLowerCase();
    return ownedCards.filter(card => 
      card.name.toLowerCase().includes(query) ||
      card.rarity.toLowerCase().includes(query) ||
      card.type.toLowerCase().includes(query)
    );
  }, [ownedCards, searchQuery]);
  
  // Map deck IDs to cards, handling evo- prefix
  const deckCards = selectedDeck.map(id => {
    const isEvo = id.startsWith('evo-');
    const baseId = isEvo ? id.replace('evo-', '') : id;
    const baseCard = allCards.find(c => c.id === baseId);
    if (!baseCard) return null;
    
    if (isEvo) {
      const evolution = getEvolution(baseId);
      return {
        ...baseCard,
        id: id, // Keep the evo- prefix for deck management
        name: `Evo ${baseCard.name}`,
        emoji: evolution?.emoji || baseCard.emoji,
        isEvolved: true
      } as CardDefinition & { isEvolved?: boolean };
    }
    return baseCard;
  }).filter(Boolean) as (CardDefinition & { isEvolved?: boolean })[];

  // Get balance info for a card
  const getBalanceInfo = (cardId: string): CardBalanceInfo | undefined => {
    return cardBalanceInfo.find(b => b.cardId === cardId);
  };

  const toggleCard = (cardId: string, useEvolution: boolean = false) => {
    const finalCardId = useEvolution ? `evo-${cardId}` : cardId;
    const baseCardId = cardId.replace('evo-', '');
    
    // Check if any version of this card is in deck
    const normalInDeck = selectedDeck.includes(baseCardId);
    const evoInDeck = selectedDeck.includes(`evo-${baseCardId}`);
    
    if (normalInDeck || evoInDeck) {
      // Remove whichever version is in deck
      setSelectedDeck(prev => prev.filter(id => id !== baseCardId && id !== `evo-${baseCardId}`));
    } else if (selectedDeck.length < 8) {
      setSelectedDeck(prev => [...prev, finalCardId]);
    }
    // If deck is full and card not in deck, do nothing (block add)
  };
  
  // Handle card double-click with evolution check
  const handleCardDoubleClick = (card: CardDefinition) => {
    const baseCardId = card.id.replace('evo-', '');
    const hasUnlockedEvolution = unlockedEvolutions.includes(baseCardId) && hasEvolution(baseCardId);
    const isInDeck = selectedDeck.includes(card.id) || selectedDeck.includes(`evo-${card.id}`);
    
    // If removing from deck, just remove it
    if (isInDeck) {
      toggleCard(card.id);
      return;
    }
    
    // If adding and has unlocked evolution, show selector
    if (hasUnlockedEvolution && selectedDeck.length < 8) {
      setEvolutionSelectorCard(card);
    } else {
      toggleCard(card.id);
    }
  };

  const handleSave = () => {
    if (selectedDeck.length === 8) {
      onSaveDeck(editingDeckId, selectedDeck);
    }
  };

  const handleSetActive = () => {
    if (selectedDeck.length === 8) {
      onSaveDeck(editingDeckId, selectedDeck);
      onSetActiveDeck(editingDeckId);
    }
  };

  const avgElixir = deckCards.length > 0 
    ? (deckCards.reduce((sum, c) => sum + c.elixirCost, 0) / deckCards.length).toFixed(1)
    : '0.0';

  const isActiveDeck = activeDeckId === editingDeckId;
  // Allow battle with current editing deck if it has 8 cards (auto-saves on battle)
  const canBattle = selectedDeck.length === 8;

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto bg-background flex flex-col items-center p-4 gap-4 pb-8"
    >

      {/* Deck Tabs */}
      <ScrollArea className="w-full max-w-md">
        <div className="flex gap-2 pb-2">
          {deckSlots.map(slot => {
            const isComplete = slot.cardIds.length === 8;
            const isEditing = editingDeckId === slot.id;
            const isActive = activeDeckId === slot.id;
            
            return (
              <button
                key={slot.id}
                onClick={() => setEditingDeckId(slot.id)}
                className={cn(
                  'min-w-[80px] py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium flex-shrink-0',
                  isEditing 
                    ? 'border-primary bg-primary/20 text-primary' 
                    : 'border-border bg-card/50 text-muted-foreground hover:bg-card',
                  isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{slot.name}</span>
                  <span className={cn(
                    'text-[10px]',
                    isComplete ? 'text-green-400' : 'text-muted-foreground'
                  )}>
                    {isComplete ? '✓ Ready' : `${slot.cardIds.length}/8`}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-primary font-bold">ACTIVE</span>
                  )}
                </div>
              </button>
            );
          })}
          <button
            onClick={onAddDeck}
            className="min-w-[60px] py-2 px-3 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-card/30 text-muted-foreground hover:bg-card hover:border-primary hover:text-primary transition-all flex-shrink-0"
          >
            <div className="flex flex-col items-center gap-1">
              <Plus className="w-4 h-4" />
              <span className="text-[10px]">Add</span>
            </div>
          </button>
        </div>
      </ScrollArea>

      {/* Current Deck */}
      <div className="bg-card/50 rounded-xl p-4 border border-border w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium">Deck {editingDeckId} ({selectedDeck.length}/8)</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Avg: ⚡{avgElixir}</span>
            {selectedDeck.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setSelectedDeck([])}
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 min-h-[200px]">
          {[...Array(8)].map((_, idx) => {
            const card = deckCards[idx];
            return (
              <div 
                key={idx}
                className={cn(
                  'rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center p-1',
                  !card && 'bg-muted/20 aspect-[3/4]'
                )}
              >
                {card ? (
                  <div className="relative flex flex-col items-center">
                    {/* Evolution glow effect */}
                    {(card as CardDefinition & { isEvolved?: boolean }).isEvolved && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none z-0" />
                    )}
                    <GameCard 
                      card={card} 
                      size="small"
                      onClick={() => {
                        // Remove the card (either normal or evo version)
                        setSelectedDeck(prev => prev.filter(id => id !== card.id));
                      }}
                      level={getCardLevel(cardCopies[card.id.replace('evo-', '')] || 0)}
                      showLevel={true}
                    />
                    <button
                      onClick={() => setSelectedDeck(prev => prev.filter(id => id !== card.id))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center hover:scale-110 transition-transform z-20"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    {/* Evolution indicator */}
                    {(card as CardDefinition & { isEvolved?: boolean }).isEvolved && (
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center z-20" title="Evolved">
                        <span className="text-[8px]">✨</span>
                      </div>
                    )}
                    {/* Nerf indicator on deck cards */}
                    {(() => {
                      const baseId = card.id.replace('evo-', '');
                      const balance = getBalanceInfo(baseId);
                      if (balance && balance.nerfLevel > 0) {
                        return (
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center z-20" title={`Nerfed ${balance.nerfLevel}x`}>
                            <TrendingDown className="w-2.5 h-2.5 text-white" />
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="mt-1 text-center w-full">
                      <div className="text-[8px] text-muted-foreground flex justify-center gap-1">
                        <span>❤️{Math.floor(card.health * getLevelMultiplier(getCardLevel(cardCopies[card.id.replace('evo-', '')] || 0)))}</span>
                        <span>⚔️{Math.floor(card.damage * getLevelMultiplier(getCardLevel(cardCopies[card.id.replace('evo-', '')] || 0)))}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-2xl">+</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tower Troop Selector */}
      {onSelectTowerTroop && (
        <div className="w-full max-w-md">
          <TowerTroopSelector
            selectedTroopId={selectedTowerTroopId}
            unlockedTroopIds={unlockedTowerTroopIds}
            onSelect={onSelectTowerTroop}
          />
        </div>
      )}
      <div className="bg-card/30 rounded-xl p-4 border border-border w-full max-w-md">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium">
            {searchQuery ? `Results (${filteredCards.length})` : `Your Cards (${ownedCards.length})`}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 p-1">
          {filteredCards.map(card => {
            const inDeck = selectedDeck.includes(card.id);
            const balance = getBalanceInfo(card.id);
            const isNerfed = balance && balance.nerfLevel > 0;
            
            return (
              <button 
                key={card.id}
                type="button"
                className="relative cursor-pointer bg-transparent border-none p-0"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPosition({ 
                    x: rect.left + rect.width / 2, 
                    y: rect.bottom + 8 
                  });
                  setSelectedCard(card);
                }}
                onMouseLeave={() => {
                  setSelectedCard(null);
                  setTooltipPosition(null);
                }}
                onClick={() => {
                  // Use timeout to distinguish single vs double click
                  if (clickTimeoutRef.current) {
                    clearTimeout(clickTimeoutRef.current);
                    clickTimeoutRef.current = null;
                  }
                  clickTimeoutRef.current = setTimeout(() => {
                    // Single click opens upgrade modal
                    if (onUseWildCards) {
                      setUpgradeModalCard(card);
                    }
                    clickTimeoutRef.current = null;
                  }, 200); // 200ms delay to wait for potential double-click
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Cancel the single-click timeout
                  if (clickTimeoutRef.current) {
                    clearTimeout(clickTimeoutRef.current);
                    clickTimeoutRef.current = null;
                  }
                  handleCardDoubleClick(card);
                }}
              >
                <GameCard 
                  card={card} 
                  size="small"
                  isSelected={inDeck}
                  level={getCardLevel(cardCopies[card.id] || 0)}
                  showLevel={true}
                />
                {inDeck && (
                  <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full flex items-center justify-center z-10">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                {/* Nerf indicator */}
                {isNerfed && (
                  <div 
                    className="absolute top-0 left-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 z-10 shadow-lg"
                    title={`Stats reduced by ${balance.nerfLevel * 10}% (${balance.lastNerfedStat || 'random stat'})`}
                  >
                    <TrendingDown className="w-2.5 h-2.5 text-white" />
                    <span className="text-[8px] font-bold text-white">-{balance.nerfLevel * 10}%</span>
                  </div>
                )}
                {/* Win streak indicator (close to nerf) */}
                {balance && balance.winStreak > 0 && balance.winStreak < 3 && !isNerfed && (
                  <div 
                    className="absolute bottom-0 left-0 bg-yellow-500/90 rounded-full px-1 py-0.5 flex items-center gap-0.5 z-10"
                    title={`${balance.winStreak}/3 wins to nerf`}
                  >
                    <span className="text-[7px] font-bold text-yellow-900">🔥{balance.winStreak}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          {selectedDeck.length >= 8 ? 'Deck full! Remove a card first.' : 'Click to upgrade • Double-click to add/remove'}
        </p>
      </div>

      {/* Card Info Tooltip - positioned under hovered card */}
      {selectedCard && tooltipPosition && (() => {
        const balance = getBalanceInfo(selectedCard.id);
        const isNerfed = balance && balance.nerfLevel > 0;
        const nerfMultiplier = isNerfed ? (1 - balance.nerfLevel * 0.1) : 1;
        
        return (
          <div 
            className="fixed z-50 pointer-events-none"
            style={{ 
              left: tooltipPosition.x, 
              top: tooltipPosition.y,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-card border-2 border-primary/50 rounded-xl p-3 shadow-2xl min-w-64 max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedCard.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{selectedCard.name}</h3>
                    {isNerfed && (
                      <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        -{balance.nerfLevel * 10}%
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs capitalize',
                    selectedCard.rarity === 'common' && 'text-slate-400',
                    selectedCard.rarity === 'rare' && 'text-blue-400',
                    selectedCard.rarity === 'epic' && 'text-purple-400',
                    selectedCard.rarity === 'legendary' && 'text-amber-400',
                    selectedCard.rarity === 'champion' && 'text-pink-400'
                  )}>
                    {selectedCard.rarity}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{selectedCard.description}</p>
              
              {/* Stats with nerf indication */}
              <div className="flex gap-4 text-xs">
                <span className={isNerfed ? 'text-orange-400' : ''}>
                  ❤️ {isNerfed ? Math.round(selectedCard.health * nerfMultiplier) : selectedCard.health}
                  {isNerfed && <span className="text-[9px] text-muted-foreground line-through ml-1">{selectedCard.health}</span>}
                </span>
                <span className={isNerfed ? 'text-orange-400' : ''}>
                  ⚔️ {isNerfed ? Math.round(selectedCard.damage * nerfMultiplier) : selectedCard.damage}
                  {isNerfed && <span className="text-[9px] text-muted-foreground line-through ml-1">{selectedCard.damage}</span>}
                </span>
                <span>⚡ {selectedCard.elixirCost}</span>
              </div>
              
              {/* Nerf details */}
              {isNerfed && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] text-orange-400">
                    ⚠️ Nerfed {balance.nerfLevel}x for winning too many games
                  </p>
                </div>
              )}
              
              {/* Win streak warning */}
              {balance && balance.winStreak > 0 && !isNerfed && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] text-yellow-500">
                    🔥 {balance.winStreak}/3 wins - nerf after {3 - balance.winStreak} more MVP wins
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full max-w-md">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSave}
            disabled={selectedDeck.length !== 8}
          >
            Save Deck {editingDeckId}
          </Button>
          {!isActiveDeck && (
            <Button 
              variant="secondary"
              className="flex-1"
              onClick={handleSetActive}
              disabled={selectedDeck.length !== 8}
            >
              Set as Active
            </Button>
          )}
        </div>
        <Button 
          className="w-full gap-2"
          onClick={() => {
            // Auto-save current deck and set as active before battle
            if (selectedDeck.length === 8) {
              onSaveDeck(editingDeckId, selectedDeck);
              onSetActiveDeck(editingDeckId);
              onStartBattle();
            }
          }}
          disabled={!canBattle}
        >
          <Swords className="w-4 h-4" />
          Battle!
        </Button>
      </div>

      {selectedDeck.length !== 8 && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <Info className="w-4 h-4" />
          Select {8 - selectedDeck.length} more card{8 - selectedDeck.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Wild Card Upgrade Modal */}
      {onUseWildCards && (
        <WildCardUpgradeModal
          card={upgradeModalCard}
          isOpen={!!upgradeModalCard}
          onClose={() => setUpgradeModalCard(null)}
          cardCopies={cardCopies}
          wildCardCounts={wildCardCounts}
          onUseWildCards={onUseWildCards}
        />
      )}

      {/* Evolution Selector Modal */}
      {evolutionSelectorCard && (
        <CardEvolutionSelector
          card={evolutionSelectorCard}
          isOpen={!!evolutionSelectorCard}
          onClose={() => setEvolutionSelectorCard(null)}
          onSelectNormal={() => {
            toggleCard(evolutionSelectorCard.id, false);
            setEvolutionSelectorCard(null);
          }}
          onSelectEvolution={() => {
            toggleCard(evolutionSelectorCard.id, true);
            setEvolutionSelectorCard(null);
          }}
          cardLevel={getCardLevel(cardCopies[evolutionSelectorCard.id] || 0)}
        />
      )}
    </div>
  );
}
