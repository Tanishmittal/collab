import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Instagram, Youtube, Twitter, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvatarUpload from "@/components/AvatarUpload";
import SocialVerification from "@/components/SocialVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = [
  { id: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-500" },
  { id: "YouTube", icon: Youtube, color: "from-red-500 to-red-600" },
  { id: "Twitter", icon: Twitter, color: "from-sky-400 to-sky-500" },
];

const EditInfluencerProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const verificationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to verification section if query param is set
  useEffect(() => {
    if (!loading && searchParams.get("section") === "verification" && verificationRef.current) {
      verificationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, searchParams]);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [niche, setNiche] = useState("");
  const [followers, setFollowers] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [priceReel, setPriceReel] = useState("");
  const [priceStory, setPriceStory] = useState("");
  const [priceVisit, setPriceVisit] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: "No profile found", description: "Please register as an influencer first.", variant: "destructive" });
        navigate("/register");
        return;
      }

      setProfileId(data.id);
      setName(data.name);
      setCity(data.city);
      setBio(data.bio || "");
      setNiche(data.niche);
      setFollowers(data.followers);
      setEngagementRate(data.engagement_rate || "");
      setPlatforms(data.platforms || []);
      setPriceReel(String(data.price_reel));
      setPriceStory(String(data.price_story));
      setPriceVisit(String(data.price_visit));
      setAvatarUrl((data as any).avatar_url || null);
      setInstagramUrl((data as any).instagram_url || "");
      setYoutubeUrl((data as any).youtube_url || "");
      setTwitterUrl((data as any).twitter_url || "");
      setVerificationCode((data as any).verification_code || "");
      setIsVerified((data as any).is_verified || false);
      setLoading(false);
    };
    fetchProfile();
  }, [user, authLoading]);

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleSave = async () => {
    if (!user || !profileId) return;

    if (!name.trim() || !city || !niche || !followers.trim() || !priceReel || !priceStory || !priceVisit || platforms.length === 0) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("influencer_profiles")
      .update({
        name: name.trim().slice(0, 100),
        city,
        bio: bio.trim().slice(0, 300),
        niche,
        followers: followers.trim(),
        engagement_rate: engagementRate,
        platforms,
        price_reel: parseInt(priceReel) || 0,
        price_story: parseInt(priceStory) || 0,
        price_visit: parseInt(priceVisit) || 0,
        instagram_url: instagramUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        avatar_url: avatarUrl,
      } as any)
      .eq("id", profileId);

    // Also update display name in profiles
    if (!error) {
      await supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", user.id);
    }

    setSaving(false);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!", description: "Your changes are now live." });
      navigate(`/influencer/${profileId}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl py-12 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="gradient-hero py-10">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground mb-4" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
            <div className="flex items-center gap-5">
              {user && (
                <AvatarUpload
                  userId={user.id}
                  currentUrl={avatarUrl}
                  initials={name.split(" ").map(n => n[0]).join("")}
                  onUploaded={(url) => setAvatarUrl(url)}
                />
              )}
              <div>
                <h1 className="text-3xl font-display font-bold text-primary-foreground">Edit Your Profile</h1>
                <p className="text-primary-foreground/60 mt-1">Tap the photo to change it</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-2xl -mt-6 pb-16 relative z-10 space-y-5">
        {/* Personal Info */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} maxLength={100} className="mt-1.5" />
            </div>
            <div>
              <Label>City *</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} className="mt-1.5 resize-none" rows={3} />
              <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/300</p>
            </div>
          </CardContent>
        </Card>

        {/* Platforms & Niche */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Platforms & Niche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Platforms *</Label>
              <div className="grid grid-cols-3 gap-3 mt-1.5">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  const selected = platforms.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-card"
                      }`}>
                      <Icon className={`w-6 h-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>{p.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Niche *</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Followers *</Label>
                <Input value={followers} onChange={e => setFollowers(e.target.value)} maxLength={20} className="mt-1.5" placeholder="e.g. 32K" />
              </div>
              <div>
                <Label>Engagement Rate (%)</Label>
                <Input type="number" step="0.1" min="0" max="100" value={engagementRate} onChange={e => setEngagementRate(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Reel Promotion", emoji: "🎬", desc: "Short-form video content", value: priceReel, setter: setPriceReel },
              { label: "Story Promotion", emoji: "📱", desc: "24-hour story feature", value: priceStory, setter: setPriceStory },
              { label: "Visit & Review", emoji: "📍", desc: "In-person visit with content", value: priceVisit, setter: setPriceVisit },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 w-32">
                  <span className="text-muted-foreground font-medium">₹</span>
                  <Input type="number" min="0" value={item.value} onChange={e => item.setter(e.target.value)} className="text-right" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Social Verification */}
        <div ref={verificationRef}>
        <SocialVerification
          verificationCode={verificationCode}
          isVerified={isVerified}
          instagramUrl={instagramUrl}
          youtubeUrl={youtubeUrl}
          twitterUrl={twitterUrl}
          onInstagramChange={setInstagramUrl}
          onYoutubeChange={setYoutubeUrl}
          onTwitterChange={setTwitterUrl}
          onVerified={() => setIsVerified(true)}
          onUnverified={() => {
            setIsVerified(false);
            setFollowers("");
            setEngagementRate("");
          }}
          onStatsFetched={(stats) => {
            if (stats.followers) setFollowers(stats.followers);
            if (stats.engagementRate) setEngagementRate(stats.engagementRate);
          }}
        />
        </div>

        <Button className="w-full gradient-primary border-0 text-primary-foreground font-semibold py-6 text-base" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
};

export default EditInfluencerProfile;
