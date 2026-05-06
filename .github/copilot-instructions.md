# CrackedRoyale — AI Instructions

This is a Clash Royale–inspired browser game called **Cracked Royale**, built with Vite + React 18 + TypeScript and styled with Tailwind CSS.

## Project Location
`C:\Users\Intersession\Documents\ClashRoyaleClone`

## Tech Stack
- **Framework:** Vite + React 18 + TypeScript (no bundler complexity)
- **Styling:** Tailwind CSS + custom CSS variables in `src/index.css`
- **Backend:** Supabase (auth + realtime for multiplayer)
- **Dev server:** `npm run dev` → http://localhost:8080
- **Deploy:** Vercel (`vercel.json` at root, auto-deploys on `git push`)

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useGameState.ts` | Core game loop, all simulation logic |
| `src/components/game/Arena.tsx` | Battlefield rendering |
| `src/components/game/GameUI.tsx` | In-battle UI wrapper (timer, hand, elixir) |
| `src/components/game/GameScreen.tsx` | Top-level screen state machine |
| `src/components/game/HomeNavigator.tsx` | Home hub with 4-panel slide navigation |
| `src/components/game/MainMenu.tsx` | Main menu with battle button and game mode dropdown |
| `src/components/game/LoadingScreen.tsx` | Loading screen shown before battle |
| `src/components/game/MegaDraftScreen.tsx` | Mega Draft gamemode draft UI |
| `src/data/cards.ts` | All 119 card definitions (`allCards`, `getCardById`) |
| `src/index.css` | Global styles — `html, body { overflow: hidden; width: 100%; height: 100%; }` |

## Arena / Game Constants (useGameState.ts)
- `ARENA_WIDTH = 340`, `ARENA_HEIGHT = 500`
- `TILE_SIZE = 40` (40×40px grid tiles)
- `GAME_DURATION = 180` (3 minutes)
- `DAMAGE_MULTIPLIER = 0.4`
- Level scaling: `Math.pow(1.1, level - 1)` applied to health and damage

## Game Modes (MainMenu.tsx)
Defined in `GAME_MODES = ["Normal", "Platform", "Mega Draft", "Boss Battle"]`

### Normal
Standard 1v1 with AI opponent. Player and enemy each have 3 towers.

### Mega Draft
- Full draft screen (`MegaDraftScreen.tsx`) before battle
- 8 picks each, turn-based with AI, 60s timer per turn
- All cards forced to **level 11** during Mega Draft battles
- Towers forced to **level 11**
- Drafted deck passed to `GameUI` via `megaDraftDeck` state in `GameScreen`

### Boss Battle
- No enemy towers on the battlefield
- Player cards and towers forced to **level 16**
- A random boss troop (level 50) spawns from: `BOSS_TROOP_IDS = ['golem', 'pekka', 'giant-skeleton', 'giant', 'electro-giant', 'rune-giant', 'goblin-giant', 'lava-hound', 'goblinstein']`
- New boss spawns every time the arena is cleared
- **Win condition:** Survive 3 minutes with King Tower alive → player wins
- **Lose condition:** King Tower destroyed → enemy wins
- No sudden death, no tower tiebreaker
- Wired via: `isBossBattle` state in `GameScreen` → prop through `GameUI` → `useGameState`

## State Flow for Game Modes
```
HomeNavigator (handleBattle)
  → Mega Draft: setShowMegaDraft(true) → MegaDraftScreen → onBattleWithDeck(deck)
  → Boss Battle: onBattleBossMode() → setIsBossBattle(true) + setScreen("loading")
  → Normal: onBattle() → setScreen("loading")

GameScreen
  → megaDraftDeck: string[] | null
  → isBossBattle: boolean
  → Passed to GameUI as: cardLevels, towerLevels, isMegaDraft, isBossBattle

GameUI
  → Passes isBossBattle to useGameState(...)

useGameState
  → isBossBattleRef controls: no AI, boss spawning, survival win condition
```

## UI Button Colors (MainMenu.tsx)
- **Battle button:** Bright yellow (`from-yellow-300 to-yellow-500`, dark yellow text)
- **Game mode button:** Blue (`from-blue-400 to-blue-600`)

## Loading Screen (LoadingScreen.tsx)
- Background: `/loading-bg.jpg` (saved in `public/` folder)
- Gold glowing progress bar at bottom with live `%` counter
- "Loading..." label
- Auto-transitions to battle when bar hits 100%

## Arena Grid
- `TILE_SIZE = 40px` grid drawn in `Arena.tsx` using CSS `background-image` linear gradients
- Grid line opacity: `rgba(255,255,255,0.18)` — visible but subtle

## Scaling / Display
- `src/index.css`: `html, body { overflow: hidden; width: 100%; height: 100%; }` — fills screen, no scrollbars, no zoom

## Known Architecture Notes
- `playCard(cardIndex, position)` in `useGameState` accepts pixel `{x, y}` position
- Card level scaling: `Math.pow(1.1, level - 1)` multiplier on base health/damage
- Boss at level 50 = ~106× base stats
- Win condition block in `useGameState` is wrapped: `if (isBossBattleRef.current) { ... } else { ... }` — the else block must be properly closed with `}`
- The CSS `@import` for Google Fonts in `index.css` must come before `@tailwind` directives to avoid build warnings (currently after — non-fatal)
