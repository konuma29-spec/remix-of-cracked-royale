import { useState, useCallback, useEffect, useRef } from 'react';
import { ChestReward } from '@/types/game';
import { useProgression } from '@/hooks/useProgression';
import { useCardBalance } from '@/hooks/useCardBalance';
import { useAuth } from '@/hooks/useAuth';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { useBattleRequests } from '@/hooks/useBattleRequests';
import { useMultiplayerBattle } from '@/hooks/useMultiplayerBattle';
import { getCardLevel } from '@/lib/cardLevels';
import { HomeNavigator } from './HomeNavigator';
import { LoadingScreen } from './LoadingScreen';
import { MatchmakingScreen } from './MatchmakingScreen';
import { GameUI } from './GameUI';
import { ChestReward as ChestRewardModal } from './ChestReward';
import { PlayerProfile } from './PlayerProfile';
import { AuthScreen } from './AuthScreen';
import { BattleRequestModal } from './BattleRequestModal';
import { getBannerById } from '@/data/banners';
import { supabase } from '@/integrations/supabase/client';

// Convert cardCopies to cardLevels
function getCardLevelsFromCopies(cardCopies: Record<string, number>): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const [cardId, copies] of Object.entries(cardCopies)) {
    levels[cardId] = getCardLevel(copies);
  }
  return levels;
}

// Convert towerCopies to towerLevels
function getTowerLevelsFromCopies(towerCopies: Record<string, number>): { princess: number; king: number } {
  return {
    princess: getCardLevel(towerCopies.princess || 1),
    king: getCardLevel(towerCopies.king || 1)
  };
}

type Screen = 'auth' | 'home' | 'loading' | 'matchmaking' | 'battle';

