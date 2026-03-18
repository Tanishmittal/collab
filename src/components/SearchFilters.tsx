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
  className?: string;
}

const SearchFilters = ({
  className,
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
    <div className={`space-y-3 ${className}`}>
      {/* Tab toggle + result count */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 p-0.5 sm:p-1 gap-0.5 sm:gap-1">
          <button
            onClick={() => onTabChange("influencers")}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${activeTab === "influencers"
              ? "bg-teal-500 text-white shadow-md"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
              }`}
          >
            <Users size={14} className="inline-block mr-1 -mt-0.5 sm:hidden" />
            <Users size={15} className="hidden sm:inline-block mr-1.5 -mt-0.5" />
            Influencers
          </button>
          <button
            onClick={() => onTabChange("campaigns")}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${activeTab === "campaigns"
              ? "bg-teal-500 text-white shadow-md"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
              }`}
          >
            <Zap size={14} className="inline-block mr-1 -mt-0.5 sm:hidden" />
            <Zap size={15} className="hidden sm:inline-block mr-1.5 -mt-0.5" />
            Campaigns
          </button>
        </div>
        <span className="text-sm font-medium text-gray-400">
          {resultCount} found
        </span>
      </div>

      {/* Search + filters single row on desktop */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name, niche, or bio..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`md:hidden flex items-center justify-center w-12 h-12 rounded-xl border transition-all shrink-0 ${filtersOpen || hasActiveFilters
            ? "bg-teal-500 text-white border-teal-500"
            : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
            }`}
        >
          <SlidersHorizontal size={18} />
        </button>

        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="hidden md:flex w-[160px] h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">All Cities</SelectItem>
            {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedNiche} onValueChange={onNicheChange}>
          <SelectTrigger className="hidden md:flex w-[160px] h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
            <SelectValue placeholder="All Niches" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">All Niches</SelectItem>
            {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="hidden md:flex w-[180px] h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
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
            className={`hidden md:flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all shrink-0 ${verifiedOnly
              ? "bg-teal-50 text-teal-600 border-teal-300"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
              }`}
          >
            <ShieldCheck size={16} />
            Verified
          </button>
        )}
      </div>

      {/* Mobile filters collapsible */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Select value={selectedCity} onValueChange={onCityChange}>
                <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="all">All Cities</SelectItem>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedNiche} onValueChange={onNicheChange}>
                <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                  <SelectValue placeholder="All Niches" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="all">All Niches</SelectItem>
                  {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-full h-12 col-span-2 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
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
                  className={`col-span-2 flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-medium transition-all ${verifiedOnly
                    ? "bg-teal-50 text-teal-600 border-teal-300"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
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
