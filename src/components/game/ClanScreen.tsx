import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Crown, Shield, MessageSquare, Send, Trophy, Wifi, WifiOff, Loader2, Plus, LogOut, Search, UserMinus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@supabase/supabase-js';
import { OnlinePlayer } from '@/hooks/useOnlinePresence';
import { BattleRequest } from '@/hooks/useBattleRequests';
import { OnlinePlayersPanel } from './OnlinePlayersPanel';
import { useChat } from '@/hooks/useChat';
import { useClan, Clan, ClanMember } from '@/hooks/useClan';
import { CreateClanModal } from './CreateClanModal';
import { toast } from 'sonner';

interface ClanScreenProps {
  playerName: string;
  trophies: number;
  onBack: () => void;
  // Multiplayer props
  user: User | null;
  onlinePlayers: OnlinePlayer[];
  incomingRequests: BattleRequest[];
  outgoingRequests: BattleRequest[];
  onSendRequest: (userId: string, playerName: string) => Promise<boolean>;
  onAcceptRequest: (requestId: string) => Promise<boolean>;
  onDeclineRequest: (requestId: string) => Promise<boolean>;
  onCancelRequest: (requestId: string) => Promise<boolean>;
  onSignOut: () => void;
  onSignIn: () => void;
}

type Tab = 'online' | 'clan' | 'search';

const ROLE_ORDER = { leader: 0, 'co-leader': 1, elder: 2, member: 3 };
const ROLE_COLORS: Record<string, string> = {
  leader: 'text-yellow-400',
  'co-leader': 'text-purple-400',
  elder: 'text-blue-400',
  member: 'text-gray-400'
};
const ROLE_ICONS: Record<string, string> = {
  leader: '👑',
  'co-leader': '⚔️',
  elder: '🛡️',
  member: ''
};

