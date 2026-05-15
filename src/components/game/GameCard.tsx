import { CardDefinition } from '@/types/game';
import { cn } from '@/lib/utils';
import { CardIcon } from './CardIcon';

interface GameCardProps {
  card: CardDefinition;
  isSelected?: boolean;
  canAfford?: boolean;
  onClick?: () => void;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showDetails?: boolean;
  level?: number; // Card level 1-15
  showLevel?: boolean; // Whether to display level on card
}

const rarityStyles = {
  common: 'from-slate-500 to-slate-700 border-slate-400',
  rare: 'from-blue-500 to-blue-700 border-blue-400',
  epic: 'from-purple-500 to-purple-700 border-purple-400',
  legendary: 'from-amber-500 to-orange-600 border-amber-400',
  champion: 'from-pink-500 to-rose-600 border-pink-400'
};

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/40',
  legendary: 'shadow-amber-500/50 animate-pulse',
  champion: 'shadow-pink-500/60 animate-pulse'
};

export function GameCard({ 
  card, 
  isSelected = false, 
  canAfford = true, 
  onClick,
  size = 'medium',
  showDetails = false,
  level = 1,
  showLevel = false
}: GameCardProps) {
  const sizeClasses = {
    tiny: 'w-10 h-12',
    small: 'w-12 h-[60px]',
    medium: 'w-16 h-[88px]',
    large: 'w-24 h-32'
  };
  const isEvolved = card.isEvolved === true;
  
  return (
    <div className="flex flex-col items-center">
      {/* Card box */}
      <div
        className={cn(
          'game-card relative flex flex-col items-center justify-between p-1 transition-all duration-200',
          sizeClasses[size],
          card.rarity === 'legendary' ? '' : `border-2 bg-gradient-to-b ${rarityStyles[card.rarity]}`,
          !canAfford && 'disabled grayscale-[50%]',
          isSelected && 'selected ring-2 ring-primary scale-110 -translate-y-2',
          rarityGlow[card.rarity],
          onClick && 'cursor-pointer hover:scale-105 hover:-translate-y-1',
          isEvolved && 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/50'
        )}
        style={card.rarity === 'legendary' ? {
          clipPath: 'polygon(50% 12%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        } : undefined}
        onClick={() => onClick?.()}
      >
        {/* Card art area - fills full card */}
        <div
          className="w-full h-full flex items-center justify-center rounded-md overflow-hidden absolute inset-0"
          style={{
            background: card.rarity === 'legendary' ? 'transparent' : `linear-gradient(135deg, ${card.color}40, ${card.color}20)`,
            clipPath: card.rarity === 'legendary' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined
          }}
        >
          <CardIcon
            card={card}
            imageClassName={cn(
              'w-full h-full object-cover',
              isSelected && 'animate-bounce'
            )}
            emojiClassName={cn(
              'transition-transform duration-200',
              size === 'tiny' ? 'text-lg' : size === 'small' ? 'text-xl' : size === 'medium' ? 'text-2xl' : 'text-4xl',
              isSelected && 'animate-bounce'
            )}
          />
        </div>

        {/* Rarity indicator */}
        {card.rarity !== 'legendary' && (
          <div className={cn(
            'absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full z-10',
            card.rarity === 'common' && 'bg-slate-400',
            card.rarity === 'rare' && 'bg-blue-400',
            card.rarity === 'epic' && 'bg-purple-400',
            card.rarity === 'champion' && 'bg-pink-400'
          )} />
        )}

        {/* Evolution indicator */}
        {isEvolved && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black border-2 border-white rounded-full flex items-center justify-center z-30 shadow-lg"
            title="Evolved Card"
          >
            <span className="text-[7px] font-black text-white tracking-wider">EVO</span>
          </div>
        )}

        {/* Level indicator */}
        {showLevel && level > 0 && size !== 'tiny' && (
          <div className={cn(
            'absolute -bottom-1.5 -left-1 rounded-sm flex items-center justify-center font-bold text-white shadow-md z-10',
            size === 'small' ? 'px-1 py-0.5 text-[7px]' : size === 'medium' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-xs',
            'bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300'
          )}>
            Lv{level}
          </div>
        )}

        {showDetails && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur p-2 rounded-lg border border-border min-w-32 z-10 text-center">
            <p className="text-[10px] text-muted-foreground">{card.description}</p>
            <div className="flex justify-center gap-3 mt-1 text-[9px]">
              <span>❤️ {card.health}</span>
              <span>⚔️ {card.damage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card name below the box */}
      {size !== 'tiny' && (
        <span className={cn(
          'font-bold text-white drop-shadow-md leading-tight mt-0.5 text-center w-full truncate',
          size === 'small' ? 'text-[8px]' : size === 'medium' ? 'text-[9px]' : 'text-xs'
        )}>
          {card.name}
        </span>
      )}
    </div>
  );
}
