import { useState, useMemo, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Users, Zap, TrendingUp, Star, MapPin, Shield, Sparkles, Building2, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import InfluencerCard from "@/components/InfluencerCard";
import CampaignCard from "@/components/CampaignCard";
import SearchFilters from "@/components/SearchFilters";
import type { Influencer, Campaign } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const parseFollowers = (f: string) => {
  const num = parseFloat(f);
  if (f.includes("K")) return num * 1000;
  if (f.includes("M")) return num * 1000000;
  return num;
};

const stats = [
{ value: "500+", label: "Active Creators", icon: Users },
{ value: "₹2M+", label: "Campaign Value", icon: TrendingUp },
{ value: "50+", label: "Cities Covered", icon: MapPin },
{ value: "4.8★", label: "Avg. Rating", icon: Star }];


const steps = [
{ step: "01", title: "Create Your Profile", desc: "Sign up as a brand or influencer and set up your profile in minutes.", icon: User, color: "from-primary/20 to-primary/5" },
{ step: "02", title: "Discover & Connect", desc: "Browse influencers by city, niche, and budget — or find campaigns that match your style.", icon: Sparkles, color: "from-accent/20 to-accent/5" },
{ step: "03", title: "Collaborate & Grow", desc: "Book creators, manage campaigns, and track results — all in one place.", icon: TrendingUp, color: "from-primary/20 to-accent/5" }];


const testimonials = [
{
  quote: "InfluFlow helped us find the perfect food creators in Mumbai. Our cafe launch went viral with 3 reels hitting 100K+ views!",
  name: "Priya Mehta",
  role: "Founder, Chai & Co.",
  avatar: "☕"
},
{
  quote: "As a micro-influencer, I struggled to find brand deals. Now I get 3-4 campaign invites every week through the platform.",
  name: "Rahul Sharma",
  role: "Lifestyle Creator, 45K followers",
  avatar: "📸"
},
{
  quote: "The hyperlocal approach is what sets this apart. We target city-specific creators and the engagement rates are 3x higher.",
  name: "Ankit Gupta",
  role: "Marketing Head, FreshBite",
  avatar: "🍔"
}];


const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const orbY3 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const orbY4 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [sortBy, setSortBy] = useState("followers");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"influencers" | "campaigns">("influencers");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownInfluencerId, setOwnInfluencerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [infRes, campRes] = await Promise.all([
      supabase.from("influencer_profiles").select("*"),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false })]
      );

      if (!infRes.error && infRes.data) {
        setInfluencers(infRes.data.map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city,
          niche: row.niche,
          followers: row.followers,
          engagementRate: parseFloat(row.engagement_rate || "4.5"),
          platforms: row.platforms || [],
          priceReel: row.price_reel,
          priceStory: row.price_story,
          priceVisit: row.price_visit,
          avatar: (row as any).avatar_url || "",
          coverUrl: (row as any).cover_url || "",
          rating: Number(row.rating) || 4.5,
          completedCampaigns: row.completed_campaigns || 0,
          bio: row.bio || "",
          isVerified: (row as any).is_verified || false
        }) as Influencer));
      }

      if (!campRes.error && campRes.data) {
        setCampaigns(campRes.data.map((row) => ({
          id: row.id,
          brand: row.brand,
          brandLogo: row.brand_logo || "🏪",
          city: row.city,
          budget: row.budget,
          influencersNeeded: row.influencers_needed,
          influencersApplied: row.influencers_applied,
          deliverables: row.deliverables || [],
          niche: row.niche,
          status: row.status as Campaign["status"] || "active",
          postedAt: new Date(row.created_at).toLocaleDateString(),
          description: row.description || ""
        })));
      }

      // Find own influencer profile
      if (user && infRes.data) {
        const own = infRes.data.find((r) => r.user_id === user.id);
        setOwnInfluencerId(own?.id ?? null);
      } else {
        setOwnInfluencerId(null);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredInfluencers = useMemo(() => {
    let result = influencers.filter((i) => {
      const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = selectedCity === "all" || i.city === selectedCity;
      const matchNiche = selectedNiche === "all" || i.niche === selectedNiche;
      const matchVerified = !verifiedOnly || i.isVerified;
      return matchSearch && matchCity && matchNiche && matchVerified;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "followers":return parseFollowers(b.followers) - parseFollowers(a.followers);
        case "engagement":return b.engagementRate - a.engagementRate;
        case "price-low":return a.priceReel - b.priceReel;
        case "price-high":return b.priceReel - a.priceReel;
        case "rating":return b.rating - a.rating;
        default:return 0;
      }
    });
    // Put own profile first if present
    if (ownInfluencerId) {
      const ownIdx = result.findIndex((i) => i.id === ownInfluencerId);
      if (ownIdx > 0) {
        const [own] = result.splice(ownIdx, 1);
        result.unshift(own);
      }
    }
    return result;
  }, [searchQuery, selectedCity, selectedNiche, sortBy, verifiedOnly, influencers, ownInfluencerId]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch = c.brand.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = selectedCity === "all" || c.city === selectedCity;
      const matchNiche = selectedNiche === "all" || c.niche === selectedNiche;
      return matchSearch && matchCity && matchNiche;
    });
  }, [searchQuery, selectedCity, selectedNiche, campaigns]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {!user && <>
      {/* Hero — Immersive / Atmospheric */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[92vh] flex items-center justify-center">
        <div className="absolute inset-0 gradient-hero-light" />

        <motion.div style={{ y: orbY1 }} className="absolute top-[10%] left-[8%] w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-[140px] animate-float-slow" />
        <motion.div style={{ y: orbY2 }} className="absolute bottom-[5%] right-[10%] w-[36rem] h-[36rem] rounded-full bg-accent/10 blur-[160px] animate-float-slower" />
        <motion.div style={{ y: orbY3 }} className="absolute top-[40%] right-[25%] w-[20rem] h-[20rem] rounded-full bg-primary/8 blur-[120px] animate-float-reverse" />
        <motion.div style={{ y: orbY4 }} className="absolute bottom-[30%] left-[30%] w-[16rem] h-[16rem] rounded-full bg-accent/8 blur-[100px] animate-float-slow" />

        <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `
            linear-gradient(hsl(222 47% 11% / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(222 47% 11% / 0.06) 1px, transparent 1px)
          `,
            backgroundSize: '80px 80px'
          }} />

        <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, hsl(220 20% 97% / 0.3) 70%, hsl(220 20% 97% / 0.7) 100%)'
          }} />

        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <circle cx="720" cy="450" r="300" fill="none" stroke="hsl(16 85% 58%)" strokeWidth="0.5" strokeDasharray="8 12" className="animate-line-draw" />
          <circle cx="720" cy="450" r="420" fill="none" stroke="hsl(280 60% 55%)" strokeWidth="0.3" strokeDasharray="4 16" className="animate-line-draw" style={{ animationDelay: '0.5s' }} />
          <circle cx="720" cy="450" r="550" fill="none" stroke="hsl(222 47% 30%)" strokeWidth="0.2" strokeDasharray="6 20" className="animate-line-draw" style={{ animationDelay: '1s' }} />
        </svg>

        <div className="relative z-10 container text-center max-w-4xl">
          <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
            
            <motion.p
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 0.5, letterSpacing: '0.35em' }}
                transition={{ duration: 1.5, delay: 0.3 }}
                className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-8 font-body font-medium">
              
              Where brands meet local creators
            </motion.p>

            <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              <motion.span
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-secondary">
                
                Discover
              </motion.span>
              <motion.span
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-gradient-divine mt-1">
                
                The Perfect Voice
              </motion.span>
              <motion.span
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-muted-foreground text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-semibold mt-4">
                
                for your brand's story
              </motion.span>
            </h1>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-24 h-[1px] mx-auto mt-10 origin-center"
                style={{ background: 'linear-gradient(90deg, transparent, hsl(16 85% 58%), transparent)' }} />
            

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 1.5 }}
                className="text-muted-foreground text-base md:text-lg mt-8 max-w-xl mx-auto leading-relaxed font-body">
              
              Hyperlocal creator marketing across India's vibrant cities — connecting authentic voices with brands that dare to stand out.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2 }}
                className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              
              <Button
                  size="lg"
                  className="gradient-primary border-0 text-primary-foreground rounded-full px-8 font-semibold"
                  onClick={() => navigate("/auth")}>
                
                Get Started <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8"
                  onClick={() => window.scrollTo({ top: document.getElementById('discover')?.offsetTop ?? 700, behavior: 'smooth' })}>
                
                Explore Creators
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-16 z-20">
        <div className="container">
          <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card rounded-2xl p-6 md:p-8">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, i) =>
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="text-center">
                
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon size={20} className="text-primary" />
                  </div>
                  <div className="font-display font-bold text-2xl md:text-3xl text-foreground">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
                )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      





































      

      {/* Testimonials */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
        










































        
      </section>
      </>}

      {/* Discovery */}
      <motion.section
        id="discover"
        className="container py-12 space-y-6"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}>
        
        <SearchFilters
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          selectedCity={selectedCity} onCityChange={setSelectedCity}
          selectedNiche={selectedNiche} onNicheChange={setSelectedNiche}
          sortBy={sortBy} onSortChange={setSortBy}
          activeTab={activeTab} onTabChange={setActiveTab}
          resultCount={activeTab === "influencers" ? filteredInfluencers.length : filteredCampaigns.length}
          verifiedOnly={verifiedOnly} onVerifiedChange={setVerifiedOnly} />
        

        {loading ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) =>
          <Skeleton key={i} className="h-72 rounded-xl" />
          )}
          </div> :
        activeTab === "influencers" ?
        filteredInfluencers.length > 0 ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredInfluencers.map((inf, i) =>
          <InfluencerCard key={inf.id} influencer={inf} index={i} isOwn={inf.id === ownInfluencerId} />
          )}
            </div> :

        <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Users size={40} className="text-primary" />
              </div>
              {influencers.length === 0 ?
          <>
                  <h3 className="font-display font-semibold text-xl text-foreground">No influencers yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">Be the first creator on the platform! Register your profile and start getting discovered by brands.</p>
                  <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/register/influencer")}>
                    <Zap size={16} className="mr-2" /> Register as Influencer
                  </Button>
                </> :

          <>
                  <h3 className="font-display font-semibold text-xl text-foreground">No influencers found</h3>
                  <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
                  <Button variant="outline" className="mt-4" onClick={() => {setSearchQuery("");setSelectedCity("all");setSelectedNiche("all");}}>
                    Clear Filters
                  </Button>
                </>
          }
            </div> :


        filteredCampaigns.length > 0 ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampaigns.map((c, i) =>
          <CampaignCard key={c.id} campaign={c} index={i} />
          )}
            </div> :

        <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus size={40} className="text-primary" />
              </div>
              {campaigns.length === 0 ?
          <>
                  <h3 className="font-display font-semibold text-xl text-foreground">No campaigns yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">Be the first brand to post a campaign and connect with local influencers.</p>
                  <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/campaigns")}>
                    <Plus size={16} className="mr-2" /> Post a Campaign
                  </Button>
                </> :

          <>
                  <h3 className="font-display font-semibold text-xl text-foreground">No campaigns found</h3>
                  <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
                  <Button variant="outline" className="mt-4" onClick={() => {setSearchQuery("");setSelectedCity("all");setSelectedNiche("all");}}>
                    Clear Filters
                  </Button>
                </>
          }
            </div>

        }
      </motion.section>

      {!user &&
      <section className="container pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl gradient-primary p-10 md:p-16 text-center">
          
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, hsl(0 0% 100% / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, hsl(0 0% 100% / 0.2) 0%, transparent 50%)
            `
          }} />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-primary-foreground">
              Ready to Grow Your Brand?
            </h2>
            <p className="text-primary-foreground/80 mt-3 max-w-lg mx-auto">
              Join hundreds of brands and creators already using InfluFlow to build authentic, hyperlocal marketing campaigns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-8 font-semibold"
                onClick={() => navigate("/register-brand")}>
                <Building2 size={16} className="mr-2" /> Join as Brand
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/register")}>
                <User size={16} className="mr-2" /> Join as Influencer
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
      }
    </div>);

};

export default Index;