import { useMemo, useState, type ComponentType, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  ExternalLink,
  Instagram,
  Loader2,
  MapPin,
  ShieldCheck,
  Twitter,
  User,
  Users,
  Youtube,
  type LucideProps,
} from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { InfluencerFormData } from "@/hooks/useInfluencerRegistration";

type StepSetter = Dispatch<SetStateAction<number>>;
type FormValue = string | string[] | number | boolean | null;
type UpdateFn = (field: keyof InfluencerFormData, value: FormValue) => void;
type SocialPlatformId = "instagram" | "youtube" | "twitter";
type SocialUrlKey = "instagramUrl" | "youtubeUrl" | "twitterUrl";
type PriceField = "priceReel" | "priceStory" | "priceVisit";

const STEPS = [
  { label: "Appearance", icon: Users },
  { label: "About You", icon: User },
  { label: "Verification", icon: ShieldCheck },
  { label: "Pricing", icon: ExternalLink },
  { label: "Review", icon: CheckCircle },
] as const;

const SOCIAL_PLATFORMS: Array<{
  id: SocialPlatformId;
  label: string;
  icon: ComponentType<LucideProps>;
  placeholder: string;
  colorClass: string;
  urlKey: SocialUrlKey;
}> = [
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "https://instagram.com/yourhandle",
    colorClass: "text-pink-500",
    urlKey: "instagramUrl",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: Youtube,
    placeholder: "https://youtube.com/@yourchannel",
    colorClass: "text-red-500",
    urlKey: "youtubeUrl",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: Twitter,
    placeholder: "https://x.com/yourhandle",
    colorClass: "text-sky-500",
    urlKey: "twitterUrl",
  },
];

const PRICE_FIELDS: Array<{
  key: PriceField;
  label: string;
  description: string;
}> = [
  { key: "priceReel", label: "Reel Promotion", description: "Short-form video content" },
  { key: "priceStory", label: "Story Promotion", description: "24-hour story feature" },
  { key: "priceVisit", label: "Visit & Review", description: "In-person visit with coverage" },
];

interface InfluencerRegistrationFormProps {
  step: number;
  setStep: StepSetter;
  submitting: boolean;
  form: InfluencerFormData;
  update: UpdateFn;
  canProceed: () => boolean;
  handleSubmit: () => void;
}

const formatPrice = (value: string) => {
  const amount = Number.parseInt(value, 10);
  return Number.isFinite(amount) && amount > 0 ? amount.toLocaleString() : "0";
};

const platformIconForPreview = (platform: SocialPlatformId) => {
  if (platform === "instagram") return <Instagram size={12} />;
  if (platform === "youtube") return <Youtube size={12} />;
  return <Twitter size={12} />;
};

