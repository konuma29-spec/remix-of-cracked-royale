import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Swords, Loader2, X, Trophy, Check } from 'lucide-react';
import { OnlinePlayer } from '@/hooks/useOnlinePresence';
import { BattleRequest } from '@/hooks/useBattleRequests';
import { getBannerById } from '@/data/banners';
import { cn } from '@/lib/utils';

interface OnlinePlayersPanelProps {
  onlinePlayers: OnlinePlayer[];
  incomingRequests: BattleRequest[];
  outgoingRequests: BattleRequest[];
  onSendRequest: (playerRecordId: string, playerName: string) => Promise<boolean>;
  onAcceptRequest: (requestId: string) => Promise<boolean>;
  onDeclineRequest: (requestId: string) => Promise<boolean>;
  onCancelRequest: (requestId: string) => Promise<boolean>;
}

export function OnlinePlayersPanel({
  onlinePlayers,
  incomingRequests,
  outgoingRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest
}: OnlinePlayersPanelProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (id: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: loading }));
  };

  const handleSendRequest = async (player: OnlinePlayer) => {
    setLoading(player.id, true);
    await onSendRequest(player.id, player.player_name);
    setLoading(player.id, false);
  };

  const handleAccept = async (requestId: string) => {
    setLoading(requestId, true);
    await onAcceptRequest(requestId);
    setLoading(requestId, false);
  };

  const handleDecline = async (requestId: string) => {
    setLoading(`decline-${requestId}`, true);
    await onDeclineRequest(requestId);
    setLoading(`decline-${requestId}`, false);
  };

  const handleCancel = async (requestId: string) => {
    setLoading(requestId, true);
    await onCancelRequest(requestId);
    setLoading(requestId, false);
  };

  // Check if we have a pending request to a player by matching player name
  // Since we no longer expose user_id, we match on outgoing request to_player_name
  const hasPendingRequestTo = (playerName: string) => {
    return outgoingRequests.some(r => r.to_player_name === playerName);
  };

  const getOutgoingRequestId = (playerName: string) => {
    return outgoingRequests.find(r => r.to_player_name === playerName)?.id;
  };

  return (
    <div className="space-y-4">
      {/* Incoming Battle Requests */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-yellow-400 font-semibold text-sm flex items-center gap-2">
            <Swords className="w-4 h-4" />
            BATTLE REQUESTS
          </h3>
          {incomingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border border-yellow-600/50 rounded-lg p-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 font-semibold">{request.from_player_name}</p>
                  <p className="text-yellow-400/70 text-xs">wants to battle!</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.id)}
                    disabled={loadingStates[request.id]}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    {loadingStates[request.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDecline(request.id)}
                    disabled={loadingStates[`decline-${request.id}`]}
                  >
                    {loadingStates[`decline-${request.id}`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Online Players */}
      <div className="space-y-2">
        <h3 className="text-green-400 font-semibold text-sm">
          ONLINE PLAYERS ({onlinePlayers.length})
        </h3>
        
        {onlinePlayers.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No other players online right now.
            <br />
            <span className="text-gray-600">Check back later!</span>
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {onlinePlayers.map((player) => {
              const banner = getBannerById(player.banner_id);
              const hasPending = hasPendingRequestTo(player.player_name);
              const pendingRequestId = getOutgoingRequestId(player.player_name);
              
              return (
                <div
                  key={player.id}
                  className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3"
                >
                  {/* Player Avatar */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border-2"
                    style={{ 
                      background: banner 
                        ? `linear-gradient(to bottom, ${banner.color}dd, ${banner.color}88)` 
                        : 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                      borderColor: banner?.color || '#3b82f6'
                    }}
                  >
                    {player.level}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">
                        {player.player_name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    </div>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {player.trophies.toLocaleString()}
                    </p>
                  </div>

                  {/* Action Button */}
                  {hasPending ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => pendingRequestId && handleCancel(pendingRequestId)}
                      disabled={loadingStates[pendingRequestId || '']}
                      className="border-gray-600 text-gray-400 hover:text-white"
                    >
                      {loadingStates[pendingRequestId || ''] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(player)}
                      disabled={loadingStates[player.id]}
                      className="bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500"
                    >
                      {loadingStates[player.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Swords className="w-4 h-4 mr-1" />
                          Battle
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
