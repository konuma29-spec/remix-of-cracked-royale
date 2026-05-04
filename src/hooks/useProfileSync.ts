import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { ExtendedPlayerProgress } from './useProgression';
import { starterCardIds } from '@/data/cards';
import { starterBannerIds } from '@/data/banners';
import { DeckSlot } from '@/types/game';

const LOCAL_STORAGE_KEY = 'clash-game-progress';

// Default values matching useProgression
const defaultDeckSlots: DeckSlot[] = [
  { id: 'A', name: 'Deck A', cardIds: starterCardIds.slice(0, 8) },
  { id: 'B', name: 'Deck B', cardIds: [] },
  { id: 'C', name: 'Deck C', cardIds: [] }
];

const defaultProgress: ExtendedPlayerProgress = {
  ownedCardIds: [...starterCardIds],
  cardCopies: starterCardIds.reduce((acc, id) => ({ ...acc, [id]: 1 }), {}),
  currentDeck: starterCardIds.slice(0, 8),
  deckSlots: defaultDeckSlots,
  activeDeckId: 'A',
  wins: 0,
  losses: 0,
  chestsAvailable: 1,
  lastFreeChestDate: new Date().toISOString().split('T')[0],
  playerName: 'Player',
  bannerId: 'banner-blue',
  ownedBannerIds: [...starterBannerIds],
  gold: 100,
  towerCopies: { princess: 1, king: 1 },
  evolutionShards: 6,
  unlockedEvolutions: [],
  wildCardCounts: { common: 0, rare: 0, epic: 0, legendary: 0, champion: 0 },
  selectedTowerTroopId: 'default',
  unlockedTowerTroopIds: ['default'],
  claimedTrophyRewards: [],
};

interface ProfileData {
  id: string;
  player_name: string;
  banner_id: string;
  gold: number;
  wins: number;
  losses: number;
  trophies: number;
  level: number;
  xp: number;
  evolution_shards: number;
  owned_card_ids: string[];
  card_copies: Record<string, number>;
  current_deck: string[];
  deck_slots: DeckSlot[];
  active_deck_id: string;
  owned_banner_ids: string[];
  tower_copies: Record<string, number>;
  unlocked_evolutions: string[];
  wild_card_counts: Record<string, number>;
  selected_tower_troop_id: string;
  unlocked_tower_troop_ids: string[];
  claimed_trophy_rewards: number[];
  chests_available: number;
  last_free_chest_date: string | null;
}

// Convert database profile to local progress format
function profileToProgress(profile: ProfileData): ExtendedPlayerProgress {
  return {
    ownedCardIds: profile.owned_card_ids,
    cardCopies: profile.card_copies as Record<string, number>,
    currentDeck: profile.current_deck,
    deckSlots: profile.deck_slots as DeckSlot[],
    activeDeckId: profile.active_deck_id,
    wins: profile.wins,
    losses: profile.losses,
    chestsAvailable: profile.chests_available,
    lastFreeChestDate: profile.last_free_chest_date,
    playerName: profile.player_name,
    bannerId: profile.banner_id,
    ownedBannerIds: profile.owned_banner_ids,
    gold: profile.gold,
    towerCopies: profile.tower_copies as Record<string, number>,
    evolutionShards: profile.evolution_shards,
    unlockedEvolutions: profile.unlocked_evolutions,
    wildCardCounts: profile.wild_card_counts as Record<string, number>,
    selectedTowerTroopId: profile.selected_tower_troop_id,
    unlockedTowerTroopIds: profile.unlocked_tower_troop_ids,
    claimedTrophyRewards: profile.claimed_trophy_rewards,
  };
}

// Convert local progress to database profile format (partial update)
function progressToProfile(progress: ExtendedPlayerProgress): Record<string, unknown> {
  return {
    player_name: progress.playerName,
    banner_id: progress.bannerId,
    gold: progress.gold,
    wins: progress.wins,
    losses: progress.losses,
    evolution_shards: progress.evolutionShards,
    owned_card_ids: progress.ownedCardIds,
    card_copies: progress.cardCopies,
    current_deck: progress.currentDeck,
    deck_slots: progress.deckSlots as unknown as Record<string, unknown>[],
    active_deck_id: progress.activeDeckId,
    owned_banner_ids: progress.ownedBannerIds,
    tower_copies: progress.towerCopies,
    unlocked_evolutions: progress.unlockedEvolutions,
    wild_card_counts: progress.wildCardCounts,
    selected_tower_troop_id: progress.selectedTowerTroopId,
    unlocked_tower_troop_ids: progress.unlockedTowerTroopIds,
    claimed_trophy_rewards: progress.claimedTrophyRewards,
    chests_available: progress.chestsAvailable,
    last_free_chest_date: progress.lastFreeChestDate,
  };
}

/**
 * Hook to sync player progress between localStorage and Supabase profiles table.
 * On login: fetches cloud data and merges with local (cloud takes precedence).
 * On change: debounced sync to cloud.
 */
export function useProfileSync(user: User | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [cloudProgress, setCloudProgress] = useState<ExtendedPlayerProgress | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string | null>(null);

  // Fetch profile from cloud
  const fetchCloudProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch cloud profile:', error);
        setIsLoading(false);
        return null;
      }

      if (data) {
        const progress = profileToProgress(data as unknown as ProfileData);
        setCloudProgress(progress);
        setIsLoading(false);
        return progress;
      }

      // Profile doesn't exist yet - will be created by trigger
      setIsLoading(false);
      return null;
    } catch (e) {
      console.error('Error fetching cloud profile:', e);
      setIsLoading(false);
      return null;
    }
  }, [user]);

  // Sync local progress to cloud (debounced)
  const syncToCloud = useCallback(async (progress: ExtendedPlayerProgress) => {
    if (!user) return;

    // Create hash to avoid duplicate syncs
    const hash = JSON.stringify(progressToProfile(progress));
    if (hash === lastSyncRef.current) return;
    lastSyncRef.current = hash;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(progressToProfile(progress))
        .eq('id', user.id);

      if (error) {
        console.error('Failed to sync to cloud:', error);
      }
    } catch (e) {
      console.error('Error syncing to cloud:', e);
    }
  }, [user]);

  // Debounced sync (500ms delay to batch rapid changes)
  const debouncedSync = useCallback((progress: ExtendedPlayerProgress) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncToCloud(progress);
    }, 500);
  }, [syncToCloud]);

  // Initial fetch on user change
  useEffect(() => {
    if (user) {
      fetchCloudProfile();
    } else {
      setCloudProgress(null);
      setIsLoading(false);
    }
  }, [user, fetchCloudProfile]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Migrate localStorage to cloud on first login
  const migrateLocalToCloud = useCallback(async () => {
    if (!user) return;

    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!localData) return;

      const localProgress = JSON.parse(localData) as ExtendedPlayerProgress;
      
      // Merge: take higher values for wins/losses/gold, merge collections
      const mergedProgress: ExtendedPlayerProgress = {
        ...defaultProgress,
        ...localProgress,
        // Keep the player name from auth metadata
        playerName: user.user_metadata?.player_name || localProgress.playerName || 'Player',
      };

      await syncToCloud(mergedProgress);
      
      // Clear localStorage after successful migration
      // localStorage.removeItem(LOCAL_STORAGE_KEY); // Keep for offline fallback
      
      return mergedProgress;
    } catch (e) {
      console.error('Error migrating local data:', e);
      return null;
    }
  }, [user, syncToCloud]);

  return {
    isLoading,
    cloudProgress,
    syncToCloud: debouncedSync,
    fetchCloudProfile,
    migrateLocalToCloud,
  };
}
