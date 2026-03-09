import { Search, Users, Zap, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES, NICHES } from "@/data/mockData";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedCity: string;
  onCityChange: (v: string) => void;
  selectedNiche: string;
  onNicheChange: (v: string) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  activeTab: "influencers" | "campaigns";
  onTabChange: (tab: "influencers" | "campaigns") => void;
  resultCount: number;
  verifiedOnly: boolean;
  onVerifiedChange: (v: boolean) => void;
}

const SearchFilters = ({
  searchQuery, onSearchChange,
  selectedCity, onCityChange,
  selectedNiche, onNicheChange,
  sortBy, onSortChange,
  activeTab, onTabChange,
  resultCount,
  verifiedOnly, onVerifiedChange,
}: SearchFiltersProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = selectedCity !== "all" || selectedNiche !== "all" || sortBy !== "followers" || verifiedOnly;

  return (
    <div className="space-y-3">
      {/* Tab toggle + result count */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-full bg-muted p-0.5 sm:p-1 gap-0.5 sm:gap-1">
          <button
            onClick={() => onTabChange("influencers")}
            className={`px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === "influencers"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={14} className="inline-block mr-1 -mt-0.5 sm:hidden" />
            <Users size={15} className="hidden sm:inline-block mr-1.5 -mt-0.5" />
            Influencers
          </button>
          <button
            onClick={() => onTabChange("campaigns")}
            className={`px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === "campaigns"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap size={14} className="inline-block mr-1 -mt-0.5 sm:hidden" />
            <Zap size={15} className="hidden sm:inline-block mr-1.5 -mt-0.5" />
            Campaigns
          </button>
        </div>
        <span className="text-sm text-muted-foreground">
          {resultCount} found
        </span>
      </div>

      {/* Search + filters — single row on desktop */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`md:hidden flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shrink-0 ${
            filtersOpen || hasActiveFilters
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-input hover:text-foreground"
          }`}
        >
          <SlidersHorizontal size={18} />
        </button>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="hidden md:flex w-[150px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedNiche} onValueChange={onNicheChange}>
          <SelectTrigger className="hidden md:flex w-[150px]">
            <SelectValue placeholder="All Niches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Niches</SelectItem>
            {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="hidden md:flex w-[170px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="followers">Most Followers</SelectItem>
            <SelectItem value="engagement">Highest Engagement</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
          </SelectContent>
        </Select>
        {activeTab === "influencers" && (
          <button
            onClick={() => onVerifiedChange(!verifiedOnly)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
              verifiedOnly
                ? "bg-success/15 text-success border-success/30"
                : "bg-background text-muted-foreground border-input hover:text-foreground"
            }`}
          >
            <ShieldCheck size={16} />
            Verified
          </button>
        )}
      </div>

      {/* Mobile filters — collapsible */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Select value={selectedCity} onValueChange={onCityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedNiche} onValueChange={onNicheChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Niches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-full col-span-2">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">Most Followers</SelectItem>
                  <SelectItem value="engagement">Highest Engagement</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
              {activeTab === "influencers" && (
                <button
                  onClick={() => onVerifiedChange(!verifiedOnly)}
                  className={`col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    verifiedOnly
                      ? "bg-success/15 text-success border-success/30"
                      : "bg-background text-muted-foreground border-input hover:text-foreground"
                  }`}
                >
                  <ShieldCheck size={16} />
                  Verified Only
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilters;
