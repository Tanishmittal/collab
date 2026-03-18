import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  Star,
  Instagram,
  Youtube,
  Twitter,
  Play,
  Image,
  Film,
  Video,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  Building2,
  Target,
  Briefcase,
  Users,
  UserCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import ReviewList from "@/components/ReviewList";
import { getReviewsForInfluencer, getPortfolioForInfluencer } from "@/data/profileData";

const platformIcon = (platform: string, size = 16) => {
  if (platform === "Instagram") return <Instagram size={size} />;
  if (platform === "YouTube") return <Youtube size={size} />;
  if (platform === "Twitter") return <Twitter size={size} />;
  return null;
};

const contentTypeIcon = (type: string) => {
  switch (type) {
    case "reel":
      return <Film size={14} />;
    case "story":
      return <Play size={14} />;
    case "post":
      return <Image size={14} />;
    case "video":
      return <Video size={14} />;
    default:
      return <Film size={14} />;
  }
};

const UnifiedProfile = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("influencer");
  const [influencer, setInfluencer] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const isInfluencerRoute = location.pathname.includes("/influencer/");
  const isBrandRoute = location.pathname.includes("/brand/");
  const requestedTab = searchParams.get("tab");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let targetUserId: string | null = null;

        let resolvedTab: "influencer" | "brand" = "influencer";

        if (requestedTab === "brand") {
          resolvedTab = "brand";
        } else if (requestedTab === "influencer") {
          resolvedTab = "influencer";
        } else if (isBrandRoute) {
          resolvedTab = "brand";
        }

        if (isInfluencerRoute) {
          const { data } = await supabase
            .from("influencer_profiles")
            .select("user_id")
            .eq("id", id!)
            .maybeSingle();
          targetUserId = data?.user_id || null;
        } else if (isBrandRoute) {
          const { data } = await supabase
            .from("brand_profiles")
            .select("user_id")
            .eq("id", id!)
            .maybeSingle();
          targetUserId = data?.user_id || null;
        }

        setActiveTab(resolvedTab);

        if (!targetUserId) {
          setLoading(false);
          return;
        }

        setIsOwner(user?.id === targetUserId);

        const [infRes, brandRes, campRes] = await Promise.all([
          supabase.from("influencer_profiles").select("*").eq("user_id", targetUserId).maybeSingle(),
          supabase.from("brand_profiles").select("*").eq("user_id", targetUserId).maybeSingle(),
          supabase.from("campaigns").select("*").eq("user_id", targetUserId).eq("status", "active"),
        ]);

        setInfluencer(infRes.data);
        setBrand(brandRes.data);

        const nextCampaigns = campRes.data || [];
        if (nextCampaigns.length > 0) {
          const { data: applicationRows } = await supabase
            .from("campaign_applications")
            .select("campaign_id")
            .in("campaign_id", nextCampaigns.map((campaign) => campaign.id));

          const applicationCounts = new Map<string, number>();
          (applicationRows || []).forEach((application) => {
            const nextCount = (applicationCounts.get(application.campaign_id) || 0) + 1;
            applicationCounts.set(application.campaign_id, nextCount);
          });

          setCampaigns(
            nextCampaigns.map((campaign) => ({
              ...campaign,
              influencers_applied: applicationCounts.get(campaign.id) || 0,
            }))
          );
        } else {
          setCampaigns([]);
        }
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
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="mb-4 h-28 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasBothProfiles = Boolean(influencer && brand);

  return (
    <div className="min-h-screen bg-white pb-12">
      {!user && <Navbar variant="minimal" title="Profile" />}

      {isOwner && hasBothProfiles && (
        <div className="container px-4 pt-4 md:px-6">
          <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("influencer")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                activeTab === "influencer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserCircle2 size={16} /> Influencer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("brand")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                activeTab === "brand" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Building2 size={16} /> Brand
            </button>
          </div>
        </div>
      )}

      {activeTab === "influencer" && influencer ? (
        <InfluencerView influencer={influencer} isOwner={isOwner} />
      ) : brand ? (
        <BrandView brand={brand} campaigns={campaigns} isOwner={isOwner} />
      ) : (
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
};

const InfluencerView = ({ influencer, isOwner }: { influencer: any; isOwner: boolean }) => {
  const navigate = useNavigate();
  const initials = influencer.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const reviews = getReviewsForInfluencer(influencer.id);
  const portfolio = getPortfolioForInfluencer(influencer.id);

  return (
    <div>
      <div className="container px-4 pb-6 pt-4 md:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Profile Info</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      {influencer.avatar_url ? (
                        <img src={influencer.avatar_url} alt={influencer.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl font-bold text-slate-900">{influencer.name}</h2>
                        {influencer.is_verified && <ShieldCheck size={18} className="text-teal-500" fill="currentColor" />}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          {influencer.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {influencer.rating || "4.5"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="h-6 rounded-md border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-600">
                          {influencer.niche}
                        </Badge>
                        {influencer.platforms?.map((platform: string) => (
                          <Badge key={platform} variant="outline" className="h-6 rounded-md border-slate-200 bg-white px-2.5 text-[11px] text-slate-600">
                            <span className="mr-1">{platformIcon(platform, 12)}</span>
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-slate-600">
                      {influencer.bio || "No bio provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
                    <StatCard label="Followers" value={`${(influencer.followers / 1000).toFixed(1)}K`} />
                    <StatCard label="Engagement" value={`${influencer.engagement_rate || "4.5"}%`} />
                    <StatCard label="Campaigns" value={String(influencer.completed_campaigns || 0)} />
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Service Pricing</h3>
                    <div className="mb-5 space-y-3">
                      <PriceRow icon={<Film size={16} />} label="Instagram Reel" value={influencer.price_reel} tone="teal" />
                      <PriceRow icon={<Play size={16} />} label="Instagram Story" value={influencer.price_story} tone="amber" />
                    </div>

                    {isOwner ? (
                      <Button className="h-11 w-full rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800" onClick={() => navigate("/edit-profile")}>
                        Edit Your Profile
                      </Button>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        Booking happens after campaign acceptance.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {influencer.is_verified && (influencer.instagram_url || influencer.youtube_url || influencer.twitter_url) && (
              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Connected Accounts</h3>
                <div className="space-y-2.5">
                  {influencer.instagram_url && <PlainSocialLink href={influencer.instagram_url} label="Instagram" icon={<Instagram size={18} className="text-slate-400 transition-colors group-hover:text-pink-500" />} />}
                  {influencer.youtube_url && <PlainSocialLink href={influencer.youtube_url} label="YouTube" icon={<Youtube size={18} className="text-slate-400 transition-colors group-hover:text-red-500" />} />}
                  {influencer.twitter_url && <PlainSocialLink href={influencer.twitter_url} label="Twitter" icon={<Twitter size={18} className="text-slate-400 transition-colors group-hover:text-sky-500" />} />}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5 lg:col-span-7">
            <section className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4">
              <h2 className="text-base font-semibold text-slate-900">Creator Overview</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Browse verified socials, featured work, and client feedback to get a quick sense of this creator's style and fit.
              </p>
            </section>

            {influencer.is_verified && (influencer.instagram_url || influencer.youtube_url || influencer.twitter_url) && (
              <section>
              <h2 className="mb-3 text-base font-semibold text-slate-900">Verified Socials</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {influencer.instagram_url && (
                    <SocialLink href={influencer.instagram_url} label="Instagram" icon={<Instagram size={18} className="text-pink-500" />} />
                  )}
                  {influencer.youtube_url && (
                    <SocialLink href={influencer.youtube_url} label="YouTube" icon={<Youtube size={18} className="text-red-500" />} />
                  )}
                  {influencer.twitter_url && (
                    <SocialLink href={influencer.twitter_url} label="X (Twitter)" icon={<Twitter size={18} className="text-sky-500" />} />
                  )}
                </div>
              </section>
            )}

            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="mb-4 h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-slate-200 bg-transparent p-0 whitespace-nowrap">
                <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 text-sm font-semibold text-slate-500 data-[state=active]:border-teal-500 data-[state=active]:text-slate-900">
                  Work Portfolio ({portfolio.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 text-sm font-semibold text-slate-500 data-[state=active]:border-teal-500 data-[state=active]:text-slate-900">
                  Client Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="m-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {portfolio.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="relative mb-2 aspect-[16/10] overflow-hidden rounded-xl border border-slate-200/60 bg-slate-100">
                        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          {contentTypeIcon(item.type)}
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-teal-600">{item.title}</h4>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{item.platform}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="m-0">
                <ReviewList reviews={reviews} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrandView = ({ brand, campaigns, isOwner }: { brand: any; campaigns: any[]; isOwner: boolean }) => {
  const navigate = useNavigate();
  const initials = brand.business_name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const targetNiches = brand.target_niches || [];
  const targetCities = brand.target_cities || [];

  return (
    <div>
      <div className="container px-4 pb-6 pt-4 md:px-6">
        <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white shadow-sm">
          <div className="grid grid-cols-1 gap-6 px-5 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-6">
            <div>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 font-display text-2xl font-bold text-white/80">
                  {initials}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-bold tracking-tight">{brand.business_name}</h1>
                    {brand.is_verified && <ShieldCheck size={18} className="text-teal-300" fill="currentColor" />}
                  </div>
                  {brand.brand_tagline && <p className="mt-1 text-sm font-medium text-teal-100">{brand.brand_tagline}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={13} />
                      {brand.industry || brand.business_type}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {brand.city}
                    </span>
                    {brand.website && (
                      <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                        <Globe size={13} />
                        {brand.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-white/80">
                {brand.description ||
                  `${brand.business_name} can use this section to explain what the brand does, who it serves, and what kind of creators it usually works with.`}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {targetNiches.slice(0, 6).map((niche: string) => (
                  <Badge key={niche} className="border-0 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/15">
                    {niche}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-start">
              <LandingStat label="Active Campaigns" value={String(campaigns.length)} />
              <LandingStat label="Target Niches" value={String(targetNiches.length)} />
              <LandingStat label="Target Cities" value={String(targetCities.length)} />
              <LandingStat label="Campaigns / Month" value={String(brand.campaigns_per_month || 0)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Brand Overview</h3>
                <div className="space-y-3">
                  <ContactRow icon={<Building2 size={16} />} value={brand.industry || brand.business_type} />
                  <ContactRow icon={<Users size={16} />} value={`${brand.campaigns_per_month || 0} campaigns / month`} />
                  <ContactRow icon={<Target size={16} />} value={`${targetNiches.length} creator niches targeted`} />
                  <ContactRow icon={<MapPin size={16} />} value={`${targetCities.length} markets in focus`} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Contact Info</h3>
                <div className="mb-5 space-y-3">
                  <ContactRow icon={<Mail size={16} />} value={brand.email} />
                  {brand.phone && <ContactRow icon={<Phone size={16} />} value={brand.phone} />}
                  {brand.contact_name && <ContactRow icon={<Users size={16} />} value={brand.contact_name} />}
                </div>

                {isOwner ? (
                  <Button className="h-10 w-full rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800" onClick={() => navigate("/edit-brand-profile")}>
                    Edit Brand Profile
                  </Button>
                ) : (
                  <Button className="h-10 w-full rounded-xl bg-teal-600 font-semibold text-white hover:bg-teal-700">
                    Contact Brand
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoPanel
                  icon={<Target size={16} className="text-teal-600" />}
                  title="Who We Want To Work With"
                  body={targetNiches.length > 0 ? "Creator categories this brand is actively seeking for campaigns." : "Add target niches to make the brand brief sharper for creators."}
                >
                  <div className="flex flex-wrap gap-2">
                    {targetNiches.length > 0 ? targetNiches.map((niche: string) => <MiniBadge key={niche} label={niche} />) : <MutedText text="No target niches added yet." />}
                  </div>
                </InfoPanel>

                <InfoPanel
                  icon={<MapPin size={16} className="text-teal-600" />}
                  title="Priority Markets"
                  body={targetCities.length > 0 ? "Cities and regions the brand is prioritizing right now." : "Add target cities to signal where activations matter most."}
                >
                  <div className="flex flex-wrap gap-2">
                    {targetCities.length > 0 ? targetCities.map((city: string) => <MiniBadge key={city} label={city} />) : <MutedText text="No target cities added yet." />}
                  </div>
                </InfoPanel>

                <InfoPanel
                  icon={<Briefcase size={16} className="text-teal-600" />}
                  title="Profile Basics"
                  body="The minimum signals creators usually need before deciding to apply."
                >
                  <div className="space-y-2 text-sm text-slate-700">
                    <SimpleMetric label="Campaign Volume" value={`${brand.campaigns_per_month || 0} / month`} />
                    <SimpleMetric label="Response Time" value={brand.response_time_expectation || "Not specified"} />
                    <SimpleMetric label="Primary Contact" value={brand.contact_name || "Not listed"} />
                  </div>
                </InfoPanel>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">About the Brand</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {brand.description ||
                  "Use this section to explain what the brand does and what kind of creator collaborations it is looking for."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Creator Requirements</h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {brand.creator_requirements ||
                  "Brands can use this section to explain what they look for in creators: audience quality, content style, language, geography, and category fit."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Open Campaigns</h2>
                  <p className="text-sm text-slate-500">Live briefs, budgets, and the creator lanes this brand is currently hiring across.</p>
                </div>
                <Badge variant="outline" className="w-fit text-[11px] font-semibold uppercase tracking-wide">
                  {campaigns.length} live
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {campaigns.map((campaign) => (
                  <Link key={campaign.id} to={`/campaign/${campaign.id}`} className="group">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-teal-200 hover:bg-teal-50/40">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{campaign.brand}</div>
                          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-teal-700">
                            {campaign.description}
                          </h3>
                        </div>
                        <div className="w-fit rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                          Rs. {campaign.budget.toLocaleString()}
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2">
                        <MiniBadge label={campaign.niche} />
                        <MiniBadge label={campaign.city} />
                        <MiniBadge label={`${campaign.influencers_needed} creators`} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <CampaignMetric label="Applied" value={String(campaign.influencers_applied || 0)} />
                        <CampaignMetric label="Need" value={String(campaign.influencers_needed || 0)} />
                      </div>
                    </div>
                  </Link>
                ))}

                {campaigns.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                    <p className="font-medium text-slate-500">No active campaigns yet.</p>
                    <p className="mt-1 text-sm text-slate-400">This brand is not currently running any live creator campaigns.</p>
                    {isOwner && (
                      <Button className="mt-4 h-10 rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800" onClick={() => navigate("/dashboard")}>
                        Launch Campaign
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
    <div className="text-base font-bold text-slate-900">{value}</div>
    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
  </div>
);

const SocialLink = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors hover:border-teal-300"
  >
    {icon}
    <span className="flex-1 truncate font-semibold text-slate-700">{label}</span>
    <ShieldCheck size={14} className="text-teal-500 fill-teal-500/10" />
  </a>
);

const PlainSocialLink = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 text-slate-600 transition-colors hover:text-slate-900"
  >
    {icon}
    <span className="text-sm font-semibold">{label}</span>
  </a>
);

const PriceRow = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "teal" | "amber";
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          tone === "teal" ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-600"
        }`}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
    <div className="text-sm font-bold text-slate-900">Rs. {value?.toLocaleString()}</div>
  </div>
);

const ContactRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
      {icon}
    </div>
    <span className="truncate font-medium text-slate-600">{value}</span>
  </div>
);

const LandingStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-sm">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="mt-1 text-[10px] uppercase tracking-wide text-white/55">{label}</div>
  </div>
);

const InfoPanel = ({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    <p className="mb-3 text-sm leading-6 text-slate-500">{body}</p>
    {children}
  </div>
);

const MiniBadge = ({ label }: { label: string }) => (
  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
    {label}
  </span>
);

const MutedText = ({ text }: { text: string }) => <p className="text-sm text-slate-400">{text}</p>;

const SimpleMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);

const CampaignMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-white px-3 py-2">
    <div className="font-semibold text-slate-900">{value}</div>
    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
  </div>
);

const ChecklistItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500" />
    <span>{text}</span>
  </div>
);

export default UnifiedProfile;
