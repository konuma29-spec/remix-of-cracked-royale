import elixirImg from '@/assets/elixir.png';
import { cn } from '@/lib/utils';

interface ElixirIconProps {
  className?: string;
}

export function ElixirIcon({ className }: ElixirIconProps) {
  return (
    <img
      src={elixirImg}
      alt="Elixir"
      className={cn('inline-block h-[1em] w-[1em] align-[-0.15em] object-contain', className)}
      draggable={false}
    />
  );
}
