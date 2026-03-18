import { QueryClient } from '@tanstack/react-query';

/**
 * Configure React Query for production
 * 
 * staleTime: 5 minutes - Cache is fresh for 5 min
 * cacheTime: 10 minutes - Keep cache in memory for 10 min
 * retry: 2 - Retry failed requests 2 times
 * retryDelay: Exponential backoff (1s, 2s, 4s, etc.)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      cacheTime: 10 * 60 * 1000,       // 10 minutes
      refetchOnWindowFocus: false,      // Don't refetch on window focus
      refetchOnReconnect: false,        // Don't refetch on tab/network resume
      retry: 2,                         // Retry 2 times on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
