import { CardDefinition } from '@/types/game';

const CARD_IMAGES: Record<string, string> = {
  'knight': '/knight.png',
  'evo-knight': '/evo-knight.png',
  'archers': '/archers.png',
  'evo-archers': '/evo-archers.png',
  'goblins': '/goblins.png',
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
