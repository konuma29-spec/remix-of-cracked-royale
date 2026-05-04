import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  user_id: string;
  player_name: string;
  message: string;
  created_at: string;
}

export function useChat(user: User | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial messages
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendMessage = useCallback(
    async (message: string, playerName: string) => {
      if (!user || !message.trim()) return false;

      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        player_name: playerName,
        message: message.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
        return false;
      }

      return true;
    },
    [user]
  );

  return {
    messages,
    loading,
    sendMessage,
  };
}
