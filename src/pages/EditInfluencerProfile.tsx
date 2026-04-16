import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvatarUpload from "@/components/AvatarUpload";
import PortfolioMediaUpload from "@/components/PortfolioMediaUpload";
import { SocialVerification } from "@/components/SocialVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import type { Database } from "@/integrations/supabase/types";
import { goBackOr } from "@/lib/navigation";
import { LocationPicker } from "@/components/LocationPicker";

type PortfolioItemRow = Database["public"]["Tables"]["portfolio_items"]["Row"];
type InfluencerProfileRow = Database["public"]["Tables"]["influencer_profiles"]["Row"] & {
  ig_followers?: string | number | null;
  yt_subscribers?: string | number | null;
  twitter_followers?: string | number | null;
};
type PortfolioDraft = Pick<
  PortfolioItemRow,
  "id" | "title" | "description" | "platform" | "media_type" | "media_url" | "thumbnail_url" | "external_url" | "is_featured"
> & {
  input_mode: "upload" | "url";
};

const inferPortfolioMediaType = (url: string) => {
  const cleanUrl = url.split("?")[0].toLowerCase();

  if (/\.(mp4|mov|webm|m4v|avi|mkv)$/.test(cleanUrl)) {
    return "video";
  }

  return "image";
};

const createPortfolioTitle = (description: string, index: number) => {
  const trimmed = description.trim();
  if (!trimmed) {
    return `Portfolio Item ${index + 1}`;
  }

  return trimmed.length > 60 ? `${trimmed.slice(0, 57).trimEnd()}...` : trimmed;
};

const EMPTY_PORTFOLIO_ITEM: PortfolioDraft = {
  id: "",
  title: "",
  description: "",
  platform: "",
  media_type: "image",
  media_url: "",
  thumbnail_url: "",
  external_url: "",
  is_featured: false,
  input_mode: "upload",
};

const EditInfluencerProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading, influencerId } = useAuth();
  const { cities, niches } = useManagedOptions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const verificationRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to verification section if query param is set
  useEffect(() => {
    if (loading) return;

    if (searchParams.get("section") === "verification" && verificationRef.current) {
      verificationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (searchParams.get("section") === "portfolio" && portfolioRef.current) {
      portfolioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, searchParams]);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [niche, setNiche] = useState("");

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [priceReel, setPriceReel] = useState("");
  const [priceStory, setPriceStory] = useState("");
  const [priceVisit, setPriceVisit] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [igFollowers, setIgFollowers] = useState("");
  const [ytSubscribers, setYtSubscribers] = useState("");
  const [twitterFollowers, setTwitterFollowers] = useState("");
  const [igLastVerified, setIgLastVerified] = useState<string | null>(null);
  const [ytLastVerified, setYtLastVerified] = useState<string | null>(null);
  const [twitterLastVerified, setTwitterLastVerified] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioDraft[]>([]);
  const [removedPortfolioItemIds, setRemovedPortfolioItemIds] = useState<string[]>([]);
  const hasVerifiedPlatforms = platforms.length > 0;

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

      const profile = data as InfluencerProfileRow & {
        avatar_url?: string | null;
        instagram_url?: string | null;
        youtube_url?: string | null;
        twitter_url?: string | null;
        verification_code?: string | null;
        ig_followers?: number | null;
        yt_subscribers?: number | null;
        twitter_followers?: number | null;
        ig_last_verified?: string | null;
        yt_last_verified?: string | null;
        twitter_last_verified?: string | null;
      };

      setProfileId(profile.id);
      setName(profile.name);
      setCity(profile.city);
      setBio(profile.bio || "");
      setNiche(profile.niche);

      const initialVerifiedPlatforms = [
        profile.ig_last_verified ? "Instagram" : null,
        profile.yt_last_verified ? "YouTube" : null,
        profile.twitter_last_verified ? "Twitter" : null,
      ].filter(Boolean) as string[];

      setPlatforms(initialVerifiedPlatforms);
      setPriceReel(String(profile.price_reel));
      setPriceStory(String(profile.price_story));
      setPriceVisit(String(profile.price_visit));
      setAvatarUrl(profile.avatar_url || null);
      setInstagramUrl(profile.instagram_url || "");
      setYoutubeUrl(profile.youtube_url || "");
      setTwitterUrl(profile.twitter_url || "");
      setIgFollowers(profile.ig_followers ? String(profile.ig_followers) : "");
      setYtSubscribers(profile.yt_subscribers ? String(profile.yt_subscribers) : "");
      setTwitterFollowers(profile.twitter_followers ? String(profile.twitter_followers) : "");
      setIgLastVerified(profile.ig_last_verified || null);
      setYtLastVerified(profile.yt_last_verified || null);
      setTwitterLastVerified(profile.twitter_last_verified || null);
      setVerificationCode(profile.verification_code || "");
      setIsVerified(initialVerifiedPlatforms.length > 0);

      const { data: portfolioRows } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("influencer_profile_id", profile.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      setPortfolioItems(
        ((portfolioRows || []) as PortfolioItemRow[])
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description || "",
            platform: item.platform || "",
            media_type: item.media_type,
            media_url: item.media_url,
            thumbnail_url: item.thumbnail_url || "",
            external_url: item.external_url || "",
            is_featured: item.is_featured,
            input_mode: "upload",
          }))
      );
      setLoading(false);
    };
    fetchProfile();
  }, [user, authLoading, navigate, toast]);

  const updatePortfolioItem = (index: number, field: keyof PortfolioDraft, value: string | boolean) => {
    setPortfolioItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const addPortfolioItem = () => {
    setPortfolioItems((current) => [...current, { ...EMPTY_PORTFOLIO_ITEM, id: crypto.randomUUID() }]);
  };

  const removePortfolioItem = (index: number) => {
    setPortfolioItems((current) => {
      const item = current[index];
      if (item?.id) {
        setRemovedPortfolioItemIds((removed) => [...removed, item.id as string]);
      }
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSave = async () => {
    if (!user || !profileId) return;

    if (!name.trim() || !city || !niche || !priceReel || !priceStory || !priceVisit) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const verifiedPlatforms = platforms;
    
    // Parse numeric inputs
    const igCount = parseInt(igFollowers) || 0;
    const ytCount = parseInt(ytSubscribers) || 0;
    const twCount = parseInt(twitterFollowers) || 0;
    
    // Calculate totals
    const totalCount = igCount + ytCount + twCount;
    const verifiedCount = (
      (igLastVerified ? igCount : 0) +
      (ytLastVerified ? ytCount : 0) +
      (twitterLastVerified ? twCount : 0)
    );

    setSaving(true);
    const { error } = await supabase
      .from("influencer_profiles")
      .update({
        name: name.trim().slice(0, 100),
        city,
        bio: bio.trim().slice(0, 300),
        niche,
        total_followers_count: totalCount,
        total_verified_followers_count: verifiedCount,
        ig_followers: igCount,
        yt_subscribers: ytCount,
        twitter_followers: twCount,
        ig_last_verified: igLastVerified,
        yt_last_verified: ytLastVerified,
        twitter_last_verified: twitterLastVerified,
        platforms: verifiedPlatforms,
        price_reel: parseInt(priceReel) || 0,
        price_story: parseInt(priceStory) || 0,
        price_visit: parseInt(priceVisit) || 0,
        is_verified: verifiedPlatforms.length > 0,
        instagram_url: instagramUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", profileId);

    if (!error) {
      await Promise.all([
        supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", user.id),
        removedPortfolioItemIds.length > 0
          ? supabase.from("portfolio_items").delete().in("id", removedPortfolioItemIds)
          : Promise.resolve(),
        portfolioItems.length > 0
          ? supabase.from("portfolio_items").upsert(
            portfolioItems
              .filter((item) => item.media_url.trim())
              .map((item, index) => ({
                id: item.id || undefined,
                influencer_profile_id: profileId,
                title: createPortfolioTitle(item.description || "", index),
                description: item.description?.trim() || null,
                platform: null,
                media_type: inferPortfolioMediaType(item.media_url),
                media_url: item.media_url.trim(),
                thumbnail_url: null,
                external_url: null,
                is_featured: false,
                sort_order: index,
              })),
            { onConflict: "id" }
          )
          : Promise.resolve(),
      ]);
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
        <Navbar variant="minimal" title="Edit Profile" />
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
      <Navbar variant="minimal" title="Edit Profile" />

      <div className="container max-w-5xl py-6 pb-16 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 hidden px-0 text-muted-foreground hover:text-foreground md:inline-flex"
          onClick={() => goBackOr(navigate, influencerId ? `/influencer/${influencerId}?tab=influencer` : "/dashboard")}
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            {user && (
              <AvatarUpload
                userId={user.id}
                currentUrl={avatarUrl}
                initials={name.split(" ").map(n => n[0]).join("")}
                onUploaded={(url) => setAvatarUrl(url)}
              />
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Edit Influencer Profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">Update your public profile and pricing.</p>
            </div>
          </div>
        </div>

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
              <LocationPicker
                value={city}
                onChange={setCity}
                className="mt-1.5 w-full justify-between rounded-md h-10 px-3 bg-background border-input"
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} className="mt-1.5 resize-none" rows={3} />
              <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/300</p>
            </div>
            <div>
              <Label>Niche *</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{niches.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
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
              { label: "Reel Promotion", emoji: "Reel", desc: "Short-form video content", value: priceReel, setter: setPriceReel },
              { label: "Story Promotion", emoji: "Story", desc: "24-hour story feature", value: priceStory, setter: setPriceStory },
              { label: "Visit & Review", emoji: "Visit", desc: "In-person visit with content", value: priceVisit, setter: setPriceVisit },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 w-32">
                  <span className="text-muted-foreground font-medium">Rs</span>
                  <Input type="number" min="0" value={item.value} onChange={e => item.setter(e.target.value)} className="text-right" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <div ref={portfolioRef} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="font-display text-lg">Portfolio</CardTitle>
              <Button type="button" variant="outline" onClick={addPortfolioItem}>Add Item</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolioItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-muted-foreground">
                Add portfolio items to showcase your best creator work.
              </div>
            ) : (
              portfolioItems.map((item, index) => (
                <div key={item.id || index} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">Portfolio Item {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={saving || !item.media_url.trim()}
                        onClick={handleSave}
                      >
                        {saving ? "Saving..." : "Save Item"}
                      </Button>
                      <Button type="button" variant="ghost" className="text-slate-500 hover:text-destructive" onClick={() => removePortfolioItem(index)}>Remove</Button>
                    </div>
                  </div>
                  {user && (
                    <div className="space-y-3">
                      {item.input_mode === "upload" && (
                        <PortfolioMediaUpload
                          userId={user.id}
                          itemId={item.id || `portfolio-${index}`}
                          kind="media"
                          mediaType="auto"
                          currentUrl={item.media_url}
                          onUploaded={(url) => {
                            updatePortfolioItem(index, "media_url", url);
                            updatePortfolioItem(index, "media_type", inferPortfolioMediaType(url));
                            updatePortfolioItem(index, "input_mode", "upload");
                          }}
                        />
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.input_mode === "upload" ? "Uploaded media will be shown on your profile." : "Use this if your work sample lives on another platform."}</span>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs text-teal-700"
                          onClick={() => updatePortfolioItem(index, "input_mode", item.input_mode === "upload" ? "url" : "upload")}
                        >
                          {item.input_mode === "upload" ? "Use external link instead" : "Switch back to file upload"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {item.input_mode === "url" ? (
                    <div>
                      <Label>External Media URL *</Label>
                      <Input
                        value={item.media_url}
                        onChange={(e) => {
                          updatePortfolioItem(index, "media_url", e.target.value);
                          updatePortfolioItem(index, "media_type", inferPortfolioMediaType(e.target.value));
                        }}
                        className="mt-1.5"
                        placeholder="Paste an Instagram, YouTube, or hosted media URL"
                      />
                    </div>
                  ) : null}
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => updatePortfolioItem(index, "description", e.target.value)}
                      className="mt-1.5 resize-none"
                      rows={3}
                      placeholder="What was this project and what did you create?"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Social Verification */}
        <div ref={verificationRef}>
          <SocialVerification
            verificationCode={verificationCode}
            isVerified={isVerified}
            verifiedPlatforms={platforms}
            instagramUrl={instagramUrl}
            youtubeUrl={youtubeUrl}
            twitterUrl={twitterUrl}
            onInstagramChange={setInstagramUrl}
            onYoutubeChange={setYoutubeUrl}
            onTwitterChange={setTwitterUrl}
            igFollowers={igFollowers}
            ytSubscribers={ytSubscribers}
            twitterFollowers={twitterFollowers}
            onIgFollowersChange={setIgFollowers}
            onYtSubscribersChange={setYtSubscribers}
            onTwitterFollowersChange={setTwitterFollowers}
            onVerified={() => setIsVerified(true)}
            onVerifiedPlatformsChange={setPlatforms}
            onUnverified={(platformId) => {
              // Clear verification for specific platform
              if (platformId === "instagram") {
                setIgLastVerified(null);
                setPlatforms(p => p.filter(x => x !== "Instagram"));
              } else if (platformId === "youtube") {
                setYtLastVerified(null);
                setPlatforms(p => p.filter(x => x !== "YouTube"));
              } else if (platformId === "twitter") {
                setTwitterLastVerified(null);
                setPlatforms(p => p.filter(x => x !== "Twitter"));
              }
            }}
            onStatsFetched={(stats) => {
              if (stats.platform === "instagram") {
                if (stats.followers) setIgFollowers(String(stats.followers));
                setIgLastVerified(new Date().toISOString());
                if (!platforms.includes("Instagram")) setPlatforms(p => [...p, "Instagram"]);
              }
              if (stats.platform === "youtube") {
                if (stats.followers) setYtSubscribers(String(stats.followers));
                setYtLastVerified(new Date().toISOString());
                if (!platforms.includes("YouTube")) setPlatforms(p => [...p, "YouTube"]);
              }
              if (stats.platform === "twitter") {
                if (stats.followers) setTwitterFollowers(String(stats.followers));
                setTwitterLastVerified(new Date().toISOString());
                if (!platforms.includes("Twitter")) setPlatforms(p => [...p, "Twitter"]);
              }
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



