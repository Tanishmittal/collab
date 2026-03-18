import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  ArrowLeft, MapPin, Star, Instagram, Youtube, Twitter, 
  IndianRupee, Play, Image, Film, Video, Eye, Heart, Share2, Pencil, ShieldCheck,
  Target, Users, Briefcase, Mail, Phone, Building2, ExternalLink, MessageSquare, Plus, Globe
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ReviewList from "@/components/ReviewList";
import { getReviewsForInfluencer, getPortfolioForInfluencer } from "@/data/profileData";

const platformIcon = (p: string, size = 16) => {
  if (p === "Instagram") return <Instagram size={size} />;
  if (p === "YouTube") return <Youtube size={size} />;
  if (p === "Twitter") return <Twitter size={size} />;
  return null;
};

const contentTypeIcon = (type: string) => {
  switch (type) {
    case "reel": return <Film size={14} />;
    case "story": return <Play size={14} />;
    case "post": return <Image size={14} />;
    case "video": return <Video size={14} />;
    default: return <Film size={14} />;
  }
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

const UnifiedProfile = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, influencerId: ownInfluencerId, brandId: ownBrandId } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("influencer");
  
  const [influencer, setInfluencer] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  
  const isInfluencerRoute = location.pathname.includes("/influencer/");
  const isBrandRoute = location.pathname.includes("/brand/");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let targetUserId: string | null = null;

        // 1. Resolve target User ID from the initial ID
        if (isInfluencerRoute) {
          const { data } = await supabase.from("influencer_profiles").select("user_id").eq("id", id!).maybeSingle();
          targetUserId = data?.user_id || null;
          setActiveTab("influencer");
        } else if (isBrandRoute) {
          const { data } = await supabase.from("brand_profiles").select("user_id").eq("id", id!).maybeSingle();
          targetUserId = data?.user_id || null;
          setActiveTab("brand");
        }

        if (!targetUserId) {
          setLoading(false);
          return;
        }

        setIsOwner(user?.id === targetUserId);

        // 2. Fetch both profiles if it's the owner, otherwise just the requested one
        const promises = [];
        promises.push(supabase.from("influencer_profiles").select("*").eq("user_id", targetUserId).maybeSingle());
        promises.push(supabase.from("brand_profiles").select("*").eq("user_id", targetUserId).maybeSingle());
        promises.push(supabase.from("campaigns").select("*").eq("user_id", targetUserId).eq("status", "active"));

        const [infRes, brandRes, campRes] = await Promise.all(promises);

        setInfluencer(infRes.data);
        setBrand(brandRes.data);
        setCampaigns(campRes.data || []);

      } catch (err) {
        console.error("Error fetching unified profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user?.id, isInfluencerRoute, isBrandRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-64 rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasBothProfiles = influencer && brand;
  const showTabs = isOwner && hasBothProfiles;

  return (
    <div className="min-h-screen bg-white pb-20">
      {!user && <Navbar variant="minimal" title="Profile" />}

      <div className="mt-0">
        {activeTab === "influencer" && influencer ? (
          <InfluencerView influencer={influencer} isOwner={isOwner} />
        ) : brand ? (
          <BrandView brand={brand} campaigns={campaigns} isOwner={isOwner} />
        ) : (
          <div className="container py-20 text-center">
            <h1 className="text-2xl font-bold">Profile not found</h1>
            <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const InfluencerView = ({ influencer, isOwner }: { influencer: any, isOwner: boolean }) => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const navigate = useNavigate();
  const initials = influencer.name.split(" ").map((n: any) => n[0]).join("").toUpperCase();
  const reviews = getReviewsForInfluencer(influencer.id);
  const portfolio = getPortfolioForInfluencer(influencer.id);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="h-48 md:h-64 relative bg-slate-50 border-b border-slate-200/60" />
      
      <div className="container -mt-24 relative z-10 px-4 md:px-8 pb-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-32 h-32 relative group mb-6">
            <div className="absolute inset-0 bg-white rounded-full border border-slate-200 shadow-sm" />
            <div className="absolute inset-2 overflow-hidden rounded-full">
              {influencer.avatar_url ? (
                <img src={influencer.avatar_url} alt={influencer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-4xl">
                  {initials}
                </div>
              )}
            </div>
          </div>
          
          <h1 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2 mb-2">
            {influencer.name}
            {influencer.is_verified && <ShieldCheck size={24} className="text-teal-500" fill="currentColor" />}
          </h1>
          
          <div className="flex items-center gap-4 text-slate-500 text-sm font-medium mb-6">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span>{influencer.city}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < Math.round(influencer.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
              ))}
              <span className="ml-1 text-slate-900">{influencer.rating}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {influencer.niche}
            </Badge>
            {influencer.platforms?.map((p: string) => (
              <Badge key={p} variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 px-3 py-1 gap-1.5 transition-colors hover:border-teal-200 hover:bg-teal-50/50">
                {platformIcon(p, 14)} {p}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-12 py-6 border-t border-b border-slate-100 w-full max-w-2xl justify-center">
            <div className="text-center">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">{(influencer.followers / 1000).toFixed(1)}K</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">{influencer.engagement_rate || "4.5"}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">{influencer.completed_campaigns || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Campaigns</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap max-w-none text-base">
                {influencer.bio || "No bio provided."}
              </p>
            </section>

            {influencer.is_verified && (influencer.instagram_url || influencer.youtube_url || influencer.twitter_url) && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Verified Socials</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {influencer.instagram_url && (
                    <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors shadow-sm">
                      <Instagram size={20} className="text-pink-500" />
                      <span className="text-sm font-semibold text-slate-700 flex-1 truncate">Instagram</span>
                      <ShieldCheck size={16} className="text-teal-500 fill-teal-500/10" />
                    </a>
                  )}
                  {influencer.youtube_url && (
                    <a href={influencer.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors shadow-sm">
                      <Youtube size={20} className="text-red-500" />
                      <span className="text-sm font-semibold text-slate-700 flex-1 truncate">YouTube</span>
                      <ShieldCheck size={16} className="text-teal-500 fill-teal-500/10" />
                    </a>
                  )}
                  {influencer.twitter_url && (
                    <a href={influencer.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition-colors shadow-sm">
                      <Twitter size={20} className="text-sky-500" />
                      <span className="text-sm font-semibold text-slate-700 flex-1 truncate">X (Twitter)</span>
                      <ShieldCheck size={16} className="text-teal-500 fill-teal-500/10" />
                    </a>
                  )}
                </div>
              </section>
            )}

            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="bg-transparent h-auto p-0 border-b border-slate-200 w-full justify-start rounded-none space-x-8 mb-8">
                <TabsTrigger value="portfolio" className="border-b-2 border-transparent data-[state=active]:border-teal-500 rounded-none bg-transparent px-0 pb-4 font-bold text-sm tracking-tight transition-all text-slate-500 data-[state=active]:text-slate-900">
                  Work Portfolio ({portfolio.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="border-b-2 border-transparent data-[state=active]:border-teal-500 rounded-none bg-transparent px-0 pb-4 font-bold text-sm tracking-tight transition-all text-slate-500 data-[state=active]:text-slate-900">
                  Client Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="portfolio" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolio.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden mb-3 border border-slate-200/60 relative">
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          {contentTypeIcon(item.type)}
                        </div>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-600 transition-colors">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.platform}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="m-0">
                 <ReviewList reviews={reviews} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm sticky top-24">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Service Pricing</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><Film size={16} /></div>
                    <span className="text-sm font-semibold text-slate-700">Instagram Reel</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">₹{influencer.price_reel?.toLocaleString()}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Play size={16} /></div>
                    <span className="text-sm font-semibold text-slate-700">Instagram Story</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">₹{influencer.price_story?.toLocaleString()}</div>
                </div>
              </div>

              {isOwner ? (
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl transition-all" onClick={() => navigate("/edit-profile")}>
                  Edit Your Profile
                </Button>
              ) : (
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-teal-600/20 transition-all" onClick={() => setBookingOpen(true)}>
                  Reserve Booking
                </Button>
              )}

              <BookingModal 
                isOpen={bookingOpen} 
                onClose={() => setBookingOpen(false)} 
                influencer={influencer} 
              />
            </div>

            {influencer.is_verified && (influencer.instagram_url || influencer.youtube_url || influencer.twitter_url) && (
              <div className="p-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Connected Accounts</h3>
                <div className="space-y-3">
                  {influencer.instagram_url && (
                    <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors group">
                      <Instagram size={18} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                      <span className="font-semibold text-sm">Instagram</span>
                    </a>
                  )}
                  {influencer.youtube_url && (
                    <a href={influencer.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors group">
                      <Youtube size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                      <span className="font-semibold text-sm">YouTube</span>
                    </a>
                  )}
                  {influencer.twitter_url && (
                    <a href={influencer.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors group">
                      <Twitter size={18} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                      <span className="font-semibold text-sm">Twitter</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BrandView = ({ brand, campaigns, isOwner }: { brand: any, campaigns: any[], isOwner: boolean }) => {
  const navigate = useNavigate();
  const initials = brand.business_name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="animate-in fade-in duration-500">
      <div className="h-48 md:h-64 relative bg-slate-50 border-b border-slate-200/60" />

      <div className="container -mt-24 relative z-10 px-4 md:px-8 pb-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-32 h-32 relative group mb-6">
            <div className="absolute inset-0 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
               <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-display font-bold text-4xl">
                {initials}
              </div>
            </div>
          </div>
          
          <h1 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2 mb-2">
            {brand.business_name}
            <ShieldCheck size={24} className="text-teal-500" fill="currentColor" />
          </h1>
          <Badge variant="outline" className="rounded-lg bg-teal-50 border-teal-100 text-teal-700 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
            {brand.business_type}
          </Badge>
          
          <div className="flex items-center gap-4 text-slate-500 text-sm font-medium mb-10">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span>{brand.city}</span>
            </div>
            {brand.website && (
              <>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-teal-600 transition-colors">
                  <Globe size={14} /> {brand.website.replace(/^https?:\/\//, '')}
                </a>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4">About the Brand</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap max-w-none text-base">
                {brand.description || "No description provided."}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-6">Active Campaigns ({campaigns.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((campaign) => (
                  <Link key={campaign.id} to={`/campaign/${campaign.id}`} className="group">
                    <div className="p-6 rounded-2xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 transition-all shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors line-clamp-1">{campaign.description}</h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">{campaign.niche}</Badge>
                        <div className="text-sm font-extrabold text-slate-900">₹{campaign.budget.toLocaleString()}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {campaigns.length === 0 && (
                  <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No active campaigns at the moment.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm sticky top-24">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Contact Info</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><Mail size={16} /></div>
                  <span className="text-slate-600 font-medium truncate">{brand.email}</span>
                </div>
                {brand.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><Phone size={16} /></div>
                    <span className="text-slate-600 font-medium">{brand.phone}</span>
                  </div>
                )}
              </div>

              {isOwner ? (
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl transition-all" onClick={() => navigate("/dashboard")}>
                  Manage Campaigns
                </Button>
              ) : (
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-teal-600/20 transition-all">
                  Contact Business
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* These icons are not imported so I'll add them to the top import list */

export default UnifiedProfile;
