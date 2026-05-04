import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#1a4a7c] via-[#0d3a5c] to-[#0a2840] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Diamond pattern background */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.05) 20px,
              rgba(255,255,255,0.05) 40px
            )`
          }}
        />
      </div>

      {/* Characters area - emoji placeholders */}
      <div className="relative mb-8 flex items-end justify-center gap-2">
        <div className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>👺</div>
        <div className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>⚔️</div>
        <div className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>💀</div>
        <div className="text-7xl animate-bounce" style={{ animationDelay: '0.15s' }}>👑</div>
        <div className="text-5xl animate-bounce" style={{ animationDelay: '0.25s' }}>🗿</div>
        <div className="text-4xl animate-bounce" style={{ animationDelay: '0.05s' }}>🏹</div>
        <div className="text-6xl animate-bounce" style={{ animationDelay: '0.3s' }}>🤖</div>
      </div>

      {/* Logo - 3D Style */}
      <div className="flex flex-col items-center mb-8">
        {/* CRACKED - White with heavy 3D effect */}
        <div className="relative">
          {/* Multiple shadow layers for 3D depth */}
          <h1 
            className="text-5xl sm:text-6xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#0a1628',
              transform: 'translate(6px, 6px)',
              letterSpacing: '4px',
            }}
            aria-hidden="true"
          >
            Cracked
          </h1>
          <h1 
            className="text-5xl sm:text-6xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#1a3a5c',
              transform: 'translate(4px, 4px)',
              letterSpacing: '4px',
            }}
            aria-hidden="true"
          >
            Cracked
          </h1>
          <h1 
            className="text-5xl sm:text-6xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#2d5a87',
              transform: 'translate(2px, 2px)',
              letterSpacing: '4px',
            }}
            aria-hidden="true"
          >
            Cracked
          </h1>
          <h1 
            className="text-5xl sm:text-6xl font-black tracking-wider uppercase relative"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              background: 'linear-gradient(180deg, #ffffff 0%, #e0e7ff 40%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '4px',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
            }}
          >
            Cracked
          </h1>
        </div>

        {/* ROYALE - Gold/Orange with heavy 3D effect */}
        <div className="relative -mt-1">
          {/* Multiple shadow layers for 3D depth */}
          <h1 
            className="text-6xl sm:text-7xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#3d1c02',
              transform: 'translate(8px, 8px)',
              letterSpacing: '3px',
            }}
            aria-hidden="true"
          >
            Royale
          </h1>
          <h1 
            className="text-6xl sm:text-7xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#6b2f04',
              transform: 'translate(6px, 6px)',
              letterSpacing: '3px',
            }}
            aria-hidden="true"
          >
            Royale
          </h1>
          <h1 
            className="text-6xl sm:text-7xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#a04508',
              transform: 'translate(4px, 4px)',
              letterSpacing: '3px',
            }}
            aria-hidden="true"
          >
            Royale
          </h1>
          <h1 
            className="text-6xl sm:text-7xl font-black tracking-wider uppercase absolute"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              color: '#c45c0a',
              transform: 'translate(2px, 2px)',
              letterSpacing: '3px',
            }}
            aria-hidden="true"
          >
            Royale
          </h1>
          <h1 
            className="text-6xl sm:text-7xl font-black tracking-wider uppercase relative"
            style={{
              fontFamily: "'Luckiest Guy', cursive",
              background: 'linear-gradient(180deg, #fffde7 0%, #fff59d 15%, #ffca28 35%, #ff9800 55%, #f57c00 75%, #e65100 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '3px',
              filter: 'drop-shadow(0 0 15px rgba(255,152,0,0.5))',
            }}
          >
            Royale
          </h1>
        </div>

        {/* Shield with crown */}
        <div className="mt-4 w-20 h-24 relative">
          <div 
            className="absolute inset-0 rounded-b-full"
            style={{
              background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)',
              clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)',
              border: '3px solid #fbbf24'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            <Crown className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-64 h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-400 mt-2 text-sm">Loading...</p>
    </div>
  );
}
