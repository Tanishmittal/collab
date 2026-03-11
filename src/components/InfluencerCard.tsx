import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Instagram, Youtube, Twitter, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Influencer } from "@/data/mockData";

const platformIcon = (p: string) => {
  if (p === "Instagram") return <Instagram size={16} />;
  if (p === "YouTube") return <Youtube size={16} />;
  if (p === "Twitter") return <Twitter size={16} />;
  return null;
};

const nicheColors: Record<string, string> = {
  Food: "from-orange-400 to-red-400",
  Fashion: "from-pink-400 to-purple-400",
  Fitness: "from-green-400 to-emerald-500",
  Tech: "from-blue-400 to-cyan-400",
  Travel: "from-teal-400 to-sky-400",
  Lifestyle: "from-amber-400 to-orange-400",
  Beauty: "from-rose-400 to-pink-400",
  Comedy: "from-yellow-400 to-amber-400",
};

const formatFollowers = (count: string | number) => {
  const num = typeof count === "string" ? parseInt(count.replace(/,/g, ""), 10) : count;
  if (isNaN(num)) return count;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return num.toString();
};

const InfluencerCard = ({ influencer, index = 0, isOwn = false }: { influencer: Influencer; index?: number; isOwn?: boolean }) => {
  const navigate = useNavigate();
  const initials = influencer.name.split(" ").map(n => n[0]).join("");
  const gradientClass = nicheColors[influencer.niche] || "from-teal-400 to-indigo-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`group relative rounded-[1.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30 ${isOwn ? 'ring-2 ring-teal-500/60' : ''}`}
      onClick={() => navigate(`/influencer/${influencer.id}`)}
    >
      {/* Full Image */}
      <div className={`aspect-[3/4] relative overflow-hidden ${!influencer.avatar ? `bg-gradient-to-br ${gradientClass}` : 'bg-gray-900'}`}>
        {influencer.avatar && (
          <img
            src={influencer.avatar}
            alt={influencer.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}

        {!influencer.avatar && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-display font-bold text-white/15">{initials}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          {isOwn && (
            <Badge className="bg-teal-500 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 border-none shadow-md">
              ✨ Your Profile
            </Badge>
          )}
          {influencer.completedCampaigns >= 10 && (
            <Badge className="bg-amber-500/90 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 border-none">
              🏆 Top Creator
            </Badge>
          )}
          {influencer.isVerified && influencer.engagementRate >= 5 && (
            <Badge className="bg-white/10 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 border border-white/20 gap-1">
              <Zap size={10} className="text-teal-400" /> High Engagement
            </Badge>
          )}
        </div>

        {/* Top-right platform icons */}
        <div className="absolute top-5 right-5 flex flex-col gap-2.5">
          {influencer.platforms.map(p => (
            <div key={p} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-teal-500 transition-colors">
              {platformIcon(p)}
            </div>
          ))}
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          {/* Niche tag */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${gradientClass}`} />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/80">{influencer.niche}</span>
          </div>

          {/* Name + verified */}
          <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-white truncate">{influencer.name}</h3>
            {influencer.isVerified && (
              <ShieldCheck size={14} className="text-teal-400 fill-teal-400/20 shrink-0" />
            )}
          </div>

          {/* Location + rating */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-1 text-white/50 text-[10px] sm:text-xs">
              <MapPin size={10} />
              <span className="truncate">{influencer.city}</span>
            </div>
            <div className="flex items-center gap-1 text-teal-400 text-[10px] sm:text-xs">
              <Star size={10} fill="currentColor" />
              <span className="font-bold">{influencer.rating}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mb-4">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Followers</p>
              <p className="text-sm sm:text-base font-bold text-white">{formatFollowers(influencer.followers)}</p>
            </div>
            <div className="h-8 w-[1px] bg-white/15 self-center" />
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Engage</p>
              <p className="text-sm sm:text-base font-bold text-white">{influencer.engagementRate}%</p>
            </div>
          </div>

          {/* CTA + Price row */}
          <div className="flex items-center gap-3">
            <button
              className="flex-1 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-bold text-xs sm:text-sm text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/influencer/${influencer.id}`);
              }}
            >
              View Insights <ExternalLink size={13} />
            </button>
            <div className="text-right shrink-0">
              <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold">from</p>
              <p className="text-sm sm:text-base font-black text-white">₹{influencer.priceReel.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfluencerCard;