const MobileStepIntro = ({
  step,
  title,
  description,
  accentClass,
}: {
  step: string;
  title: string;
  description: string;
  accentClass: string;
}) => (
  <div className="lg:hidden">
    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${accentClass}`}>{step}</p>
    <h2 className="mt-2 font-display text-xl font-semibold text-slate-950">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

const InfluencerRegistrationForm = ({
  step,
  setStep,
  submitting,
  form,
  update,
  canProceed,
  handleSubmit,
}: InfluencerRegistrationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cities, niches } = useManagedOptions();
  const [verifying, setVerifying] = useState<SocialPlatformId | null>(null);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<Set<SocialPlatformId>>(new Set());
  const [copied, setCopied] = useState(false);

  const initials = useMemo(
    () =>
      form.name
        ?.split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "IF",
    [form.name]
  );

  const copyCode = async () => {
    await navigator.clipboard.writeText(form.verificationCode || "");
    setCopied(true);
    toast({ title: "Copied", description: "Paste this code into your social bio before verifying." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (platformId: SocialPlatformId) => {
    const config = SOCIAL_PLATFORMS.find((item) => item.id === platformId);
    if (!config) return;

    const url = (form[config.urlKey] || "").trim();
    if (!url) {
      toast({
        title: "Enter a profile URL first",
        description: "Add your public profile URL before verifying this platform.",
        variant: "destructive",
      });
      return;
    }

    setVerifying(platformId);
    try {
      const { data, error } = await supabase.functions.invoke("verify-social", {
        body: { platform: platformId, url, verificationCode: form.verificationCode },
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: "Could not verify this account. Check the URL and confirm your profile is public.",
          variant: "destructive",
        });
        return;
      }

      if (data?.verified) {
        setVerifiedPlatforms((prev) => new Set(prev).add(platformId));
        update("isVerified", true);
        const verifiedLabel =
          platformId === "instagram" ? "Instagram" : platformId === "youtube" ? "YouTube" : "Twitter";
        update("platforms", Array.from(new Set([...form.platforms, verifiedLabel])));
        if (data.stats?.followers) update("followers", data.stats.followers);
        if (data.stats?.engagement_rate) update("engagementRate", String(data.stats.engagement_rate));
        toast({ title: "Verified", description: `${config.label} account verified successfully.` });
      } else {
        toast({
          title: "Code not found",
          description: data?.message || "We could not find the verification code in your profile bio.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Verification failed",
        description: "Something went wrong while verifying. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Step 1</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Set the first impression</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add a clear photo and the name brands will remember when they shortlist creators.
                </p>
              </div>
              <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Why it matters</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Profiles with a photo and strong display name look more complete and get trusted faster.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
              <MobileStepIntro
                step="Step 1"
                title="Set the first impression"
                description="Add a clear photo and the name brands will remember when they shortlist creators."
                accentClass="text-orange-500"
              />
              <div className="flex justify-center">
                <AvatarUpload
                  userId={user?.id || "anonymous"}
                  currentUrl={form.avatarUrl}
                  initials={initials}
                  onUploaded={(url) => update("avatarUrl", url)}
                  onRemove={() => update("avatarUrl", null)}
                  size="lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 text-base"
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Step 2</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Tell brands what you create</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Share your city, niche, and a short bio so brands can understand your audience quickly.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
              <MobileStepIntro
                step="Step 2"
                title="Tell brands what you create"
                description="Share your city, niche, and a short bio so brands can understand your audience quickly."
                accentClass="text-teal-600"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Base City</Label>
                  <Select value={form.city} onValueChange={(value) => update("city", value)}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/60">
                      <SelectValue placeholder="Where are you based?" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary Niche</Label>
                  <Select value={form.niche} onValueChange={(value) => update("niche", value)}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/60">
                      <SelectValue placeholder="What do you create?" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map((niche) => (
                        <SelectItem key={niche} value={niche}>
                          {niche}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Short Bio
                </Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Tell brands what you create, who you reach, and what makes your content unique."
                  className="min-h-[130px] rounded-2xl border-slate-200 bg-slate-50/60"
                  maxLength={300}
                />
                <p className="text-right text-xs text-slate-400">{form.bio.length}/300</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Step 3</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Connect and verify your platforms</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Verification is optional, but it helps us pull real stats and makes your profile more trustworthy.
                </p>
              </div>
              <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Verification code</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-800">
                    {form.verificationCode}
                  </code>
                  <Button type="button" variant="outline" size="icon" className="rounded-2xl" onClick={copyCode}>
                    {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Paste this code into your social bio, then verify the linked account below.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
              <MobileStepIntro
                step="Step 3"
                title="Connect and verify your platforms"
                description="Add a public social URL and verify it. Only verified socials will show on your public profile."
                accentClass="text-slate-500"
              />

              <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-4 lg:hidden">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Verification code</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-800">
                    {form.verificationCode}
                  </code>
                  <Button type="button" variant="outline" size="icon" className="rounded-2xl" onClick={copyCode}>
                    {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const value = form[platform.urlKey] || "";
                  const isVerified = verifiedPlatforms.has(platform.id);

                  return (
                    <div key={platform.id} className="space-y-2">
                      <Label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <span className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${platform.colorClass}`} />
                          {platform.label}
                        </span>
                        {isVerified && <Badge className="border-none bg-teal-50 text-teal-700">Verified</Badge>}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => update(platform.urlKey, e.target.value)}
                          placeholder={platform.placeholder}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50/60"
                          disabled={isVerified}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-2xl px-3 sm:px-4"
                          onClick={() => handleVerify(platform.id)}
                          disabled={!value.trim() || verifying !== null || isVerified}
                        >
                          {verifying === platform.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isVerified ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Step 4</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Set your starting rates</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add simple ballpark pricing. You can always update these later inside your profile settings.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
              <MobileStepIntro
                step="Step 4"
                title="Set your starting rates"
                description="Add simple ballpark pricing. You can always update these later inside your profile settings."
                accentClass="text-orange-500"
              />
              {PRICE_FIELDS.map((item) => (
                <div key={item.key} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:w-44">
                    <span className="text-sm font-semibold text-orange-500">Rs</span>
                    <Input
                      type="number"
                      min="0"
                      value={form[item.key]}
                      onChange={(e) => update(item.key, e.target.value)}
                      placeholder="0"
                      className="h-auto border-none bg-transparent p-0 text-right text-base font-semibold shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid gap-4 lg:gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Step 5</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Review your profile</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This is the information brands will see first when they discover your creator profile.
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
              <MobileStepIntro
                step="Step 5"
                title="Review your profile"
                description="This is the information brands will see first when they discover your creator profile."
                accentClass="text-teal-600"
              />
              <div className="overflow-hidden rounded-[32px] bg-slate-950 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.7)]">
                <div className={`relative aspect-[4/5] ${form.avatarUrl ? "bg-slate-950" : "bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300"}`}>
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt={form.name || "Creator preview"} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-display text-7xl font-bold text-white/20">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                        {form.niche || "Creator"}
                      </span>
                      {form.isVerified && <ShieldCheck className="h-4 w-4 text-teal-300" />}
                    </div>
                    <h3 className="font-display text-2xl font-semibold">{form.name || "Your Name"}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                      <MapPin className="h-3.5 w-3.5" />
                      {form.city || "Your city"}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="rounded-[32px] border-slate-200 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)]">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">About</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{form.bio || "No bio added yet."}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Followers</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{form.followers || "0"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Engagement</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{form.engagementRate || "0"}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Verified</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{form.platforms.length}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Verified platforms</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.platforms.length > 0 ? (
                        form.platforms.map((platform) => (
                          <Badge key={platform} className="rounded-full border-none bg-teal-50 px-3 py-1 text-teal-700">
                            {platform}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No verified platforms yet.</span>
                      )}
                    </div>
                    {verifiedPlatforms.size > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from(verifiedPlatforms).map((platform) => (
                          <span
                            key={platform}
                            className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600"
                          >
                            {platformIconForPreview(platform)}
                            Verified
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRICE_FIELDS.map((item) => (
                      <div key={item.key} className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {item.label.replace(" Promotion", "").replace(" & Review", "")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-orange-500">Rs {formatPrice(form[item.key])}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const active = index === step;
          const complete = index < step;

          return (
            <div key={item.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    complete
                      ? "bg-orange-500 text-white"
                      : active
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {complete ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`hidden text-sm font-medium sm:block ${active || complete ? "text-slate-900" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </div>
              {index < STEPS.length - 1 && <div className={`hidden h-px w-6 sm:block ${index < step ? "bg-orange-300" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.22 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-3 z-20 flex items-center justify-between rounded-[24px] border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:static sm:rounded-[28px] sm:bg-white sm:px-6 sm:py-4 sm:shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((current) => current - 1)}
          disabled={step === 0}
          className="h-10 rounded-2xl px-3 text-slate-600 sm:h-11 sm:px-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="hidden items-center gap-1.5 sm:flex">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={`h-2.5 rounded-full transition-all ${index === step ? "w-8 bg-orange-500" : "w-2.5 bg-slate-200"}`}
            />
          ))}
        </div>

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStep((current) => current + 1)}
            disabled={!canProceed()}
            className="h-10 rounded-2xl bg-orange-500 px-4 text-white hover:bg-orange-600 sm:h-11 sm:px-6"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-900 sm:h-11 sm:px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing
              </>
            ) : (
              <>
                Create profile
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default InfluencerRegistrationForm;
