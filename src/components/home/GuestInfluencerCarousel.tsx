import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Influencer } from "@/data/mockData";
import InfluencerCard from "@/components/InfluencerCard";
import { Skeleton } from "@/components/ui/skeleton";

interface GuestInfluencerCarouselProps {
  influencers: Influencer[];
  loading: boolean;
}

const GuestInfluencerCarousel = ({ influencers, loading }: GuestInfluencerCarouselProps) => {
  const visibleInfluencers = influencers.slice(0, 8);
  const marqueeInfluencers = [...visibleInfluencers, ...visibleInfluencers];

  return (
    <section id="discover" className="overflow-hidden py-10 md:py-12">
      <div className="container mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600">Featured Creators</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">Browse top influencers</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            A quick look at creators already on the platform. Sign in to use full discovery, filtering, and campaign matching.
          </p>
        </div>
        <Link to="/auth" className="hidden items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-teal-600 md:inline-flex">
          Explore in app <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[360px] rounded-[1.5rem]" />
          ))}
        </div>
      ) : (
        <div className="container">
          <div className="group relative overflow-hidden">
            <div className="flex w-max animate-[guest-marquee_40s_linear_infinite] gap-5 group-hover:[animation-play-state:paused]">
              <div className="w-0 shrink-0" />
              {marqueeInfluencers.map((influencer, index) => (
                <div
                  key={`${influencer.id}-${index}`}
                  className="w-[280px] shrink-0 sm:w-[320px] lg:w-[340px]"
                >
                  <InfluencerCard influencer={influencer} index={0} />
                </div>
              ))}
              <div className="w-0 shrink-0" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GuestInfluencerCarousel;
