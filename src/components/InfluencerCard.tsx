import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Instagram, Youtube, Twitter, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFollowers } from "@/lib/utils";
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



const InfluencerCard = ({
  influencer,
  index = 0,
  isOwn = false,
}: {
  influencer: Influencer;
  index?: number;
  isOwn?: boolean;
}) => {
  const navigate = useNavigate();
  const initials = influencer.name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const gradientClass = nicheColors[influencer.niche] || "from-teal-400 to-indigo-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`group relative cursor-pointer overflow-hidden rounded-[1.5rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30 ${isOwn ? "ring-2 ring-teal-500/60" : ""}`}
      onClick={() => navigate(`/influencer/${influencer.id}`)}
    >
      <div className={`relative aspect-[3/4] overflow-hidden ${!influencer.avatar ? `bg-gradient-to-br ${gradientClass}` : "bg-gray-900"}`}>
        {influencer.avatar && (
          <img
            src={influencer.avatar}
            alt={influencer.name}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1280px) 340px, (min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}

        {!influencer.avatar && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl font-bold text-white/15">{initials}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {isOwn && (
            <Badge className="border-none bg-teal-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              Your Profile
            </Badge>
          )}
          {influencer.completedCampaigns >= 10 && (
            <Badge className="border-none bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Top Creator
            </Badge>
          )}
          {influencer.isVerified && influencer.engagementRate >= 5 && (
            <Badge className="gap-1 border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
              <Zap size={10} className="text-teal-400" />
              High Engagement
            </Badge>
          )}
        </div>

        <div className="absolute right-5 top-5 flex flex-col gap-2.5">
          {influencer.platforms.map((p) => (
            <div
              key={p}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-teal-500"
            >
              {platformIcon(p)}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${gradientClass}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 sm:text-[10px]">
              {influencer.niche}
            </span>
          </div>

          <div className="mb-0.5 flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-lg capitalize font-black text-white sm:text-xl">{influencer.name}</h3>
            {influencer.isVerified && <ShieldCheck size={14} className="shrink-0 fill-teal-400/20 text-teal-400" />}
          </div>

          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <div className="flex items-center gap-1 text-[10px] text-white/50 sm:text-xs">
              <MapPin size={10} />
              <span className="truncate">{influencer.city}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-teal-400 sm:text-xs">
              <Star size={10} fill="currentColor" />
              <span className="font-bold">{influencer.rating}</span>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-6">
            <div className="min-w-0">
              {influencer.totalFollowers > 0 && influencer.totalFollowers === influencer.totalVerifiedFollowers ? (
                <>
                  <p className="mb-0.5 text-[8px] font-bold uppercase tracking-wider text-teal-400 sm:text-[10px]">Verified Reach</p>

                  <p className="text-sm font-bold text-teal-400 sm:text-base">{formatFollowers(influencer.totalFollowers)}</p>

                </>
              ) : (
                <>
                  <p className="mb-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[10px]">Followers</p>
                  <p className="text-sm font-bold text-white sm:text-base">{formatFollowers(influencer.totalFollowers)}</p>
                </>
              )}
            </div>
            <div className="h-8 w-[1px] self-center bg-white/15" />
            <div className="min-w-0">
              <p className="mb-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[10px]">Avg Collab Price</p>
              <p className="text-sm font-black text-white sm:text-base">₹ {influencer.priceReel.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfluencerCard;
