import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
  body: string;
  created_at: string;
  is_read: boolean;
}

interface UseMessagesOptions {
  conversationId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  useRealtime?: boolean;
}

/**
 * Hook to fetch messages with realtime subscriptions
 * 
 * Falls back to polling if realtime is unavailable
 * 
 * @param options - Query options (conversationId, userId, limit, offset, useRealtime)
 * @returns Query object with messages data
 */
export const useMessages = (
  options: UseMessagesOptions = { limit: 50, offset: 0, useRealtime: true },
  queryOptions?: Partial<UseQueryOptions<Message[], Error>>
) => {
  const { conversationId, userId, limit = 50, offset = 0, useRealtime = true } = options;
  const subscriptionRef = useRef<any>(null);

  const query = useQuery<Message[], Error>({
    queryKey: ['messages', { conversationId, userId, limit, offset }],
    queryFn: async () => {
      if (!conversationId || !userId) {
        throw new Error('conversationId and userId are required');
      }

      const { data, error } = await supabase
        .from('messages' as any)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message || 'Failed to fetch messages');
      }

      return ((data || []) as any[]).reverse() as Message[];
    },
    enabled: !!conversationId && !!userId,
    refetchInterval: useRealtime ? undefined : 5000, // Poll every 5s if realtime disabled
    ...queryOptions,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!useRealtime || !conversationId || !userId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Refetch on new message
          query.refetch();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, useRealtime, query]);

  return query;
};
