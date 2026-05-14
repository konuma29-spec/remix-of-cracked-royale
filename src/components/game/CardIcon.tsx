import { CardDefinition } from '@/types/game';

const CARD_IMAGES: Record<string, string> = {
  'knight': '/knight.png',
};

interface CardIconProps {
  card: CardDefinition | { id: string; emoji: string };
  className?: string;
}

/**
 * Renders a card's visual icon — a custom image for cards that have one,
 * or the emoji fallback for all others.
 */
export function CardIcon({ card, className }: CardIconProps) {
  const imageSrc = CARD_IMAGES[card.id];
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={card.id}
        className={className ?? 'w-full h-full object-contain'}
      />
    );
  }
  return <span className={className}>{card.emoji}</span>;
}
