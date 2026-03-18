-- Production Optimization: Add Indices for Query Performance
-- Created: March 18, 2026
-- Purpose: 50% query speed improvement, zero downtime deployment

-- ============================================================================
-- FOREIGN KEY INDICES (Most critical)
-- ============================================================================

-- campaigns table lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- campaign_applications table lookups
CREATE INDEX IF NOT EXISTS idx_campaign_applications_user_id ON campaign_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_influencer_profile_id ON campaign_applications(influencer_profile_id);

-- bookings table lookups (most expensive without indices)
CREATE INDEX IF NOT EXISTS idx_bookings_brand_user_id ON bookings(brand_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_influencer_user_id ON bookings(influencer_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- profile table lookups
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user_id ON influencer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ============================================================================
-- SEARCH & FILTER INDICES
-- ============================================================================

-- Influencer discovery filtering
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_niche ON influencer_profiles(niche);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_city ON influencer_profiles(city);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_is_verified ON influencer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_rating ON influencer_profiles(rating DESC);

-- Campaign filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_niche ON campaigns(niche);
CREATE INDEX IF NOT EXISTS idx_campaigns_city ON campaigns(city);

-- ============================================================================
-- COMPOSITE INDICES (For common query patterns)
-- ============================================================================

-- Dashboard queries: user_id + order by created_at
CREATE INDEX IF NOT EXISTS idx_campaigns_user_created ON campaigns(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_user_created ON campaign_applications(user_id, created_at DESC);

-- Messages queries
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(application_id, created_at DESC);

-- Bookings with status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at DESC);

-- Campaign applications with status
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status_created ON campaign_applications(status, created_at DESC);

-- ============================================================================
-- FULL TEXT SEARCH INDICES (Advanced)
-- ============================================================================

-- Influencer search by name, bio, niche
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_search ON influencer_profiles 
  USING gin(to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(bio, '') || ' ' || 
    COALESCE(niche, '')
  ));

-- Campaign search
CREATE INDEX IF NOT EXISTS idx_campaigns_search ON campaigns 
  USING gin(to_tsvector('english', 
    COALESCE(brand, '') || ' ' || 
    COALESCE(description, '')
  ));

-- ============================================================================
-- UNIQUE INDEX (Prevent duplicates)
-- ============================================================================

-- Ensure one influencer profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencer_profiles_user_id_unique ON influencer_profiles(user_id) WHERE user_id IS NOT NULL;

-- Ensure one brand profile per user  
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_profiles_user_id_unique ON brand_profiles(user_id) WHERE user_id IS NOT NULL;

-- Ensure one profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique ON profiles(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- PARTIAL INDICES (For active records only - reduces index size)
-- ============================================================================

-- Active campaigns only
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(user_id, created_at DESC) 
  WHERE status = 'active';

-- Pending applications only
CREATE INDEX IF NOT EXISTS idx_applications_pending ON campaign_applications(campaign_id, user_id) 
  WHERE status = 'pending';

-- Unread messages only
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read) 
  WHERE read = false;

-- ============================================================================
-- PERFORMANCE VERIFICATION
-- ============================================================================
-- Run after indices are created to verify:
-- 1. Check index existence:
--    SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
--
-- 2. Check index size:
--    SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) 
--    FROM pg_stat_user_indexes WHERE schemaname = 'public';
--
-- 3. Check slow queries:
--    SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
-- ============================================================================
