import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Settings, 
  Eye, 
  Edit3,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ListInfluencerModal from "@/components/ListInfluencerModal";
import JoinBrandModal from "@/components/JoinBrandModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [influencerProfile, setInfluencerProfile] = useState<any>(null);
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      
      try {
        const [influencerRes, brandRes] = await Promise.all([
          supabase.from("influencer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("brand_profiles").select("*").eq("user_id", user.id).maybeSingle()
        ]);

        setInfluencerProfile(influencerRes.data);
        setBrandProfile(brandRes.data);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user]);

  const IdentityGuide = () => (
    <AnimatePresence>
      {showGuide && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
              <button 
                onClick={() => setShowGuide(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <ArrowRight className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Welcome to your Identity Hub</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    InfluFlow is built for dual-identities. You can earn as a <span className="text-foreground font-medium">Creator</span> and grow your business as a <span className="text-foreground font-medium">Brand</span> using the same account. Use the tabs below to manage both sides of your presence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ProfileState = ({ type, data, isLoading }: { type: 'influencer' | 'brand', data: any, isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      );
    }

    if (!data) {
      const isInfluencer = type === 'influencer';
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"
        >
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center mb-6",
            isInfluencer ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
          )}>
            {isInfluencer ? <User size={40} /> : <Building2 size={40} />}
          </div>
          <h2 className="text-2xl font-bold mb-2">Join as {isInfluencer ? "Influencer" : "Brand"}</h2>
          <p className="text-slate-500 mb-8 max-w-sm">
            {isInfluencer 
              ? "Start showcasing your talent, connecting with premium brands, and earning from your content."
              : "Access the best talent, create impactful campaigns, and scale your brand visibility."}
          </p>
          
          <div className="grid grid-cols-1 gap-3 w-full max-w-xs mb-8">
            <div className="flex items-center gap-3 text-sm text-left bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span>{isInfluencer ? "Apply to open campaigns" : "Post unlimited campaigns"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-left bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span>{isInfluencer ? "Build a professional portfolio" : "Directly message creators"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-left bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span>{isInfluencer ? "Direct brand messaging" : "Track performance analytics"}</span>
            </div>
          </div>

          {isInfluencer ? (
            <ListInfluencerModal
              trigger={
                <Button className="w-full max-w-xs h-12 text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95 bg-pink-600 hover:bg-pink-700">
                  Join now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              }
            />
          ) : (
            <JoinBrandModal
              trigger={
                <Button className="w-full max-w-xs h-12 text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95 bg-blue-600 hover:bg-blue-700">
                  Join now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              }
            />
          )}
        </motion.div>
      );
    }

    // Active Profile State
    const isInfluencer = type === 'influencer';
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card className="overflow-hidden border-none shadow-xl bg-white rounded-3xl">
          <div className={cn(
            "h-24 w-full",
            isInfluencer ? "bg-gradient-to-r from-pink-500 to-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
          )} />
          <CardContent className="px-6 pb-6 -mt-12 relative">
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4 mb-6">
              <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-slate-100 shrink-0">
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt={data.name || data.business_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    {isInfluencer ? <User size={40} /> : <Building2 size={40} />}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left pt-14 sm:pt-12">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{data.name || data.business_name}</h2>
                  {data.is_verified && <ShieldCheck className="w-5 h-5 text-blue-500" />}
                </div>
                <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                  <Badge variant="secondary" className="font-medium">
                    {data.niche || data.business_type}
                  </Badge>
                  {data.city && <span className="text-xs uppercase tracking-wider ml-1">{data.city}</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="rounded-xl h-12 font-bold gap-2"
                onClick={() => navigate(isInfluencer ? `/influencer/${data.id}` : `/dashboard`)}
              >
                <Eye size={18} /> {isInfluencer ? "View Public Profile" : "View Dashboard"}
              </Button>
              <Button 
                className="rounded-xl h-12 font-bold gap-2"
                onClick={() => navigate(isInfluencer ? `/edit-profile` : `/register-brand`)}
              >
                <Edit3 size={18} /> Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {isInfluencer && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Followers</span>
              <span className="text-xl font-black">{data.followers || '0'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Engagement</span>
              <span className="text-xl font-black">{data.engagement_rate || '0%'}</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar variant="minimal" title="Profile" />
      
      <main className="container max-w-2xl pt-6 px-4">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Profile</h1>
            <p className="text-slate-500 font-medium">Manage your identities</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/settings")}>
            <Settings className="w-6 h-6 text-slate-400" />
          </Button>
        </header>

        <IdentityGuide />

        <Tabs defaultValue="influencer" className="w-full">
          <TabsList className="w-full h-14 p-1.5 bg-white shadow-sm border border-slate-100 rounded-2xl mb-8">
            <TabsTrigger 
              value="influencer" 
              className="flex-1 rounded-xl h-full font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all gap-2"
            >
              <User size={18} /> Influencer
            </TabsTrigger>
            <TabsTrigger 
              value="brand" 
              className="flex-1 rounded-xl h-full font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all gap-2"
            >
              <Building2 size={18} /> Brand
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="influencer">
            <ProfileState type="influencer" data={influencerProfile} isLoading={loading} />
          </TabsContent>
          <TabsContent value="brand">
            <ProfileState type="brand" data={brandProfile} isLoading={loading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Helper function for conditional styles
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

export default ProfileHub;
