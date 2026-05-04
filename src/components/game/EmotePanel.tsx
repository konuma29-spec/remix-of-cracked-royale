import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface EmotePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEmoteSelect: (emote: string, isText: boolean) => void;
}

// Top 10 most used Clash Royale emotes (represented as emojis)
const EMOTES = [
  { id: 'laugh', emoji: '😂', label: 'Laughing' },
  { id: 'cry', emoji: '😢', label: 'Crying' },
  { id: 'angry', emoji: '😠', label: 'Angry' },
  { id: 'thumbsup', emoji: '👍', label: 'Thumbs Up' },
  { id: 'evil', emoji: '😈', label: 'Evil' },
  { id: 'scream', emoji: '🐷', label: 'Hog Scream' },
  { id: 'yawn', emoji: '😴', label: 'Yawn' },
  { id: 'shock', emoji: '😱', label: 'Shocked' },
  { id: 'love', emoji: '😍', label: 'Love' },
  { id: 'eyeroll', emoji: '🙄', label: 'Eye Roll' },
];

const TEXT_PHRASES = [
  'Good luck!',
  'Well played!',
  'Thanks!',
  'Wow!',
  'Oops',
];

export function EmotePanel({ isOpen, onClose, onEmoteSelect }: EmotePanelProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Emote panel */}
      <div 
        className="relative bg-gradient-to-b from-amber-800/90 to-amber-950/90 backdrop-blur-sm rounded-2xl p-3 border-2 border-amber-600/50 shadow-2xl mx-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center border-2 border-red-400 shadow-lg transition-colors z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Title */}
        <div className="text-center mb-3">
          <h3 className="text-amber-200 font-bold text-sm uppercase tracking-wide">Emotes</h3>
        </div>

        {/* Emote grid - 5x2 */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {EMOTES.map((emote) => (
            <button
              key={emote.id}
              onClick={() => onEmoteSelect(emote.emoji, false)}
              className="aspect-square bg-gradient-to-b from-amber-700/80 to-amber-900/80 hover:from-amber-600 hover:to-amber-800 rounded-xl flex items-center justify-center text-2xl border border-amber-500/40 hover:border-amber-400 transition-all hover:scale-110 active:scale-95 shadow-md"
              title={emote.label}
            >
              {emote.emoji}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-amber-600/40 my-2" />

        {/* Text phrases */}
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PHRASES.map((phrase) => (
            <button
              key={phrase}
              onClick={() => onEmoteSelect(phrase, true)}
              className={cn(
                "px-3 py-2 bg-gradient-to-b from-blue-700/80 to-blue-900/80 hover:from-blue-600 hover:to-blue-800",
                "rounded-lg text-white text-xs font-bold border border-blue-500/40 hover:border-blue-400",
                "transition-all hover:scale-105 active:scale-95 shadow-md",
                phrase.length > 8 ? "col-span-1" : "col-span-1"
              )}
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
