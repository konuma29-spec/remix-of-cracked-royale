import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 350);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        backgroundImage: "url('/loading-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay at bottom for bar readability */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          paddingTop: "60px",
          paddingBottom: "28px",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        {/* Percentage */}
        <div className="flex justify-end mb-1 pr-1">
          <span
            className="text-sm font-bold text-yellow-400 tabular-nums"
            style={{ letterSpacing: "1px" }}
          >
            {progress}%
          </span>
        </div>

        {/* Bar track */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{
            height: "18px",
            background: "rgba(0,0,0,0.5)",
            border: "2px solid rgba(251,191,36,0.5)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-75 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 55%, #fef08a 70%, #fbbf24 85%, #d97706 100%)",
              boxShadow:
                progress > 3 ? "0 0 12px 2px rgba(251,191,36,0.7)" : "none",
            }}
          />
        </div>

        <p className="text-center text-white/60 text-xs font-semibold tracking-widest uppercase mt-2">
          Loading...
        </p>
      </div>
    </div>
  );
}
