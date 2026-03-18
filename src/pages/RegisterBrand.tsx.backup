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
  Sparkles,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { icon: Building2, label: "Business Info" },
  { icon: Target, label: "Creator Fit" },
  { icon: CheckCircle, label: "Review" },
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

const RegisterBrand = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
        return form.businessName.trim() && form.businessType && form.city && form.contactName.trim() && form.email.trim() && form.description.trim();
      case 1:
        return form.targetNiches.length > 0 && form.targetCities.length > 0;
      case 2:
        return true;
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
      await supabase.from("profiles").update({ user_type: "brand", display_name: form.businessName }).eq("user_id", user.id);
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating brand account", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Brand Account Created",
      description: "You can now post campaigns and review creators.",
    });
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="gradient-hero py-12 md:py-16">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Join as Brand</span>
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Build Your Brand Profile
            </h1>
            <p className="mx-auto max-w-md text-primary-foreground/60">
              Tell creators who you are, where you activate, and what kind of collaborations you run.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container relative z-10 -mt-8 max-w-2xl pb-16">
        <div className="mb-8 flex items-center justify-center px-2">
          {STEPS.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = index === step;
            const isDone = index < step;
            return (
              <div key={stepItem.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    isDone
                      ? "gradient-accent text-accent-foreground"
                      : isActive
                      ? "border-2 border-accent bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`hidden text-xs font-medium sm:block ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                    {stepItem.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`mx-2 h-0.5 w-16 rounded transition-colors sm:w-24 ${index < step ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="glass-card overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <SectionTitle title="Business Information" subtitle="Give creators the context they need to trust the brand." />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Business Name">
                        <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="mt-1.5" placeholder="e.g. Burger Cafe" />
                      </Field>
                      <Field label="Business Type">
                        <Select value={form.businessType} onValueChange={(value) => update("businessType", value)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="City">
                        <Select value={form.city} onValueChange={(value) => update("city", value)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                          <SelectContent>
                            {CITIES.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Tagline">
                        <Input value={form.brandTagline} onChange={(e) => update("brandTagline", e.target.value)} className="mt-1.5" placeholder="Short public-facing line" />
                      </Field>
                    </div>

                    <Field label="About Your Business">
                      <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1.5 resize-none" rows={4} placeholder="What does your business do, who does it serve, and what kind of creator-led campaigns do you run?" />
                    </Field>

                    <div className="border-t border-border pt-4">
                      <p className="mb-3 text-sm font-medium">Contact Person</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Full Name">
                          <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} className="mt-1.5" placeholder="Your name" />
                        </Field>
                        <Field label="Email">
                          <Input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="mt-1.5" placeholder="you@business.com" />
                        </Field>
                        <Field label="Phone">
                          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1.5" placeholder="+91..." />
                        </Field>
                        <Field label="Website">
                          <Input value={form.website} onChange={(e) => update("website", e.target.value)} className="mt-1.5" placeholder="https://..." />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <SectionTitle title="Creator Fit" subtitle="Describe the campaigns, markets, and creator profiles you want to work with." />
                    <TagSelector label="Target Niches" options={NICHES} values={form.targetNiches} onToggle={(value) => toggleArrayItem("targetNiches", value)} />
                    <TagSelector label="Target Cities" options={CITIES} values={form.targetCities} onToggle={(value) => toggleArrayItem("targetCities", value)} />
                    <TagSelector label="Deliverable Preferences" options={DELIVERABLE_OPTIONS} values={form.deliverablePreferences} onToggle={(value) => toggleArrayItem("deliverablePreferences", value)} />
                    <TagSelector label="Campaign Goals" options={CAMPAIGN_GOALS} values={form.campaignGoals} onToggle={(value) => toggleArrayItem("campaignGoals", value)} />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Campaigns / Month">
                        <Input value={form.campaignsPerMonth} onChange={(e) => update("campaignsPerMonth", e.target.value)} type="number" min="1" max="50" className="mt-1.5" placeholder="e.g. 3" />
                      </Field>
                      <Field label="Response Time">
                        <Select value={form.responseTimeExpectation} onValueChange={(value) => update("responseTimeExpectation", value)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select response window" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_TIME_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <Field label="Creator Requirements">
                      <Textarea value={form.creatorRequirements} onChange={(e) => update("creatorRequirements", e.target.value)} className="mt-1.5 resize-none" rows={4} placeholder="What do you expect from creators: audience quality, style, production level, language, platform fit, etc.?" />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <SectionTitle title="Review Your Account" subtitle="This profile is for trust and fit, not public budget negotiation." />

                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className="gradient-accent flex items-center gap-4 p-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent-foreground/20 text-2xl font-bold text-accent-foreground">
                          {form.businessName.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-accent-foreground">{form.businessName || "Business Name"}</h3>
                          <p className="text-sm text-accent-foreground/70">{form.city || "City"} · {form.businessType || "Type"}</p>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">{form.description || "No description yet."}</p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <PreviewCard icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email" value={form.email || "—"} />
                          <PreviewCard icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Phone" value={form.phone || "Not provided"} />
                          <PreviewCard icon={<Globe className="h-4 w-4 text-muted-foreground" />} label="Website" value={form.website || "Not provided"} />
                          <PreviewCard icon={<Users className="h-4 w-4 text-muted-foreground" />} label="Campaigns / Month" value={form.campaignsPerMonth || "Not specified"} />
                          <PreviewCard icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} label="Goals" value={String(form.campaignGoals.length)} />
                          <PreviewCard icon={<Target className="h-4 w-4 text-muted-foreground" />} label="Deliverables" value={String(form.deliverablePreferences.length)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <Button variant="outline" onClick={() => setStep((current) => current - 1)} disabled={step === 0} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              <div className="flex items-center gap-1.5">
                {STEPS.map((_, index) => (
                  <div key={index} className={`h-2 w-2 rounded-full transition-colors ${index === step ? "bg-accent" : "bg-border"}`} />
                ))}
              </div>

              {step < 2 ? (
                <Button onClick={() => setStep((current) => current + 1)} disabled={!canProceed()} className="gradient-accent gap-2 border-0 text-accent-foreground">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="gradient-accent gap-2 border-0 text-accent-foreground">
                  <CheckCircle className="h-4 w-4" /> {submitting ? "Creating..." : "Create Account"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h2 className="mb-1 font-display text-xl font-semibold">{title}</h2>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

const TagSelector = ({
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
  <div>
    <Label>{label}</Label>
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              selected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-muted-foreground hover:border-accent/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </div>
);

const PreviewCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg bg-muted p-3">
    <div className="mb-1 flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export default RegisterBrand;
