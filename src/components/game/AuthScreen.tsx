import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crown, Loader2, User, Swords } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AuthScreenProps {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInAnonymously } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast.error('Please enter a player name');
      return;
    }
    
    if (playerName.trim().length < 3) {
      toast.error('Name must be at least 3 characters');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signInAnonymously(playerName.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Welcome, ${playerName.trim()}!`);
        onSuccess();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a3a5c] via-[#0d2840] to-[#0a1f33] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xl border-4 border-amber-400">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 
          className="text-4xl font-black uppercase"
          style={{
            fontFamily: "'Luckiest Guy', cursive",
            background: 'linear-gradient(180deg, #fff9c4 0%, #ffd54f 25%, #ff8f00 50%, #e65100 75%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Cracked Royale
        </h1>
        <p className="text-cyan-300 mt-2">
          Enter your name to battle online!
        </p>
      </div>

      {/* Simple Name Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Enter your player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 h-12 text-lg"
            maxLength={20}
            autoFocus
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !playerName.trim()}
          className="w-full h-14 text-lg font-bold bg-gradient-to-b from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600 border-b-4 border-green-900 gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Swords className="w-5 h-5" />
              Join Battle!
            </>
          )}
        </Button>
      </form>

      {/* Info text */}
      <p className="mt-8 text-gray-500 text-sm text-center max-w-xs">
        No account needed! Just enter a name and start playing friendly battles with others online.
      </p>
    </div>
  );
}
