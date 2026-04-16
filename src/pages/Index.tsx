import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import type { Campaign, Influencer } from "@/data/mockData";
import { influencers as mockInfluencers } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaigns, useInfluencers } from "@/hooks/useQuery";
import Hero from "@/components/home/Hero";
import type { Database } from "@/integrations/supabase/types";
import { getCampaignEligibility } from "@/lib/campaignEligibility";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const CTASection = lazy(() => import("@/components/home/CTASection"));
const DiscoverySection = lazy(() => import("@/components/home/DiscoverySection"));
const FeaturesSection = lazy(() => import("@/components/home/FeaturesSection"));
const GuestInfluencerCarousel = lazy(() => import("@/components/home/GuestInfluencerCarousel"));
const HowItWorksSection = lazy(() => import("@/components/home/HowItWorksSection"));

const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const Footer = lazy(() => import("@/components/home/Footer"));

type InfluencerProfileRow = Database["public"]["Tables"]["influencer_profiles"]["Row"] & {
  total_followers_count?: number | null;
  total_verified_followers_count?: number | null;
};

const SectionSkeleton = ({ className = "min-h-[320px]" }: { className?: string }) => (
  <div className={`container ${className}`} aria-hidden="true" />
);

const DeferredSection = ({
  children,
  fallbackClassName,
}: {
  children: React.ReactNode;
  fallbackClassName?: string;
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {shouldRender ? children : <SectionSkeleton className={fallbackClassName} />}
    </div>
  );
};

