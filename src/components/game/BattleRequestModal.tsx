import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Swords, Crown, Loader2 } from 'lucide-react';
import { BattleRequest } from '@/hooks/useBattleRequests';

interface BattleRequestModalProps {
  battle: BattleRequest;
  isChallenger: boolean;
  onStartBattle: () => void;
}

export function BattleRequestModal({ 
  battle, 
  isChallenger,
  onStartBattle 
}: BattleRequestModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onStartBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStartBattle]);

  const opponentName = isChallenger ? battle.to_player_name : battle.from_player_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#1a3a5c] to-[#0d2840] rounded-2xl p-8 text-center max-w-sm mx-4 border-2 border-cyan-500/50 shadow-2xl">
        {/* VS Icon */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center animate-pulse shadow-lg shadow-orange-500/50">
          <Swords className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">BATTLE READY!</h2>
        
        <p className="text-cyan-300 mb-4">
          Friendly battle with
        </p>

        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-bold text-yellow-300">{opponentName}</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">No trophies at stake!</p>
        </div>

        <div className="text-4xl font-black text-white mb-4">
          {countdown > 0 ? countdown : '⚔️'}
        </div>

        <p className="text-gray-400 text-sm">
          Starting in {countdown}...
        </p>
      </div>
    </div>
  );
}
