/**
 * React Query hooks for Influgal
 * 
 * These hooks use React Query for automatic caching, deduplication, and refetch management
 * Production configuration is in src/lib/queryClient.ts
 */

export { useDashboardData, type DashboardData } from './useDashboardData';
export { useCampaigns, type Campaign } from './useCampaigns';
export { useInfluencers, type Influencer } from './useInfluencers';
export { useBookings, type Booking } from './useBookings';
export { useMessages, type Message } from './useMessages';
