import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, MapPin, Target, CheckCircle, ArrowLeft, ArrowRight, 
  Sparkles, Globe, Phone, Mail, IndianRupee, Users, 
  ShieldCheck, Briefcase, Rocket, Info, Laptop, Plus
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
  { icon: Target, label: "Objectives" },
  { icon: ShieldCheck, label: "Verification" },
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

interface JoinBrandModalProps {
  trigger?: React.ReactNode;
}

const JoinBrandModal = ({ trigger }: JoinBrandModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
          form.city.length > 0
        );
      case 1:
        return form.targetNiches.length > 0 && form.targetCities.length > 0 && form.monthlyBudget.length > 0;
      case 2:
        return form.contactName.trim().length > 0 && form.email.trim().length > 0;
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
      await supabase.from("profiles").update({ 
        user_type: "brand", 
        display_name: form.businessName 
      }).eq("user_id", user.id);
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating brand account", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "🚀 Brand Account Created!",
        description: "Welcome to InfluFlow! You can now start collaborating.",
      });
      setOpen(false);
      setTimeout(() => navigate("/dashboard"), 1000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 hover:bg-muted transition-all rounded-xl h-11 px-5 border-muted font-bold">
            <Building2 className="w-4 h-4" /> Join as Brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-[2rem] border-none shadow-2xl">
        <div className="gradient-primary py-8 px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-3 w-fit border border-white/10">
              <Rocket className="w-4 h-4 text-white" />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Growth Mode</span>
            </div>
            <DialogTitle className="text-3xl font-display font-black text-white tracking-tight leading-tight">
              Scale Your Brand
            </DialogTitle>
            <p className="text-white/70 text-sm font-medium max-w-sm mt-1">
              Connect with local creators who speak your audience's language.
            </p>
          </DialogHeader>
        </div>

        <div className="p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-10 max-w-md mx-auto relative px-4">
             {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.label} className="flex flex-col items-center gap-2.5 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${
                    isDone ? "gradient-primary text-white rotate-[360deg]" :
                    isActive ? "bg-primary/10 border-2 border-primary text-primary shadow-xl shadow-primary/10 scale-110" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
            {/* Background Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-0 mx-12" />
            <div className="absolute top-6 left-0 h-0.5 bg-primary -z-0 mx-12 transition-all duration-500" 
                 style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>

          <div className="min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 0: Business Identity */}
                {step === 0 && (
                  <div className="space-y-6 max-w-lg mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Business Name *</Label>
                        <Input
                          placeholder="e.g. Blue Tokai"
                          className="rounded-2xl h-12 bg-muted/30 border-muted focus:bg-background transition-all font-medium"
                          value={form.businessName}
                          onChange={(e) => update("businessName", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Category *</Label>
                        <Select value={form.businessType} onValueChange={(v) => update("businessType", v)}>
                          <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-muted">
                            <SelectValue placeholder="Industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Base City *</Label>
                      <Select value={form.city} onValueChange={(v) => update("city", v)}>
                        <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-muted font-medium">
                          <SelectValue placeholder="Select primary location" />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Brand Narrative</Label>
                      <Textarea
                        placeholder="Tell creators what your brand stands for..."
                        className="rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all resize-none min-h-[120px] font-medium p-4"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        maxLength={400}
                      />
                      <div className="flex justify-between mt-1 px-1">
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Info className="w-3 h-3" /> Helps influencers understand your vibe
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground">{form.description.length}/400</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Growth Objectives */}
                {step === 1 && (
                  <div className="space-y-6 max-w-lg mx-auto">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Ideal Audience Interest</Label>
                      <div className="flex flex-wrap gap-2">
                        {NICHES.map((n) => {
                          const selected = form.targetNiches.includes(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => toggleArrayItem("targetNiches", n)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border-2 ${
                                selected
                                  ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                                  : "border-muted bg-card text-muted-foreground hover:border-primary/30"
                              }`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Expansion Cities</Label>
                      <div className="flex flex-wrap gap-2">
                        {CITIES.map((c) => {
                          const selected = form.targetCities.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleArrayItem("targetCities", c)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border-2 ${
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-muted bg-card text-muted-foreground hover:border-primary/30"
                              }`}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1 font-black">Monthly Budget</Label>
                        <Select value={form.monthlyBudget} onValueChange={(v) => update("monthlyBudget", v)}>
                          <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-muted font-bold">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUDGET_RANGES.map((b) => (
                              <SelectItem key={b} value={b} className="font-medium">{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1 font-black">Campaign Frequency</Label>
                        <Input
                          type="number"
                          placeholder="Campaigns / Month"
                          className="rounded-2xl h-12 bg-muted/30 border-muted font-bold text-center"
                          value={form.campaignsPerMonth}
                          onChange={(e) => update("campaignsPerMonth", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Verification Review */}
                {step === 2 && (
                  <div className="space-y-6 max-w-lg mx-auto">
                    <div className="bg-muted/30 p-6 rounded-[2rem] border border-muted relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <ShieldCheck className="w-10 h-10 text-primary opacity-20" />
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-[1.5rem] gradient-primary flex items-center justify-center text-white text-3xl font-display font-black shadow-xl">
                          {form.businessName.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="text-xl font-display font-black tracking-tight leading-none mb-1">
                            {form.businessName || "New Brand"}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <MapPin className="w-3 h-3 text-primary" /> {form.city || "Unset"} · {form.businessType || "Unset"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Representative *</Label>
                            <Input
                              placeholder="Your full name"
                              className="h-10 border-none bg-background/50 rounded-xl font-bold"
                              value={form.contactName}
                              onChange={(e) => update("contactName", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Business Email *</Label>
                            <Input
                              type="email"
                              placeholder="hello@brand.com"
                              className="h-10 border-none bg-background/50 rounded-xl font-bold"
                              value={form.email}
                              onChange={(e) => update("email", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Phone (Optional)</Label>
                            <Input
                              placeholder="Contact number"
                              className="h-10 border-none bg-background/50 rounded-xl font-bold"
                              value={form.phone}
                              onChange={(e) => update("phone", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Website (Optional)</Label>
                            <Input
                              placeholder="brand.com"
                              className="h-10 border-none bg-background/50 rounded-xl font-bold"
                              value={form.website}
                              onChange={(e) => update("website", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {form.targetNiches.slice(0, 3).map((n) => (
                          <span key={n} className="text-[9px] bg-white text-primary border border-primary/20 rounded-full px-3 py-1 font-black uppercase tracking-tighter shadow-sm">
                            {n}
                          </span>
                        ))}
                        {form.targetNiches.length > 3 && (
                          <span className="text-[9px] text-muted-foreground font-black uppercase pt-1 tracking-tighter">+{form.targetNiches.length - 3} others</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl flex items-start gap-3 border border-primary/10">
                      <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed font-medium text-primary/80">
                        By signing up, you agree to our brand guidelines. We verify all business accounts to maintain high-quality collaborations.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-muted">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="rounded-2xl h-12 px-6 border-muted font-bold transition-all hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary shadow-sm" : "w-1.5 bg-muted"}`} />
              ))}
            </div>

            {step < 2 ? (
              <Button
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="rounded-2xl h-12 px-8 gradient-primary border-0 text-white font-black uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-2xl h-12 px-8 gradient-primary border-0 text-white font-black uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching...</>
                ) : (
                  <>Create Account <CheckCircle className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinBrandModal;
