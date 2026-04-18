import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  Star,
  Instagram,
  Youtube,
  Twitter,
  Play,
  Image,
  Film,
  Video,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  Building2,
  Target,
  Briefcase,
  Users,
  UserCircle2,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFollowers } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ReviewList from "@/components/ReviewList";
import type { Database } from "@/integrations/supabase/types";

// --- Database Type Definitions ---
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type InfluencerProfileRow = Database["public"]["Tables"]["influencer_profiles"]["Row"] & {
  // Extended fields for social stats stored in the database
  ig_followers?: number | null;
  yt_subscribers?: number | null;
  twitter_followers?: number | null;
  ig_engagement?: number | null;
  yt_engagement?: number | null;
  twitter_engagement?: number | null;
  total_followers_count?: number | null;
  total_verified_followers_count?: number | null;
};
type BrandProfileRow = Database["public"]["Tables"]["brand_profiles"]["Row"];
type PortfolioItemRow = Database["public"]["Tables"]["portfolio_items"]["Row"];

type ReviewSummary = {
  average: string;
  count: number;
  distribution: Array<{ star: number; count: number; pct: number }>;
};

type CollaborationItem = Pick<CampaignRow, "id" | "brand" | "description" | "niche" | "city" | "budget" | "deliverables" | "status">;

const emptyReviewSummary: ReviewSummary = {
  average: "0.0",
  count: 0,
  distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, pct: 0 })),
};



// --- Utility Functions ---

/**
 * Summarizes an array of reviews into metrics like average rating and star distribution.
 */
const createReviewSummary = (reviews: ReviewRow[]): ReviewSummary => {
  if (reviews.length === 0) return emptyReviewSummary;

  const average = (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    return {
      star,
      count,
      pct: (count / reviews.length) * 100,
    };
  });

  return { average, count: reviews.length, distribution };
};

/**
 * Returns the corresponding Lucide icon for a social media platform.
 */
const platformIcon = (platform: string, size = 16) => {
  if (platform === "Instagram") return <Instagram size={size} />;
  if (platform === "YouTube") return <Youtube size={size} />;
  if (platform === "Twitter") return <Twitter size={size} />;
  return null;
};

const contentTypeIcon = (type: string) => {
  switch (type) {
    case "reel":
      return <Film size={14} />;
    case "story":
      return <Play size={14} />;
    case "post":
      return <Image size={14} />;
    case "video":
      return <Video size={14} />;
    default:
      return <Film size={14} />;
  }
};

const isGeneratedPortfolioTitle = (item: PortfolioItemRow) => {
  if (!item.description) return false;

  const normalizedTitle = item.title.trim().replace(/\.\.\.$/, "").toLowerCase();
  const normalizedDescription = item.description.trim().toLowerCase();

  return (
    normalizedTitle === normalizedDescription ||
    normalizedDescription.startsWith(normalizedTitle)
  );
};

/**
 * UnifiedProfile is the main parent component that handles data fetching 
 * for both Influencer and Brand profiles. 
 * It dynamically switches between views based on the URL and user data.
 */
