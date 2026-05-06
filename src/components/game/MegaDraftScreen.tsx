import { useState, useEffect, useCallback, useRef } from "react";
import { allCards } from "@/data/cards";
import { CardDefinition } from "@/types/game";
import { cn } from "@/lib/utils";

interface MegaDraftScreenProps {
  onDraftComplete: (playerDeck: string[]) => void;
  onCancel: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Category definitions ────────────────────────────────────────────────────
const WIN_CONDITION_IDS = new Set([
  "hog-rider",
  "giant",
  "golem",
  "royal-giant",
  "balloon",
  "battle-ram",
  "miner",
  "ram-rider",
  "wall-breakers",
  "goblin-barrel",
  "lava-hound",
  "elixir-golem",
  "goblin-giant",
  "electro-giant",
  "goblin-drill",
  "giant-skeleton",
  "rune-giant",
  "x-bow",
  "mortar",
  "goblin-machine",
  "skeleton-barrel",
  "royal-hogs",
  "goblin-demolisher",
]);

const SMALL_SPELL_IDS = new Set([
  "zap",
  "log",
  "arrows",
  "giant-snowball",
  "barbarian-barrel",
  "earthquake",
  "goblin-curse",
  "vines",
]);

const BIG_SPELL_IDS = new Set([
  "fireball",
  "poison",
  "freeze",
  "tornado",
  "rocket",
  "lightning",
  "rage",
  "royal-delivery",
  "graveyard",
  "void",
]);

const BUILDING_IDS = new Set([
  "cannon",
  "tesla",
  "inferno-tower",
  "bomb-tower",
  "goblin-hut",
  "tombstone",
  "furnace",
  "barbarian-hut",
  "elixir-collector",
  "goblin-cage",
]);

const CHAMPION_IDS = new Set([
  "golden-knight",
  "archer-queen",
  "skeleton-king",
  "mighty-miner",
  "little-prince",
  "monk",
  "boss-bandit",
  "goblinstein",
]);

const TANK_KILLER_IDS = new Set([
  "mini-pekka",
  "pekka",
  "inferno-dragon",
  "hunter",
  "executioner",
  "sparky",
  "zappies",
  "electro-dragon",
  "mega-minion",
  "flying-machine",
  "musketeer",
  "wizard",
  "baby-dragon",
  "valkyrie",
  "bowler",
  "dark-prince",
  "prince",
  "goblin-brawler",
  "electro-wizard",
  "three-musketeers",
  "cannon-cart",
]);

// Support = everything else (troops not in other categories)
function isSupport(card: CardDefinition): boolean {
  return (
    !WIN_CONDITION_IDS.has(card.id) &&
    !SMALL_SPELL_IDS.has(card.id) &&
    !BIG_SPELL_IDS.has(card.id) &&
    !BUILDING_IDS.has(card.id) &&
    !CHAMPION_IDS.has(card.id) &&
    !TANK_KILLER_IDS.has(card.id)
  );
}

// Build the 8-row grid: pick 8 random cards from each category pool
function buildGrid(): CardDefinition[] {
  const pick8 = (ids: Set<string>) => {
    const pool = allCards.filter((c) => ids.has(c.id));
    return shuffleArray(pool).slice(0, 8);
  };
  const pickSupport8 = () => {
    const pool = allCards.filter(isSupport);
    return shuffleArray(pool).slice(0, 8);
  };

  const winCon1 = pick8(WIN_CONDITION_IDS);
  const smallSpells = pick8(SMALL_SPELL_IDS);
  const bigSpells = pick8(BIG_SPELL_IDS);
  const buildings = pick8(BUILDING_IDS);
  const support = pickSupport8();
  const tankKillers = pick8(TANK_KILLER_IDS);
  const champions = pick8(CHAMPION_IDS);
  // 2nd win-con row: exclude cards already in row 1
  const usedWinCon = new Set(winCon1.map((c) => c.id));
  const winConPool2 = allCards.filter(
    (c) => WIN_CONDITION_IDS.has(c.id) && !usedWinCon.has(c.id),
  );
  // If fewer than 8 remain, fill with shuffled repeats from row 1
  const winCon2 =
    winConPool2.length >= 8
      ? shuffleArray(winConPool2).slice(0, 8)
      : [...shuffleArray(winConPool2), ...shuffleArray(winCon1)].slice(0, 8);

  return [
    ...winCon1,
    ...smallSpells,
    ...bigSpells,
    ...buildings,
    ...support,
    ...tankKillers,
    ...champions,
    ...winCon2,
  ];
}

const ROW_LABELS = [
  "Win Conditions",
  "Small Spells",
  "Big Spells",
  "Buildings",
  "Support",
  "Tank Killers",
  "Champions",
  "Win Conditions",
];

const PICKS_PER_PLAYER = 8;

export function MegaDraftScreen({
  onDraftComplete,
  onCancel,
}: MegaDraftScreenProps) {
  const [gridCards] = useState<CardDefinition[]>(() => buildGrid());

  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [playerPicks, setPlayerPicks] = useState<string[]>([]);
  const [aiPicks, setAiPicks] = useState<string[]>([]);

  const [playerGoesFirst] = useState(() => Math.random() < 0.5);
  const [isPlayerTurn, setIsPlayerTurn] = useState(playerGoesFirst);
  const [aiThinking, setAiThinking] = useState(false);
  const [draftDone, setDraftDone] = useState(false);
  const [lastAiPick, setLastAiPick] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived state — must come before effects that use them
  const totalPicks = playerPicks.length + aiPicks.length;
  const isDone =
    playerPicks.length >= PICKS_PER_PLAYER &&
    aiPicks.length >= PICKS_PER_PLAYER;

  const resetTimer = useCallback(() => setTimeLeft(60), []);

  // Reset timer every time the turn switches
  useEffect(() => {
    resetTimer();
  }, [isPlayerTurn, resetTimer]);

  // Countdown tick — runs whenever draft is not done
  useEffect(() => {
    if (isDone) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDone]);

  const doAiPick = useCallback(
    (currentPicked: Set<string>, currentAiPicks: string[]) => {
      if (currentAiPicks.length >= PICKS_PER_PLAYER) return;
      setAiThinking(true);
      const delay = 800 + Math.random() * 700;
      setTimeout(() => {
        const available = gridCards.filter((c) => !currentPicked.has(c.id));
        if (available.length === 0) return;
        const chosen = available[Math.floor(Math.random() * available.length)];
        setPickedIds((prev) => new Set([...prev, chosen.id]));
        setAiPicks((prev) => [...prev, chosen.id]);
        setLastAiPick(chosen.id);
        setAiThinking(false);
        setIsPlayerTurn(true);
      }, delay);
    },
    [gridCards, resetTimer],
  );

  // After AI picks, clear the highlight after a moment
  useEffect(() => {
    if (!lastAiPick) return;
    const t = setTimeout(() => setLastAiPick(null), 1200);
    return () => clearTimeout(t);
  }, [lastAiPick]);

  // Handle player clicking a card
  const handleCardClick = (card: CardDefinition) => {
    if (!isPlayerTurn || aiThinking || pickedIds.has(card.id) || isDone) return;
    if (playerPicks.length >= PICKS_PER_PLAYER) return;

    const newPicked = new Set([...pickedIds, card.id]);
    const newPlayerPicks = [...playerPicks, card.id];
    setPickedIds(newPicked);
    setPlayerPicks(newPlayerPicks);

    if (newPlayerPicks.length < PICKS_PER_PLAYER) {
      setIsPlayerTurn(false);
      doAiPick(newPicked, aiPicks);
    } else {
      if (aiPicks.length < PICKS_PER_PLAYER) {
        setIsPlayerTurn(false);
        doAiPick(newPicked, aiPicks);
      }
    }
  };

  // Auto-pick for player when timer expires
  useEffect(() => {
    if (timeLeft !== 0 || !isPlayerTurn || aiThinking || isDone) return;
    if (playerPicks.length >= PICKS_PER_PLAYER) return;
    const available = gridCards.filter((c) => !pickedIds.has(c.id));
    if (available.length === 0) return;
    const auto = available[Math.floor(Math.random() * available.length)];
    handleCardClick(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Check if draft is fully complete
  useEffect(() => {
    if (
      playerPicks.length >= PICKS_PER_PLAYER &&
      aiPicks.length >= PICKS_PER_PLAYER
    ) {
      setDraftDone(true);
    }
  }, [playerPicks, aiPicks]);

  // If AI goes first, trigger immediately on mount
  useEffect(() => {
    if (!playerGoesFirst) {
      setIsPlayerTurn(false);
      doAiPick(new Set(), []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardById = (id: string) => gridCards.find((c) => c.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a3a5c] via-[#0d2840] to-[#0a1f33] flex flex-col">
      {/* Header */}
      <div className="bg-[#0d1b2a] border-b border-cyan-900/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white text-sm font-semibold transition-colors"
        >
          ✕ Cancel
        </button>
        <div className="text-center">
          <h2
            className="text-xl font-black text-white uppercase tracking-wide"
            style={{ fontFamily: "'Luckiest Guy', cursive" }}
          >
            🃏 Mega Draft
          </h2>
          <p className="text-cyan-400 text-xs font-semibold">
            Pick {PICKS_PER_PLAYER} cards for your battle deck
          </p>
        </div>
        <div className="text-right text-xs text-gray-400 w-16">
          <div>
            {totalPicks}/{PICKS_PER_PLAYER * 2}
          </div>
          <div>picked</div>
        </div>
      </div>

      {/* Timer bar */}
      {!isDone && (
        <div className="w-full h-1.5 bg-gray-800">
          <div
            className={cn(
              "h-full transition-all duration-1000",
              timeLeft > 30
                ? "bg-green-500"
                : timeLeft > 10
                  ? "bg-yellow-400"
                  : "bg-red-500 animate-pulse",
            )}
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      )}

      {/* Turn indicator */}
      <div
        className={cn(
          "text-center py-2 font-bold text-sm transition-all flex items-center justify-center gap-2",
          isDone
            ? "bg-emerald-700/60 text-emerald-200"
            : aiThinking
              ? "bg-red-900/60 text-red-300 animate-pulse"
              : isPlayerTurn
                ? "bg-blue-800/60 text-blue-200"
                : "bg-red-900/60 text-red-300",
        )}
      >
        <span>
          {isDone
            ? "✅ Draft complete! Ready to battle."
            : aiThinking
              ? "🤖 Opponent is choosing..."
              : isPlayerTurn
                ? "👆 Your turn — tap a card to pick it!"
                : "⏳ Waiting for opponent..."}
        </span>
        {!isDone && (
          <span
            className={cn(
              "font-black tabular-nums",
              timeLeft <= 10
                ? "text-red-400 animate-pulse"
                : timeLeft <= 30
                  ? "text-yellow-300"
                  : "text-white/70",
            )}
          >
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Pick trackers */}
      <div className="flex gap-2 px-3 py-2">
        {/* Player picks */}
        <div className="flex-1">
          <p className="text-blue-300 text-[10px] font-bold mb-1 uppercase tracking-wide">
            Your picks ({playerPicks.length}/8)
          </p>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: PICKS_PER_PLAYER }).map((_, i) => {
              const id = playerPicks[i];
              const card = id ? cardById(id) : undefined;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded border flex items-center justify-center text-base",
                    card
                      ? "bg-blue-700/60 border-blue-400"
                      : "bg-gray-800/40 border-gray-700/40",
                  )}
                >
                  {card ? (
                    card.emoji
                  ) : (
                    <span className="text-gray-600 text-xs">?</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI picks */}
        <div className="flex-1">
          <p className="text-red-300 text-[10px] font-bold mb-1 uppercase tracking-wide text-right">
            Opponent ({aiPicks.length}/8)
          </p>
          <div className="flex flex-wrap gap-1 justify-end">
            {Array.from({ length: PICKS_PER_PLAYER }).map((_, i) => {
              const id = aiPicks[i];
              const card = id ? cardById(id) : undefined;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded border flex items-center justify-center text-base",
                    card
                      ? "bg-red-700/60 border-red-400"
                      : "bg-gray-800/40 border-gray-700/40",
                  )}
                >
                  {card ? (
                    card.emoji
                  ) : (
                    <span className="text-gray-600 text-xs">?</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8x8 Card Grid — one labelled row per category */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {ROW_LABELS.map((label, rowIndex) => {
          const rowCards = gridCards.slice(rowIndex * 8, rowIndex * 8 + 8);
          return (
            <div key={rowIndex} className="mb-3">
              {/* Row label */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80 px-0.5 pb-0.5 border-b border-cyan-900/30 mb-1">
                {label}
              </div>
              <div className="grid grid-cols-8 gap-1">
                {rowCards.map((card) => {
                  const isPicked = pickedIds.has(card.id);
                  const isPlayerCard = playerPicks.includes(card.id);
                  const isAiCard = aiPicks.includes(card.id);
                  const isJustAiPicked = card.id === lastAiPick;
                  const isClickable =
                    isPlayerTurn &&
                    !isPicked &&
                    !isDone &&
                    !aiThinking &&
                    playerPicks.length < PICKS_PER_PLAYER;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      disabled={isPicked || !isClickable}
                      className={cn(
                        "rounded-lg border-2 flex flex-col items-center justify-start py-1.5 px-0.5 transition-all duration-200 relative min-h-[72px]",
                        isPicked && isPlayerCard
                          ? "bg-blue-800/50 border-blue-500/40 opacity-40 cursor-not-allowed"
                          : isPicked && isAiCard
                            ? "bg-red-800/50 border-red-500/40 opacity-40 cursor-not-allowed"
                            : isJustAiPicked
                              ? "bg-red-600/60 border-red-400 scale-105 ring-2 ring-red-400"
                              : isClickable
                                ? "bg-[#152238] border-cyan-600/50 hover:border-cyan-400 hover:bg-cyan-900/30 hover:scale-105 cursor-pointer active:scale-95"
                                : "bg-[#152238] border-gray-700/40 cursor-not-allowed opacity-70",
                      )}
                    >
                      <span className="text-2xl leading-none mb-1">
                        {card.emoji}
                      </span>
                      <span className="text-[9px] text-gray-200 font-semibold w-full text-center leading-tight px-0.5 break-words hyphens-auto">
                        {card.name}
                      </span>
                      <span
                        className={cn(
                          "absolute top-0.5 right-0.5 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center",
                          card.elixirCost <= 3
                            ? "bg-purple-600 text-white"
                            : card.elixirCost <= 5
                              ? "bg-purple-700 text-white"
                              : "bg-purple-900 text-purple-200",
                        )}
                      >
                        {card.elixirCost}
                      </span>
                      {isPlayerCard && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                          <span className="text-blue-300 text-2xl font-black opacity-70">
                            ✓
                          </span>
                        </div>
                      )}
                      {isAiCard && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                          <span className="text-red-300 text-2xl font-black opacity-70">
                            ✕
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Battle button - shown when draft is done */}
      {draftDone && (
        <div className="p-4 bg-[#0d1b2a] border-t border-cyan-900/50">
          <button
            onClick={() => onDraftComplete(playerPicks)}
            className="w-full py-3 bg-gradient-to-b from-green-500 via-green-600 to-green-700 border-b-4 border-green-900 rounded-xl text-white font-black text-xl shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            ⚔️ Battle!
          </button>
        </div>
      )}
    </div>
  );
}
