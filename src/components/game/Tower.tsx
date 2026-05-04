import { Tower as TowerType } from '@/types/game';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface TowerProps {
  tower: TowerType;
}

export function Tower({ tower }: TowerProps) {
  const [isAttacking, setIsAttacking] = useState(false);
  const healthPercent = (tower.health / tower.maxHealth) * 100;
  const isDestroyed = tower.health <= 0;
  const isKingInactive = tower.type === 'king' && !tower.isActivated;
  
  const healthClass = healthPercent > 60 ? 'health-full' : healthPercent > 30 ? 'health-mid' : 'health-low';

  // Detect attacks
  useEffect(() => {
    const now = performance.now();
    if (now - tower.lastAttackTime < 200) {
      setIsAttacking(true);
      const timer = setTimeout(() => setIsAttacking(false), 200);
      return () => clearTimeout(timer);
    }
  }, [tower.lastAttackTime]);

  const size = tower.type === 'king' ? 'w-16 h-16' : 'w-12 h-12';

  // For player's king tower, show health above to avoid being covered by UI
  const showHealthAbove = tower.type === 'king' && tower.owner === 'player';

  return (
    <div
      className={cn(
        'absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300',
        isDestroyed && 'opacity-30'
      )}
      style={{
        left: tower.position.x,
        top: tower.position.y,
        zIndex: 50
      }}
    >
      {/* Attack range indicator when attacking */}
      {isAttacking && !isDestroyed && (
        <div 
          className="absolute rounded-full border-2 border-white/20 animate-ping"
          style={{
            width: tower.attackRange * 2,
            height: tower.attackRange * 2,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Health bar ABOVE tower for player king tower */}
      {!isDestroyed && showHealthAbove && (
        <div className="w-full mb-1 px-1">
          <div className="health-bar-container h-2 relative">
            <div
              className={cn('health-bar-fill', healthClass)}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="text-center mt-0.5 flex items-center justify-center gap-0.5">
            {tower.level && (
              <span 
                className="text-[10px] font-bold text-amber-400 px-1"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                Lv{tower.level}
              </span>
            )}
            <span 
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                tower.owner === 'player' ? "text-blue-200" : "text-red-200"
              )}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {Math.max(0, Math.floor(tower.health))}
            </span>
          </div>
        </div>
      )}
      
      <div
        className={cn(
          'tower-base flex items-center justify-center relative',
          size,
          tower.owner === 'player' ? 'tower-friendly' : 'tower-enemy',
          tower.type === 'king' && 'tower-king',
          isAttacking && 'scale-110'
        )}
        style={{
          transition: 'transform 0.1s ease-out'
        }}
      >
        <span className={cn(
          'text-2xl',
          tower.type === 'king' && 'text-3xl',
          isKingInactive && 'opacity-60'
        )}>
          {tower.type === 'king' ? '👑' : '👸'}
        </span>
        
        {/* Sleeping indicator for inactive king tower */}
        {isKingInactive && !isDestroyed && (
          <div className="absolute -top-1 -right-1 text-xs animate-pulse">
            💤
          </div>
        )}
        
        {/* Cannon indicator for activated king tower */}
        {tower.type === 'king' && tower.isActivated && !isDestroyed && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg animate-bounce">
            🔫
          </div>
        )}
        
        {/* Muzzle flash when attacking */}
        {isAttacking && !isDestroyed && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <span className="text-lg animate-bounce">
              {tower.type === 'king' ? '🔥' : '🏹'}
            </span>
          </div>
        )}
      </div>
      
      {/* Health bar BELOW tower for all other towers */}
      {!isDestroyed && !showHealthAbove && (
        <div className="w-full mt-1 px-1">
          <div className="health-bar-container h-2 relative">
            <div
              className={cn('health-bar-fill', healthClass)}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="text-center mt-0.5 flex items-center justify-center gap-0.5">
            {tower.level && (
              <span 
                className="text-[10px] font-bold text-amber-400 px-1"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                Lv{tower.level}
              </span>
            )}
            <span 
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                tower.owner === 'player' ? "text-blue-200" : "text-red-200"
              )}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {Math.max(0, Math.floor(tower.health))}
            </span>
          </div>
        </div>
      )}

      {isDestroyed && (
        <div className="text-xl mt-1">💥</div>
      )}
    </div>
  );
}