export function ClanScreen({ 
  playerName, 
  trophies, 
  onBack,
  user,
  onlinePlayers,
  incomingRequests,
  outgoingRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onSignOut,
  onSignIn
}: ClanScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('online');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Global chat (for users not in a clan)
  const { messages: globalMessages, loading: globalChatLoading, sendMessage: sendGlobalMessage } = useChat(user);
  
  // Clan system
  const {
    userClan,
    userMembership,
    clanMembers,
    clanMessages,
    availableClans,
    loading: clanLoading,
    messagesLoading,
    createClan,
    joinClan,
    leaveClan,
    deleteClan,
    deleteAllClans,
    kickMember,
    promoteMember,
    sendMessage: sendClanMessage,
    refreshClans
  } = useClan(user, playerName, trophies);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clanMessages, globalMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !user) return;
    
    setSending(true);
    const success = userClan 
      ? await sendClanMessage(newMessage)
      : await sendGlobalMessage(newMessage, playerName);
    
    if (success) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleJoinClan = async (clanId: string) => {
    const result = await joinClan(clanId);
    if (result.success) {
      toast.success('Joined clan successfully!');
      setActiveTab('clan');
    } else {
      toast.error(result.error || 'Failed to join clan');
    }
  };

  const handleLeaveClan = async () => {
    const result = await leaveClan();
    if (result.success) {
      toast.success('Left clan');
      setActiveTab('search');
    } else {
      toast.error(result.error || 'Failed to leave clan');
    }
  };

  const handleDeleteClan = async () => {
    if (!confirm('Are you sure you want to delete this clan? This action cannot be undone.')) return;
    const result = await deleteClan();
    if (result.success) {
      toast.success('Clan deleted');
      setActiveTab('search');
    } else {
      toast.error(result.error || 'Failed to delete clan');
    }
  };

  const handleDeleteAllClans = async () => {
    if (!confirm('DELETE ALL CLANS? This will remove every clan and all members. This cannot be undone!')) return;
    const result = await deleteAllClans();
    if (result.success) {
      toast.success('All clans deleted');
      refreshClans();
    } else {
      toast.error(result.error || 'Failed to delete clans');
    }
  };

  const handleKickMember = async (member: ClanMember) => {
    if (!confirm(`Kick ${member.player_name} from the clan?`)) return;
    const result = await kickMember(member.id);
    if (result.success) {
      toast.success(`${member.player_name} was removed from the clan`);
    } else {
      toast.error(result.error || 'Failed to kick member');
    }
  };

  const sortedMembers = [...clanMembers].sort((a, b) => 
    ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
  );

  const filteredClans = availableClans.filter(clan =>
    clan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messages = userClan ? clanMessages : globalMessages;
  const chatLoading = userClan ? messagesLoading : globalChatLoading;

  // Determine which tabs to show based on clan status
  const tabs: Tab[] = userClan ? ['online', 'clan'] : ['online', 'search'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a3a5c] via-[#0d2840] to-[#0a1f33] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d1b2a] to-[#152238] px-3 py-2 border-b border-cyan-900/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-xl">
            {userClan ? userClan.badge_emoji : <Shield className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {userClan ? userClan.name : 'Social'}
            </h1>
            <div className="flex items-center gap-2 text-xs">
              {user ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Online</span>
                  {userClan && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{userClan.member_count} members</span>
                    </>
                  )}
                  <span className="text-gray-500">•</span>
                  <button 
                    onClick={onSignOut}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-500">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all capitalize relative",
                activeTab === tab
                  ? "bg-cyan-600/40 text-cyan-300 border border-cyan-500/50"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab === 'online' && <Wifi className="w-4 h-4 inline mr-1" />}
              {tab === 'clan' && <MessageSquare className="w-4 h-4 inline mr-1" />}
              {tab === 'search' && <Search className="w-4 h-4 inline mr-1" />}
              {tab === 'online' ? 'Players' : tab === 'search' ? 'Find Clan' : 'Clan Chat'}
              {tab === 'online' && incomingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-bounce">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Online Players Tab */}
        {activeTab === 'online' && (
          <div className="flex-1 overflow-y-auto p-3">
            {user ? (
              <OnlinePlayersPanel
                onlinePlayers={onlinePlayers}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                onSendRequest={onSendRequest}
                onAcceptRequest={onAcceptRequest}
                onDeclineRequest={onDeclineRequest}
                onCancelRequest={onCancelRequest}
              />
            ) : (
              <div className="text-center py-8 px-4">
                <WifiOff className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-white text-xl font-bold mb-3">Sign in to play with friends!</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                  Create an account to see online players and join clans!
                </p>
                <Button
                  onClick={onSignIn}
                  className="w-full max-w-xs mx-auto h-12 text-lg font-bold bg-gradient-to-b from-green-500 via-green-600 to-green-700"
                >
                  Sign In / Create Account
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Clan Chat Tab (only when in a clan) */}
        {activeTab === 'clan' && userClan && (
          <>
            {/* Clan Info Header */}
            <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{clanMembers.length} members</span>
              </div>
              <div className="flex gap-2">
                {userMembership?.role === 'leader' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClan}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Clan
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveClan}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Leave
                </Button>
              </div>
            </div>

            {/* Members List (collapsible) */}
            <details className="bg-gray-800/30 border-b border-gray-700/30">
              <summary className="px-3 py-2 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300">
                👥 View Members
              </summary>
              <div className="px-3 pb-2 space-y-1 max-h-40 overflow-y-auto">
                {sortedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 text-sm py-1">
                    <span>{ROLE_ICONS[member.role]}</span>
                    <span className={ROLE_COLORS[member.role]}>{member.player_name}</span>
                    {member.user_id === user?.id && <span className="text-gray-500">(you)</span>}
                    {userMembership && 
                     ['leader', 'co-leader'].includes(userMembership.role) && 
                     member.user_id !== user?.id &&
                     member.role !== 'leader' && (
                      <button
                        onClick={() => handleKickMember(member)}
                        className="ml-auto text-red-400 hover:text-red-300"
                        title="Kick member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </details>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-2",
                      msg.user_id === user?.id 
                        ? "bg-cyan-900/30 border border-cyan-600/30" 
                        : "bg-gray-800/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "font-semibold text-sm",
                        msg.user_id === user?.id ? "text-cyan-300" : "text-cyan-400"
                      )}>
                        {msg.player_name}
                        {msg.user_id === user?.id && " (you)"}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-white text-sm">{msg.message}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 bg-[#0a1525] border-t border-cyan-900/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={sending}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 disabled:opacity-50"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={sending || !newMessage.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Search/Join Clan Tab (only when not in a clan) */}
        {activeTab === 'search' && !userClan && (
          <div className="flex-1 overflow-y-auto p-3">
            {!user ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">Sign in to create or join clans!</p>
                <Button onClick={onSignIn} className="mt-4 bg-green-600 hover:bg-green-500">
                  Sign In
                </Button>
              </div>
            ) : clanLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                {/* Create Clan Button */}
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full mb-4 h-12 text-lg font-bold bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 border-b-4 border-purple-900"
                >
                  <Plus className="w-5 h-5 mr-2" /> Create New Clan
                </Button>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search clans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500"
                  />
                </div>

                {/* Available Clans */}
                <div className="space-y-2">
                  {filteredClans.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? 'No clans found' : 'No clans available. Create one!'}
                    </p>
                  ) : (
                    filteredClans.map((clan) => (
                      <div 
                        key={clan.id}
                        className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl">
                          {clan.badge_emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{clan.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span><Users className="w-3 h-3 inline" /> {clan.member_count}</span>
                            <span>•</span>
                            <span><Trophy className="w-3 h-3 inline" /> {clan.min_trophies}+</span>
                          </div>
                          {clan.description && (
                            <p className="text-gray-500 text-xs truncate mt-1">{clan.description}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleJoinClan(clan.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-500"
                        >
                          Join
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Clan Modal */}
      <CreateClanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createClan}
      />
    </div>
  );
}
