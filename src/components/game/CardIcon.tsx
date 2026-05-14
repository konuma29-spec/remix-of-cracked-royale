import { CardDefinition } from '@/types/game';

const CARD_IMAGES: Record<string, string> = {
  'knight': '/knight.png',
  'evo-knight': '/evo-knight.png',
  'archers': '/archers.png',
  'evo-archers': '/evo-archers.png',
  'goblins': '/goblins.png',
  'skeletons': '/skeletons.png',
  'bomber': '/bomber.png',
  'minions': '/minions.png',
  'ice-spirit': '/ice-spirit.png',
  'fire-spirit': '/fire-spirit.png',
  'heal-spirit': '/heal-spirit.png',
  'electro-spirit': '/electro-spirit.png',
  'barbarians': '/barbarians.png',
  'evo-barbarians': '/evo-barbarians.png',
  'bats': '/bats.png',
  'firecracker': '/firecracker.png',
  'goblin-gang': '/goblin-gang.png',
  'minion-horde': '/minion-horde.png',
  'rascals': '/rascals.png',
  'skeleton-barrel': '/skeleton-barrel.png',
  'skeleton-dragons': '/skeleton-dragons.png',
  'spear-goblins': '/spear-goblins.png',
  'wizard': '/wizard.png',
  'musketeer': '/musketeer.png',
  'baby-dragon': '/baby-dragon.png',
  'hog-rider': '/hog-rider.png',
  'battle-ram': '/battle-ram.png',
  'dart-goblin': '/dart-goblin.png',
  'flying-machine': '/flying-machine.png',
  'goblin-demolisher': '/goblin-demolisher.png',
  'mega-minion': '/mega-minion.png',
  'royal-hogs': '/royal-hogs.png',
  'suspicious-bush': '/suspicious-bush.png',
  'three-musketeers': '/three-musketeers.png',
  'zappies': '/zappies.png',
  'witch': '/witch.png',
  'balloon': '/balloon.png',
  'cannon-cart': '/cannon-cart.png',
  'electro-dragon': '/electro-dragon.png',
  'executioner': '/executioner.png',
  'guards': '/guards.png',
  'hunter': '/hunter.png',
  'skeleton-army': '/skeleton-army.png',
  'wall-breakers': '/wall-breakers.png',
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
  'ram-rider': '/ram-rider.png',
  'royal-ghost': '/royal-ghost.png',
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
