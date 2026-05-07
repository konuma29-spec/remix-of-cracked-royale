import chestImg from '@/assets/chest.png';
import { cn } from '@/lib/utils';

interface ChestIconProps {
  className?: string;
  spinning?: boolean;
  locked?: boolean;
}

export function ChestIcon({ className, spinning, locked }: ChestIconProps) {
  return (
    <img
      src={chestImg}
      alt="Chest"
      draggable={false}
      className={cn(
        'inline-block object-contain select-none pointer-events-none',
        spinning && 'chest-spin',
        locked && 'grayscale opacity-50',
        className,
      )}
    />
  );
}
