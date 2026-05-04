import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Loader2 } from 'lucide-react';

const BADGE_EMOJIS = ['⚔️', '🛡️', '👑', '🔥', '💀', '🐉', '⚡', '🌟', '💎', '🏰', '🦁', '🦅', '🐺', '🎯', '💪'];

interface CreateClanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, badgeEmoji: string, minTrophies: number, isOpen: boolean) => Promise<{ success: boolean; error?: string }>;
}

export function CreateClanModal({ isOpen, onClose, onCreate }: CreateClanModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badgeEmoji, setBadgeEmoji] = useState('⚔️');
  const [minTrophies, setMinTrophies] = useState(0);
  const [isOpenClan, setIsOpenClan] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Clan name is required');
      return;
    }
    if (name.length < 3) {
      setError('Clan name must be at least 3 characters');
      return;
    }
    if (name.length > 20) {
      setError('Clan name must be 20 characters or less');
      return;
    }

    setCreating(true);
    setError('');

    const result = await onCreate(name.trim(), description.trim(), badgeEmoji, minTrophies, isOpenClan);
    
    if (result.success) {
      onClose();
      setName('');
      setDescription('');
      setBadgeEmoji('⚔️');
      setMinTrophies(0);
      setIsOpenClan(true);
    } else {
      setError(result.error || 'Failed to create clan');
    }

    setCreating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#1a3a5c] to-[#0d2840] border-cyan-600/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cyan-300 flex items-center gap-2">
            🏰 Create Clan
          </DialogTitle>
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Clan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Clan Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter clan name..."
              maxLength={20}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your clan..."
              maxLength={100}
              rows={2}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Badge Emoji */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Clan Badge</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setBadgeEmoji(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    badgeEmoji === emoji
                      ? 'bg-cyan-600 scale-110 ring-2 ring-cyan-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Min Trophies */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Minimum Trophies: {minTrophies}
            </label>
            <input
              type="range"
              min={0}
              max={5000}
              step={100}
              value={minTrophies}
              onChange={(e) => setMinTrophies(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Open/Closed */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isOpenClan}
                onChange={(e) => setIsOpenClan(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
            <span className="text-sm text-gray-300">
              {isOpenClan ? 'Open - Anyone can join' : 'Invite Only'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="w-full h-12 text-lg font-bold bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 border-b-4 border-green-900 disabled:opacity-50"
          >
            {creating ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating...</>
            ) : (
              'Create Clan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
