import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerProgress, Banner } from '@/types/game';
import { getBannerById, allBanners } from '@/data/banners';
import { Trophy, Swords, Edit2, Check, X, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: PlayerProgress;
  onUpdateName: (name: string) => void;
  onUpdateBanner: (bannerId: string) => void;
}

export function PlayerProfile({ 
  open, 
  onOpenChange, 
  progress, 
  onUpdateName, 
  onUpdateBanner 
}: PlayerProfileProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(progress.playerName);
  const [showBannerSelect, setShowBannerSelect] = useState(false);

  const currentBanner = getBannerById(progress.bannerId);
  const playerLevel = Math.min(14, Math.floor(progress.wins / 5) + 1);
  const trophies = progress.wins * 30;
  const battlesWon = progress.wins;
  const totalBattles = progress.wins + progress.losses;

  const handleSaveName = () => {
    if (tempName.trim().length > 0) {
      onUpdateName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(progress.playerName);
    setIsEditingName(false);
  };

  const getRarityColor = (rarity: Banner['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-700';
      case 'rare': return 'from-orange-500 to-orange-700';
      case 'epic': return 'from-purple-500 to-purple-700';
      case 'legendary': return 'from-yellow-400 to-amber-600';
    }
  };

  const getRarityBorder = (rarity: Banner['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'rare': return 'border-orange-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-[#1a3a5c] to-[#0a1f33] border-cyan-700/50 text-white max-w-md w-full h-[90vh] max-h-[700px] p-0 overflow-hidden flex flex-col">
        {/* Banner Header */}
        <div 
          className="relative h-32 flex items-end justify-center pb-2"
          style={{ 
            background: currentBanner 
              ? `linear-gradient(135deg, ${currentBanner.color}dd, ${currentBanner.color}88)` 
              : 'linear-gradient(135deg, #3b82f6dd, #3b82f688)'
          }}
        >
          {/* Banner pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]" />
          </div>
          
          {/* Banner emoji */}
          <div className="text-6xl mb-2">{currentBanner?.emoji || '🛡️'}</div>
          
          {/* Edit banner button */}
          <button
            onClick={() => setShowBannerSelect(true)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          {/* Level badge */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 border-4 border-[#0a1f33] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">{playerLevel}</span>
            </div>
          </div>
        </div>

        {/* Profile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-8 pb-4">
          {/* Player Name */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-center text-lg font-bold w-40"
                  maxLength={16}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold">{progress.playerName}</h2>
                <button
                  onClick={() => {
                    setTempName(progress.playerName);
                    setIsEditingName(true);
                  }}
                  className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Trophies */}
            <div className="bg-gradient-to-b from-orange-900/50 to-orange-950/50 rounded-lg p-3 border border-orange-600/30">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 text-xs font-semibold">Trophies</span>
              </div>
              <p className="text-xl font-bold">{trophies}</p>
            </div>

            {/* Battles Won */}
            <div className="bg-gradient-to-b from-purple-900/50 to-purple-950/50 rounded-lg p-3 border border-purple-600/30">
              <div className="flex items-center gap-2 mb-1">
                <Swords className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-xs font-semibold">Battles Won</span>
              </div>
              <p className="text-xl font-bold">{battlesWon}</p>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Win Rate</span>
              <span className="text-white font-bold">
                {totalBattles > 0 ? Math.round((battlesWon / totalBattles) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                style={{ width: `${totalBattles > 0 ? (battlesWon / totalBattles) * 100 : 0}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">{battlesWon}W - {progress.losses}L</p>
          </div>

          {/* Owned Banners Count */}
          <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-300 text-sm">Banners Collected</span>
            </div>
            <span className="text-white font-bold">{progress.ownedBannerIds.length}/{allBanners.length}</span>
          </div>
        </div>

        {/* Banner Selection Modal */}
        {showBannerSelect && (
          <div className="absolute inset-0 bg-black/80 flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold">Select Banner</h3>
              <button
                onClick={() => setShowBannerSelect(false)}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-3">
                {allBanners.map(banner => {
                  const isOwned = progress.ownedBannerIds.includes(banner.id);
                  const isEquipped = progress.bannerId === banner.id;
                  
                  return (
                    <button
                      key={banner.id}
                      onClick={() => {
                        if (isOwned) {
                          onUpdateBanner(banner.id);
                          setShowBannerSelect(false);
                        }
                      }}
                      disabled={!isOwned}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all",
                        isOwned
                          ? `bg-gradient-to-b ${getRarityColor(banner.rarity)} ${getRarityBorder(banner.rarity)} hover:scale-105`
                          : "bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed",
                        isEquipped && "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                      )}
                    >
                      <span className="text-2xl">{banner.emoji}</span>
                      <span className="text-[10px] font-semibold truncate w-full px-1 text-center">
                        {banner.name}
                      </span>
                      
                      {!isOwned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                          <span className="text-lg">🔒</span>
                        </div>
                      )}
                      
                      {isEquipped && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
