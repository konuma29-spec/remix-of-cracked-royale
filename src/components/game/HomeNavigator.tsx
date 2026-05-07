import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { OnlinePlayer } from "@/hooks/useOnlinePresence";
import { BattleRequest } from "@/hooks/useBattleRequests";
import { ExtendedPlayerProgress } from "@/hooks/useProgression";
import { ChestReward } from "@/types/game";
import { MainMenu } from "./MainMenu";
import { CardsPage } from "./CardsPage";
import { CardBalanceInfo } from "./DeckBuilder";
import { ClanScreen } from "./ClanScreen";
import { ShopScreen } from "./ShopScreen";
import { TrophyRoad } from "./TrophyRoad";
import { EvolutionShardsModal } from "./EvolutionShardsModal";
import { MegaDraftScreen } from "./MegaDraftScreen";
import { useShop } from "@/hooks/useShop";
import { cn } from "@/lib/utils";

type HomeScreen = "shop" | "cards" | "battle" | "clan" | "evolutions";

const SCREENS: HomeScreen[] = ["shop", "cards", "battle", "clan"];
const ALL_SCREENS_WITH_EVOLUTIONS = [...SCREENS, "evolutions"] as const;

type TutorialStep = 'welcome' | 'profile' | 'cards' | 'collection' | 'shop' | 'clan' | 'battle';

const TUTORIAL_TEXTS: Record<Exclude<TutorialStep, 'welcome'>, string> = {
  profile: "This is the profile button. Click here to change your name and banner and also check your stats.",
  cards: "The goal of this game (except in the platform gamemode) is to defeat other cards or towers using cards that you unlock. Win more battles to unlock new cards and level them up. This page allows you to choose your own deck consisting of your favorite 8 cards.",
  collection: "This is the collection page. This page allows you to see how many cards you have unlocked and which cards you haven't yet unlocked. Clicking on the Evo shards button lets you unlock evolutions which are better versions of the cards. You can get evo shards from lucky chests which you can get from winning battles.",
  shop: "This is the shop page. There will be a free gift in this page everyday. You can also use coins that you can get from lucky chests to buy new cards.",
  clan: "This is the clan page. Sign in to see other real players who are online and join clans where you can chat with other people. You can also do friendly battles against your friends.",
  battle: "This is the gamemode button where you can select from a few gamemodes. The normal gamemode takes you on the trophy road where the goal is to collect as much trophies as possible from winning battles. The platform gamemode takes you to a platform game. Flappy Royale is a Clash Royale-themed Flappy Bird where you dodge castle towers as a crown. The mega draft gamemode takes you to a battle where you get to choose your own deck from cards you haven't unlocked yet. The boss battle gamemode lets you fight against level 50 cards while all of your cards are level 16. After you choose your gamemode, click on the battle button to start your battle.",
};

interface HomeNavigatorProps {
  progress: ExtendedPlayerProgress;
  onBattle: () => void;
  onBattleWithDeck?: (deck: string[]) => void;
  onBattleBossMode?: () => void;
  onOpenChest: () => void;
  onReset: () => void;
  onOpenProfile: () => void;
  onSaveDeck: (deckId: string, cardIds: string[]) => void;
  onSetActiveDeck: (deckId: string) => void;
  onAddDeck: () => void;
  cardBalanceInfo?: CardBalanceInfo[];
  onSpendGold: (amount: number) => boolean;
  onAddCard: (cardId: string) => void;
  onSelectTowerTroop?: (troopId: string) => void;
  onClaimTrophyReward?: (trophyMilestone: number) => boolean;
  onGenerateReward?: (
    stars: number,
    skipInventoryCheck?: boolean,
  ) => ChestReward | null;
  onUseWildCards?: (cardId: string, amount: number) => boolean;
  onUnlockEvolution?: (cardId: string) => boolean;
  // Multiplayer props
  user: User | null;
  onlinePlayers: OnlinePlayer[];
  incomingRequests: BattleRequest[];
  outgoingRequests: BattleRequest[];
  onSendRequest: (userId: string, playerName: string) => Promise<boolean>;
  onAcceptRequest: (requestId: string) => Promise<boolean>;
  onDeclineRequest: (requestId: string) => Promise<boolean>;
  onCancelRequest: (requestId: string) => Promise<boolean>;
  onSignOut: () => void;
  onSignIn: () => void;
}

