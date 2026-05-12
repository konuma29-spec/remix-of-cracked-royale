import { Tower as TowerType } from "@/types/game";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import kingTowerImg from "@/assets/king-tower.png";
import kingTowerEnemyImg from "@/assets/king-tower-enemy.png";
import princessTowerEnemyImg from "@/assets/princess-tower-enemy.png";
import princessTowerPlayerImg from "@/assets/princess-tower-player.png";

interface TowerProps {
  tower: TowerType;
}

export function Tower({ tower }: TowerProps) {
  const [isAttacking, setIsAttacking] = useState(false);
  const healthPercent = (tower.health / tower.maxHealth) * 100;
  const isDestroyed = tower.health <= 0;
  const isKingInactive = tower.type === "king" && !tower.isActivated;

  const healthClass =
    healthPercent > 60
      ? "health-full"
      : healthPercent > 30
        ? "health-mid"
        : "health-low";

  // Detect attacks
  useEffect(() => {
    const now = performance.now();
    if (now - tower.lastAttackTime < 200) {
      setIsAttacking(true);
      const timer = setTimeout(() => setIsAttacking(false), 200);
      return () => clearTimeout(timer);
    }
  }, [tower.lastAttackTime]);

  const size = tower.type === "king" ? "w-24 h-24" : "w-16 h-16";

  // For player's king tower, show health above to avoid being covered by UI
  const showHealthAbove = tower.type === "king" && tower.owner === "player";

  return (
    <div
      className={cn(
        "absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300",
        isDestroyed && "opacity-30",
      )}
      style={{
        left: tower.position.x,
        top: tower.position.y,
        zIndex: 50,
      }}
    >
      {/* Attack range indicator when attacking */}
      {isAttacking && !isDestroyed && (
        <div
          className="absolute rounded-full border-2 border-white/20 animate-ping"
          style={{
            width: tower.attackRange * 2,
            height: tower.attackRange * 2,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Health bar ABOVE tower for player king tower */}
      {!isDestroyed && showHealthAbove && (
        <div className="w-full mb-1 px-1">
          <div className="health-bar-container h-2 relative">
            <div
              className={cn("health-bar-fill", healthClass)}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="text-center mt-0.5 flex items-center justify-center gap-0.5">
            {tower.level && (
              <span
                className="text-[10px] font-bold text-amber-400 px-1"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                Lv{tower.level}
              </span>
            )}
            <span
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                tower.owner === "player" ? "text-blue-200" : "text-red-200",
              )}
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
            >
              {Math.max(0, Math.floor(tower.health))}
            </span>
          </div>
        </div>
      )}

      {(() => {
        const usesImage = tower.type === "king" || tower.type === "princess";
        const imgSrc =
          tower.type === "king"
            ? tower.owner === "player"
              ? kingTowerImg
              : kingTowerEnemyImg
            : tower.owner === "player"
              ? princessTowerPlayerImg
              : princessTowerEnemyImg;
        return (
          <div
            className={cn(
              "flex items-center justify-center relative",
              size,
              !usesImage && "tower-base",
              !usesImage &&
                (tower.owner === "player" ? "tower-friendly" : "tower-enemy"),
              !usesImage && tower.type === "king" && "tower-king",
              isAttacking && "scale-110",
            )}
            style={{
              transition: "transform 0.1s ease-out",
            }}
          >
            {tower.type === "princess" && tower.owner === "player" ? (
              <svg
                viewBox="0 0 60 72"
                className={cn("w-full h-full", isDestroyed && "opacity-40")}
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Shadow */}
                <ellipse cx="30" cy="70" rx="14" ry="3" fill="rgba(0,0,0,0.25)" />
                {/* Base / foundation */}
                <rect x="10" y="52" width="40" height="10" rx="2" fill="#7a6a50" />
                <rect x="10" y="52" width="40" height="3" rx="1" fill="#9a8a6a" />
                {/* Main tower body */}
                <rect x="13" y="22" width="34" height="32" fill="#5b7fa6" />
                {/* Stone block texture lines */}
                <rect x="13" y="28" width="34" height="1.5" fill="rgba(0,0,0,0.18)" />
                <rect x="13" y="35" width="34" height="1.5" fill="rgba(0,0,0,0.18)" />
                <rect x="13" y="42" width="34" height="1.5" fill="rgba(0,0,0,0.18)" />
                <rect x="13" y="49" width="34" height="1.5" fill="rgba(0,0,0,0.18)" />
                <rect x="21" y="22" width="1.5" height="30" fill="rgba(0,0,0,0.12)" />
                <rect x="37.5" y="22" width="1.5" height="30" fill="rgba(0,0,0,0.12)" />
                {/* Highlight on left edge */}
                <rect x="13" y="22" width="3" height="32" fill="rgba(255,255,255,0.12)" />
                {/* Tower window */}
                <rect x="23" y="35" width="14" height="10" rx="7" fill="#1a1a2e" />
                <rect x="23" y="35" width="14" height="5" rx="7" fill="#2a2a4e" />
                {/* Battlement / merlons row */}
                <rect x="11" y="17" width="8" height="7" rx="1" fill="#4a6d94" />
                <rect x="22" y="17" width="8" height="7" rx="1" fill="#4a6d94" />
                <rect x="33" y="17" width="8" height="7" rx="1" fill="#4a6d94" />
                <rect x="44" y="17" width="7" height="7" rx="1" fill="#4a6d94" />
                {/* Battlement top edge highlight */}
                <rect x="11" y="17" width="8" height="2" rx="1" fill="#6a8db4" />
                <rect x="22" y="17" width="8" height="2" rx="1" fill="#6a8db4" />
                <rect x="33" y="17" width="8" height="2" rx="1" fill="#6a8db4" />
                <rect x="44" y="17" width="7" height="2" rx="1" fill="#6a8db4" />
                {/* Battlement floor */}
                <rect x="11" y="23" width="40" height="2" fill="#4a6d94" />
                {/* Princess figure */}
                {/* Crown */}
                <polygon points="24,10 26,5 28,9 30,3 32,9 34,5 36,10" fill="#f5c842" />
                {/* Head */}
                <ellipse cx="30" cy="13" rx="5" ry="5.5" fill="#f5c8a0" />
                {/* Hair */}
                <ellipse cx="30" cy="10" rx="5.5" ry="4" fill="#c8803a" />
                <ellipse cx="24.5" cy="14" rx="2" ry="3.5" fill="#c8803a" />
                <ellipse cx="35.5" cy="14" rx="2" ry="3.5" fill="#c8803a" />
                {/* Eyes */}
                <ellipse cx="27.5" cy="13.5" rx="1.2" ry="1.2" fill="#2a1a0a" />
                <ellipse cx="32.5" cy="13.5" rx="1.2" ry="1.2" fill="#2a1a0a" />
                {/* Smile */}
                <path d="M28 16.5 Q30 18 32 16.5" stroke="#c0705a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              </svg>
            ) : usesImage ? (
              <img
                src={imgSrc}
                alt={tower.type === "king" ? "King Tower" : "Princess Tower"}
                className={cn(
                  "w-full h-full object-contain",
                  isKingInactive && "opacity-60",
                )}
              />
            ) : (
              <span
                className={cn("text-2xl", isKingInactive && "opacity-60")}
              >
                👸
              </span>
            )}

        {/* Sleeping indicator for inactive king tower */}
        {isKingInactive && !isDestroyed && (
          <div className="absolute -top-1 -right-1 text-xs animate-pulse">
            💤
          </div>
        )}

        {/* Cannon indicator for activated king tower */}
        {tower.type === "king" && tower.isActivated && !isDestroyed && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg animate-bounce">
            🔫
          </div>
        )}

        {/* Muzzle flash when attacking */}
        {isAttacking && !isDestroyed && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <span className="text-lg animate-bounce">
              {tower.type === "king" ? "🔥" : "🏹"}
            </span>
          </div>
        )}
          </div>
        );
      })()}

      {/* Health bar BELOW tower for all other towers */}
      {!isDestroyed && !showHealthAbove && (
        <div className="w-full mt-1 px-1">
          <div className="health-bar-container h-2 relative">
            <div
              className={cn("health-bar-fill", healthClass)}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="text-center mt-0.5 flex items-center justify-center gap-0.5">
            {tower.level && (
              <span
                className="text-[10px] font-bold text-amber-400 px-1"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                Lv{tower.level}
              </span>
            )}
            <span
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                tower.owner === "player" ? "text-blue-200" : "text-red-200",
              )}
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
            >
              {Math.max(0, Math.floor(tower.health))}
            </span>
          </div>
        </div>
      )}

      {isDestroyed && <div className="text-xl mt-1">💥</div>}
    </div>
  );
}
