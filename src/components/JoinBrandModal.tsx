import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Target,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Rocket,
  Info,
  Loader2,
  Briefcase,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { icon: Building2, label: "Identity" },
  { icon: Target, label: "Fit" },
  { icon: ShieldCheck, label: "Review" },
];

const BUSINESS_TYPES = ["Restaurant / Cafe", "Retail / E-commerce", "Gym / Fitness", "Salon / Beauty", "Tech / SaaS", "Events / Entertainment", "Other"];
const DELIVERABLE_OPTIONS = ["Reels", "Stories", "UGC", "Launch Events", "Store Visits", "Giveaways"];
const CAMPAIGN_GOALS = ["Brand Awareness", "Footfall", "Product Launch", "UGC", "Sales", "Local Reach"];
const RESPONSE_TIME_OPTIONS = ["Usually within 24 hours", "Usually within 2-3 days", "Within a week"];

interface BrandFormData {
  businessName: string;
  businessType: string;
  city: string;
  brandTagline: string;
  description: string;
  targetNiches: string[];
  targetCities: string[];
  deliverablePreferences: string[];
  campaignGoals: string[];
  creatorRequirements: string;
  campaignsPerMonth: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  responseTimeExpectation: string;
}

interface JoinBrandModalProps {
  trigger?: React.ReactNode;
}

