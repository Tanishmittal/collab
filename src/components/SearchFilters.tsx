import { Search, Users, Zap, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import { LocationPicker } from "@/components/LocationPicker";

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
  eligibleOnly?: boolean;
  onEligibleChange?: (v: boolean) => void;
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
  eligibleOnly = false, onEligibleChange,
}: SearchFiltersProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { cities, niches } = useManagedOptions();

  const hasActiveFilters = selectedCity !== "all" || selectedNiche !== "all" || sortBy !== "followers" || verifiedOnly || eligibleOnly;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="hidden md:flex md:flex-wrap md:items-center md:gap-3 xl:flex-nowrap">
        <div className="inline-flex h-12 w-fit max-w-full items-center rounded-full border border-gray-200 bg-gray-100 p-1 gap-1 shrink-0">
          <button
            onClick={() => onTabChange("influencers")}
            className={`h-10 px-4 lg:px-6 rounded-full text-xs lg:text-sm font-medium transition-all duration-300 ${activeTab === "influencers"
              ? "bg-teal-500 text-white shadow-md"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
              }`}
          >
            <Users size={15} className="inline-block mr-1.5 -mt-0.5" />
            Influencers
          </button>
          <button
            onClick={() => onTabChange("campaigns")}
            className={`h-10 px-4 lg:px-6 rounded-full text-xs lg:text-sm font-medium transition-all duration-300 ${activeTab === "campaigns"
              ? "bg-teal-500 text-white shadow-md"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
              }`}
          >
            <Zap size={15} className="inline-block mr-1.5 -mt-0.5" />
            Campaigns
          </button>
        </div>
        <LocationPicker
          value={selectedCity}
          onChange={onCityChange}
          showAllOption={true}
          className="w-[132px] lg:w-[160px] h-12 bg-gray-50 border-gray-200 text-gray-900 shrink-0"
        />

        <Select value={selectedNiche} onValueChange={onNicheChange}>
          <SelectTrigger className="w-[132px] lg:w-[160px] h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl shrink-0">
            <SelectValue placeholder="All Niches" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">All Niches</SelectItem>
            {niches.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[152px] lg:w-[180px] h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl shrink-0">
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
            className={`flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl border text-xs lg:text-sm font-medium transition-all shrink-0 ${verifiedOnly
              ? "bg-teal-50 text-teal-600 border-teal-300"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
              }`}
          >
            <ShieldCheck size={16} />
            Verified
          </button>
        )}

        {activeTab === "campaigns" && onEligibleChange && (
          <button
            onClick={() => onEligibleChange(!eligibleOnly)}
            className={`flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl border text-xs lg:text-sm font-medium transition-all shrink-0 ${eligibleOnly
              ? "bg-teal-50 text-teal-600 border-teal-300"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
              }`}
          >
            <ShieldCheck size={16} />
            Eligible Only
          </button>
        )}

      </div>

      <div className="hidden md:block">
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name, niche, or bio..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
            />
          </div>
          <span className="shrink-0 text-sm font-medium text-gray-400">
            {resultCount} found
          </span>
        </div>
      </div>

      {/* Mobile switch + filters */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="inline-flex h-11 min-w-0 max-w-full items-center rounded-full border border-gray-200 bg-gray-100 p-0.5 gap-0.5 flex-1">
          <button
            onClick={() => onTabChange("influencers")}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center px-3 rounded-full text-xs font-medium transition-all duration-300 ${activeTab === "influencers"
              ? "bg-teal-500 text-white shadow-md"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
              }`}
          >
            <Users size={14} className="mr-1 -mt-0.5 shrink-0" />
            Influencers
          </button>
          <button
            onClick={() => onTabChange("campaigns")}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center px-3 rounded-full text-xs font-medium transition-all duration-300 ${activeTab === "campaigns"
              ? "bg-teal-500 text-white shadow-md"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
              }`}
          >
            <Zap size={14} className="mr-1 -mt-0.5 shrink-0" />
            Campaigns
          </button>
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex h-11 shrink-0 items-center justify-center rounded-xl border px-4 transition-all ${filtersOpen || hasActiveFilters
            ? "bg-teal-500 text-white border-teal-500"
            : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
            }`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Mobile search + filters */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name, niche, or bio..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-400">
            {resultCount} found
          </span>
        </div>
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
            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
              <LocationPicker
                value={selectedCity}
                onChange={onCityChange}
                showAllOption={true}
                className="w-full h-12 bg-gray-50 border-gray-200 text-gray-900"
              />
              <Select value={selectedNiche} onValueChange={onNicheChange}>
                <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
                  <SelectValue placeholder="All Niches" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="all">All Niches</SelectItem>
                  {niches.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-full h-12 sm:col-span-2 bg-gray-50 border-gray-200 text-gray-900 rounded-xl">
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
                  className={`sm:col-span-2 flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-medium transition-all ${verifiedOnly
                    ? "bg-teal-50 text-teal-600 border-teal-300"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
                    }`}
                >
                  <ShieldCheck size={16} />
                  Verified Only
                </button>
              )}
              {activeTab === "campaigns" && onEligibleChange && (
                <button
                  onClick={() => onEligibleChange(!eligibleOnly)}
                  className={`sm:col-span-2 flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-medium transition-all ${eligibleOnly
                    ? "bg-teal-50 text-teal-600 border-teal-300"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800"
                    }`}
                >
                  <ShieldCheck size={16} />
                  Eligible Campaigns Only
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
