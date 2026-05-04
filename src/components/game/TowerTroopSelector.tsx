import { cn } from '@/lib/utils';
import { Check, Lock, Crown } from 'lucide-react';
import { TOWER_TROOPS, TowerTroop } from '@/data/towerTroops';

interface TowerTroopSelectorProps {
  selectedTroopId: string;
  unlockedTroopIds: string[];
  onSelect: (troopId: string) => void;
}

const RARITY_COLORS = {
  common: 'from-gray-500 to-gray-700 border-gray-400',
  rare: 'from-amber-500 to-amber-700 border-amber-400',
  epic: 'from-purple-500 to-purple-700 border-purple-400',
  legendary: 'from-yellow-400 to-amber-600 border-yellow-300',
};

export function TowerTroopSelector({ selectedTroopId, unlockedTroopIds, onSelect }: TowerTroopSelectorProps) {
  return (
    <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-xl p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Princess Tower</h3>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {TOWER_TROOPS.map((troop) => {
          const isUnlocked = unlockedTroopIds.includes(troop.id);
          const isSelected = selectedTroopId === troop.id;
          
          return (
            <button
              key={troop.id}
              onClick={() => isUnlocked && onSelect(troop.id)}
              disabled={!isUnlocked}
              className={cn(
                "relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all border-2",
                isUnlocked 
                  ? `bg-gradient-to-b ${RARITY_COLORS[troop.rarity]} hover:scale-105 active:scale-95`
                  : "bg-gradient-to-b from-gray-700 to-gray-900 border-gray-600 opacity-50 cursor-not-allowed",
                isSelected && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900"
              )}
              title={isUnlocked ? troop.name : `${troop.name} (Locked)`}
            >
              <span className="text-2xl">{troop.emoji}</span>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              
              {/* Locked indicator */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selected troop details */}
      {selectedTroopId && (
        <TroopDetails troopId={selectedTroopId} />
      )}
    </div>
  );
}

function TroopDetails({ troopId }: { troopId: string }) {
  const troop = TOWER_TROOPS.find(t => t.id === troopId);
  if (!troop) return null;
  
  return (
    <div className="mt-3 p-2 bg-black/30 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{troop.emoji}</span>
        <span className="text-white font-bold text-sm">{troop.name}</span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
          troop.rarity === 'common' && "bg-gray-600 text-gray-200",
          troop.rarity === 'rare' && "bg-amber-600 text-amber-100",
          troop.rarity === 'epic' && "bg-purple-600 text-purple-100",
          troop.rarity === 'legendary' && "bg-yellow-500 text-yellow-900"
        )}>
          {troop.rarity}
        </span>
      </div>
      <p className="text-gray-400 text-xs">{troop.description}</p>
      
      {/* Stats comparison */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
        <StatBadge label="HP" value={troop.healthMultiplier} />
        <StatBadge label="DMG" value={troop.damageMultiplier} />
        <StatBadge label="SPD" value={troop.attackSpeedMultiplier} />
        <StatBadge label="RNG" value={troop.rangeMultiplier} />
      </div>
      
      {/* Special abilities */}
      <div className="mt-1 flex flex-wrap gap-1">
        {troop.hasSplash && (
          <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">💥 Splash</span>
        )}
        {troop.hasHealing && (
          <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">💚 Heals</span>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  const percentage = Math.round((value - 1) * 100);
  const isPositive = percentage > 0;
  const isNegative = percentage < 0;
  
  return (
    <div className="flex flex-col items-center bg-black/20 rounded px-1 py-0.5">
      <span className="text-gray-400">{label}</span>
      <span className={cn(
        "font-bold",
        isPositive && "text-green-400",
        isNegative && "text-red-400",
        !isPositive && !isNegative && "text-gray-300"
      )}>
        {isPositive && "+"}{percentage}%
      </span>
    </div>
  );
}
