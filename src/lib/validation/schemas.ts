import { z } from 'zod';

/**
 * Input validation schemas using Zod
 * These schemas validate all form inputs before sending to database
 */

// ============ Campaign Schemas ============

export const createCampaignSchema = z.object({
  brand: z.string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(100, 'Brand name must be less than 100 characters'),
  
  brand_logo: z.string()
    .max(5, 'Logo emoji must be single character')
    .optional(),
  
  city: z.string()
    .min(2, 'City must be selected')
    .max(50, 'City name too long'),
  
  budget: z.number()
    .positive('Budget must be greater than 0')
    .min(1000, 'Minimum budget is ₹1,000')
    .max(10000000, 'Maximum budget is ₹10,000,000'),
  
  influencers_needed: z.number()
    .int('Must be whole number')
    .min(1, 'Need at least 1 influencer')
    .max(100, 'Maximum 100 influencers per campaign'),
  
  niche: z.string()
    .min(2, 'Select a niche')
    .max(50, 'Niche name too long'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  deliverables: z.array(z.string())
    .min(1, 'Select at least 1 deliverable')
    .max(10, 'Maximum 10 deliverables'),
  
  status: z.enum(['active', 'paused', 'closed']).default('active'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

// ============ Influencer Profile Schemas ============

export const createInfluencerProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  
  city: z.string()
    .min(2, 'City must be selected')
    .max(50, 'City name too long'),
  
  niche: z.string()
    .min(2, 'Niche must be selected')
    .max(50, 'Niche too long'),
  
  followers: z.string()
    .regex(/^\d+\.?\d*[KM]?$/, 'Enter followers in format: 100K, 1.5M, etc'),
  
  engagement_rate: z.string()
    .regex(/^\d+\.?\d*%?$/, 'Enter percentage (e.g., 4.5 or 4.5%)')
    .transform(val => parseFloat(val.replace('%', '')))
    .refine(val => val >= 0 && val <= 100, 'Engagement rate must be 0-100%'),
  
  bio: z.string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio must be less than 500 characters'),
  
  hourly_rate: z.number()
    .positive('Rate must be greater than 0')
    .min(100, 'Minimum hourly rate is ₹100')
    .max(100000, 'Maximum hourly rate is ₹100,000'),
  
  platforms: z.array(z.string()).optional(),
  
  price_reel: z.number().positive().optional(),
  price_story: z.number().positive().optional(),
  price_visit: z.number().positive().optional(),
  
  avatar_url: z.string().url('Invalid image URL').optional(),
  cover_url: z.string().url('Invalid image URL').optional(),
});

export type CreateInfluencerProfileInput = z.infer<typeof createInfluencerProfileSchema>;

// ============ Brand Profile Schemas ============

export const createBrandProfileSchema = z.object({
  business_name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name too long'),

  business_type: z.string()
    .min(2, 'Business type is required')
    .max(100, 'Business type too long'),

  city: z.string()
    .min(2, 'City is required')
    .max(50, 'City name too long'),

  brand_tagline: z.string()
    .max(120, 'Tagline too long')
    .optional(),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),

  target_niches: z.array(z.string())
    .min(1, 'Select at least one target niche')
    .max(20, 'Too many niches selected'),

  target_cities: z.array(z.string())
    .min(1, 'Select at least one target city')
    .max(30, 'Too many cities selected'),

  deliverable_preferences: z.array(z.string())
    .max(20, 'Too many deliverable preferences selected')
    .optional(),

  campaign_goals: z.array(z.string())
    .max(20, 'Too many campaign goals selected')
    .optional(),

  creator_requirements: z.string()
    .max(1000, 'Creator requirements too long')
    .optional(),

  campaigns_per_month: z.number()
    .int('Must be a whole number')
    .min(0, 'Must be 0 or more')
    .max(100, 'Too many campaigns per month')
    .optional(),

  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),

  logo_url: z.string()
    .url('Invalid logo URL')
    .optional()
    .or(z.literal('')),

  response_time_expectation: z.string()
    .max(60, 'Response time text too long')
    .optional(),

  contact_name: z.string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name too long'),

  email: z.string()
    .email('Invalid email'),

  phone: z.string()
    .max(20, 'Phone number too long')
    .optional(),
});

export type CreateBrandProfileInput = z.infer<typeof createBrandProfileSchema>;

// ============ Message Schemas ============

export const sendMessageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long'),
  
  receiver_id: z.string().uuid('Invalid receiver ID'),
  
  sender_id: z.string().uuid('Invalid sender ID'),
  
  conversation_id: z.string()
    .min(1, 'Conversation ID required'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ============ Application Schemas ============

export const applyCampaignSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID'),
  
  influencer_profile_id: z.string().uuid('Invalid influencer ID'),
  
  message: z.string()
    .min(10, 'Cover message must be at least 10 characters')
    .max(500, 'Cover message must be less than 500 characters'),
});

export type ApplyCampaignInput = z.infer<typeof applyCampaignSchema>;

// ============ Booking Schemas ============

export const createBookingSchema = z.object({
  influencer_profile_id: z.string().uuid('Invalid influencer ID'),
  
  influencer_user_id: z.string().uuid('Invalid influencer user ID'),
  
  items: z.array(z.object({
    type: z.string().min(1, 'Item type required'),
    price: z.number().positive('Price must be positive'),
    qty: z.number().int().positive('Quantity must be at least 1'),
  }))
    .min(1, 'At least one item required'),
  
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  
  total_amount: z.number()
    .positive('Total must be greater than 0')
    .min(100, 'Minimum booking amount is ₹100')
    .max(10000000, 'Maximum booking amount is ₹10,000,000'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ============ Review Schemas ============

export const createReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be whole number')
    .min(1, 'Minimum rating is 1')
    .max(5, 'Maximum rating is 5'),
  
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must be less than 500 characters')
    .optional(),
  
  booking_id: z.string().uuid('Invalid booking ID'),
  
  reviewer_id: z.string().uuid('Invalid reviewer ID'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ============ All Schemas Export ============

export const validationSchemas = {
  createCampaign: createCampaignSchema,
  createInfluencerProfile: createInfluencerProfileSchema,
  createBrandProfile: createBrandProfileSchema,
  sendMessage: sendMessageSchema,
  applyCampaign: applyCampaignSchema,
  createBooking: createBookingSchema,
  createReview: createReviewSchema,
};
