import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Star, Instagram, Youtube, Twitter,
  IndianRupee, Play, Image, Film, Video, Eye, Heart, Share2, Pencil, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Influencer } from "@/data/mockData";
import { getReviewsForInfluencer, getPortfolioForInfluencer } from "@/data/profileData";
import ReviewList from "@/components/ReviewList";
import { supabase } from "@/integrations/supabase/client";

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

const InfluencerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [socialUrls, setSocialUrls] = useState<{ instagram?: string; youtube?: string; twitter?: string }>({});

  useEffect(() => {
    const fetchInfluencer = async () => {
      setLoading(true);
      // Try fetching from database first
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (!error && data) {
        setOwnerUserId(data.user_id);
        setAvatarUrl((data as any).avatar_url || null);
        setIsVerified((data as any).is_verified || false);
        setSocialUrls({
          instagram: data.instagram_url || undefined,
          youtube: data.youtube_url || undefined,
          twitter: data.twitter_url || undefined,
        });
        
        setInfluencer({
          id: data.id,
          name: data.name,
          city: data.city,
          niche: data.niche,
          followers: data.followers,
          engagementRate: parseFloat(data.engagement_rate || "4.5"),
          platforms: data.platforms || [],
          priceReel: data.price_reel,
          priceStory: data.price_story,
          priceVisit: data.price_visit,
          avatar: "",
          rating: Number(data.rating) || 4.5,
          completedCampaigns: data.completed_campaigns || 0,
          bio: data.bio || "",
          isVerified: (data as any).is_verified || false,
        });
      }
      setLoading(false);
    };
    if (id) fetchInfluencer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Profile" />
        <div className="h-48 md:h-56 bg-muted" />
        <div className="container -mt-16 relative z-10 space-y-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Profile" />
        <div className="container py-20 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="font-display font-bold text-2xl text-foreground">Influencer not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Discovery</Link>
        </div>
      </div>
    );
  }

  const reviews = getReviewsForInfluencer(influencer.id);
  const portfolio = getPortfolioForInfluencer(influencer.id);
  const initials = influencer.name.split(" ").map(n => n[0]).join("");
  const gradientClass = nicheColors[influencer.niche] || "from-primary to-accent";
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : influencer.rating;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      {!user && <Navbar variant="minimal" title="Profile" />}

      {/* Hero Banner */}
      <div className={`h-48 md:h-56 relative overflow-hidden bg-gradient-to-r ${gradientClass}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="container relative h-full flex items-end pb-0">
          <Link to="/" className="absolute top-4 left-4 md:left-8 flex items-center gap-1.5 text-sm font-medium bg-background/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-foreground hover:bg-background/40 transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      <div className="container -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card overflow-visible">
                <CardContent className="p-6 pt-0">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 -mt-16 relative group">
                      <div className="absolute inset-0 bg-card rounded-[2rem] ring-4 ring-background shadow-2xl" />
                      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={influencer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-4xl">
                            {initials}
                          </div>
                        )}
                      </div>
                    </div>
                    <h1 className="font-display font-bold text-xl mt-3 text-foreground flex items-center gap-2">
                      {influencer.name}
                      {isVerified && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 bg-success/15 text-success rounded-full px-2 py-0.5 cursor-help">
                                <ShieldCheck size={14} fill="currentColor" className="opacity-90" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Verified</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[220px]">
                              <p className="text-xs font-medium">Verified Creator</p>
                              <p className="text-[10px] text-muted-foreground">This influencer's identity has been confirmed through social media link-in-bio verification.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </h1>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                      <MapPin size={14} />
                      <span>{influencer.city}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < Math.round(influencer.rating) ? "text-warning fill-warning" : "text-muted"} />
                      ))}
                      <span className="text-sm font-semibold ml-1 text-foreground">{influencer.rating}</span>
                      <span className="text-xs text-muted-foreground">({reviews.length})</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                      <Badge variant="secondary">{influencer.niche}</Badge>
                      {influencer.platforms.map(p => (
                        <Badge key={p} variant="outline" className="gap-1">
                          {platformIcon(p, 12)} {p}
                        </Badge>
                      ))}
                    </div>

                    {/* Verified Social Links */}
                    {isVerified && (socialUrls.instagram || socialUrls.youtube || socialUrls.twitter) ? (
                      <div className="w-full mt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Verified Socials</p>
                        {socialUrls.instagram && (
                          <a href={socialUrls.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <Instagram size={16} className="text-pink-500" />
                            <span className="text-sm text-foreground flex-1 truncate">Instagram</span>
                            <ShieldCheck size={14} className="text-success" />
                          </a>
                        )}
                        {socialUrls.youtube && (
                          <a href={socialUrls.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <Youtube size={16} className="text-red-500" />
                            <span className="text-sm text-foreground flex-1 truncate">YouTube</span>
                            <ShieldCheck size={14} className="text-success" />
                          </a>
                        )}
                        {socialUrls.twitter && (
                          <a href={socialUrls.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <Twitter size={16} className="text-sky-500" />
                            <span className="text-sm text-foreground flex-1 truncate">X (Twitter)</span>
                            <ShieldCheck size={14} className="text-success" />
                          </a>
                        )}
                      </div>
                    ) : user && ownerUserId === user.id && !isVerified ? (
                      <div className="w-full mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => navigate(`/edit-profile?section=verification`)}
                        >
                          <ShieldCheck size={14} />
                          Verify Your Socials
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-sm text-muted-foreground text-center mt-4">{influencer.bio}</p>

                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <div className="text-center p-2.5 rounded-lg bg-muted/50">
                      <div className="font-display font-bold text-lg text-foreground">
                        {influencer.isVerified && influencer.followers ? influencer.followers : "0"}
                      </div>
                      <span className="text-xs text-muted-foreground">Followers</span>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-muted/50">
                      <div className="font-display font-bold text-lg text-foreground">
                        {influencer.isVerified && influencer.engagementRate ? `${influencer.engagementRate}%` : "0"}
                      </div>
                      <span className="text-xs text-muted-foreground">Engagement</span>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-muted/50">
                      <div className="font-display font-bold text-lg text-foreground">{influencer.completedCampaigns || 0}</div>
                      <span className="text-xs text-muted-foreground">Campaigns</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing & Book */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold text-foreground mb-3">Pricing</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Reel Promotion", price: influencer.priceReel, icon: Film, desc: "30-60s Instagram Reel" },
                      { label: "Story Promotion", price: influencer.priceStory, icon: Play, desc: "24h Instagram Story" },
                      { label: "Visit & Review", price: influencer.priceVisit, icon: MapPin, desc: "On-location visit + content" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <item.icon size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.desc}</div>
                          </div>
                        </div>
                        <div className="font-display font-bold text-foreground flex items-center">
                          <IndianRupee size={14} />{item.price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  {user && ownerUserId === user.id ? (
                    <Button className="w-full mt-4 gradient-primary border-0 text-primary-foreground font-semibold" onClick={() => navigate("/edit-profile")}>
                      <Pencil size={14} className="mr-2" /> Edit Profile
                    </Button>
                  ) : user ? (
                    <Button className="w-full mt-4 gradient-primary border-0 text-primary-foreground font-semibold" onClick={() => setBookingOpen(true)}>
                      Book Now
                    </Button>
                  ) : (
                    <Button className="w-full mt-4 gradient-primary border-0 text-primary-foreground font-semibold" onClick={() => navigate("/auth")}>
                      Sign In to Book
                    </Button>
                  )}
                  <Button variant="outline" className="w-full mt-2 gap-2" size="sm">
                    <Share2 size={14} /> Share Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Tabs defaultValue="portfolio" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="portfolio" className="font-display">Portfolio ({portfolio.length})</TabsTrigger>
                  <TabsTrigger value="reviews" className="font-display">Reviews ({reviews.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portfolio.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className={`aspect-square bg-gradient-to-br ${gradientClass} relative flex items-center justify-center`}>
                          <div className="text-center text-primary-foreground/80">
                            {contentTypeIcon(item.type)}
                            <div className="text-xs font-medium mt-1 capitalize">{item.type}</div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-background/80 backdrop-blur-sm">
                              {item.platform}
                            </Badge>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <div className="flex items-center gap-3 text-xs text-foreground">
                              <span className="flex items-center gap-1"><Eye size={12} />{item.views}</span>
                              <span className="flex items-center gap-1"><Heart size={12} />{item.likes}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-medium text-foreground truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.brand}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews">
                  {/* Real reviews from database */}
                  {ownerUserId && <ReviewList userId={ownerUserId} />}

                  {/* Fallback mock reviews */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="glass-card md:col-span-1">
                      <CardContent className="p-5 text-center">
                        <div className="font-display font-bold text-4xl text-foreground">{avgRating}</div>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < Math.round(Number(avgRating)) ? "text-warning fill-warning" : "text-muted"} />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{reviews.length} mock reviews</div>
                        <div className="mt-4 space-y-1.5">
                          {ratingDist.map(r => (
                            <div key={r.star} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-muted-foreground">{r.star}</span>
                              <Star size={10} className="text-warning fill-warning" />
                              <Progress value={r.pct} className="h-1.5 flex-1" />
                              <span className="w-4 text-muted-foreground text-right">{r.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-3">
                      {reviews.map((review, i) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="glass-card">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg">
                                    {review.brandLogo}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-sm text-foreground">{review.brand}</div>
                                    <div className="text-xs text-muted-foreground">{review.campaign} · {review.date}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={12} className={j < review.rating ? "text-warning fill-warning" : "text-muted"} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{review.comment}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="h-12" />

      <BookingModal influencer={influencer} influencerUserId={ownerUserId || undefined} open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
};

export default InfluencerProfile;
