import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Users, Zap, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchFilters from "@/components/SearchFilters";
import InfluencerCard from "@/components/InfluencerCard";
import CampaignCard from "@/components/CampaignCard";
import { supabase } from "@/integrations/supabase/client";
import type { Influencer, Campaign } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { getCampaignEligibility } from "@/lib/campaignEligibility";

interface DiscoverySectionProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  selectedNiche: string;
  setSelectedNiche: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  activeTab: "influencers" | "campaigns";
  setActiveTab: (v: "influencers" | "campaigns") => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  eligibleOnly: boolean;
  setEligibleOnly: (v: boolean) => void;
  loading: boolean;
  influencers: Influencer[];
  campaigns: Campaign[];
  filteredInfluencers: Influencer[];
  filteredCampaigns: Campaign[];
  ownInfluencerId: string | null;
  ownBrandId: string | null;
}



const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-72 rounded-xl" />
    ))}
  </div>
);

const EmptyInfluencerState = ({ 
  influencersCount, 
  onClearFilters,
  onRegister,
}: { 
  influencersCount: number, 
  onClearFilters: () => void,
  onRegister: () => void,
}) => (
  <div className="text-center py-10">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
      <Users size={40} className="text-primary" />
    </div>
    {influencersCount === 0 ? (
      <>
        <h3 className="font-display font-semibold text-xl text-foreground">No influencers yet</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Be the first creator on the platform! Register your profile and start getting discovered by brands.
        </p>
        <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={onRegister}>
          <Zap size={16} className="mr-2" /> Register as Influencer
        </Button>
      </>
    ) : (
      <>
        <h3 className="font-display font-semibold text-xl text-foreground">No influencers found</h3>
        <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </>
    )}
  </div>
);

const EmptyCampaignState = ({ 
  campaignsCount, 
  ownBrandId, 
  onClearFilters,
  onCreateCampaign,
  onJoinBrand,
}: { 
  campaignsCount: number, 
  ownBrandId: string | null, 
  onClearFilters: () => void,
  onCreateCampaign: () => void,
  onJoinBrand: () => void,
}) => (
  <div className="text-center py-20">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
      <Plus size={40} className="text-primary" />
    </div>
    {campaignsCount === 0 ? (
      <>
        <h3 className="font-display font-semibold text-xl text-foreground">No campaigns yet</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Be the first brand to post a campaign and connect with local influencers.
        </p>
        {ownBrandId ? (
          <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={onCreateCampaign}>
            <Plus size={16} className="mr-2" /> Post a Campaign
          </Button>
        ) : (
          <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={onJoinBrand}>
            <Building2 className="mr-2 w-4 h-4" /> Join as Brand
          </Button>
        )}
      </>
    ) : (
      <>
        <h3 className="font-display font-semibold text-xl text-foreground">No campaigns found</h3>
        <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </>
    )}
  </div>
);

const DiscoverySection = ({
  searchQuery,
  setSearchQuery,
  selectedCity,
  setSelectedCity,
  selectedNiche,
  setSelectedNiche,
  sortBy,
  setSortBy,
  activeTab,
  setActiveTab,
  verifiedOnly,
  setVerifiedOnly,
  eligibleOnly,
  setEligibleOnly,
  loading,
  influencers,
  campaigns,
  filteredInfluencers,
  filteredCampaigns,
  ownInfluencerId,
  ownBrandId,
}: DiscoverySectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myApplications = [] } = useQuery({
    queryKey: ["campaign-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_applications")
        .select("campaign_id, status")
        .eq("user_id", user!.id);

      if (error) {
        throw new Error(error.message || "Failed to fetch application state");
      }

      return data || [];
    },
  });

  const applicationStatusByCampaign = new Map(
    myApplications.map((application) => [application.campaign_id, application.status])
  );

  const { data: currentInfluencerContext } = useQuery({
    queryKey: ["current-influencer-eligibility", ownInfluencerId],
    enabled: !!ownInfluencerId,
    queryFn: async () => {
      const [{ data: profile, error: profileError }, { count: portfolioCount, error: portfolioError }] = await Promise.all([
        supabase
          .from("influencer_profiles")
          .select("city, niche, followers, engagement_rate, platforms, is_verified, price_reel, price_story, price_visit")
          .eq("id", ownInfluencerId!)
          .maybeSingle(),
        supabase
          .from("portfolio_items")
          .select("*", { count: "exact", head: true })
          .eq("influencer_profile_id", ownInfluencerId!),
      ]);

      if (profileError) {
        throw new Error(profileError.message || "Failed to load influencer eligibility profile");
      }
      if (portfolioError) {
        throw new Error(portfolioError.message || "Failed to load portfolio count");
      }

      return {
        profile,
        hasPortfolio: (portfolioCount || 0) > 0,
      };
    },
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedNiche("all");
  };

  return (
    <>
      <div className="sticky top-14 z-40 border-b border-slate-200/70 bg-white md:top-0">
        <div className="container px-4 py-3 sm:px-4 sm:py-4 lg:px-6">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedNiche={selectedNiche}
            onNicheChange={setSelectedNiche}
            sortBy={sortBy}
            onSortChange={setSortBy}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            resultCount={activeTab === "influencers" ? filteredInfluencers.length : filteredCampaigns.length}
            verifiedOnly={verifiedOnly}
            onVerifiedChange={setVerifiedOnly}
            eligibleOnly={eligibleOnly}
            onEligibleChange={setEligibleOnly}
          />
        </div>
      </div>

      <section id="discover" className="container py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {loading ? (
            <LoadingSkeleton />
          ) : activeTab === "influencers" ? (
            filteredInfluencers.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredInfluencers.map((inf, i) => (
                  <InfluencerCard
                    key={inf.id}
                    influencer={inf}
                    index={i}
                    isOwn={inf.id === ownInfluencerId}
                  />
                ))}
              </div>
            ) : (
              <EmptyInfluencerState 
                influencersCount={influencers.length} 
                onClearFilters={clearFilters}
                onRegister={() => navigate("/register")}
              />
            )
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCampaigns.map((c, i) => {
                const eligibility =
                  currentInfluencerContext?.profile
                    ? getCampaignEligibility(
                        {
                          city: c.city,
                          niche: c.niche,
                          deliverables: c.deliverables,
                          min_followers: c.minFollowers ?? null,
                          min_engagement_rate: c.minEngagementRate ?? null,
                          target_platforms: c.targetPlatforms ?? [],
                          verified_socials_only: c.verifiedSocialsOnly ?? false,
                          portfolio_required: c.portfolioRequired ?? false,
                        },
                        currentInfluencerContext.profile,
                        currentInfluencerContext.hasPortfolio
                      )
                    : null;

                return (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    index={i}
                    isOwn={c.userId === user?.id}
                    applicationStatus={applicationStatusByCampaign.get(c.id) || null}
                    eligibility={eligibility}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyCampaignState 
              campaignsCount={campaigns.length} 
              ownBrandId={ownBrandId} 
              onClearFilters={clearFilters}
              onCreateCampaign={() => navigate("/create-campaign")}
              onJoinBrand={() => navigate("/register-brand")}
            />
          )}
        </motion.div>
      </section>
    </>
  );
};

export default DiscoverySection;
