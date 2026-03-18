export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          application_id: string | null
          brand_user_id: string
          campaign_id: string | null
          created_at: string
          id: string
          influencer_profile_id: string
          influencer_user_id: string
          items: Json
          notes: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          brand_user_id: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          influencer_profile_id: string
          influencer_user_id: string
          items?: Json
          notes?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          brand_user_id?: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          influencer_profile_id?: string
          influencer_user_id?: string
          items?: Json
          notes?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "campaign_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_influencer_profile_id_fkey"
            columns: ["influencer_profile_id"]
            isOneToOne: false
            referencedRelation: "influencer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          brand_tagline: string | null
          business_name: string
          business_type: string
          campaigns_per_month: number | null
          campaign_goals: string[]
          city: string
          contact_name: string
          created_at: string
          creator_requirements: string | null
          deliverable_preferences: string[]
          description: string | null
          email: string
          id: string
          industry: string | null
          is_verified: boolean
          logo_url: string | null
          monthly_budget: string | null
          phone: string | null
          response_time_expectation: string | null
          target_cities: string[]
          target_niches: string[]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          brand_tagline?: string | null
          business_name: string
          business_type: string
          campaigns_per_month?: number | null
          campaign_goals?: string[]
          city: string
          contact_name: string
          created_at?: string
          creator_requirements?: string | null
          deliverable_preferences?: string[]
          description?: string | null
          email: string
          id?: string
          industry?: string | null
          is_verified?: boolean
          logo_url?: string | null
          monthly_budget?: string | null
          phone?: string | null
          response_time_expectation?: string | null
          target_cities?: string[]
          target_niches?: string[]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          brand_tagline?: string | null
          business_name?: string
          business_type?: string
          campaigns_per_month?: number | null
          campaign_goals?: string[]
          city?: string
          contact_name?: string
          created_at?: string
          creator_requirements?: string | null
          deliverable_preferences?: string[]
          description?: string | null
          email?: string
          id?: string
          industry?: string | null
          is_verified?: boolean
          logo_url?: string | null
          monthly_budget?: string | null
          phone?: string | null
          response_time_expectation?: string | null
          target_cities?: string[]
          target_niches?: string[]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      campaign_applications: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          influencer_profile_id: string
          message: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          influencer_profile_id: string
          message?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          influencer_profile_id?: string
          message?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_applications_influencer_profile_id_fkey"
            columns: ["influencer_profile_id"]
            isOneToOne: false
            referencedRelation: "influencer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand: string
          brand_logo: string
          budget: number
          city: string
          created_at: string
          deliverables: string[]
          description: string
          expires_at: string | null
          id: string
          influencers_applied: number
          influencers_needed: number
          niche: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand: string
          brand_logo?: string
          budget?: number
          city: string
          created_at?: string
          deliverables?: string[]
          description?: string
          expires_at?: string | null
          id?: string
          influencers_applied?: number
          influencers_needed?: number
          niche: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          brand_logo?: string
          budget?: number
          city?: string
          created_at?: string
          deliverables?: string[]
          description?: string
          expires_at?: string | null
          id?: string
          influencers_applied?: number
          influencers_needed?: number
          niche?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencer_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string
          completed_campaigns: number | null
          cover_url: string | null
          created_at: string
          engagement_rate: string | null
          followers: string
          id: string
          instagram_url: string | null
          is_verified: boolean
          name: string
          niche: string
          platforms: string[]
          price_reel: number
          price_story: number
          price_visit: number
          rating: number | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          verification_code: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city: string
          completed_campaigns?: number | null
          cover_url?: string | null
          created_at?: string
          engagement_rate?: string | null
          followers: string
          id?: string
          instagram_url?: string | null
          is_verified?: boolean
          name: string
          niche: string
          platforms?: string[]
          price_reel?: number
          price_story?: number
          price_visit?: number
          rating?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          verification_code?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string
          completed_campaigns?: number | null
          cover_url?: string | null
          created_at?: string
          engagement_rate?: string | null
          followers?: string
          id?: string
          instagram_url?: string | null
          is_verified?: boolean
          name?: string
          niche?: string
          platforms?: string[]
          price_reel?: number
          price_story?: number
          price_visit?: number
          rating?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: string
          campaign_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          application_id: string
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          application_id?: string
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "campaign_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          campaign_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          reviewer_type: string
        }
        Insert: {
          campaign_id: string
          comment?: string
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          reviewer_type: string
        }
        Update: {
          campaign_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          reviewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