const UnifiedProfile = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // --- State Hooks ---
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("influencer"); // Current view mode: "influencer" or "brand"
  const [influencer, setInfluencer] = useState<InfluencerProfileRow | null>(null);
  const [brand, setBrand] = useState<BrandProfileRow | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [isOwner, setIsOwner] = useState(false); // Whether the current logged-in user owns this profile
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>(emptyReviewSummary);
  const [collaborations, setCollaborations] = useState<CollaborationItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemRow[]>([]);

  // Navigation and routing helpers
  const isInfluencerRoute = location.pathname.includes("/influencer/");
  const isBrandRoute = location.pathname.includes("/brand/");
  const requestedTab = searchParams.get("tab");
  const profileBackTo = `${location.pathname}${location.search}`;

  /**
   * Main data fetching orchestration. 
   * Fetches profile details, reviews, campaigns, and portfolio items in parallel.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!id || id === "undefined") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let targetUserId: string | null = null;

        let resolvedTab: "influencer" | "brand" = "influencer";

        if (requestedTab === "brand") {
          resolvedTab = "brand";
        } else if (requestedTab === "influencer") {
          resolvedTab = "influencer";
        } else if (isBrandRoute) {
          resolvedTab = "brand";
        }

        if (isInfluencerRoute) {
          const { data } = await supabase
            .from("influencer_profiles")
            .select("user_id")
            .eq("id", id!)
            .maybeSingle();
          targetUserId = data?.user_id || null;
        } else if (isBrandRoute) {
          const { data } = await supabase
            .from("brand_profiles")
            .select("user_id")
            .eq("id", id!)
            .maybeSingle();
          targetUserId = data?.user_id || null;
        }

        setActiveTab(resolvedTab);

        if (!targetUserId) {
          setLoading(false);
          return;
        }

        setIsOwner(user?.id === targetUserId);

        const [infRes, brandRes, campRes] = await Promise.all([
          supabase.from("influencer_profiles").select("*").eq("user_id", targetUserId).maybeSingle(),
          supabase.from("brand_profiles").select("*").eq("user_id", targetUserId).maybeSingle(),
          supabase.from("campaigns").select("*").eq("user_id", targetUserId).eq("status", "active"),
        ]);

        setInfluencer(infRes.data);
        setBrand(brandRes.data);
        setReviewSummary(emptyReviewSummary);
        setCollaborations([]);
        setPortfolioItems([]);

        const nextCampaigns = campRes.data || [];
        if (nextCampaigns.length > 0) {
          const { data: applicationRows } = await supabase
            .from("campaign_applications")
            .select("campaign_id")
            .in("campaign_id", nextCampaigns.map((campaign) => campaign.id));

          const applicationCounts = new Map<string, number>();
          (applicationRows || []).forEach((application) => {
            const nextCount = (applicationCounts.get(application.campaign_id) || 0) + 1;
            applicationCounts.set(application.campaign_id, nextCount);
          });

          setCampaigns(
            nextCampaigns.map((campaign) => ({
              ...campaign,
              influencers_applied: applicationCounts.get(campaign.id) || 0,
            }))
          );
        } else {
          setCampaigns([]);
        }

        if (infRes.data) {
          // Fetch secondary data for the influencer: reviews, bookings, and portfolio
          const [reviewsRes, bookingsRes, portfolioRes] = await Promise.all([
            supabase.from("reviews").select("*").eq("reviewee_id", infRes.data.user_id).order("created_at", { ascending: false }),
            supabase
              .from("bookings")
              .select("*")
              .eq("influencer_profile_id", infRes.data.id)
              .order("created_at", { ascending: false })
              .limit(12),
            supabase
              .from("portfolio_items")
              .select("*")
              .eq("influencer_profile_id", infRes.data.id)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: false }),
          ]);

          const reviewRows = (reviewsRes.data || []) as ReviewRow[];
          const bookingRows = (bookingsRes.data || []) as BookingRow[];
          const portfolioRows = (portfolioRes.data || []) as PortfolioItemRow[];
          setReviewSummary(createReviewSummary(reviewRows));
          setPortfolioItems(portfolioRows);

          // Find all unique campaign IDs from reviews and bookings to build the collaboration history
          const campaignIds = Array.from(
            new Set(
              [
                ...reviewRows.map((review) => review.campaign_id),
                ...bookingRows.map((booking) => booking.campaign_id).filter(Boolean),
              ].filter(Boolean)
            )
          ) as string[];

          if (campaignIds.length > 0) {
            const { data: collaborationCampaigns } = await supabase
              .from("campaigns")
              .select("id, brand, description, niche, city, budget, deliverables, status")
              .in("id", campaignIds);

            setCollaborations(((collaborationCampaigns || []) as CollaborationItem[]).slice(0, 12));
          }
        }
      } catch (err) {
        console.error("Error fetching unified profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user?.id, isInfluencerRoute, isBrandRoute, requestedTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="mb-4 h-28 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasBothProfiles = Boolean(influencer && brand);

  return (
    <div className="min-h-screen bg-white pb-12">
      {user ? (
        <div className="md:hidden">
          <Navbar variant="minimal" title="Profile" />
        </div>
      ) : (
        <Navbar variant="minimal" title="Profile" />
      )}

      {isOwner && hasBothProfiles && (
        <div className="container px-4 pt-4 md:px-6">
          <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("influencer")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "influencer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <UserCircle2 size={16} /> Influencer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("brand")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "brand" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <Building2 size={16} /> Brand
            </button>
          </div>
        </div>
      )}

      {activeTab === "influencer" && influencer ? (
        <InfluencerView
          influencer={influencer}
          isOwner={isOwner}
          reviewSummary={reviewSummary}
          collaborations={collaborations}
          portfolioItems={portfolioItems}
          profileBackTo={profileBackTo}
        />
      ) : brand ? (
        <BrandView brand={brand} campaigns={campaigns} isOwner={isOwner} profileBackTo={profileBackTo} />
      ) : (
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
};

/**
 * InfluencerView renders the profile page for a creator.
 * It includes their stats, verified socials, rate card, and tabs for portfolio/reviews.
 */