const Index = () => {
  const { user, loading: authLoading, influencerId: ownInfluencerId, brandId: ownBrandId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [sortBy, setSortBy] = useState("followers");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"influencers" | "campaigns">("influencers");
  const [influencerPage, setInfluencerPage] = useState(0);
  const [campaignPage, setCampaignPage] = useState(0);
  const pageSize = 20;
  const isGuest = !authLoading && !user;
  const influencerLimit = user ? pageSize : 8;

  const {
    data: influencersData = [],
    isLoading: influencersLoading,
  } = useInfluencers({
    limit: influencerLimit,
    offset: user ? influencerPage * pageSize : 0,
  }, {
    enabled: !authLoading,
  });

  const {
    data: campaignsData = [],
    isLoading: campaignsLoading,
  } = useCampaigns({
    limit: pageSize,
    offset: campaignPage * pageSize,
    onlyActive: true,
  }, {
    enabled: !!user,
  });
  const influencers = useMemo(
    () => {
      const realInfluencers = (influencersData as InfluencerProfileRow[]).map(
        (row) =>
          ({
            id: row.id,
            name: row.name,
            city: row.city,
            niche: row.niche,
            totalFollowers: Number(row.total_followers_count) || 0,
            totalVerifiedFollowers: Number(row.total_verified_followers_count) || 0,
            engagementRate: parseFloat(row.engagement_rate || "4.5"),
            platforms: row.platforms || [],
            priceReel: row.price_reel,
            priceStory: row.price_story,
            priceVisit: row.price_visit,
            avatar: row.avatar_url || "",
            coverUrl: row.cover_url || "",
            rating: Number(row.rating) || 4.5,
            completedCampaigns: row.completed_campaigns || 0,
            bio: row.bio || "",
            isVerified: row.is_verified || false,
          }) as Influencer
      );

      // If user is guest, supplement with mock data to fill the carousel
      if (isGuest) {
        const existingNames = new Set(realInfluencers.map(i => i.name.toLowerCase()));
        const uniqueMock = mockInfluencers.filter(m => !existingNames.has(m.name.toLowerCase()));
        return [...realInfluencers, ...uniqueMock].slice(0, 8);
      }

      return realInfluencers;
    },
    [influencersData, isGuest]
  );

  const campaigns = useMemo(
    () =>
      (campaignsData as CampaignRow[]).map(
        (row) =>
          ({
            id: row.id,
            userId: row.user_id,
            brand: row.brand,
            brandLogo: row.brand_logo || "B",
            city: row.city,
            budget: row.budget,
            influencersNeeded: row.influencers_needed,
            influencersApplied: row.influencers_applied,
            deliverables: row.deliverables || [],
            niche: row.niche,
            status: (row.status as Campaign["status"]) || "active",
            postedAt: new Date(row.created_at).toLocaleDateString(),
            description: row.description || "",
            deadline: row.expires_at || undefined,
            targetPlatforms: row.target_platforms || [],
            minFollowers: row.min_followers,
            minEngagementRate: row.min_engagement_rate,
            verifiedSocialsOnly: row.verified_socials_only || false,
            portfolioRequired: row.portfolio_required || false,
          }) as Campaign
      ),
    [campaignsData]
  );

  const currentInfluencer = useMemo(
    () => influencers.find((influencer) => influencer.id === ownInfluencerId) || null,
    [influencers, ownInfluencerId]
  );
  const [hasPortfolio, setHasPortfolio] = useState(false);

  useEffect(() => {
    const loadPortfolioPresence = async () => {
      if (!ownInfluencerId) {
        setHasPortfolio(false);
        return;
      }

      const { count } = await supabase
        .from("portfolio_items")
        .select("*", { count: "exact", head: true })
        .eq("influencer_profile_id", ownInfluencerId);

      setHasPortfolio((count || 0) > 0);
    };

    loadPortfolioPresence();
  }, [ownInfluencerId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "campaigns" || tab === "influencers") {
      setActiveTab(tab as "influencers" | "campaigns");
    }
  }, [searchParams]);

  const filteredInfluencers = useMemo(() => {
    const result = influencers.filter((influencer) => {
      const matchSearch =
        influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        influencer.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = selectedCity === "all" || influencer.city === selectedCity;
      const matchNiche = selectedNiche === "all" || influencer.niche === selectedNiche;
      const matchVerified = !verifiedOnly || influencer.isVerified;
      
      // If verifiedOnly is active, the influencer must have verified followers actually >= some threshold? 
      // Actually, the filter is just "Is Verified". The count logic is in Sort and Eligibility.
      return matchSearch && matchCity && matchNiche && matchVerified;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "followers":
          return (verifiedOnly ? b.totalVerifiedFollowers : b.totalFollowers) - (verifiedOnly ? a.totalVerifiedFollowers : a.totalFollowers);

        case "price-low":
          return a.priceReel - b.priceReel;
        case "price-high":
          return b.priceReel - a.priceReel;
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    if (ownInfluencerId) {
      const ownIdx = result.findIndex((influencer) => influencer.id === ownInfluencerId);
      if (ownIdx > 0) {
        const [own] = result.splice(ownIdx, 1);
        result.unshift(own);
      }
    }

    return result;
  }, [searchQuery, selectedCity, selectedNiche, sortBy, verifiedOnly, influencers, ownInfluencerId]);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        const matchSearch =
          campaign.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCity = selectedCity === "all" || campaign.city === selectedCity;
        const matchNiche = selectedNiche === "all" || campaign.niche === selectedNiche;
        const matchEligibility =
          !eligibleOnly ||
          (currentInfluencer &&
            getCampaignEligibility(
              {
                city: campaign.city,
                niche: campaign.niche,
                deliverables: campaign.deliverables,
                min_followers: campaign.minFollowers ?? null,
                min_engagement_rate: campaign.minEngagementRate ?? null,
                target_platforms: campaign.targetPlatforms ?? [],
                verified_socials_only: campaign.verifiedSocialsOnly ?? false,
                portfolio_required: campaign.portfolioRequired ?? false,
              },
              {
                city: currentInfluencer.city,
                niche: currentInfluencer.niche,
                total_followers_count: currentInfluencer.totalFollowers,
                total_verified_followers_count: currentInfluencer.totalVerifiedFollowers,
                engagement_rate: String(currentInfluencer.engagementRate),
                platforms: currentInfluencer.platforms,
                is_verified: currentInfluencer.isVerified ?? false,
                price_reel: currentInfluencer.priceReel,
                price_story: currentInfluencer.priceStory,
                price_visit: currentInfluencer.priceVisit,
              },
              hasPortfolio
            ).eligible);

        return matchSearch && matchCity && matchNiche && matchEligibility;
      }),
    [searchQuery, selectedCity, selectedNiche, campaigns, eligibleOnly, currentInfluencer, hasPortfolio]
  );

  const profileCompletionPrompt = useMemo(() => {
    if (!user || !currentInfluencer) return null;

    const relevantReasons = new Set<string>();

    campaigns.forEach((campaign) => {
      const result = getCampaignEligibility(
        {
          city: campaign.city,
          niche: campaign.niche,
          deliverables: campaign.deliverables,
          min_followers: campaign.minFollowers ?? null,
          min_engagement_rate: campaign.minEngagementRate ?? null,
          target_platforms: campaign.targetPlatforms ?? [],
          verified_socials_only: campaign.verifiedSocialsOnly ?? false,
          portfolio_required: campaign.portfolioRequired ?? false,
        },
        {
          city: currentInfluencer.city,
          niche: currentInfluencer.niche,
          total_followers_count: currentInfluencer.totalFollowers,
          total_verified_followers_count: currentInfluencer.totalVerifiedFollowers,
          engagement_rate: String(currentInfluencer.engagementRate),
          platforms: currentInfluencer.platforms,
          is_verified: currentInfluencer.isVerified ?? false,
          price_reel: currentInfluencer.priceReel,
          price_story: currentInfluencer.priceStory,
          price_visit: currentInfluencer.priceVisit,
        },
        hasPortfolio
      );

      result.reasons
        .filter((reason) =>
          reason === "Portfolio required." ||
          reason === "Verified socials required." ||
          reason === "Missing reel pricing." ||
          reason === "Missing story pricing." ||
          reason === "Missing visit pricing."
        )
        .forEach((reason) => relevantReasons.add(reason));
    });

    if (relevantReasons.size === 0) return null;

    return Array.from(relevantReasons);
  }, [campaigns, currentInfluencer, hasPortfolio, user]);

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-teal-500/30">
      {(!user || window.innerWidth < 768) && <Navbar />}

      {isGuest && <Hero />}

      {user ? (
        <Suspense fallback={<SectionSkeleton className="min-h-[640px]" />}>
          {profileCompletionPrompt && activeTab === "campaigns" && (
            <div className="container mb-4">
              <div className="rounded-3xl border border-teal-200 bg-teal-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-900">Complete your profile to unlock more campaigns</p>
                    <p className="mt-1 text-sm text-teal-800/80">
                      You're currently missing a few requirements brands are filtering on.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profileCompletionPrompt.map((reason) => (
                        <div key={reason} className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-700">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="h-10 rounded-xl bg-teal-600 px-4 font-semibold text-white hover:bg-teal-700"
                    onClick={() => navigate("/edit-profile?section=verification")}
                  >
                    Update Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DiscoverySection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            selectedNiche={selectedNiche}
            setSelectedNiche={setSelectedNiche}
            sortBy={sortBy}
            setSortBy={setSortBy}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            eligibleOnly={eligibleOnly}
            setEligibleOnly={setEligibleOnly}
            loading={influencersLoading || campaignsLoading}
            influencers={influencers}
            campaigns={campaigns}
            filteredInfluencers={filteredInfluencers}
            filteredCampaigns={filteredCampaigns}
            ownInfluencerId={ownInfluencerId}
            ownBrandId={ownBrandId}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<SectionSkeleton className="min-h-[520px]" />}>
          <GuestInfluencerCarousel influencers={influencers} loading={influencersLoading} />
        </Suspense>
      )}

      {isGuest && (
        <>
          <DeferredSection fallbackClassName="min-h-[420px]">
            <Suspense fallback={<SectionSkeleton className="min-h-[420px]" />}>
              <FeaturesSection />
            </Suspense>
          </DeferredSection>
          <DeferredSection fallbackClassName="min-h-[380px]">
            <Suspense fallback={<SectionSkeleton className="min-h-[380px]" />}>
              <HowItWorksSection />
            </Suspense>
          </DeferredSection>

          <DeferredSection fallbackClassName="min-h-[420px]">
            <Suspense fallback={<SectionSkeleton className="min-h-[420px]" />}>
              <TestimonialsSection />
            </Suspense>
          </DeferredSection>
        </>
      )}

      {isGuest && (
        <DeferredSection fallbackClassName="min-h-[240px]">
          <Suspense fallback={<SectionSkeleton className="min-h-[240px]" />}>
            <CTASection />
          </Suspense>
        </DeferredSection>
      )}

      {isGuest && (
        <Suspense fallback={<div className="h-40 bg-gray-50" />}>
          <Footer />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
