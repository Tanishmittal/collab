import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import type { Campaign, Influencer } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaigns, useInfluencers } from "@/hooks/useQuery";
import Hero from "@/components/home/Hero";
import type { Database } from "@/integrations/supabase/types";

const CTASection = lazy(() => import("@/components/home/CTASection"));
const DiscoverySection = lazy(() => import("@/components/home/DiscoverySection"));
const FeaturesSection = lazy(() => import("@/components/home/FeaturesSection"));
const GuestInfluencerCarousel = lazy(() => import("@/components/home/GuestInfluencerCarousel"));
const HowItWorksSection = lazy(() => import("@/components/home/HowItWorksSection"));
const StatsSection = lazy(() => import("@/components/home/StatsSection"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));

type InfluencerProfileRow = Database["public"]["Tables"]["influencer_profiles"]["Row"];
type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

const parseFollowers = (f: string) => {
  const num = parseFloat(f);
  if (f.includes("K")) return num * 1000;
  if (f.includes("M")) return num * 1000000;
  return num;
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
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [sortBy, setSortBy] = useState("followers");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
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
    () =>
      (influencersData as InfluencerProfileRow[]).map(
        (row) =>
          ({
            id: row.id,
            name: row.name,
            city: row.city,
            niche: row.niche,
            followers: row.followers,
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
      ),
    [influencersData]
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
          }) as Campaign
      ),
    [campaignsData]
  );

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
      return matchSearch && matchCity && matchNiche && matchVerified;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "followers":
          return parseFollowers(b.followers) - parseFollowers(a.followers);
        case "engagement":
          return b.engagementRate - a.engagementRate;
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
        return matchSearch && matchCity && matchNiche;
      }),
    [searchQuery, selectedCity, selectedNiche, campaigns]
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-teal-500/30">
      {(!user || window.innerWidth < 768) && <Navbar />}

      {isGuest && <Hero />}

      {user ? (
        <Suspense fallback={<SectionSkeleton className="min-h-[640px]" />}>
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
          <DeferredSection fallbackClassName="min-h-[280px]">
            <Suspense fallback={<SectionSkeleton className="min-h-[280px]" />}>
              <StatsSection />
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
    </div>
  );
};

export default Index;
