import { PlayerProgress } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Swords, Trophy, LayoutGrid, Crown, Users, ShoppingBag, Coins, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBannerById } from '@/data/banners';
import { getCurrentArena, ARENAS } from '@/data/arenas';

interface MainMenuProps {
  progress: PlayerProgress;
  onBattle: () => void;
  onDeckBuilder: () => void;
  onCollection: () => void;
  onClan: () => void;
  onShop: () => void;
  onOpenChest: () => void;
  onReset: () => void;
  onOpenProfile: () => void;
  onOpenTrophyRoad: () => void;
  claimedTrophyRewards?: number[];
  incomingRequestCount?: number;
}

export function MainMenu({ progress, onBattle, onDeckBuilder, onCollection, onClan, onShop, onOpenChest, onReset, onOpenProfile, onOpenTrophyRoad, claimedTrophyRewards = [], incomingRequestCount = 0 }: MainMenuProps) {
  const playerLevel = Math.min(14, Math.floor(progress.wins / 5) + 1);
  const trophies = progress.wins * 30;
  const currentBanner = getBannerById(progress.bannerId);
  const currentArena = getCurrentArena(trophies);

  // Calculate unclaimed Trophy Road chests
  const unclaimedTrophyChests = (() => {
    let count = 0;
    for (let t = 10; t <= trophies; t += 10) {
      // Skip arena milestones (100, 200, 300...)
      const isArena = ARENAS.some(a => a.trophiesRequired === t);
      if (!isArena && !claimedTrophyRewards.includes(t)) {
        count++;
      }
    }
    return count;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a3a5c] via-[#0d2840] to-[#0a1f33] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gradient-to-b from-[#0d1b2a] to-[#152238] px-3 py-2 flex items-center justify-between border-b border-cyan-900/50">
        {/* Player Level & Info - Clickable for profile */}
        <button 
          onClick={onOpenProfile}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-blue-400 shadow-lg"
              style={{ 
                background: currentBanner 
                  ? `linear-gradient(to bottom, ${currentBanner.color}dd, ${currentBanner.color}88)` 
                  : 'linear-gradient(to bottom, #3b82f6, #1d4ed8)'
              }}
            >
              <span className="text-white font-bold text-lg">{playerLevel}</span>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{progress.playerName}</p>
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-orange-400" />
              <span className="text-orange-300 text-xs font-bold">{trophies}</span>
            </div>
          </div>
        </button>
        
        {/* Gold Display */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-500 px-3 py-1.5 rounded-lg shadow-md border border-amber-400">
          <Coins className="w-5 h-5 text-yellow-200" />
          <span className="text-white font-black text-sm">{progress.gold}</span>
        </div>
      </div>

      {/* Game Title */}
      <div className="text-center pt-3 flex flex-col items-center -space-y-1">
        <h1 
          className="text-4xl font-black tracking-wider uppercase"
          style={{
            fontFamily: "'Luckiest Guy', cursive",
            color: '#ffffff',
            textShadow: '2px 2px 0px #1a3a5c, 3px 3px 0px #0d2840, 4px 4px 8px rgba(0,0,0,0.5)',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))',
            letterSpacing: '3px',
          }}
        >
          Cracked
        </h1>
        <h1 
          className="text-5xl font-black tracking-wider uppercase"
          style={{
            fontFamily: "'Luckiest Guy', cursive",
            background: 'linear-gradient(180deg, #fff9c4 0%, #ffd54f 25%, #ff8f00 50%, #e65100 75%, #8b4513 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))',
            letterSpacing: '2px',
          }}
        >
          Royale
        </h1>
      </div>

      {/* Arena Display Area - Clickable to open Trophy Road */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* Arena Background - Clickable */}
        <button 
          onClick={onOpenTrophyRoad}
          className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl overflow-hidden border-4 border-amber-500/50 shadow-2xl transition-all hover:scale-[1.02] hover:border-amber-400 active:scale-[0.98] group"
        >
          {/* Arena themed background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b",
            currentArena.bgGradient
          )}>
            {/* Grid lines for arena feel */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute w-full h-px bg-black/30" style={{ top: `${(i + 1) * 16}%` }} />
              ))}
            </div>
            
            {/* River */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 opacity-80" />
            
            {/* Bridges */}
            <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-8 h-5 bg-amber-700 rounded" />
            <div className="absolute top-1/2 -translate-y-1/2 right-[15%] w-8 h-5 bg-amber-700 rounded" />
          </div>

          {/* Arena emoji in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-30 group-hover:opacity-50 transition-opacity">{currentArena.emoji}</span>
          </div>

          {/* Towers */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="absolute top-8 left-4 w-7 h-7 rounded bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400" />
          <div className="absolute top-8 right-4 w-7 h-7 rounded bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400" />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="absolute bottom-8 left-4 w-7 h-7 rounded bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400" />
          <div className="absolute bottom-8 right-4 w-7 h-7 rounded bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400" />

          {/* Tap indicator */}
          <div className="absolute bottom-2 right-2 bg-black/40 px-2 py-0.5 rounded text-[10px] text-white/70">
            Tap for Trophy Road
          </div>

          {/* Unclaimed Trophy Road Chests Badge */}
          {unclaimedTrophyChests > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-gradient-to-r from-purple-600 to-purple-800 px-2 py-1 rounded-lg border border-purple-400 shadow-lg animate-pulse">
              <Gift className="w-4 h-4 text-purple-200" />
              <span className="text-white font-bold text-sm">{unclaimedTrophyChests}</span>
            </div>
          )}
        </button>

        {/* Arena Name Badge */}
        <div 
          className={cn(
            "mt-3 px-4 py-1 rounded-full border border-amber-500/40",
            `bg-gradient-to-r ${currentArena.bgGradient}`
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentArena.emoji}</span>
            <span className="text-white font-semibold text-sm">{currentArena.name}</span>
          </div>
        </div>
      </div>

      {/* Chest Slots - 4 small slots above battle button */}
      <div className="px-4 mb-2">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((slotIndex) => {
            const hasChest = slotIndex < progress.chestsAvailable;
            return (
              <button
                key={slotIndex}
                onClick={hasChest ? onOpenChest : undefined}
                disabled={!hasChest}
                className={cn(
                  "w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all relative overflow-hidden",
                  hasChest 
                    ? "bg-gradient-to-b from-purple-600 to-purple-900 border-amber-500 cursor-pointer hover:scale-105 shadow-lg shadow-purple-500/40" 
                    : "bg-gradient-to-b from-gray-800/50 to-gray-900/50 border-gray-700/50 cursor-not-allowed"
                )}
              >
                {hasChest ? (
                  <span className="text-2xl animate-bounce">🎁</span>
                ) : (
                  <span className="text-2xl opacity-30">📦</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Battle Button */}
      <div className="flex justify-center pb-3">
        <Button 
          onClick={onBattle}
          className="px-12 h-12 text-xl font-bold gap-2 bg-gradient-to-b from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600 border-b-4 border-green-900 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all"
        >
          <Swords className="w-6 h-6" />
          Battle
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-[#0a1525] border-t border-cyan-900/40 px-2 py-1.5 safe-area-inset-bottom">
        <div className="flex justify-around max-w-md mx-auto">
          <NavButton icon={<ShoppingBag className="w-5 h-5" />} label="Shop" onClick={onShop} />
          <NavButton icon={<LayoutGrid className="w-5 h-5" />} label="Cards" onClick={onDeckBuilder} />
          <NavButton icon={<Swords className="w-5 h-5" />} label="Battle" onClick={onBattle} active />
          <NavButton 
            icon={<Users className="w-5 h-5" />} 
            label="Clan" 
            onClick={onClan} 
            badge={incomingRequestCount > 0 ? incomingRequestCount : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({ 
  icon, 
  label, 
  onClick, 
  active = false,
  badge
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
        active 
          ? 'bg-cyan-600/30 text-cyan-400' 
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
      }`}
    >
      {icon}
      <span className="text-[9px] font-semibold">{label}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-bounce">
          {badge}
        </span>
      )}
    </button>
  );
}
