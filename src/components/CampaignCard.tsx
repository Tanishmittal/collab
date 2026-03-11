import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, IndianRupee, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Campaign } from "@/data/mockData";

const CampaignCard = ({ campaign, index = 0 }: { campaign: Campaign; index?: number }) => {
  const navigate = useNavigate();
  const progress = Math.round((campaign.influencersApplied / campaign.influencersNeeded) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass-card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/campaign/${campaign.id}`)}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
              {campaign.brandLogo}
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{campaign.brand}</h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin size={13} />
                <span>{campaign.city}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock size={12} />
            {campaign.postedAt}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{campaign.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="secondary" className="text-xs">{campaign.niche}</Badge>
          {campaign.deliverables.map(d => (
            <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-foreground font-semibold text-sm">
              <IndianRupee size={13} />
              {campaign.budget.toLocaleString()}
            </div>
            <span className="text-xs text-muted-foreground">Budget</span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-foreground font-semibold text-sm">
              <Users size={13} />
              {campaign.influencersNeeded}
            </div>
            <span className="text-xs text-muted-foreground">Influencers needed</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{campaign.influencersApplied} applied</span>
            <span className="text-muted-foreground">{campaign.influencersNeeded} needed</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-1.5" />
        </div>

        <Button className="w-full mt-4 gradient-primary border-0 text-primary-foreground font-medium" size="sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/campaign/${campaign.id}`); }}>
          View Details & Apply
        </Button>
      </div>
    </motion.div>
  );
};

export default CampaignCard;
