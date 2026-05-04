import { useMemo, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Instagram,
  Link,
  Loader2,
  MapPin,
  Twitter,
  User,
  Users,
  Youtube,
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
import { LocationPicker } from "@/components/LocationPicker";
import type { InfluencerFormData } from "@/hooks/useInfluencerRegistration";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

type StepSetter = Dispatch<SetStateAction<number>>;
type FormValue = string | string[] | number | boolean | null;
type UpdateFn = (field: keyof InfluencerFormData, value: FormValue) => void;
type PriceField = "priceReel" | "priceStory" | "priceVisit";

const STEPS = [
  { label: "Appearance", icon: Users },
  { label: "About You", icon: User },
  { label: "Platforms", icon: Link },
  { label: "Pricing", icon: ExternalLink },
  { label: "Review", icon: CheckCircle },
] as const;


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
  nextStep: () => Promise<void>;
}

const formatPrice = (value: string) => {
  const amount = Number.parseInt(value, 10);
  return Number.isFinite(amount) && amount > 0 ? amount.toLocaleString() : "0";
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
  nextStep,
}: InfluencerRegistrationFormProps) => {
  const { user } = useAuth();
  const { cities, niches } = useManagedOptions();

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



  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid w-full mx-auto gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
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

            <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Full Name
                  </Label>
                  {form.name.trim().length > 0 && form.name.trim().length < 4 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <AlertCircle size={10} /> Min 4 characters required
                    </span>
                  )}
                </div>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className={cn(
                    "h-12 rounded-2xl border-slate-200 bg-slate-50/60 text-base transition-all",
                    form.name.trim().length > 0 && form.name.trim().length < 4 && "border-amber-300 ring-amber-500/10 focus-visible:ring-amber-500"
                  )}
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid w-full mx-auto gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Step 2</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Tell brands what you create</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Share your city, niche, and a short bio so brands can understand your audience quickly.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
              <MobileStepIntro
                step="Step 2"
                title="Tell brands what you create"
                description="Share your city, niche, and a short bio so brands can understand your audience quickly."
                accentClass="text-teal-600"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Base City</Label>
                  <LocationPicker
                    value={form.city}
                    onChange={(value) => update("city", value)}
                    placeholder="Where are you based?"
                    className="h-12 w-full justify-between rounded-2xl border-slate-200 bg-slate-50/60 font-medium shadow-none"
                  />
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
          <div className="grid w-full mx-auto gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <div className="hidden space-y-5 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Step 3</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Connect your platforms</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add the social platforms you create on. Enter your handle and follower count for each.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-900">Tip</p>
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  You can verify your accounts later from your profile settings to unlock a verified badge and auto-sync follower counts.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8">
              <MobileStepIntro
                step="Step 3"
                title="Connect your platforms"
                description="Add the social platforms you create on and your approximate follower counts."
                accentClass="text-slate-500"
              />

              <div className="space-y-4">
                {/* Instagram */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Instagram size={14} className="text-pink-500" /> Instagram
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={form.instagramUrl}
                        onChange={(e) => update("instagramUrl", e.target.value)}
                        placeholder="@yourhandle"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60"
                      />
                    </div>
                    <div className="w-28 sm:w-36">
                      <Input
                        type="number"
                        value={form.igFollowers}
                        onChange={(e) => update("igFollowers", e.target.value)}
                        placeholder="Followers"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* YouTube */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Youtube size={14} className="text-red-500" /> YouTube
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={form.youtubeUrl}
                        onChange={(e) => update("youtubeUrl", e.target.value)}
                        placeholder="@yourchannel"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60"
                      />
                    </div>
                    <div className="w-28 sm:w-36">
                      <Input
                        type="number"
                        value={form.ytFollowers}
                        onChange={(e) => update("ytFollowers", e.target.value)}
                        placeholder="Subscribers"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Twitter size={14} className="text-sky-500" /> X (Twitter)
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={form.twitterUrl}
                        onChange={(e) => update("twitterUrl", e.target.value)}
                        placeholder="@yourhandle"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60"
                      />
                    </div>
                    <div className="w-28 sm:w-36">
                      <Input
                        type="number"
                        value={form.twitterFollowers}
                        onChange={(e) => update("twitterFollowers", e.target.value)}
                        placeholder="Followers"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-medium text-slate-400 italic">
                Add at least one platform with followers to continue. You can verify accounts later to unlock a trust badge.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid w-full mx-auto gap-4 lg:gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
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
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total Reach</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {((Number.parseInt(form.igFollowers, 10) || 0) +
                          (Number.parseInt(form.ytFollowers, 10) || 0) +
                          (Number.parseInt(form.twitterFollowers, 10) || 0)).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Verified</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{form.platforms.length}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Social platforms</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.instagramUrl && (
                        <Badge className="rounded-full border-none bg-pink-50 px-3 py-1 text-pink-700">
                          <Instagram size={12} className="mr-1" /> Instagram
                        </Badge>
                      )}
                      {form.youtubeUrl && (
                        <Badge className="rounded-full border-none bg-red-50 px-3 py-1 text-red-700">
                          <Youtube size={12} className="mr-1" /> YouTube
                        </Badge>
                      )}
                      {form.twitterUrl && (
                        <Badge className="rounded-full border-none bg-sky-50 px-3 py-1 text-sky-700">
                          <Twitter size={12} className="mr-1" /> X (Twitter)
                        </Badge>
                      )}
                      {!form.instagramUrl && !form.youtubeUrl && !form.twitterUrl && (
                        <span className="text-sm text-slate-500">No platforms added yet.</span>
                      )}
                    </div>
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
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${complete
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
            onClick={nextStep}
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
