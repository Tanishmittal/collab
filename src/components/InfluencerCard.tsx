import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Instagram, Youtube, Twitter, Zap, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Influencer } from "@/data/mockData";

const platformIcon = (p: string) => {
  if (p === "Instagram") return <Instagram size={12} />;
  if (p === "YouTube") return <Youtube size={12} />;
  if (p === "Twitter") return <Twitter size={12} />;
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

const InfluencerCard = ({ influencer, index = 0, isOwn = false }: { influencer: Influencer; index?: number; isOwn?: boolean }) => {
  const navigate = useNavigate();
  const initials = influencer.name.split(" ").map(n => n[0]).join("");
  const gradientClass = nicheColors[influencer.niche] || "from-primary to-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`group glass-card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${isOwn ? 'ring-2 ring-primary/60 shadow-[0_0_15px_hsl(var(--primary)/0.25)]' : ''}`}
      onClick={() => navigate(`/influencer/${influencer.id}`)}
    >
      {/* Full Image Section */}
      <div className={`aspect-[3/4] relative overflow-hidden ${!influencer.avatar ? `bg-gradient-to-br ${gradientClass}` : ''}`}>
        {influencer.avatar && (
          <img 
            src={influencer.avatar} 
            alt={influencer.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        )}
        
        {!influencer.avatar && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-display font-bold text-white/80">{initials}</span>
          </div>
        )}
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isOwn && (
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 backdrop-blur-sm gap-1">
              ✨ Your Profile
            </Badge>
          )}
          {influencer.completedCampaigns >= 10 && (
            <Badge className="bg-destructive/90 text-destructive-foreground text-[10px] px-2 py-0.5 backdrop-blur-sm">
              🏆 Top Creator
            </Badge>
          )}
          {influencer.isVerified && influencer.engagementRate >= 5 && (
            <Badge className="bg-foreground/80 text-background text-[10px] px-2 py-0.5 backdrop-blur-sm gap-1">
              <Zap size={10} /> High Engagement
            </Badge>
          )}
        </div>

        {/* Platform badges */}
        <div className="absolute bottom-16 left-3 flex flex-wrap gap-1.5 pr-3">
          {influencer.platforms.map(p => (
            <Badge key={p} variant="secondary" className="bg-secondary text-secondary-foreground backdrop-blur-sm text-[10px] gap-1">
              {platformIcon(p)} {p}
            </Badge>
          ))}
        </div>

        {/* Bottom overlay with name and rating */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-3 px-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground truncate">{influencer.name}</h3>
            {influencer.isVerified && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-0.5 bg-success/15 text-success rounded-full px-1.5 py-0.5 shrink-0 cursor-help">
                      <ShieldCheck size={13} fill="currentColor" className="opacity-90" />
                      <span className="text-[9px] font-bold uppercase tracking-wide">Verified</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-center">
                    <p className="text-xs font-medium">Verified Creator</p>
                    <p className="text-[10px] text-muted-foreground">Identity confirmed via social media link-in-bio verification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="flex items-center gap-0.5 text-warning shrink-0">
              <Star size={13} fill="currentColor" />
              <span className="text-xs font-medium">{influencer.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{influencer.niche} • {influencer.isVerified && influencer.followers ? influencer.followers : "0"} followers</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin size={11} />
              <span>{influencer.city}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-display font-bold text-foreground">₹{influencer.priceReel.toLocaleString()}</span>
            <p className="text-[10px] text-muted-foreground">per reel</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfluencerCard;
