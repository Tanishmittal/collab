import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Influencer {
  id: string;
  user_id: string;
  name: string;
  city: string;
  niche: string;
  followers: string;
  engagement_rate: string | null;
  rating: number | null;
  avatar_url: string | null;
  bio: string | null;
  hourly_rate: number | null;
}

interface UseInfluencersOptions {
  limit?: number;
  offset?: number;
  niche?: string;
  city?: string;
  minRating?: number;
  searchQuery?: string;
}

/**
 * Hook to fetch influencers with filtering and pagination
 * 
 * @param options - Query options (limit, offset, filters)
 * @returns Query object with influencers data
 */
export const useInfluencers = (
  options: UseInfluencersOptions = { limit: 20, offset: 0 },
  queryOptions?: Partial<UseQueryOptions<Influencer[], Error>>
) => {
  const { limit = 20, offset = 0, niche, city, minRating, searchQuery } = options;

  return useQuery<Influencer[], Error>({
    queryKey: ['influencers', { limit, offset, niche, city, minRating, searchQuery }],
    queryFn: async () => {
      let query = supabase
        .from('influencer_profiles')
        .select('*', { count: 'exact' });

      if (niche) {
        query = query.eq('niche', niche);
      }

      if (city) {
        query = query.eq('city', city);
      }

      if (minRating) {
        query = query.gte('rating', minRating);
      }

      if (searchQuery) {
        // Use full-text search on name and bio
        query = query.or(
          `name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query
        .order('rating', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message || 'Failed to fetch influencers');
      }

      return (data || []) as any as Influencer[];
    },
    ...queryOptions,
  });
};
