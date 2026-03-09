import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, DollarSign, CheckCircle, ArrowLeft, ArrowRight, Instagram, Youtube, Twitter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { icon: User, label: "Personal Info" },
  { icon: MapPin, label: "Platforms & Niche" },
  { icon: DollarSign, label: "Pricing" },
  { icon: CheckCircle, label: "Review" },
];

const PLATFORMS = [
  { id: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-500" },
  { id: "YouTube", icon: Youtube, color: "from-red-500 to-red-600" },
  { id: "Twitter", icon: Twitter, color: "from-sky-400 to-sky-500" },
];

interface FormData {
  name: string;
  city: string;
  bio: string;
  niche: string;
  followers: string;
  engagementRate: string;
  platforms: string[];
  priceReel: string;
  priceStory: string;
  priceVisit: string;
}

interface ListInfluencerModalProps {
  trigger: React.ReactNode;
  onCreated?: () => void;
}

const ListInfluencerModal = ({ trigger, onCreated }: ListInfluencerModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", city: "", bio: "", niche: "", followers: "",
    engagementRate: "", platforms: [], priceReel: "", priceStory: "", priceVisit: "",
  });

  const resetForm = () => {
    setForm({ name: "", city: "", bio: "", niche: "", followers: "", engagementRate: "", platforms: [], priceReel: "", priceStory: "", priceVisit: "" });
    setStep(0);
  };

  const update = (field: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return form.name.trim().length > 0 && form.city.length > 0 && form.bio.trim().length > 0;
      case 1: return form.niche.length > 0 && form.followers.trim().length > 0 && form.engagementRate.trim().length > 0 && form.platforms.length > 0;
      case 2: return form.priceReel.trim().length > 0 && form.priceStory.trim().length > 0 && form.priceVisit.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to create a profile.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("influencer_profiles").insert({
      user_id: user.id,
      name: form.name,
      city: form.city,
      bio: form.bio,
      niche: form.niche,
      followers: form.followers,
      engagement_rate: form.engagementRate,
      platforms: form.platforms,
      price_reel: parseInt(form.priceReel) || 0,
      price_story: parseInt(form.priceStory) || 0,
      price_visit: parseInt(form.priceVisit) || 0,
    });

    if (!error) {
      await supabase.from("profiles").update({ user_type: "influencer", display_name: form.name }).eq("user_id", user.id);
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🎉 Profile Created!", description: "Your influencer profile is now live." });
      resetForm();
      setOpen(false);
      onCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">List as Influencer</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 mt-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs ${
                    isDone ? "gradient-primary text-primary-foreground" :
                    isActive ? "bg-primary/10 border-2 border-primary text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 rounded transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input placeholder="e.g. Rahul Sharma" className="mt-1" value={form.name} onChange={e => update("name", e.target.value)} maxLength={100} />
                </div>
                <div>
                  <Label>City *</Label>
                  <Select value={form.city} onValueChange={v => update("city", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select your city" /></SelectTrigger>
                    <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bio *</Label>
                  <Textarea placeholder="Describe what you create..." className="mt-1 resize-none" rows={3} value={form.bio} onChange={e => update("bio", e.target.value)} maxLength={300} />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/300</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Platforms *</Label>
                  <div className="grid grid-cols-3 gap-3 mt-1.5">
                    {PLATFORMS.map(p => {
                      const Icon = p.icon;
                      const selected = form.platforms.includes(p.id);
                      return (
                        <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card"
                          }`}>
                          <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>{p.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Niche *</Label>
                  <Select value={form.niche} onValueChange={v => update("niche", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select niche" /></SelectTrigger>
                    <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Followers *</Label>
                    <Input placeholder="e.g. 32K" className="mt-1" value={form.followers} onChange={e => update("followers", e.target.value)} maxLength={20} />
                  </div>
                  <div>
                    <Label>Engagement Rate (%) *</Label>
                    <Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 4.8" className="mt-1" value={form.engagementRate} onChange={e => update("engagementRate", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 mt-4">
                {[
                  { key: "priceReel" as const, label: "Reel Promotion", icon: "🎬", desc: "Short-form video content" },
                  { key: "priceStory" as const, label: "Story Promotion", icon: "📱", desc: "24-hour story feature" },
                  { key: "priceVisit" as const, label: "Visit & Review", icon: "📍", desc: "In-person visit with content" },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-muted-foreground font-medium">₹</span>
                      <Input type="number" min="0" placeholder="0" value={form[item.key]} onChange={e => update(item.key, e.target.value)} className="text-right" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 mt-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="gradient-primary p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-lg font-display font-bold">
                      {form.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-primary-foreground">{form.name || "Your Name"}</h3>
                      <p className="text-primary-foreground/70 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {form.city || "City"}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{form.bio || "No bio"}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="font-display font-bold text-sm">{form.followers || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Followers</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="font-display font-bold text-sm">{form.engagementRate ? `${form.engagementRate}%` : "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Engagement</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="font-display font-bold text-sm">{form.niche || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Niche</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {form.platforms.map(p => (
                        <span key={p} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">{p}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Reel", value: form.priceReel },
                        { label: "Story", value: form.priceStory },
                        { label: "Visit", value: form.priceVisit },
                      ].map(p => (
                        <div key={p.label} className="text-center p-2 rounded-lg border border-border">
                          <p className="text-[10px] text-muted-foreground">{p.label}</p>
                          <p className="font-display font-bold text-primary text-sm">₹{p.value || "0"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-1 gradient-primary border-0 text-primary-foreground">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1 gradient-primary border-0 text-primary-foreground">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle className="w-4 h-4" /> Create Profile</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListInfluencerModal;
