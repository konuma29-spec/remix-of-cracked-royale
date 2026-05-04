import { memo } from 'react';
import { Projectile, SpawnEffect } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';

interface ProjectileProps {
  projectile: Projectile;
}

export const ProjectileComponent = memo(function ProjectileComponent({ projectile }: ProjectileProps) {
  const { from, to, progress, type, owner } = projectile;
  
  // Interpolate position
  const x = from.x + (to.x - from.x) * progress;
  const y = from.y + (to.y - from.y) * progress;
  
  // Calculate rotation angle
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        zIndex: 1000
      }}
    >
      {type === 'arrow' ? (
        // Arrow projectile - thin, pointy, with fletching
        <div className="relative">
          {/* Arrow shaft */}
          <div className={cn(
            'w-8 h-0.5 rounded-full',
            owner === 'player' ? 'bg-amber-700' : 'bg-gray-600'
          )} />
          {/* Arrow head (triangle) */}
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderLeft: owner === 'player' ? '8px solid #92400e' : '8px solid #374151',
            }}
          />
          {/* Fletching (feathers at back) */}
          <div className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 -ml-1',
            owner === 'player' ? 'bg-red-500' : 'bg-blue-500'
          )} 
          style={{
            clipPath: 'polygon(100% 50%, 0 0, 0 100%)'
          }}
          />
        </div>
      ) : type === 'pancake' ? (
        // Pancake projectile - golden disc that buffs friendly units
        <div className="relative animate-spin" style={{ animationDuration: '0.3s' }}>
          <div className="text-2xl">🥞</div>
          {/* Golden glow */}
          <div className="absolute inset-0 -m-1 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.6), transparent)',
              filter: 'blur(4px)'
            }}
          />
        </div>
      ) : type === 'bolt' ? (
        // Bolt projectile - for siege buildings like X-Bow
        <div className="relative">
          <div className={cn(
            'w-6 h-1 rounded-full',
            owner === 'player' ? 'bg-blue-500' : 'bg-red-500'
          )} />
          {/* Electric glow */}
          <div className="absolute inset-0 -m-0.5"
            style={{
              background: owner === 'player' 
                ? 'linear-gradient(90deg, transparent, #3b82f6, #60a5fa, transparent)'
                : 'linear-gradient(90deg, transparent, #ef4444, #f87171, transparent)',
              filter: 'blur(2px)'
            }}
          />
        </div>
      ) : (
        // Cannonball projectile - large, heavy, with smoke trail
        <div className="relative">
          <div className={cn(
            'w-5 h-5 rounded-full border-2',
            owner === 'player' ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-700'
          )} 
          style={{
            boxShadow: owner === 'player' 
              ? '0 0 8px #1f2937, inset 2px -2px 4px rgba(255,255,255,0.2)' 
              : '0 0 8px #111827, inset 2px -2px 4px rgba(255,255,255,0.2)'
          }}
          />
          {/* Smoke trail */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -ml-4"
            style={{
              width: 16,
              height: 8,
              background: 'radial-gradient(ellipse at right, rgba(156,163,175,0.6), transparent)',
              filter: 'blur(2px)'
            }}
          />
          {/* Fire glow at front */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{
              background: 'radial-gradient(circle, #f97316, #ea580c, transparent)',
              filter: 'blur(1px)'
            }}
          />
        </div>
      )}
    </div>
  );
});

interface SpawnEffectProps {
  effect: SpawnEffect;
}

export const SpawnEffectComponent = memo(function SpawnEffectComponent({ effect }: SpawnEffectProps) {
  const scale = 1 + effect.progress * 0.5;
  const opacity = 1 - effect.progress;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: effect.position.x,
        top: effect.position.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        zIndex: 999
      }}
    >
      {/* Spawn ring */}
      <div 
        className={cn(
          'w-16 h-16 rounded-full border-4',
          effect.owner === 'player' ? 'border-amber-400' : 'border-blue-400'
        )}
        style={{
          boxShadow: effect.owner === 'player'
            ? '0 0 20px #fbbf24, inset 0 0 20px #fbbf2440'
            : '0 0 20px #60a5fa, inset 0 0 20px #60a5fa40'
        }}
      />
      
      {/* Center emoji */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl">
        {effect.emoji}
      </div>
    </div>
  );
});
