import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, MapPin, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Influencer, Campaign } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Hero from "@/components/home/Hero";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import StatsSection from "@/components/home/StatsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import DiscoverySection from "@/components/home/DiscoverySection";
import CTASection from "@/components/home/CTASection";

const parseFollowers = (f: string) => {
  const num = parseFloat(f);
  if (f.includes("K")) return num * 1000;
  if (f.includes("M")) return num * 1000000;
  return num;
};

const stats = [
  { value: "500+", label: "Active Creators", icon: Users },
  { value: "₹2M+", label: "Campaign Value", icon: TrendingUp },
  { value: "50+", label: "Cities Covered", icon: MapPin },
  { value: "4.8★", label: "Avg. Rating", icon: Star }
];

const Index = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [sortBy, setSortBy] = useState("followers");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"influencers" | "campaigns">("influencers");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownInfluencerId, setOwnInfluencerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [infRes, campRes] = await Promise.all([
        supabase.from("influencer_profiles").select("*"),
        supabase.from("campaigns").select("*").order("created_at", { ascending: false })
      ]);

      if (!infRes.error && infRes.data) {
        setInfluencers(infRes.data.map((row) => ({
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
          avatar: (row as any).avatar_url || "",
          coverUrl: (row as any).cover_url || "",
          rating: Number(row.rating) || 4.5,
          completedCampaigns: row.completed_campaigns || 0,
          bio: row.bio || "",
          isVerified: (row as any).is_verified || false
        }) as Influencer));
      }

      if (!campRes.error && campRes.data) {
        setCampaigns(campRes.data.map((row) => ({
          id: row.id,
          brand: row.brand,
          brandLogo: row.brand_logo || "🏪",
          city: row.city,
          budget: row.budget,
          influencersNeeded: row.influencers_needed,
          influencersApplied: row.influencers_applied,
          deliverables: row.deliverables || [],
          niche: row.niche,
          status: row.status as Campaign["status"] || "active",
          postedAt: new Date(row.created_at).toLocaleDateString(),
          description: row.description || ""
        })));
      }

      if (user && infRes.data) {
        const own = infRes.data.find((r) => r.user_id === user.id);
        setOwnInfluencerId(own?.id ?? null);
      } else {
        setOwnInfluencerId(null);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredInfluencers = useMemo(() => {
    let result = influencers.filter((i) => {
      const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = selectedCity === "all" || i.city === selectedCity;
      const matchNiche = selectedNiche === "all" || i.niche === selectedNiche;
      const matchVerified = !verifiedOnly || i.isVerified;
      return matchSearch && matchCity && matchNiche && matchVerified;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "followers": return parseFollowers(b.followers) - parseFollowers(a.followers);
        case "engagement": return b.engagementRate - a.engagementRate;
        case "price-low": return a.priceReel - b.priceReel;
        case "price-high": return b.priceReel - a.priceReel;
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    });

    if (ownInfluencerId) {
      const ownIdx = result.findIndex((i) => i.id === ownInfluencerId);
      if (ownIdx > 0) {
        const [own] = result.splice(ownIdx, 1);
        result.unshift(own);
      }
    }
    return result;
  }, [searchQuery, selectedCity, selectedNiche, sortBy, verifiedOnly, influencers, ownInfluencerId]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch = c.brand.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = selectedCity === "all" || c.city === selectedCity;
      const matchNiche = selectedNiche === "all" || c.niche === selectedNiche;
      return matchSearch && matchCity && matchNiche;
    });
  }, [searchQuery, selectedCity, selectedNiche, campaigns]);

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-teal-500/30">
      <Navbar />

      {!user && <Hero />}

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
        loading={loading}
        influencers={influencers}
        campaigns={campaigns}
        filteredInfluencers={filteredInfluencers}
        filteredCampaigns={filteredCampaigns}
        ownInfluencerId={ownInfluencerId}
      />

      {!user && (
        <>
          <FeaturesSection />
          <HowItWorksSection />
          <StatsSection />
          <TestimonialsSection />
        </>
      )}



      {!user && <CTASection />}
    </div>
  );
};

export default Index;