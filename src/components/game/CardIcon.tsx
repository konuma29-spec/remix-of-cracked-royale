import { CardDefinition } from '@/types/game';

const CARD_IMAGES: Record<string, string> = {
  'knight': '/knight.png',
  'evo-knight': '/evo-knight.png',
  'archers': '/archers.png',
  'evo-archers': '/evo-archers.png',
  'goblins': '/goblins.png',
  'skeletons': '/skeletons.png',
  'evo-skeletons': '/evo-skeletons.png',
  'bomber': '/bomber.png',
  'evo-bomber': '/evo-bomber.png',
  'minions': '/minions.png',
  'ice-spirit': '/ice-spirit.png',
  'evo-ice-spirit': '/evo-ice-spirit.png',
  'fire-spirit': '/fire-spirit.png',
  'heal-spirit': '/heal-spirit.png',
  'electro-spirit': '/electro-spirit.png',
  'barbarians': '/barbarians.png',
  'evo-barbarians': '/evo-barbarians.png',
  'elite-barbarians': '/elite-barbarians.png',
  'bats': '/bats.png',
  'evo-bats': '/evo-bats.png',
  'firecracker': '/firecracker.png',
  'evo-firecracker': '/evo-firecracker.png',
  'goblin-gang': '/goblin-gang.png',
  'minion-horde': '/minion-horde.png',
  'rascals': '/rascals.png',
  'skeleton-barrel': '/skeleton-barrel.png',
  'evo-skeleton-barrel': '/evo-skeleton-barrel.png',
  'skeleton-dragons': '/skeleton-dragons.png',
  'skeleton-giant': '/skeleton-giant.png',
  'spear-goblins': '/spear-goblins.png',
  'wizard': '/wizard.png',
  'evo-wizard': '/evo-wizard.png',
  'musketeer': '/musketeer.png',
  'evo-musketeer': '/evo-musketeer.png',
  'battle-healer': '/battle-healer.png',
  'baby-dragon': '/baby-dragon.png',
  'evo-baby-dragon': '/evo-baby-dragon.png',
  'hog-rider': '/hog-rider.png',
  'battle-ram': '/battle-ram.png',
  'evo-battle-ram': '/evo-battle-ram.png',
  'dart-goblin': '/dart-goblin.png',
  'evo-dart-goblin': '/evo-dart-goblin.png',
  'flying-machine': '/flying-machine.png',
  'giant': '/giant.png',
  'goblin-demolisher': '/goblin-demolisher.png',
  'mega-minion': '/mega-minion.png',
  'royal-hogs': '/royal-hogs.png',
  'evo-royal-hogs': '/evo-royal-hogs.png',
  'suspicious-bush': '/suspicious-bush.png',
  'three-musketeers': '/three-musketeers.png',
  'zappies': '/zappies.png',
  'witch': '/witch.png',
  'evo-witch': '/evo-witch.png',
  'balloon': '/balloon.png',
  'berserker': '/berserker.png',
  'bowler': '/bowler.png',
  'cannon-cart': '/cannon-cart.png',
  'dark-prince': '/dark-prince.png',
  'electro-dragon': '/electro-dragon.png',
  'golem': '/golem.png',
  'elixir-golem': '/elixir-golem.png',
  'executioner': '/executioner.png',
  'evo-executioner': '/evo-executioner.png',
  'guards': '/guards.png',
  'hunter': '/hunter.png',
  'evo-hunter': '/evo-hunter.png',
  'ice-golem': '/ice-golem.png',
  'mini-pekka': '/mini-pekka.png',
  'pekka': '/pekka.png',
  'evo-pekka': '/evo-pekka.png',
  'skeleton-army': '/skeleton-army.png',
  'evo-skeleton-army': '/evo-skeleton-army.png',
  'wall-breakers': '/wall-breakers.png',
  'valkyrie': '/valkyrie.png',
  'evo-valkyrie': '/evo-valkyrie.png',
  'electro-wizard': '/electro-wizard.png',
  'princess': '/princess.png',
  'bandit': '/bandit.png',
  'fisherman': '/fisherman.png',
  'inferno-dragon': '/inferno-dragon.png',
  'ice-wizard': '/ice-wizard.png',
  'lumberjack': '/lumberjack.png',
  'magic-archer': '/magic-archer.png',
  'mother-witch': '/mother-witch.png',
  'night-witch': '/night-witch.png',
  'phoenix': '/phoenix.png',
  'prince': '/prince.png',
  'ram-rider': '/ram-rider.png',
  'royal-ghost': '/royal-ghost.png',
  'royal-giant': '/royal-giant.png',
  'evo-royal-giant': '/evo-royal-giant.png',
  'royal-recruits': '/royal-recruits.png',
  'evo-royal-recruits': '/evo-royal-recruits.png',
  'sparky': '/sparky.png',
  'spirit-empress': '/spirit-empress.png',
  'archer-queen': '/archer-queen.png',
  'little-prince': '/little-prince.png',
};

export function hasCardImage(id: string): boolean {
  return id in CARD_IMAGES;
}

interface CardIconProps {
  card: CardDefinition | { id: string; emoji: string };
  /** Class applied to the <img> when a custom image exists */
  imageClassName?: string;
  /** Class applied to the <span> emoji fallback */
  emojiClassName?: string;
  /** Shorthand: sets both imageClassName and emojiClassName to the same value */
  className?: string;
}

/**
 * Renders a card's visual icon — a custom image for cards that have one,
 * or the emoji fallback for all others.
 */
export function CardIcon({ card, imageClassName, emojiClassName, className }: CardIconProps) {
  const baseId = card.id.replace(/^evo-/, '');
  const imageSrc = CARD_IMAGES[card.id] ?? CARD_IMAGES[baseId];
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={card.id}
        className={imageClassName ?? className ?? 'w-full h-full object-contain'}
      />
    );
  }
  return <span className={emojiClassName ?? className}>{card.emoji}</span>;
}
