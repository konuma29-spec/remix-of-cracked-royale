import { useState, useEffect, Component, ReactNode } from 'react';
import { GameScreen } from '@/components/game/GameScreen';

// Error boundary to catch React internal errors (like HMR issues)
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GameErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GameScreen error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            A temporary error occurred. This usually happens during development hot reloads.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Reload Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Index = () => {
  // Force remount key to recover from HMR issues
  const [mountKey, setMountKey] = useState(0);

  return (
    <GameErrorBoundary onReset={() => setMountKey(k => k + 1)}>
      <GameScreen key={mountKey} />
    </GameErrorBoundary>
  );
};

export default Index;
