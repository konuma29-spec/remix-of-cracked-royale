import { memo, useMemo } from 'react';
import { Unit } from '@/types/game';
import { getChampionAbility } from '@/data/championAbilities';
import { getCardById } from '@/data/cards';
import { cn } from '@/lib/utils';

interface ChampionAbilityButtonProps {
  playerUnits: Unit[];
  playerElixir: number;
  onActivateAbility: (unitId: string) => void;
  currentTime: number;
}

export const ChampionAbilityButton = memo(function ChampionAbilityButton({
  playerUnits,
  playerElixir,
  onActivateAbility,
  currentTime
}: ChampionAbilityButtonProps) {
  // Find the first champion unit on the battlefield
  const championUnit = useMemo(() => {
    return playerUnits.find(unit => {
      const card = getCardById(unit.cardId);
      return card?.rarity === 'champion' && unit.health > 0;
    });
  }, [playerUnits]);

  if (!championUnit) return null;

  const card = getCardById(championUnit.cardId);
  const ability = getChampionAbility(championUnit.cardId);
  
  if (!ability || !card) return null;

  // Calculate cooldown
  const abilityState = championUnit.abilityState;
  const timeSinceLastActivation = abilityState 
    ? (currentTime - abilityState.lastActivationTime) / 1000 // Convert to seconds
    : ability.cooldown;
  const isOnCooldown = ability.cooldown > 0 && timeSinceLastActivation < ability.cooldown;
  const cooldownRemaining = Math.max(0, ability.cooldown - timeSinceLastActivation);
  const cooldownPercent = isOnCooldown ? (cooldownRemaining / ability.cooldown) * 100 : 0;
  
  // Check if ability is currently active
  const isActive = abilityState?.isActive || false;
  
  // Check if player has enough elixir
  const hasEnoughElixir = playerElixir >= ability.elixirCost;
  
  // For soul-summon, need at least some souls to activate
  const hasSouls = ability.id === 'soul-summon' ? (abilityState?.stacks || 0) >= 6 : true;
  
  const canActivate = !isOnCooldown && !isActive && hasEnoughElixir && hasSouls;

  const handleClick = () => {
    if (canActivate) {
      onActivateAbility(championUnit.id);
    }
  };

  // Get ability-specific styling
  const getAbilityColor = () => {
    switch (ability.id) {
      case 'cloak': return { from: 'from-purple-500', to: 'to-purple-700', border: 'border-purple-400', glow: 'shadow-purple-500/50' };
      case 'dash-chain': return { from: 'from-yellow-500', to: 'to-yellow-700', border: 'border-yellow-400', glow: 'shadow-yellow-500/50' };
      case 'soul-summon': return { from: 'from-green-500', to: 'to-green-700', border: 'border-green-400', glow: 'shadow-green-500/50' };
      case 'drill': return { from: 'from-orange-500', to: 'to-orange-700', border: 'border-orange-400', glow: 'shadow-orange-500/50' };
      case 'guardian': return { from: 'from-blue-500', to: 'to-blue-700', border: 'border-blue-400', glow: 'shadow-blue-500/50' };
      case 'reflect': return { from: 'from-cyan-500', to: 'to-cyan-700', border: 'border-cyan-400', glow: 'shadow-cyan-500/50' };
      default: return { from: 'from-amber-500', to: 'to-amber-700', border: 'border-amber-400', glow: 'shadow-amber-500/50' };
    }
  };

  const colors = getAbilityColor();

  // Get ability icon/emoji
  const getAbilityIcon = () => {
    switch (ability.id) {
      case 'cloak': return '👻';
      case 'dash-chain': return '⚔️';
      case 'soul-summon': return '💀';
      case 'drill': return '💣';
      case 'guardian': return '🛡️';
      case 'reflect': return '🔄';
      default: return '⚡';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={!canActivate}
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border-2 shadow-md transition-all relative overflow-hidden",
          `bg-gradient-to-b ${colors.from} ${colors.to} ${colors.border}`,
          canActivate && "hover:scale-105 active:scale-95 cursor-pointer",
          isActive && `animate-pulse shadow-lg ${colors.glow}`,
          !canActivate && "opacity-60 cursor-not-allowed"
        )}
        title={`${ability.name} (${ability.elixirCost} elixir): ${ability.description}`}
      >
        {/* Cooldown overlay */}
        {isOnCooldown && (
          <div 
            className="absolute inset-0 bg-black/60"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% ${cooldownPercent}%, 0 ${cooldownPercent}%)`
            }}
          />
        )}
        
        {/* Active glow ring */}
        {isActive && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-white/80 animate-ping" />
        )}
        
        {/* Ability icon */}
        <span className="text-lg relative z-10">{getAbilityIcon()}</span>
        
        {/* Cooldown timer */}
        {isOnCooldown && (
          <div className="absolute bottom-0 left-0 right-0 text-[8px] font-bold text-white bg-black/50 text-center">
            {cooldownRemaining.toFixed(1)}s
          </div>
        )}
        
        {/* Soul stacks indicator for Skeleton King */}
        {ability.id === 'soul-summon' && abilityState?.stacks !== undefined && abilityState.stacks > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center text-[10px] text-white font-bold z-20">
            {abilityState.stacks}
          </div>
        )}
        
        {/* Elixir cost badge */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-20 border",
          hasEnoughElixir 
            ? "bg-pink-500 border-pink-300 text-white" 
            : "bg-gray-500 border-gray-400 text-gray-300"
        )}>
          {ability.elixirCost}
        </div>
      </button>
      
      {/* Champion card emoji indicator */}
      <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-[10px] z-10">
        {card.emoji}
      </div>
    </div>
  );
});
