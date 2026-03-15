import { motion } from "framer-motion";
import { Users, Zap, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchFilters from "@/components/SearchFilters";
import InfluencerCard from "@/components/InfluencerCard";
import CampaignCard from "@/components/CampaignCard";
import ListInfluencerModal from "@/components/ListInfluencerModal";
import CreateCampaignModal from "@/components/CreateCampaignModal";
import JoinBrandModal from "@/components/JoinBrandModal";
import type { Influencer, Campaign } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

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
  loading: boolean;
  influencers: Influencer[];
  campaigns: Campaign[];
  filteredInfluencers: Influencer[];
  filteredCampaigns: Campaign[];
  ownInfluencerId: string | null;
  ownBrandId: string | null;
}

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
  loading,
  influencers,
  campaigns,
  filteredInfluencers,
  filteredCampaigns,
  ownInfluencerId,
  ownBrandId,
}: DiscoverySectionProps) => {
  const navigate = useNavigate();

  return (
    <motion.section
      id="discover"
      className="container py-12 space-y-6"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
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
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : activeTab === "influencers" ? (
        filteredInfluencers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Users size={40} className="text-primary" />
            </div>
            {influencers.length === 0 ? (
              <>
                <h3 className="font-display font-semibold text-xl text-foreground">No influencers yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Be the first creator on the platform! Register your profile and start getting discovered by brands.
                </p>
                <ListInfluencerModal
                  trigger={
                    <Button className="mt-6 gradient-primary border-0 text-primary-foreground">
                      <Zap size={16} className="mr-2" /> Register as Influencer
                    </Button>
                  }
                />
              </>
            ) : (
              <>
                <h3 className="font-display font-semibold text-xl text-foreground">No influencers found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCity("all");
                    setSelectedNiche("all");
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </div>
        )
      ) : filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus size={40} className="text-primary" />
          </div>
          {campaigns.length === 0 ? (
            <>
              <h3 className="font-display font-semibold text-xl text-foreground">No campaigns yet</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Be the first brand to post a campaign and connect with local influencers.
              </p>
              {ownBrandId ? (
                <CreateCampaignModal
                  trigger={
                    <Button className="mt-6 gradient-primary border-0 text-primary-foreground">
                      <Plus size={16} className="mr-2" /> Post a Campaign
                    </Button>
                  }
                />
              ) : (
                <JoinBrandModal
                  trigger={
                    <Button className="mt-6 gradient-primary border-0 text-primary-foreground">
                      <Building2 className="mr-2 w-4 h-4" /> Join as Brand
                    </Button>
                  }
                />
              )}
            </>
          ) : (
            <>
              <h3 className="font-display font-semibold text-xl text-foreground">No campaigns found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("all");
                  setSelectedNiche("all");
                }}
              >
                Clear Filters
              </Button>
            </>
          )}
        </div>
      )}
    </motion.section>
  );
};

export default DiscoverySection;
