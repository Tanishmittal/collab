import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Booking {
  id: string;
  brand_user_id: string;
  influencer_user_id: string;
  influencer_profile_id: string;
  items: Array<{ type: string; price: number; qty: number }>;
  notes: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface UseBookingsOptions {
  userId?: string;
  limit?: number;
  offset?: number;
  status?: string;
}

/**
 * Hook to fetch bookings with pagination and filtering
 * 
 * @param options - Query options (userId, limit, offset, status)
 * @returns Query object with bookings data
 */
export const useBookings = (
  options: UseBookingsOptions = { limit: 20, offset: 0 },
  queryOptions?: Partial<UseQueryOptions<Booking[], Error>>
) => {
  const { userId, limit = 20, offset = 0, status } = options;

  return useQuery<Booking[], Error>({
    queryKey: ['bookings', { userId, limit, offset, status }],
    queryFn: async () => {
      if (!userId) {
        throw new Error('userId is required');
      }

      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' });

      // Get bookings where user is either brand or influencer
      query = query.or(`brand_user_id.eq.${userId},influencer_user_id.eq.${userId}`);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      return (data || []) as any as Booking[];
    },
    enabled: !!userId,
    ...queryOptions,
  });
};