export function HomeNavigator({
  progress,
  onBattle,
  onBattleWithDeck,
  onBattleBossMode,
  onOpenChest,
  onReset,
  onOpenProfile,
  onSaveDeck,
  onSetActiveDeck,
  onAddDeck,
  cardBalanceInfo = [],
  onSpendGold,
  onAddCard,
  onSelectTowerTroop,
  onClaimTrophyReward,
  onGenerateReward,
  onUseWildCards,
  onUnlockEvolution,
  // Multiplayer props
  user,
  onlinePlayers,
  incomingRequests,
  outgoingRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onSignOut,
  onSignIn,
}: HomeNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(2); // Start at battle (center)
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTrophyRoad, setShowTrophyRoad] = useState(false);
  const [showEvolutions, setShowEvolutions] = useState(false);
  const [gameMode, setGameMode] = useState<string>("Normal");
  const [showMegaDraft, setShowMegaDraft] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);

  const { shopState, purchaseItem, getTimeUntilRefresh } = useShop(
    progress.ownedCardIds,
  );

  const trophies = progress.wins * 30;

  const navigateTo = useCallback(
    (index: number) => {
      if (isAnimating || index < 0 || index >= SCREENS.length) return;
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 300);
    },
    [isAnimating],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        navigateTo(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        navigateTo(currentIndex + 1);
      }
    },
    [currentIndex, navigateTo],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!localStorage.getItem('crackedroyale_tutorial_done')) {
      setTutorialStep('welcome');
    }
  }, []);

  const goToScreen = (screen: HomeScreen) => {
    const index = SCREENS.indexOf(screen);
    if (index !== -1) {
      navigateTo(index);
    }
  };

  const handleTutorialNext = () => {
    switch (tutorialStep) {
      case 'welcome':
        setCurrentIndex(2);
        setTutorialStep('profile');
        break;
      case 'profile':
        setCurrentIndex(1);
        setTutorialStep('cards');
        break;
      case 'cards':
        setTutorialStep('collection');
        break;
      case 'collection':
        setCurrentIndex(0);
        setTutorialStep('shop');
        break;
      case 'shop':
        setCurrentIndex(3);
        setTutorialStep('clan');
        break;
      case 'clan':
        setCurrentIndex(2);
        setTutorialStep('battle');
        break;
      case 'battle':
        setTutorialStep(null);
        localStorage.setItem('crackedroyale_tutorial_done', 'true');
        break;
    }
  };

  const handleTutorialDecline = () => {
    setTutorialStep(null);
    localStorage.setItem('crackedroyale_tutorial_done', 'true');
  };

  const handleBattle = () => {
    if (gameMode === "Platform") {
      window.location.href = "/games/platformer.html";
    } else if (gameMode === "\uD83D\uDC51 Flappy Royale") {
      window.location.href = "/games/flappy.html";
    } else if (gameMode === "Mega Draft") {
      setShowMegaDraft(true);
    } else if (gameMode === "Boss Battle") {
      if (onBattleBossMode) {
        onBattleBossMode();
      } else {
        onBattle();
      }
    } else {
      onBattle();
    }
  };

  const handleMegaDraftComplete = (draftedDeck: string[]) => {
    setShowMegaDraft(false);
    if (onBattleWithDeck) {
      onBattleWithDeck(draftedDeck);
    } else {
      onBattle();
    }
  };

  const handleShopPurchase = (
    itemId: string,
    price: number,
    cardId: string,
  ) => {
    if (onSpendGold(price)) {
      purchaseItem(itemId);
      onAddCard(cardId);
    }
  };

  const handleClaimFreebie = (itemId: string, cardId: string) => {
    purchaseItem(itemId);
    onAddCard(cardId);
  };

  return (
    <div className="h-screen w-screen overflow-x-hidden overflow-y-auto relative">
      {/* Sliding container */}
      <div
        className={cn("flex h-full transition-transform duration-300 ease-out")}
        style={{
          width: `${SCREENS.length * 100}%`,
          transform: `translateX(-${currentIndex * (100 / SCREENS.length)}%)`,
        }}
      >
        {/* Shop Screen */}
        <div
          className="w-full h-full flex-shrink-0"
          style={{ width: `${100 / SCREENS.length}%` }}
        >
          <ShopScreen
            shopState={shopState}
            gold={progress.gold}
            ownedCardIds={progress.ownedCardIds}
            onPurchase={handleShopPurchase}
            onClaimFreebie={handleClaimFreebie}
            onBack={() => goToScreen("cards")}
            timeUntilRefresh={getTimeUntilRefresh()}
          />
        </div>

        {/* Cards Screen */}
        <div
          className="w-full h-full flex-shrink-0"
          style={{ width: `${100 / SCREENS.length}%` }}
        >
          <CardsPage
            progress={progress}
            onSaveDeck={onSaveDeck}
            onSetActiveDeck={onSetActiveDeck}
            onAddDeck={onAddDeck}
            onStartBattle={onBattle}
            cardBalanceInfo={cardBalanceInfo}
            onSelectTowerTroop={onSelectTowerTroop}
            onUseWildCards={onUseWildCards}
            onUnlockEvolution={onUnlockEvolution}
            onOpenEvolutions={() => setShowEvolutions(true)}
            forcedTab={tutorialStep === 'collection' ? 'collection' : tutorialStep === 'cards' ? 'decks' : undefined}
            tutorialHighlightCollection={tutorialStep === 'collection'}
          />
        </div>

        {/* Battle/Main Menu Screen */}
        <div
          className="w-full h-full flex-shrink-0"
          style={{ width: `${100 / SCREENS.length}%` }}
        >
          <MainMenu
            progress={progress}
            onBattle={handleBattle}
            onDeckBuilder={() => goToScreen("cards")}
            onCollection={() => goToScreen("cards")}
            onClan={() => goToScreen("clan")}
            onShop={() => goToScreen("shop")}
            onOpenChest={onOpenChest}
            onReset={onReset}
            onOpenProfile={onOpenProfile}
            onOpenTrophyRoad={() => setShowTrophyRoad(true)}
            claimedTrophyRewards={progress.claimedTrophyRewards}
            incomingRequestCount={incomingRequests.length}
            gameMode={gameMode}
            onGameModeChange={setGameMode}
            tutorialHighlight={
              tutorialStep === 'profile' ? 'profile' :
              tutorialStep === 'battle' ? 'battle' : null
            }
          />
        </div>

        {/* Clan Screen */}
        <div
          className="w-full h-full flex-shrink-0"
          style={{ width: `${100 / SCREENS.length}%` }}
        >
          <ClanScreen
            playerName={progress.playerName}
            trophies={trophies}
            onBack={() => goToScreen("battle")}
            user={user}
            onlinePlayers={onlinePlayers}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            onSendRequest={onSendRequest}
            onAcceptRequest={onAcceptRequest}
            onDeclineRequest={onDeclineRequest}
            onCancelRequest={onCancelRequest}
            onSignOut={onSignOut}
            onSignIn={onSignIn}
          />
        </div>
      </div>

      {/* Trophy Road Overlay */}
      {showTrophyRoad && (
        <div className="absolute inset-0 z-50">
          <TrophyRoad
            trophies={trophies}
            onClose={() => setShowTrophyRoad(false)}
            onClaimReward={onClaimTrophyReward}
            onGenerateReward={onGenerateReward}
            claimedRewards={progress.claimedTrophyRewards || []}
          />
        </div>
      )}

      {/* Evolutions Overlay */}
      {showEvolutions && onUnlockEvolution && (
        <div className="absolute inset-0 z-50">
          <EvolutionShardsModal
            evolutionShards={progress.evolutionShards}
            ownedCardIds={progress.ownedCardIds}
            unlockedEvolutions={progress.unlockedEvolutions}
            cardCopies={progress.cardCopies}
            onUnlockEvolution={onUnlockEvolution}
            onClose={() => setShowEvolutions(false)}
          />
        </div>
      )}

      {/* Mega Draft Screen Overlay */}
      {showMegaDraft && (
        <div className="absolute inset-0 z-50">
          <MegaDraftScreen
            onDraftComplete={handleMegaDraftComplete}
            onCancel={() => setShowMegaDraft(false)}
          />
        </div>
      )}

      {/* Tutorial: Welcome Popup */}
      {tutorialStep === 'welcome' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70">
          <div className="bg-gradient-to-b from-[#0d2840] to-[#0a1f33] border-2 border-cyan-400 rounded-2xl p-6 shadow-2xl max-w-sm mx-4">
            <h2 className="text-white font-bold text-xl mb-3 text-center">🎮 Welcome to Cracked Royale!</h2>
            <p className="text-gray-200 text-sm mb-6 text-center leading-relaxed">Would you like a tutorial of the game?</p>
            <div className="flex gap-3">
              <button
                onClick={handleTutorialDecline}
                className="flex-1 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-bold text-sm transition-colors"
              >
                No
              </button>
              <button
                onClick={handleTutorialNext}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-900 font-bold text-sm transition-colors"
              >
                Start Tutorial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial: Step Popups */}
      {tutorialStep && tutorialStep !== 'welcome' && (
        <div
          className={cn(
            "fixed z-[300] pointer-events-auto",
            tutorialStep === 'profile' && "top-[72px] left-3 right-3",
            (tutorialStep === 'cards' || tutorialStep === 'shop' || tutorialStep === 'clan') && "top-1/2 left-3 right-3 -translate-y-1/2",
            tutorialStep === 'collection' && "top-[62px] left-3 right-3",
            tutorialStep === 'battle' && "bottom-[110px] left-3 right-3",
          )}
        >
          <div className="max-w-sm mx-auto bg-gradient-to-b from-[#0d2840] to-[#0a1f33] border-2 border-cyan-400 rounded-2xl p-4 shadow-2xl">
            <p className="text-gray-200 text-sm mb-4 leading-relaxed">
              {TUTORIAL_TEXTS[tutorialStep]}
            </p>
            <button
              onClick={handleTutorialNext}
              className="w-full py-2.5 rounded-xl bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-900 font-bold text-sm transition-colors"
            >
              {tutorialStep === 'battle' ? 'Finish Tutorial ✓' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
