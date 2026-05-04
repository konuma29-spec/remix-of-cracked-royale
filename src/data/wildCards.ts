// Wild Cards - Magic items that can be used to upgrade any card of the same rarity
// Based on Clash Royale's Wild Card system

export type WildCardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'champion';

export interface WildCard {
  id: string;
  name: string;
  rarity: WildCardRarity;
  emoji: string;
  description: string;
  color: string;
  gradient: string;
}

export const wildCards: WildCard[] = [
  {
    id: 'wild-common',
    name: 'Common Wild Card',
    rarity: 'common',
    emoji: '🃏',
    description: 'Can be converted into any Common card you own',
    color: '#94a3b8',
    gradient: 'from-slate-400 to-slate-600'
  },
  {
    id: 'wild-rare',
    name: 'Rare Wild Card',
    rarity: 'rare',
    emoji: '🃏',
    description: 'Can be converted into any Rare card you own',
    color: '#f97316',
    gradient: 'from-orange-400 to-orange-600'
  },
  {
    id: 'wild-epic',
    name: 'Epic Wild Card',
    rarity: 'epic',
    emoji: '🃏',
    description: 'Can be converted into any Epic card you own',
    color: '#a855f7',
    gradient: 'from-purple-400 to-purple-600'
  },
  {
    id: 'wild-legendary',
    name: 'Legendary Wild Card',
    rarity: 'legendary',
    emoji: '🃏',
    description: 'Can be converted into any Legendary card you own',
    color: '#fbbf24',
    gradient: 'from-amber-400 to-amber-600'
  },
  {
    id: 'wild-champion',
    name: 'Champion Wild Card',
    rarity: 'champion',
    emoji: '🃏',
    description: 'Can be converted into any Champion card you own',
    color: '#ec4899',
    gradient: 'from-pink-400 to-rose-600'
  }
];

export function getWildCard(rarity: WildCardRarity): WildCard | undefined {
  return wildCards.find(w => w.rarity === rarity);
}

export function getWildCardById(id: string): WildCard | undefined {
  return wildCards.find(w => w.id === id);
}