const JoinBrandModal = ({ trigger }: JoinBrandModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfiles } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BrandFormData>({
    businessName: "",
    businessType: "",
    city: "",
    brandTagline: "",
    description: "",
    targetNiches: [],
    targetCities: [],
    deliverablePreferences: [],
    campaignGoals: [],
    creatorRequirements: "",
    campaignsPerMonth: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    responseTimeExpectation: "",
  });

  const update = (field: keyof BrandFormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (
    field: "targetNiches" | "targetCities" | "deliverablePreferences" | "campaignGoals",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.businessName.trim() && form.businessType && form.city && form.description.trim();
      case 1:
        return form.targetNiches.length > 0 && form.targetCities.length > 0;
      case 2:
        return form.contactName.trim() && form.email.trim();
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to register your brand.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("brand_profiles").insert({
      user_id: user.id,
      business_name: form.businessName,
      business_type: form.businessType,
      city: form.city,
      brand_tagline: form.brandTagline || null,
      description: form.description,
      contact_name: form.contactName,
      email: form.email,
      phone: form.phone || null,
      website: form.website || null,
      target_niches: form.targetNiches,
      target_cities: form.targetCities,
      deliverable_preferences: form.deliverablePreferences,
      campaign_goals: form.campaignGoals,
      creator_requirements: form.creatorRequirements || null,
      campaigns_per_month: form.campaignsPerMonth ? parseInt(form.campaignsPerMonth, 10) : null,
      response_time_expectation: form.responseTimeExpectation || null,
      monthly_budget: null,
    });

    if (!error) {
      await supabase.from("profiles").update({
        user_type: "brand",
        display_name: form.businessName,
      }).eq("user_id", user.id);
      await refreshProfiles();
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating brand account", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Brand Account Created",
      description: "Your brand profile is live. You can now post campaigns and review creators.",
    });
    setOpen(false);
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 rounded-xl border-muted px-5 font-bold transition-all hover:bg-muted">
            <Building2 className="h-4 w-4" /> Join as Brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden border-none p-0 shadow-2xl sm:rounded-[2rem]">
        <div className="gradient-primary relative overflow-hidden px-8 py-8">
          <div className="absolute right-0 top-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-white/5 blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <Rocket className="h-4 w-4 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Brand Setup</span>
            </div>
            <DialogTitle className="font-display text-3xl font-black leading-tight tracking-tight text-white">
              Build a Brand Profile Creators Can Trust
            </DialogTitle>
            <p className="mt-1 max-w-md text-sm font-medium text-white/70">
              Focus on brand story, creator fit, markets, and campaign style. Budget stays at campaign level.
            </p>
          </DialogHeader>
        </div>

        <div className="p-8">
          <div className="relative mx-auto mb-10 flex max-w-md items-center justify-between px-4">
            {STEPS.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = index === step;
              const isDone = index < step;
              return (
                <div key={stepItem.label} className="relative z-10 flex flex-col items-center gap-2.5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 ${
                    isDone
                      ? "gradient-primary rotate-[360deg] text-white"
                      : isActive
                      ? "scale-110 border-2 border-primary bg-primary/10 text-primary shadow-xl shadow-primary/10"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
            <div className="absolute left-0 right-0 top-6 -z-0 mx-12 h-0.5 bg-muted" />
            <div className="absolute left-0 top-6 -z-0 mx-12 h-0.5 bg-primary transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>

          <div className="min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <div className="mx-auto max-w-lg space-y-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Business Name *">
                        <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="e.g. Blue Tokai" className="h-12 rounded-2xl bg-muted/30 font-medium" />
                      </Field>
                      <Field label="Category *">
                        <Select value={form.businessType} onValueChange={(value) => update("businessType", value)}>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30">
                            <SelectValue placeholder="Industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Base City *">
                        <Select value={form.city} onValueChange={(value) => update("city", value)}>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30">
                            <SelectValue placeholder="Select primary location" />
                          </SelectTrigger>
                          <SelectContent>
                            {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Brand Tagline">
                        <Input value={form.brandTagline} onChange={(e) => update("brandTagline", e.target.value)} placeholder="Short one-line positioning" className="h-12 rounded-2xl bg-muted/30 font-medium" />
                      </Field>
                    </div>

                    <Field label="Brand Narrative *">
                      <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What do you sell, who do you serve, and what kind of campaigns do you run?" className="min-h-[120px] rounded-2xl bg-muted/30 p-4 font-medium" maxLength={600} />
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="mx-auto max-w-lg space-y-6">
                    <TagPicker
                      label="Target Creator Niches *"
                      options={NICHES}
                      values={form.targetNiches}
                      onToggle={(value) => toggleArrayItem("targetNiches", value)}
                    />

                    <TagPicker
                      label="Priority Cities *"
                      options={CITIES}
                      values={form.targetCities}
                      onToggle={(value) => toggleArrayItem("targetCities", value)}
                    />

                    <TagPicker
                      label="Deliverable Preferences"
                      options={DELIVERABLE_OPTIONS}
                      values={form.deliverablePreferences}
                      onToggle={(value) => toggleArrayItem("deliverablePreferences", value)}
                    />

                    <TagPicker
                      label="Campaign Goals"
                      options={CAMPAIGN_GOALS}
                      values={form.campaignGoals}
                      onToggle={(value) => toggleArrayItem("campaignGoals", value)}
                    />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Campaign Frequency">
                        <Input value={form.campaignsPerMonth} onChange={(e) => update("campaignsPerMonth", e.target.value)} type="number" placeholder="Campaigns / month" className="h-12 rounded-2xl bg-muted/30 font-medium" />
                      </Field>
                      <Field label="Response Time">
                        <Select value={form.responseTimeExpectation} onValueChange={(value) => update("responseTimeExpectation", value)}>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30">
                            <SelectValue placeholder="How quickly do you reply?" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_TIME_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <Field label="Creator Requirements">
                      <Textarea value={form.creatorRequirements} onChange={(e) => update("creatorRequirements", e.target.value)} placeholder="What kind of creators, audience quality, style, or campaign fit do you expect?" className="min-h-[110px] rounded-2xl bg-muted/30 p-4 font-medium" maxLength={500} />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="mx-auto max-w-lg space-y-6">
                    <div className="relative overflow-hidden rounded-[2rem] border border-muted bg-muted/30 p-6">
                      <div className="absolute right-0 top-0 p-4">
                        <ShieldCheck className="h-10 w-10 text-primary/20" />
                      </div>
                      <div className="mb-6 flex items-center gap-4">
                        <div className="gradient-primary flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-3xl font-black text-white shadow-xl">
                          {form.businessName.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-black leading-none tracking-tight">{form.businessName || "New Brand"}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>{form.city || "Unset city"}</span>
                            <span>·</span>
                            <span>{form.businessType || "Unset category"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Representative *">
                          <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Your full name" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                        </Field>
                        <Field label="Business Email *">
                          <Input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="hello@brand.com" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                        </Field>
                        <Field label="Phone">
                          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Contact number" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                        </Field>
                        <Field label="Website">
                          <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="brand.com" className="h-10 rounded-xl border-none bg-background/50 font-medium" />
                        </Field>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <PreviewMetric icon={<Briefcase className="h-4 w-4 text-primary" />} label="Deliverables" value={String(form.deliverablePreferences.length || 0)} />
                        <PreviewMetric icon={<Users className="h-4 w-4 text-primary" />} label="Goals" value={String(form.campaignGoals.length || 0)} />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-[11px] font-medium leading-relaxed text-primary/80">
                        Public brand profiles should help creators understand brand fit. Budget is intentionally left out here and should be set at campaign level.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-muted pt-6">
            <Button variant="outline" size="sm" onClick={() => setStep((current) => current - 1)} disabled={step === 0} className="h-12 rounded-2xl px-6 font-bold">
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, index) => (
                <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
              ))}
            </div>

            {step < 2 ? (
              <Button size="sm" onClick={() => setStep((current) => current + 1)} disabled={!canProceed()} className="gradient-primary h-12 rounded-2xl border-0 px-8 font-black uppercase tracking-tight text-white">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gradient-primary h-12 rounded-2xl border-0 px-8 font-black uppercase tracking-tight text-white">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <>Create Account <CheckCircle className="ml-2 h-4 w-4" /></>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const TagPicker = ({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) => (
  <div className="space-y-3">
    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-tight transition-all ${
              selected
                ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                : "border-muted bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </div>
);

const PreviewMetric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl bg-background/60 p-3">
    <div className="mb-1 flex items-center gap-2">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <div className="text-sm font-bold text-foreground">{value}</div>
  </div>
);

export default JoinBrandModal;
