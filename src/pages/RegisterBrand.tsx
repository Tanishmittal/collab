import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Target, CheckCircle, ArrowLeft, ArrowRight, Sparkles, Globe, Phone, Mail, IndianRupee, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { icon: Building2, label: "Business Info" },
  { icon: Target, label: "Campaign Goals" },
  { icon: CheckCircle, label: "Review" },
];

const BUDGET_RANGES = ["₹5,000 – ₹15,000", "₹15,000 – ₹50,000", "₹50,000 – ₹1,00,000", "₹1,00,000+"];
const BUSINESS_TYPES = ["Restaurant / Café", "Retail / E-commerce", "Gym / Fitness", "Salon / Beauty", "Tech / SaaS", "Events / Entertainment", "Other"];

interface BrandFormData {
  businessName: string;
  businessType: string;
  city: string;
  description: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  targetNiches: string[];
  targetCities: string[];
  monthlyBudget: string;
  campaignsPerMonth: string;
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
    description: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    targetNiches: [],
    targetCities: [],
    monthlyBudget: "",
    campaignsPerMonth: "",
  });

  const update = (field: keyof BrandFormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "targetNiches" | "targetCities", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return (
          form.businessName.trim().length > 0 &&
          form.businessType.length > 0 &&
          form.city.length > 0 &&
          form.contactName.trim().length > 0 &&
          form.email.trim().length > 0
        );
      case 1:
        return form.targetNiches.length > 0 && form.targetCities.length > 0 && form.monthlyBudget.length > 0;
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
      description: form.description,
      contact_name: form.contactName,
      email: form.email,
      phone: form.phone || null,
      website: form.website || null,
      target_niches: form.targetNiches,
      target_cities: form.targetCities,
      monthly_budget: form.monthlyBudget,
      campaigns_per_month: form.campaignsPerMonth ? parseInt(form.campaignsPerMonth) : null,
    });

    if (!error) {
      await supabase.from("profiles").update({ user_type: "brand", display_name: form.businessName }).eq("user_id", user.id);
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating brand account", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "🚀 Brand Account Created!",
        description: "You can now post campaigns and discover influencers.",
      });
      setTimeout(() => navigate("/"), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="gradient-hero py-12 md:py-16">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-accent text-sm font-medium">Join as Brand</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
              Register Your Business
            </h1>
            <p className="text-primary-foreground/60 max-w-md mx-auto">
              Connect with local influencers and grow your brand
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-2xl -mt-8 pb-16 relative z-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? "gradient-accent text-accent-foreground"
                        : isActive
                        ? "bg-accent/10 border-2 border-accent text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 rounded transition-colors ${i < step ? "bg-accent" : "bg-border"}`} />
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
                {/* Step 0: Business Info */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Business Information</h2>
                      <p className="text-sm text-muted-foreground">Tell influencers about your business</p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            placeholder="e.g. Burger Cafe"
                            value={form.businessName}
                            onChange={(e) => update("businessName", e.target.value)}
                            maxLength={100}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Business Type</Label>
                          <Select value={form.businessType} onValueChange={(v) => update("businessType", v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {BUSINESS_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>City</Label>
                        <Select value={form.city} onValueChange={(v) => update("city", v)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                          <SelectContent>
                            {CITIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">About Your Business</Label>
                        <Textarea
                          id="description"
                          placeholder="What does your business do? What makes it special?"
                          value={form.description}
                          onChange={(e) => update("description", e.target.value)}
                          maxLength={400}
                          className="mt-1.5 resize-none"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{form.description.length}/400</p>
                      </div>

                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-3">Contact Person</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contactName">Full Name</Label>
                            <Input
                              id="contactName"
                              placeholder="Your name"
                              value={form.contactName}
                              onChange={(e) => update("contactName", e.target.value)}
                              maxLength={100}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@business.com"
                              value={form.email}
                              onChange={(e) => update("email", e.target.value)}
                              maxLength={255}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone (optional)</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={form.phone}
                              onChange={(e) => update("phone", e.target.value)}
                              maxLength={15}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="website">Website (optional)</Label>
                            <Input
                              id="website"
                              placeholder="https://..."
                              value={form.website}
                              onChange={(e) => update("website", e.target.value)}
                              maxLength={200}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Campaign Goals */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Campaign Preferences</h2>
                      <p className="text-sm text-muted-foreground">Help us match you with the right influencers</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Target Niches</Label>
                        <p className="text-xs text-muted-foreground mb-2">Select the niches relevant to your campaigns</p>
                        <div className="flex flex-wrap gap-2">
                          {NICHES.map((n) => {
                            const selected = form.targetNiches.includes(n);
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => toggleArrayItem("targetNiches", n)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                  selected
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-border bg-card text-muted-foreground hover:border-accent/40"
                                }`}
                              >
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label>Target Cities</Label>
                        <p className="text-xs text-muted-foreground mb-2">Where do you want to run campaigns?</p>
                        <div className="flex flex-wrap gap-2">
                          {CITIES.map((c) => {
                            const selected = form.targetCities.includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => toggleArrayItem("targetCities", c)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                  selected
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-border bg-card text-muted-foreground hover:border-accent/40"
                                }`}
                              >
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Monthly Budget</Label>
                          <Select value={form.monthlyBudget} onValueChange={(v) => update("monthlyBudget", v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              {BUDGET_RANGES.map((b) => (
                                <SelectItem key={b} value={b}>{b}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="campaignsPerMonth">Campaigns / Month (optional)</Label>
                          <Input
                            id="campaignsPerMonth"
                            type="number"
                            min="1"
                            max="50"
                            placeholder="e.g. 3"
                            value={form.campaignsPerMonth}
                            onChange={(e) => update("campaignsPerMonth", e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Review Your Account</h2>
                      <p className="text-sm text-muted-foreground">Make sure everything looks good before creating</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="gradient-accent p-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-accent-foreground/20 flex items-center justify-center text-accent-foreground text-2xl font-display font-bold">
                          {form.businessName.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-accent-foreground">
                            {form.businessName || "Business Name"}
                          </h3>
                          <p className="text-accent-foreground/70 text-sm flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {form.city || "City"} · {form.businessType || "Type"}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {form.description && (
                          <p className="text-sm text-muted-foreground">{form.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate">{form.email || "—"}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{form.phone || "Not provided"}</span>
                          </div>
                        </div>

                        {form.website && (
                          <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate">{form.website}</span>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Target Niches</p>
                          <div className="flex flex-wrap gap-1.5">
                            {form.targetNiches.map((n) => (
                              <span key={n} className="text-xs bg-accent/10 text-accent rounded-full px-3 py-1 font-medium">{n}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Target Cities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {form.targetCities.map((c) => (
                              <span key={c} className="text-xs bg-accent/10 text-accent rounded-full px-3 py-1 font-medium">{c}</span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 rounded-lg border border-border">
                            <IndianRupee className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">Monthly Budget</p>
                            <p className="font-display font-bold text-sm text-accent">{form.monthlyBudget || "—"}</p>
                          </div>
                          <div className="text-center p-3 rounded-lg border border-border">
                            <Users className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">Campaigns / Month</p>
                            <p className="font-display font-bold text-sm text-accent">{form.campaignsPerMonth || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-accent" : "bg-border"}`} />
                ))}
              </div>

              {step < 2 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2 gradient-accent border-0 text-accent-foreground"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 gradient-accent border-0 text-accent-foreground"
                >
                  <CheckCircle className="w-4 h-4" /> {submitting ? "Creating..." : "Create Account"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterBrand;
