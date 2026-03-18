import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Clock, Zap, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Campaign } from "@/data/mockData";

const nicheColors: Record<string, string> = {
  Food: "text-orange-600 border-orange-200 bg-orange-50",
  Fitness: "text-green-600 border-green-200 bg-green-50",
  Fashion: "text-pink-600 border-pink-200 bg-pink-50",
  Tech: "text-blue-600 border-blue-200 bg-blue-50",
  Travel: "text-teal-600 border-teal-200 bg-teal-50",
  Lifestyle: "text-amber-600 border-amber-200 bg-amber-50",
  Beauty: "text-rose-600 border-rose-200 bg-rose-50",
  Comedy: "text-yellow-600 border-yellow-200 bg-yellow-50",
};

const CampaignCard = ({ campaign, index = 0, isOwn = false }: { campaign: Campaign; index?: number; isOwn?: boolean }) => {
  const navigate = useNavigate();
  const progress = Math.min((campaign.influencersApplied / campaign.influencersNeeded) * 100, 100);
  const slotsLeft = Math.max(0, campaign.influencersNeeded - campaign.influencersApplied);
  const isUrgent = progress >= 80 && slotsLeft > 0;

  const nicheStyle = nicheColors[campaign.niche] || "text-teal-600 border-teal-200 bg-teal-50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative bg-white border border-gray-200 rounded-[1.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-[0_15px_40px_-10px_rgba(20,184,166,0.15)] hover:border-teal-500/30 flex flex-col"
      onClick={() => navigate(`/campaign/${campaign.id}`)}
    >
      <div className="p-6 flex-grow flex flex-col relative z-10">
        {/* Top Header Section */}
        <div className="mb-5 flex items-start">
          <div className="flex min-w-0 items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500 text-gray-900">
              {campaign.brandLogo}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-black text-xl text-gray-900 tracking-wide group-hover:text-teal-600 transition-colors truncate">
                {campaign.brand}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge className={`px-2 py-0 text-[10px] uppercase tracking-widest font-bold rounded-md ${nicheStyle} shadow-none`}>
                  {campaign.niche}
                </Badge>
                <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold tracking-wider uppercase">
                  <MapPin size={10} className="text-gray-400" />
                  {campaign.city}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
          {campaign.description}
        </p>

        {/* Highlight Box: Budget & Deliverables */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6 group-hover:border-teal-500/20 transition-colors">
          <div className="flex justify-between items-end mb-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1.5">Campaign Budget</p>
              <div className="flex items-end gap-1">
                <span className="text-teal-600 font-bold text-lg mb-0.5">₹</span>
                <span className="text-3xl font-black text-gray-900 tracking-tight">{campaign.budget.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-gray-600 text-xs font-bold uppercase tracking-wider bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <Clock size={12} className={isUrgent ? "text-rose-500" : "text-teal-600"} />
                {campaign.deadline ? (
                  (() => {
                    const days = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                    return days === 0 ? "Closing Soon" : `${days} Day${days > 1 ? "s" : ""}`;
                  })()
                ) : "3 Days"}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2.5 flex items-center gap-1.5">
              <Target size={10} /> Required Deliverables
            </p>
            <div className="flex flex-wrap gap-2">
              {campaign.deliverables.map(d => (
                <div key={d} className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium tracking-wide">
                  <Zap size={10} className="text-teal-500" />
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bottom */}
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-4">
            <div>

              <p className="text-gray-900 text-sm font-bold">
                <span className={isUrgent ? "text-rose-600" : "text-teal-600"}>
                  {slotsLeft === 0 ? "No slots left" : `${slotsLeft} slots left`}
                </span>
              </p>
            </div>

            {/* Applicant Avatars overlapping */}
            {campaign.influencersApplied > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(campaign.influencersApplied, 3))].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-[2px] border-white flex items-center justify-center text-gray-400 z-10 shadow-sm">
                      <Users size={12} />
                    </div>
                  ))}
                  {campaign.influencersApplied > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-[2px] border-white flex items-center justify-center text-[10px] font-bold text-gray-600 z-0">
                      +{campaign.influencersApplied - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {campaign.influencersApplied} applied
                </span>
              </div>
            )}
          </div>

          {/* Custom Progress Bar */}
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${isUrgent ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]'}`}
            />
          </div>

          {isOwn ? (
            <button
              className="w-full py-3 bg-gray-400 text-white rounded-xl font-bold tracking-wide shadow flex items-center justify-center gap-2 cursor-not-allowed"
              disabled
            >
              Your Campaign
            </button>
          ) : (
            <button
              className="w-full py-3 bg-gray-900 hover:bg-teal-600 text-white rounded-xl font-bold tracking-wide transition-colors duration-300 shadow flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/campaign/${campaign.id}`);
              }}
            >
              Apply Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 3.33331L12.6667 7.99998L8 12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Background radial glow */}
      <div className="absolute inset-0 bg-teal-50/0 group-hover:bg-teal-50/[0.3] transition-colors duration-500 pointer-events-none" />
    </motion.div>
  );
};

export default CampaignCard;