export function GameScreen() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showChestModal, setShowChestModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isFriendlyBattle, setIsFriendlyBattle] = useState(false);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [matchmakingComplete, setMatchmakingComplete] = useState(false);
  const readySentRef = useRef(false);
  const [friendlyBattleData, setFriendlyBattleData] = useState<{
    opponentName: string;
    opponentBannerId: string;
    opponentLevel: number;
    opponentTrophies: number;
    isChallenger: boolean;
    opponentId?: string;
  } | null>(null);
  
  // Auth and multiplayer hooks
  const { user, loading: authLoading, signOut } = useAuth();
  
  const { 
    progress, 
    updateDeck, 
    updateDeckSlot,
    setActiveDeck,
    addDeckSlot,
    recordWin, 
    recordLoss, 
    openChest, 
    updatePlayerName,
    updateBanner,
    resetProgress,
    spendGold,
    addCard,
    selectTowerTroop,
    claimTrophyReward,
    useWildCards,
    unlockEvolution
  } = useProgression();
  
  const playerLevel = Math.max(1, Math.floor(progress.wins / 5) + 1);
  const trophies = progress.wins * 30;
  
  // Online presence - only active when authenticated
  const { onlinePlayers } = useOnlinePresence(
    user,
    progress.playerName,
    progress.bannerId,
    trophies,
    playerLevel
  );
  
  // Battle requests
  const {
    incomingRequests,
    outgoingRequests,
    acceptedBattle,
    sendBattleRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    clearAcceptedBattle
  } = useBattleRequests(user, progress.playerName);
  
  // Multiplayer battle hook
  const {
    battleState,
    isConnected,
    pendingOpponentPlacements,
    syncedGameState,
    pendingDeltas,
    createBattle,
    markReady,
    sendCardPlacement,
    syncGameState,
    syncDelta,
    reportGameEnd,
    consumePlacement,
    consumeDelta,
    disconnect
  } = useMultiplayerBattle(
    user,
    activeBattleId,
    progress.playerName,
    progress.bannerId,
    playerLevel
  );
  
  const {
    balanceState,
    trackDamage,
    processGameEnd,
    getBalancedCardStats,
    resetBalance
  } = useCardBalance();
  
  // Convert balance state to CardBalanceInfo array for DeckBuilder
  const cardBalanceInfo = balanceState.performances.map(p => ({
    cardId: p.cardId,
    nerfLevel: p.nerfLevel,
    winStreak: p.winStreak,
    lastNerfedStat: p.lastNerfedStat
  }));

  const handleGameEnd = (result: 'win' | 'loss' | 'draw') => {
    // Process card balance (track MVP and apply nerfs)
    const mvpCard = processGameEnd(result === 'win', progress.currentDeck);
    if (mvpCard) {
      console.log(`🏆 Game MVP: ${mvpCard}`);
    }
    
    // Report multiplayer game end
    if (isFriendlyBattle && activeBattleId && user) {
      const winnerId = result === 'win' ? user.id : 
                       result === 'loss' ? (battleState?.isPlayer1 ? undefined : user.id) : 
                       null;
      reportGameEnd(winnerId || null);
    }
    
    // For friendly battles, don't record wins/losses
    if (!isFriendlyBattle) {
      if (result === 'win') {
        recordWin();
      } else if (result === 'loss') {
        recordLoss();
      }
    }
    
    // Cleanup
    setIsFriendlyBattle(false);
    setActiveBattleId(null);
    setFriendlyBattleData(null);
    setLoadingComplete(false);
    setMatchmakingComplete(false);
    readySentRef.current = false;
    disconnect();
    setScreen('home');
  };

  const handleOpenChest = () => {
    if (progress.chestsAvailable > 0) {
      setShowChestModal(true);
    }
  };

  const handleGenerateReward = useCallback((stars: number, skipInventoryCheck: boolean = false): ChestReward | null => {
    return openChest(stars, skipInventoryCheck);
  }, [openChest]);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      resetProgress();
    }
  };

  // Start friendly battle - store opponent info, let matchmaking handle battle creation/join
  const handleStartFriendlyBattle = useCallback(async () => {
    if (!acceptedBattle || !user) return;

    // Reset start-gating flags
    setLoadingComplete(false);
    setMatchmakingComplete(false);
    readySentRef.current = false;
    
    const isChallenger = acceptedBattle.from_user_id === user.id;
    const opponentId = isChallenger ? acceptedBattle.to_user_id : acceptedBattle.from_user_id;
    const opponentName = isChallenger ? acceptedBattle.to_player_name : acceptedBattle.from_player_name;
    
    // Find opponent in online players
    const opponent = onlinePlayers.find(p => p.player_name === opponentName);
    const opponentBannerId = opponent?.banner_id || 'banner-blue';
    const opponentLevel = opponent?.level || 1;
    const opponentTrophies = opponent?.trophies || 0;
    
    // Store battle data for matchmaking screen
    setFriendlyBattleData({
      opponentName,
      opponentBannerId,
      opponentLevel,
      opponentTrophies,
      isChallenger,
      opponentId // Store for later use
    });
    
    setIsFriendlyBattle(true);
    clearAcceptedBattle();
    setScreen('loading');
  }, [acceptedBattle, user, onlinePlayers, clearAcceptedBattle]);

  // Gate: loading screen just plays animation, no battle ID blocking
  useEffect(() => {
    if (screen !== 'loading') return;
    if (!loadingComplete) return;
    setScreen('matchmaking');
  }, [screen, loadingComplete]);

  // Polling ref to track active poll
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gate: matchmaking handles battle creation, ready sync, and status='active' check
  useEffect(() => {
    if (screen !== 'matchmaking') return;
    if (!matchmakingComplete) return;

    // Single-player / AI battles keep the old flow
    if (!isFriendlyBattle) {
      setScreen('battle');
      return;
    }

    if (!user || !friendlyBattleData) return;

    // Step 1: Challenger creates battle immediately
    if (friendlyBattleData.isChallenger && !activeBattleId) {
      createBattle(
        friendlyBattleData.opponentId!,
        friendlyBattleData.opponentName,
        friendlyBattleData.opponentBannerId,
        friendlyBattleData.opponentLevel,
        true
      ).then(newBattleId => {
        if (newBattleId) setActiveBattleId(newBattleId);
      });
      return;
    }

    // Step 2: Non-challenger polls for battle
    if (!friendlyBattleData.isChallenger && !activeBattleId) {
      if (pollIntervalRef.current) return; // Already polling
      
      const poll = async () => {
        const { data } = await supabase
          .from('active_battles')
          .select('id')
          .eq('player1_id', friendlyBattleData.opponentId!)
          .eq('player2_id', user.id)
          .in('status', ['waiting', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setActiveBattleId(data.id);
        }
      };
      
      poll(); // Initial poll
      pollIntervalRef.current = setInterval(poll, 500);
      return;
    }

    // Step 3: Mark ready once we have battle ID
    if (activeBattleId && !readySentRef.current) {
      readySentRef.current = true;
      markReady();
    }

    // Step 4: Enter battle when status is 'active'
    if (battleState?.status === 'active') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setScreen('battle');
    }
  }, [screen, matchmakingComplete, isFriendlyBattle, activeBattleId, battleState?.status, markReady, user, friendlyBattleData, createBattle]);

  // Cleanup polling on unmount or screen change
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [screen]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Show auth screen if user wants to sign in
  if (screen === 'auth') {
    return <AuthScreen onSuccess={() => setScreen('home')} />;
  }

  return (
    <>
      {/* Battle Request Modal */}
      {acceptedBattle && (
        <BattleRequestModal
          battle={acceptedBattle}
          isChallenger={acceptedBattle.from_user_id === user?.id}
          onStartBattle={handleStartFriendlyBattle}
        />
      )}

      {screen === 'home' && (
        <HomeNavigator
          progress={progress}
          onBattle={() => setScreen('loading')}
          onOpenChest={handleOpenChest}
          onReset={handleReset}
          onOpenProfile={() => setShowProfile(true)}
          onSaveDeck={(deckId, cardIds) => updateDeckSlot(deckId, cardIds)}
          onSetActiveDeck={setActiveDeck}
          onAddDeck={addDeckSlot}
          cardBalanceInfo={cardBalanceInfo}
          onSpendGold={spendGold}
          onAddCard={addCard}
          onSelectTowerTroop={selectTowerTroop}
          onClaimTrophyReward={claimTrophyReward}
          onGenerateReward={handleGenerateReward}
          onUseWildCards={useWildCards}
          onUnlockEvolution={unlockEvolution}
          // Multiplayer props
          user={user}
          onlinePlayers={onlinePlayers}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onSendRequest={sendBattleRequest}
          onAcceptRequest={acceptRequest}
          onDeclineRequest={declineRequest}
          onCancelRequest={cancelRequest}
          onSignOut={handleSignOut}
          onSignIn={() => setScreen('auth')}
        />
      )}

      {screen === 'loading' && (
        <LoadingScreen onComplete={() => setLoadingComplete(true)} />
      )}

      {screen === 'matchmaking' && (
        <MatchmakingScreen
          progress={progress}
          onReady={() => setMatchmakingComplete(true)}
          isFriendlyBattle={isFriendlyBattle}
          friendlyBattleData={friendlyBattleData}
        />
      )}

      {screen === 'battle' && (
        <GameUI
          playerDeck={progress.currentDeck}
          cardLevels={getCardLevelsFromCopies(progress.cardCopies)}
          towerLevels={getTowerLevelsFromCopies(progress.towerCopies)}
          playerName={progress.playerName}
          playerBannerEmoji={getBannerById(progress.bannerId)?.emoji || '🛡️'}
          playerLevel={playerLevel}
          trophies={trophies}
          unlockedEvolutions={progress.unlockedEvolutions}
          selectedTowerTroopId={progress.selectedTowerTroopId}
          onGameEnd={handleGameEnd}
          onBack={() => {
            setIsFriendlyBattle(false);
            setActiveBattleId(null);
            setFriendlyBattleData(null);
            disconnect();
            setScreen('home');
          }}
          onTrackDamage={trackDamage}
          getBalancedCardStats={getBalancedCardStats}
          isFriendlyBattle={isFriendlyBattle}
          // Multiplayer props
          isMultiplayer={isFriendlyBattle && !!activeBattleId}
          isHost={battleState?.isPlayer1 ?? true}
          battleState={battleState}
          pendingOpponentPlacements={pendingOpponentPlacements}
          syncedGameState={syncedGameState}
          pendingDeltas={pendingDeltas}
          onSendCardPlacement={sendCardPlacement}
          onSyncGameState={syncGameState}
          onSyncDelta={syncDelta}
          onConsumePlacement={consumePlacement}
          onConsumeDelta={consumeDelta}
          opponentLevel={battleState?.opponentLevel || friendlyBattleData?.opponentLevel || 1}
        />
      )}

      {showChestModal && (
        <ChestRewardModal
          onGenerateReward={handleGenerateReward}
          onClose={() => setShowChestModal(false)}
        />
      )}

      <PlayerProfile
        open={showProfile}
        onOpenChange={setShowProfile}
        progress={progress}
        onUpdateName={updatePlayerName}
        onUpdateBanner={updateBanner}
      />
    </>
  );
}
