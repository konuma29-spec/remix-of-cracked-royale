import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface BattleResultsProps {
  gameStatus: 'player-wins' | 'enemy-wins' | 'draw';
  playerCrowns: number;
  enemyCrowns: number;
  playerName: string;
  playerBannerEmoji: string;
  playerLevel: number;
  enemyName: string;
  enemyBannerEmoji: string;
  enemyLevel: number;
  onContinue: () => void;
}

export function BattleResults({
  gameStatus,
  playerCrowns,
  enemyCrowns,
  playerName,
  playerBannerEmoji,
  playerLevel,
  enemyName,
  enemyBannerEmoji,
  enemyLevel,
  onContinue
}: BattleResultsProps) {
  const isWin = gameStatus === 'player-wins';
  const isLoss = gameStatus === 'enemy-wins';
  const isDraw = gameStatus === 'draw';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md">
        
        {/* Enemy Banner (from top-right) */}
        <div className="w-full flex justify-end -mb-4">
          <div 
            className={cn(
              "relative px-6 py-3 min-w-[200px]",
              "bg-gradient-to-r from-red-700 to-red-900",
              "border-2 border-red-400",
              "transform -rotate-2 translate-x-4",
              "shadow-lg"
            )}
            style={{
              clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)'
            }}
          >
            <div className="flex items-center gap-3 transform rotate-2">
              <span className="text-2xl">{enemyBannerEmoji}</span>
              <div className="text-left">
                <div className="text-white font-bold text-sm truncate max-w-[120px]">
                  {enemyName}
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-yellow-500 text-yellow-900 text-[10px] font-bold px-1.5 rounded">
                    Lv{enemyLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VS Banner with Result */}
        <div className="relative flex flex-col items-center">
          {/* Winner/Loser Badge */}
          <div className={cn(
            "text-3xl font-black tracking-wider mb-2",
            "drop-shadow-lg",
            isWin && "text-yellow-400",
            isLoss && "text-red-400",
            isDraw && "text-blue-300"
          )}>
            {isWin && '🏆 Winner!'}
            {isLoss && '💀 Defeat'}
            {isDraw && '🤝 Draw'}
          </div>

          {/* Crown Display */}
          <div className="flex items-center justify-center gap-4 bg-black/40 rounded-2xl px-6 py-4 border border-white/20">
            {/* Player Crowns */}
            <div className="flex flex-col items-center">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <Crown 
                    key={i}
                    className={cn(
                      "w-8 h-8 transition-all",
                      i < playerCrowns 
                        ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" 
                        : "text-gray-600 fill-gray-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-white/70 text-xs mt-1">You</span>
            </div>

            {/* VS */}
            <div className="text-white font-black text-2xl px-3">
              VS
            </div>

            {/* Enemy Crowns */}
            <div className="flex flex-col items-center">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <Crown 
                    key={i}
                    className={cn(
                      "w-8 h-8 transition-all",
                      i < enemyCrowns 
                        ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" 
                        : "text-gray-600 fill-gray-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-white/70 text-xs mt-1">Foe</span>
            </div>
          </div>
        </div>

        {/* Player Banner (from bottom-left) */}
        <div className="w-full flex justify-start -mt-4">
          <div 
            className={cn(
              "relative px-6 py-3 min-w-[200px]",
              isWin 
                ? "bg-gradient-to-r from-yellow-600 to-amber-700 border-yellow-400" 
                : "bg-gradient-to-r from-blue-700 to-blue-900 border-blue-400",
              "border-2",
              "transform rotate-2 -translate-x-4",
              "shadow-lg"
            )}
            style={{
              clipPath: 'polygon(0% 0%, 85% 0%, 100% 100%, 0% 100%)'
            }}
          >
            <div className="flex items-center gap-3 transform -rotate-2">
              <span className="text-2xl">{playerBannerEmoji}</span>
              <div className="text-left">
                <div className="text-white font-bold text-sm truncate max-w-[120px]">
                  {playerName}
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-yellow-500 text-yellow-900 text-[10px] font-bold px-1.5 rounded">
                    Lv{playerLevel}
                  </div>
                  {isWin && (
                    <span className="text-[10px] text-green-300 font-bold">+🏆</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Preview (for wins) */}
        {isWin && (
          <div className="bg-black/30 rounded-xl px-6 py-3 border border-yellow-500/30">
            <div className="text-yellow-400 text-sm font-bold text-center">
              🎁 Chest Earned!
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          size="lg"
          className={cn(
            "text-xl px-12 py-6 font-bold",
            "bg-gradient-to-b shadow-lg",
            isWin 
              ? "from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white" 
              : "from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white"
          )}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