const InfluencerView = ({
  influencer,
  isOwner,
  reviewSummary,
  collaborations,
  portfolioItems,
  profileBackTo,
}: {
  influencer: InfluencerProfileRow;
  isOwner: boolean;
  reviewSummary: ReviewSummary;
  collaborations: CollaborationItem[];
  portfolioItems: PortfolioItemRow[];
  profileBackTo: string;
}) => {
  const navigate = useNavigate();
  const { user, brandId } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemRow | null>(null);
  const initials = influencer.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  // Prepare social media platform presence for display (including self-reported stats)
  const platformPresence = [
    { 
      label: "Instagram", 
      href: influencer.instagram_url, 
      icon: <Instagram size={18} className="text-pink-500" />,
      followers: Number(influencer.ig_followers) || 0,
      engagement: influencer.ig_engagement,
      isVerified: influencer.is_verified && influencer.ig_followers > 0 && influencer.total_verified_followers_count > 0
    },
    { 
      label: "YouTube", 
      href: influencer.youtube_url, 
      icon: <Youtube size={18} className="text-red-500" />,
      followers: Number(influencer.yt_subscribers) || 0,
      engagement: influencer.yt_engagement,
      isVerified: influencer.is_verified && influencer.yt_subscribers > 0 && influencer.total_verified_followers_count > 0
    },
    { 
      label: "X (Twitter)", 
      href: influencer.twitter_url, 
      icon: <Twitter size={18} className="text-sky-500" />,
      followers: Number(influencer.twitter_followers) || 0,
      engagement: influencer.twitter_engagement,
      isVerified: influencer.is_verified && influencer.twitter_followers > 0 && influencer.total_verified_followers_count > 0
    },
  ].filter(p => p.href || p.followers > 0) as Array<{ label: string; href: string | null; icon: JSX.Element; followers: number; engagement: number | null; isVerified: boolean }>;

  return (
    <div>
      <div className="container px-4 pb-6 pt-4 md:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200/50 bg-white/80 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="group relative">
                      <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border-4 border-white bg-slate-100 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:scale-95 group-hover:rounded-[2.5rem] group-hover:shadow-2xl">
                        {!influencer.avatar_url ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
                            <User size={32} className="text-slate-400" />
                          </div>
                        ) : (
                          <img
                            src={influencer.avatar_url}
                            alt={influencer.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[inherit]" />
                      </div>
                      {influencer.is_verified && (
                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg ring-4 ring-white">
                          <ShieldCheck size={14} fill="currentColor" fillOpacity={0.2} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 px-2">
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {influencer.name}
                      </h1>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                          <MapPin size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">{influencer.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-teal-600 ring-1 ring-inset ring-teal-100/50">
                          <span className="text-[10px] font-bold uppercase tracking-tight">{influencer.niche}</span>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-center py-3 mt-4 border-y border-slate-100/60">
                        {Number(influencer.total_followers_count) > 0 && Number(influencer.total_followers_count) === Number(influencer.total_verified_followers_count) ? (
                          /* Centered Hero State for 100% Verified */
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-teal-600 leading-none">
                                {formatFollowers(Number(influencer.total_verified_followers_count) || 0)}
                              </span>
                              <ShieldCheck size={18} className="text-teal-500" />
                            </div>
                            <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-teal-600/70">100% Verified Reach</span>
                          </div>
                        ) : (
                          /* Standard Split View for Mixed Verification */
                          <div className="flex w-full items-center justify-center gap-6">
                            <div className="flex flex-col items-center">
                              <span className="text-base font-black text-slate-900 leading-none">
                                {formatFollowers(Number(influencer.total_followers_count) || 0)}
                              </span>
                              <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Reach</span>
                            </div>
                            
                            <div className="h-6 w-px bg-slate-100" />

                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base font-black text-teal-600 leading-none">
                                  {formatFollowers(Number(influencer.total_verified_followers_count) || 0)}
                                </span>
                                <ShieldCheck size={14} className="text-teal-500" />
                              </div>
                              <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-teal-600/70">Verified Reach</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-2">
                      {/* Bio Section */}
                      {influencer.bio && (
                        <p className="text-xs leading-5 text-slate-500 italic line-clamp-2">
                          "{influencer.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Compact Platform Row */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Presence</h3>
                      {influencer.is_verified && (
                        <div className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-600">
                          <ShieldCheck size={10} fill="currentColor" fillOpacity={0.2} />
                          <span className="text-[9px] font-black uppercase">Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {platformPresence.map((platform) => (
                        <div
                          key={platform.label}
                          className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm transition-all ${
                            platform.isVerified 
                              ? "border-teal-100 bg-teal-50/30 hover:border-teal-200" 
                              : "border-slate-100 bg-white hover:border-slate-200"
                          }`}
                        >
                          <span className={`${platform.isVerified ? "text-teal-600" : "text-slate-400"} transition-colors`}>
                            {platformIcon(platform.label === "X (Twitter)" ? "Twitter" : platform.label, 14)}
                          </span>
                          <span className={`text-xs font-black leading-none ${platform.isVerified ? "text-teal-700" : "text-slate-900"}`}>
                            {formatFollowers(platform.followers)}
                          </span>
                          {platform.isVerified && (
                            <ShieldCheck size={10} className="text-teal-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Trust CTA - Only shown if zero verified platforms */}
                  {platformPresence.every(p => !p.isVerified) && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-500 shadow-sm">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Trust Status</p>
                          <p className="text-xs font-black text-slate-900 mt-1">Pending Verification</p>
                          <p className="text-[10px] leading-4 text-slate-500 mt-1.5">
                            {isOwner 
                              ? "Verify your identity to increase brand trust and visibility."
                              : "This creator's account metrics are pending authentication."}
                          </p>
                          {isOwner && (
                            <Button
                              variant="link"
                              className="h-auto p-0 mt-2 text-[10px] font-black text-teal-600 hover:text-teal-700 decoration-teal-500/30 underline-offset-4 hover:underline"
                              onClick={() => navigate("/edit-profile?section=verification")}
                            >
                              Verify Account Now →
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Collaboration Packages */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collaboration</h3>
                      <div className="h-px flex-1 bg-slate-100 ml-3" />
                    </div>
                    
                    <div className="space-y-2">
                      <PriceRow icon={<Film size={16} />} label="Reel Creation" value={influencer.price_reel} tone="teal" />
                      <PriceRow icon={<Play size={16} />} label="Instant Story" value={influencer.price_story} tone="amber" />
                      <PriceRow icon={<MapPin size={16} />} label="Store Discovery" value={influencer.price_visit} tone="slate" />
                    </div>

                    <div className="pt-1">
                      {isOwner ? (
                        <Button className="h-10 w-full rounded-xl bg-slate-900 text-xs font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5" onClick={() => navigate("/edit-profile")}>
                          Edit Profile
                        </Button>
                      ) : !user ? (
                        <Button
                          className="h-10 w-full rounded-xl bg-slate-900 text-xs font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                          onClick={() => navigate("/auth")}
                        >
                          Sign In
                        </Button>
                      ) : !brandId ? (
                        <Button
                          className="h-10 w-full rounded-xl bg-teal-600 text-xs font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all hover:-translate-y-0.5"
                          onClick={() => navigate("/register-brand")}
                        >
                          Join as Brand Partner
                        </Button>
                      ) : (
                        <Button
                          className="h-10 w-full rounded-xl bg-slate-900 text-xs font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                          onClick={() => setBookingOpen(true)}
                        >
                          Send Booking Request
                        </Button>
                      )}
                    </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="space-y-5 lg:col-span-7">



            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="mb-8 h-auto w-full justify-start gap-8 overflow-x-auto rounded-none border-b border-slate-100 bg-transparent p-0 whitespace-nowrap scrollbar-none">
                <TabsTrigger value="portfolio" className="group relative rounded-none border-b-2 border-transparent bg-transparent px-2 pb-4 text-sm font-bold text-slate-400 transition-all data-[state=active]:border-teal-500 data-[state=active]:text-slate-900">
                  <div className="flex items-center gap-2">
                    <Image size={16} className="transition-colors group-data-[state=active]:text-teal-600" />
                    Portfolio ({portfolioItems.length})
                  </div>
                </TabsTrigger>
                <TabsTrigger value="history" className="group relative rounded-none border-b-2 border-transparent bg-transparent px-2 pb-4 text-sm font-bold text-slate-400 transition-all data-[state=active]:border-teal-500 data-[state=active]:text-slate-900">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="transition-colors group-data-[state=active]:text-teal-600" />
                    History ({collaborations.length})
                  </div>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="group relative rounded-none border-b-2 border-transparent bg-transparent px-2 pb-4 text-sm font-bold text-slate-400 transition-all data-[state=active]:border-teal-500 data-[state=active]:text-slate-900">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="transition-colors group-data-[state=active]:text-teal-600" />
                    Reviews ({reviewSummary.count})
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="m-0 focus-visible:outline-none">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Portfolio Highlights</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Curated work and premium creator collaborations.
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      type="button"
                      className="rounded-2xl bg-slate-900 px-6 font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                      onClick={() => navigate("/edit-profile?section=portfolio")}
                    >
                      Add New Item
                    </Button>
                  )}
                </div>

                {portfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {portfolioItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="group relative flex flex-col cursor-pointer overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-2 transition-all hover:border-teal-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
                      >
                        <div className="aspect-[16/10] overflow-hidden rounded-[2rem] bg-slate-50">
                          {["video", "reel", "story"].includes(item.media_type) ? (
                            <video
                              src={item.media_url}
                              poster={item.thumbnail_url || undefined}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-6">
                              <img
                                src={item.thumbnail_url || item.media_url}
                                alt={item.title}
                                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl shadow-slate-200 transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md text-slate-900 shadow-lg transition-transform group-hover:scale-110">
                            {contentTypeIcon(item.media_type)}
                          </div>
                        </div>
                        <div className="space-y-2 p-5 pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">
                              {item.platform || "Work Showcase"}
                            </p>
                          </div>
                          {!isGeneratedPortfolioTitle(item) && (
                            <h4 className="text-base font-black text-slate-900 tracking-tight transition-colors group-hover:text-teal-700">
                              {item.title}
                            </h4>
                          )}
                          {item.description && <p className="text-xs leading-6 text-slate-500 font-medium line-clamp-2">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">No creator portfolio items published yet.</p>
                    {isOwner && (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 rounded-xl"
                        onClick={() => navigate("/edit-profile?section=portfolio")}
                      >
                        Upload Your First Portfolio Item
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="m-0 focus-visible:outline-none">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Campaign History</h3>
                  <p className="text-sm text-slate-500 font-medium">Verified collaborations and successful brand partnerships.</p>
                </div>

                {collaborations.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {collaborations.map((item) => (
                      <Link key={item.id} to={`/campaign/${item.id}`} state={{ backTo: profileBackTo }} className="group">
                        <div className="flex flex-col h-full rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">{item.brand}</p>
                              <h4 className="mt-1 text-base font-black text-slate-900 tracking-tight transition-colors group-hover:text-teal-700 line-clamp-2">
                                {item.description}
                              </h4>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                              {contentTypeIcon(item.deliverables?.[0]?.toLowerCase() || "post")}
                            </div>
                          </div>

                          <div className="mb-4 flex flex-wrap gap-2">
                            <MiniBadge label={item.niche} />
                            <MiniBadge label={item.city} />
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest">
                              Rs. {item.budget.toLocaleString()}
                            </span>
                          </div>

                          <p className="mt-auto text-xs font-medium leading-5 text-slate-500 border-t border-slate-50 pt-4">
                            {(item.deliverables || []).length > 0
                              ? `Deliverables: ${item.deliverables.join(", ")}`
                              : "Standard collaboration deliverables."}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
                    <p className="text-sm font-bold text-slate-500">No completed collaborations recorded yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="m-0 focus-visible:outline-none">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Client Feedback</h3>
                  <p className="text-sm text-slate-500 font-medium">Reputation and trust signals from past brand partners.</p>
                </div>

                <div className="space-y-6">
                  <Card className="overflow-hidden rounded-[2rem] border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                    <CardContent className="grid gap-8 p-8 md:grid-cols-[200px_1fr] md:items-center">
                      <div className="flex flex-col items-center justify-center space-y-3 border-r border-slate-100 pr-8 text-center md:border-r">
                        <div className="font-display text-6xl font-black text-slate-900 tracking-tighter">{reviewSummary.average}</div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={18}
                              className={index < Math.round(Number(reviewSummary.average)) ? "fill-amber-400 text-amber-400 shadow-sm" : "text-slate-100"}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{reviewSummary.count} Authenticated Reviews</div>
                      </div>

                      <div className="space-y-3">
                        {reviewSummary.distribution.map((item) => (
                          <div key={item.star} className="flex items-center gap-4 text-xs">
                            <span className="w-4 font-black text-slate-400">{item.star}</span>
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-50">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 shadow-sm transition-all duration-500" style={{ width: `${item.pct}%` }} />
                            </div>
                            <span className="w-8 text-right font-black text-slate-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <ReviewList userId={influencer.user_id} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {!isOwner && (
          <BookingModal
            influencer={{
              id: influencer.id,
              name: influencer.name,
              city: influencer.city,
              niche: influencer.niche,
              price_reel: influencer.price_reel,
              price_story: influencer.price_story,
              price_visit: influencer.price_visit,
            }}
            influencerUserId={influencer.user_id}
            isOpen={bookingOpen}
            onClose={() => setBookingOpen(false)}
          />
        )}

        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
            {selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] h-full max-h-[90vh] md:max-h-[80vh] overflow-y-auto md:overflow-hidden">
                {/* Media Section */}
                <div className="relative bg-slate-50 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-100 min-h-[300px] md:min-h-0">
                  {["video", "reel", "story"].includes(selectedItem.media_type) ? (
                    <video
                      src={selectedItem.media_url}
                      poster={selectedItem.thumbnail_url || undefined}
                      className="max-h-full w-full object-contain"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={selectedItem.thumbnail_url || selectedItem.media_url}
                      alt={selectedItem.title}
                      className="max-h-full max-w-full object-contain p-6 drop-shadow-2xl"
                    />
                  )}
                  <div className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md text-slate-900 shadow-xl">
                    {contentTypeIcon(selectedItem.media_type)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col p-8 md:p-10 h-full overflow-y-auto">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full bg-teal-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 border border-teal-100/50">
                      {selectedItem.platform || "Work Showcase"}
                    </span>
                  </div>

                  <h2 className="mb-4 text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                    {selectedItem.title}
                  </h2>

                  <div className="prose prose-slate prose-sm max-w-none">
                    <p className="text-base leading-8 text-slate-600 font-medium">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-10">
                    <div className="flex flex-col gap-4">
                      {selectedItem.external_url && (
                        <Button
                          className="w-full rounded-2xl bg-slate-900 py-6 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0"
                          onClick={() => window.open(selectedItem.external_url, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Original Content
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl border-slate-200 py-6 font-bold text-slate-600 hover:bg-slate-50"
                        onClick={() => setSelectedItem(null)}
                      >
                        Close Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

/**
 * BrandView renders the profile page for a business.
 * It focuses on their industry, target audience, and open campaigns.
 */
const BrandView = ({
  brand,
  campaigns,
  isOwner,
  profileBackTo,
}: {
  brand: BrandProfileRow;
  campaigns: CampaignRow[];
  isOwner: boolean;
  profileBackTo: string;
}) => {
  const navigate = useNavigate();
  const initials = brand.business_name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const targetNiches = brand.target_niches || [];
  const targetCities = brand.target_cities || [];

  return (
    <div>
      <div className="container px-4 pb-6 pt-4 md:px-6">
        <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white shadow-sm">
          <div className="grid grid-cols-1 gap-6 px-5 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-6">
            <div>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/10 font-display text-2xl font-bold text-white/80">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.business_name} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-bold tracking-tight">{brand.business_name}</h1>
                    {brand.is_verified && <ShieldCheck size={18} className="text-teal-300" fill="currentColor" />}
                  </div>
                  {brand.brand_tagline && <p className="mt-1 text-sm font-medium text-teal-100">{brand.brand_tagline}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={13} />
                      {brand.industry || brand.business_type}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {brand.city}
                    </span>
                    {brand.website && (
                      <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                        <Globe size={13} />
                        {brand.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-white/80">
                {brand.description ||
                  `${brand.business_name} can use this section to explain what the brand does, who it serves, and what kind of creators it usually works with.`}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {targetNiches.slice(0, 6).map((niche: string) => (
                  <Badge key={niche} className="border-0 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/15">
                    {niche}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-start">
              <LandingStat label="Active Campaigns" value={String(campaigns.length)} />
              <LandingStat label="Target Niches" value={String(targetNiches.length)} />
              <LandingStat label="Target Cities" value={String(targetCities.length)} />
              <LandingStat label="Campaigns / Month" value={String(brand.campaigns_per_month || 0)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Brand Overview</h3>
                <div className="space-y-3">
                  <ContactRow icon={<Building2 size={16} />} value={brand.industry || brand.business_type} />
                  <ContactRow icon={<Users size={16} />} value={`${brand.campaigns_per_month || 0} campaigns / month`} />
                  <ContactRow icon={<Target size={16} />} value={`${targetNiches.length} creator niches targeted`} />
                  <ContactRow icon={<MapPin size={16} />} value={`${targetCities.length} markets in focus`} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Contact Info</h3>
                <div className="mb-5 space-y-3">
                  <ContactRow icon={<Mail size={16} />} value={brand.email} />
                  {brand.phone && <ContactRow icon={<Phone size={16} />} value={brand.phone} />}
                  {brand.contact_name && <ContactRow icon={<Users size={16} />} value={brand.contact_name} />}
                </div>

                {isOwner ? (
                  <Button className="h-10 w-full rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800" onClick={() => navigate("/edit-brand-profile")}>
                    Edit Brand Profile
                  </Button>
                ) : (
                  <Button className="h-10 w-full rounded-xl bg-teal-600 font-semibold text-white hover:bg-teal-700">
                    Contact Brand
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-8">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoPanel
                icon={<Target size={16} className="text-teal-600" />}
                title="Who We Want To Work With"
                body={targetNiches.length > 0 ? "Creator categories this brand is actively seeking for campaigns." : "Add target niches to make the brand brief sharper for creators."}
              >
                <div className="flex flex-wrap gap-2">
                  {targetNiches.length > 0 ? targetNiches.map((niche: string) => <MiniBadge key={niche} label={niche} />) : <MutedText text="No target niches added yet." />}
                </div>
              </InfoPanel>

              <InfoPanel
                icon={<MapPin size={16} className="text-teal-600" />}
                title="Priority Markets"
                body={targetCities.length > 0 ? "Cities and regions the brand is prioritizing right now." : "Add target cities to signal where activations matter most."}
              >
                <div className="flex flex-wrap gap-2">
                  {targetCities.length > 0 ? targetCities.map((city: string) => <MiniBadge key={city} label={city} />) : <MutedText text="No target cities added yet." />}
                </div>
              </InfoPanel>

              <InfoPanel
                icon={<Briefcase size={16} className="text-teal-600" />}
                title="Profile Basics"
                body="The minimum signals creators usually need before deciding to apply."
              >
                <div className="space-y-2 text-sm text-slate-700">
                  <SimpleMetric label="Campaign Volume" value={`${brand.campaigns_per_month || 0} / month`} />
                  <SimpleMetric label="Response Time" value={brand.response_time_expectation || "Not specified"} />
                  <SimpleMetric label="Primary Contact" value={brand.contact_name || "Not listed"} />
                </div>
              </InfoPanel>
            </div>


            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">About the Brand</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {brand.description ||
                  "Use this section to explain what the brand does and what kind of creator collaborations it is looking for."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Creator Requirements</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {brand.creator_requirements ||
                  "Brands can use this section to explain what they look for in creators: audience quality, content style, language, geography, and category fit."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Open Campaigns</h2>
                  <p className="text-sm text-slate-500">Live briefs, budgets, and the creator lanes this brand is currently hiring across.</p>
                </div>
                <Badge variant="outline" className="w-fit text-[11px] font-semibold uppercase tracking-wide">
                  {campaigns.length} live
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {campaigns.map((campaign) => (
                  <Link key={campaign.id} to={`/campaign/${campaign.id}`} state={{ backTo: profileBackTo }} className="group">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-teal-200 hover:bg-teal-50/40">

                      {/* Row 1: Title + Price */}
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {campaign.brand}
                          </div>


                        </div>

                        <div className="shrink-0 rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                          Rs. {campaign.budget.toLocaleString()}
                        </div>
                      </div>

                      {/* Row 2: Description */}
                      <p className="mb-3 line-clamp-2 text-sm text-slate-600 break-words">
                        {campaign.description}
                      </p>

                      {/* Row 3: Badges */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        <MiniBadge label={campaign.niche} />
                        <MiniBadge label={campaign.city} />
                        <MiniBadge label={`${campaign.influencers_needed} creators`} />
                      </div>

                      {/* Row 4: Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <CampaignMetric label="Applied" value={String(campaign.influencers_applied || 0)} />
                        <CampaignMetric label="Need" value={String(campaign.influencers_needed || 0)} />
                      </div>

                    </div>
                  </Link>
                ))}

                {campaigns.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                    <p className="font-medium text-slate-500">No active campaigns yet.</p>
                    <p className="mt-1 text-sm text-slate-400">This brand is not currently running any live creator campaigns.</p>
                    {isOwner && (
                      <Button className="mt-4 h-10 rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800" onClick={() => navigate("/dashboard")}>
                        Launch Campaign
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subLabel }: { label: string; value: string; subLabel?: string }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
    <div className="text-base font-bold text-slate-900">{value}</div>
    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
      {label} {subLabel && <span className="text-[9px] lowercase italic text-slate-300">({subLabel})</span>}
    </div>
  </div>
);

const SocialLink = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors hover:border-teal-300"
  >
    {icon}
    <span className="flex-1 truncate font-semibold text-slate-700">{label}</span>
    <ShieldCheck size={14} className="text-teal-500 fill-teal-500/10" />
  </a>
);


const PriceRow = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "teal" | "amber" | "slate";
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone === "teal"
          ? "bg-teal-50 text-teal-600"
          : tone === "amber"
            ? "bg-amber-50 text-amber-600"
            : "bg-slate-100 text-slate-600"
          }`}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
    <div className="text-sm font-bold text-slate-900">Rs. {value?.toLocaleString()}</div>
  </div>
);

const ContactRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
      {icon}
    </div>
    <span className="truncate font-medium text-slate-600">{value}</span>
  </div>
);

const LandingStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-sm">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="mt-1 text-[10px] uppercase tracking-wide text-white/55">{label}</div>
  </div>
);

const InfoPanel = ({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    <p className="mb-3 text-sm leading-6 text-slate-500">{body}</p>
    {children}
  </div>
);

const MiniBadge = ({ label }: { label: string }) => (
  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
    {label}
  </span>
);

const MutedText = ({ text }: { text: string }) => <p className="text-sm text-slate-400">{text}</p>;

const SimpleMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);

const CampaignMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-white px-3 py-2">
    <div className="font-semibold text-slate-900">{value}</div>
    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
  </div>
);

const ChecklistItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500" />
    <span>{text}</span>
  </div>
);

export default UnifiedProfile;
