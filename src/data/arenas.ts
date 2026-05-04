// Clash Royale Trophy Road Arenas
export interface Arena {
  id: number;
  name: string;
  trophiesRequired: number;
  emoji: string;
  color: string;
  bgGradient: string;
}

export const ARENAS: Arena[] = [
  { id: 1, name: "Goblin Stadium", trophiesRequired: 0, emoji: "🏟️", color: "#4a7c59", bgGradient: "from-green-700 to-green-900" },
  { id: 2, name: "Bone Pit", trophiesRequired: 100, emoji: "💀", color: "#5c4a4a", bgGradient: "from-gray-600 to-gray-800" },
  { id: 3, name: "Barbarian Bowl", trophiesRequired: 200, emoji: "⚔️", color: "#8b6914", bgGradient: "from-amber-700 to-amber-900" },
  { id: 4, name: "P.E.K.K.A's Playhouse", trophiesRequired: 300, emoji: "🤖", color: "#4a5c7c", bgGradient: "from-indigo-700 to-indigo-900" },
  { id: 5, name: "Spell Valley", trophiesRequired: 400, emoji: "✨", color: "#6b4a8c", bgGradient: "from-purple-700 to-purple-900" },
  { id: 6, name: "Builder's Workshop", trophiesRequired: 500, emoji: "🔧", color: "#7c5a3a", bgGradient: "from-orange-700 to-orange-900" },
  { id: 7, name: "Royal Arena", trophiesRequired: 600, emoji: "👑", color: "#3a6a8c", bgGradient: "from-blue-600 to-blue-800" },
  { id: 8, name: "Frozen Peak", trophiesRequired: 700, emoji: "❄️", color: "#5a8a9c", bgGradient: "from-cyan-600 to-cyan-800" },
  { id: 9, name: "Jungle Arena", trophiesRequired: 800, emoji: "🌴", color: "#3a7c4a", bgGradient: "from-emerald-600 to-emerald-800" },
  { id: 10, name: "Hog Mountain", trophiesRequired: 900, emoji: "🐷", color: "#8c5a5a", bgGradient: "from-rose-700 to-rose-900" },
  { id: 11, name: "Electro Valley", trophiesRequired: 1000, emoji: "⚡", color: "#5a5a8c", bgGradient: "from-violet-600 to-violet-800" },
  { id: 12, name: "Spooky Town", trophiesRequired: 1100, emoji: "🎃", color: "#6a4a7c", bgGradient: "from-fuchsia-700 to-fuchsia-900" },
  { id: 13, name: "Rascal's Hideout", trophiesRequired: 1200, emoji: "🏴‍☠️", color: "#4a4a5c", bgGradient: "from-slate-600 to-slate-800" },
  { id: 14, name: "Serenity Peak", trophiesRequired: 1300, emoji: "🏔️", color: "#7c8a9c", bgGradient: "from-sky-600 to-sky-800" },
  { id: 15, name: "Miner's Mine", trophiesRequired: 1400, emoji: "⛏️", color: "#8c7a5a", bgGradient: "from-yellow-700 to-yellow-900" },
  { id: 16, name: "Executioner's Kitchen", trophiesRequired: 1500, emoji: "🔥", color: "#9c4a4a", bgGradient: "from-red-600 to-red-800" },
  { id: 17, name: "Royal Crypt", trophiesRequired: 1600, emoji: "⚰️", color: "#4a5c6c", bgGradient: "from-zinc-600 to-zinc-800" },
  { id: 18, name: "Silent Sanctuary", trophiesRequired: 1700, emoji: "🕊️", color: "#8c8c7c", bgGradient: "from-stone-500 to-stone-700" },
  { id: 19, name: "Dragon Spa", trophiesRequired: 1800, emoji: "🐉", color: "#5c8c7c", bgGradient: "from-teal-600 to-teal-800" },
  { id: 20, name: "Legendary Arena", trophiesRequired: 1900, emoji: "🏆", color: "#8c7c3a", bgGradient: "from-amber-500 to-amber-700" },
];

// Trophy Road rewards - chest every 10 trophies
export interface TrophyReward {
  trophies: number;
  type: 'chest' | 'arena';
  arenaId?: number;
}

export function getTrophyRewards(maxTrophies: number): TrophyReward[] {
  const rewards: TrophyReward[] = [];
  
  for (let t = 10; t <= Math.max(maxTrophies + 100, 2000); t += 10) {
    // Check if this is an arena unlock (every 100 trophies)
    const arena = ARENAS.find(a => a.trophiesRequired === t);
    if (arena) {
      rewards.push({ trophies: t, type: 'arena', arenaId: arena.id });
    } else {
      rewards.push({ trophies: t, type: 'chest' });
    }
  }
  
  return rewards;
}

export function getCurrentArena(trophies: number): Arena {
  // Find the highest arena the player has unlocked
  for (let i = ARENAS.length - 1; i >= 0; i--) {
    if (trophies >= ARENAS[i].trophiesRequired) {
      return ARENAS[i];
    }
  }
  return ARENAS[0];
}

export function getNextArena(trophies: number): Arena | null {
  const currentArena = getCurrentArena(trophies);
  const nextIndex = ARENAS.findIndex(a => a.id === currentArena.id) + 1;
  return nextIndex < ARENAS.length ? ARENAS[nextIndex] : null;
}
