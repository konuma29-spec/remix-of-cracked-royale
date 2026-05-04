import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface EmoteMessage {
  id: string;
  content: string;
  isText: boolean;
  isPlayer: boolean;
  timestamp: number;
}

interface EmoteDisplayProps {
  messages: EmoteMessage[];
}

export function EmoteDisplay({ messages }: EmoteDisplayProps) {
  const [playerEmote, setPlayerEmote] = useState<EmoteMessage | null>(null);
  const [enemyEmote, setEnemyEmote] = useState<EmoteMessage | null>(null);

  useEffect(() => {
    // Get the latest message for each side
    const latestPlayer = messages.filter(m => m.isPlayer).slice(-1)[0];
    const latestEnemy = messages.filter(m => !m.isPlayer).slice(-1)[0];

    // Update player emote if new
    if (latestPlayer && (!playerEmote || latestPlayer.id !== playerEmote.id)) {
      setPlayerEmote(latestPlayer);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setPlayerEmote(prev => prev?.id === latestPlayer.id ? null : prev);
      }, 5000);
    }

    // Update enemy emote if new
    if (latestEnemy && (!enemyEmote || latestEnemy.id !== enemyEmote.id)) {
      setEnemyEmote(latestEnemy);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setEnemyEmote(prev => prev?.id === latestEnemy.id ? null : prev);
      }, 5000);
    }
  }, [messages]);

  // King tower positions (relative to arena: 340x500)
  // Player king: y = 450 (ARENA_HEIGHT - 50)
  // Enemy king: y = 50
  // Emotes should appear right above the crown on each king tower
  
  return (
    <>
      {/* Player emote - right above player king tower crown */}
      {playerEmote && (
        <div
          key={playerEmote.id}
          className={cn(
            "absolute z-[100]",
            "animate-in zoom-in-75 fade-in duration-200"
          )}
          style={{
            left: '50%',
            bottom: '200px', // Well above the player king tower
            transform: 'translateX(-50%)'
          }}
        >
          <EmoteBubble content={playerEmote.content} isText={playerEmote.isText} isPlayer={true} />
        </div>
      )}

      {/* Enemy emote - right above enemy king tower crown */}
      {enemyEmote && (
        <div
          key={enemyEmote.id}
          className={cn(
            "absolute z-[100]",
            "animate-in zoom-in-75 fade-in duration-200"
          )}
          style={{
            left: '50%',
            top: '135px', // Well above the enemy king tower
            transform: 'translateX(-50%)'
          }}
        >
          <EmoteBubble content={enemyEmote.content} isText={enemyEmote.isText} isPlayer={false} />
        </div>
      )}
    </>
  );
}

function EmoteBubble({ content, isText, isPlayer }: { content: string; isText: boolean; isPlayer: boolean }) {
  return (
    <div 
      className={cn(
        "relative px-4 py-2 rounded-2xl shadow-lg animate-bounce-subtle",
        isPlayer 
          ? "bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400"
          : "bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400"
      )}
    >
      {isText ? (
        <span className="text-white font-bold text-sm whitespace-nowrap">{content}</span>
      ) : (
        <span className="text-4xl">{content}</span>
      )}
      
      {/* Speech bubble tail */}
      <div 
        className={cn(
          "absolute w-3 h-3 rotate-45",
          isPlayer 
            ? "bg-blue-600 border-b-2 border-r-2 border-blue-400 -bottom-1.5 left-1/2 -translate-x-1/2"
            : "bg-red-600 border-t-2 border-l-2 border-red-400 -top-1.5 left-1/2 -translate-x-1/2"
        )}
      />
    </div>
  );
}
