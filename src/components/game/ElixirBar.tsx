import { cn } from '@/lib/utils';

interface ElixirBarProps {
  elixir: number;
  isSuddenDeath?: boolean;
}

export function ElixirBar({ elixir, isSuddenDeath = false }: ElixirBarProps) {
  const displayElixir = Math.floor(elixir);
  const fillPercent = (elixir / 10) * 100;

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-between items-center mb-1">
        <span className={cn(
          "text-sm font-bold transition-colors duration-300",
          isSuddenDeath ? "text-orange-400" : "text-accent"
        )}>
          ⚡ Elixir {isSuddenDeath && <span className="text-xs">(2X)</span>}
        </span>
        <span className={cn(
          "text-lg font-bold transition-colors duration-300",
          isSuddenDeath ? "text-orange-400" : "text-accent"
        )}>
          {displayElixir}/10
        </span>
      </div>
      
      <div className={cn(
        "elixir-bar-container transition-all duration-300",
        isSuddenDeath && "ring-2 ring-orange-400/50"
      )}>
        <div
          className={cn(
            "elixir-bar-fill transition-colors duration-300",
            isSuddenDeath && "!bg-gradient-to-r from-orange-500 to-amber-400"
          )}
          style={{ width: `${fillPercent}%` }}
        />
        <div className="elixir-segments">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="elixir-segment" />
          ))}
        </div>
      </div>
    </div>
  );
}
