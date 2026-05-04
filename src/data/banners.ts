import { Banner } from '@/types/game';

export const allBanners: Banner[] = [
  // Starter banners
  { id: 'banner-blue', name: 'Blue Shield', emoji: '🛡️', rarity: 'common', color: '#3b82f6' },
  { id: 'banner-green', name: 'Green Forest', emoji: '🌲', rarity: 'common', color: '#22c55e' },
  
  // Common banners
  { id: 'banner-sword', name: 'Sword Master', emoji: '⚔️', rarity: 'common', color: '#6b7280' },
  { id: 'banner-fire', name: 'Fire Spirit', emoji: '🔥', rarity: 'common', color: '#ef4444' },
  { id: 'banner-water', name: 'Water Wave', emoji: '🌊', rarity: 'common', color: '#0ea5e9' },
  
  // Rare banners
  { id: 'banner-dragon', name: 'Dragon Flame', emoji: '🐉', rarity: 'rare', color: '#f97316' },
  { id: 'banner-crown', name: 'Royal Crown', emoji: '👑', rarity: 'rare', color: '#eab308' },
  { id: 'banner-lightning', name: 'Thunder Strike', emoji: '⚡', rarity: 'rare', color: '#a855f7' },
  
  // Epic banners
  { id: 'banner-skull', name: 'Skull King', emoji: '💀', rarity: 'epic', color: '#1f2937' },
  { id: 'banner-phoenix', name: 'Phoenix Rise', emoji: '🦅', rarity: 'epic', color: '#dc2626' },
  { id: 'banner-ice', name: 'Frozen Heart', emoji: '❄️', rarity: 'epic', color: '#06b6d4' },
  
  // Legendary banners
  { id: 'banner-unicorn', name: 'Mythical Unicorn', emoji: '🦄', rarity: 'legendary', color: '#ec4899' },
  { id: 'banner-galaxy', name: 'Galaxy Warrior', emoji: '🌌', rarity: 'legendary', color: '#8b5cf6' },
];

export const starterBannerIds = ['banner-blue', 'banner-green'];

export function getBannerById(id: string): Banner | undefined {
  return allBanners.find(b => b.id === id);
}

export function getRandomBanner(ownedIds: string[]): Banner | null {
  const unowned = allBanners.filter(b => !ownedIds.includes(b.id));
  if (unowned.length === 0) return null;
  
  // Weight by rarity (rarer = less likely)
  const weights = unowned.map(b => {
    switch (b.rarity) {
      case 'common': return 40;
      case 'rare': return 25;
      case 'epic': return 10;
      case 'legendary': return 3;
    }
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < unowned.length; i++) {
    random -= weights[i];
    if (random <= 0) return unowned[i];
  }
  
  return unowned[0];
}
