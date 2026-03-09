import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Hash, Camera, DollarSign, CheckCircle, ArrowLeft, ArrowRight, Instagram, Youtube, Twitter, Sparkles } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { icon: User, label: "Personal Info" },
  { icon: Hash, label: "Platforms & Niche" },
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

const RegisterInfluencer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    city: "",
    bio: "",
    niche: "",
    followers: "",
    engagementRate: "",
    platforms: [],
    priceReel: "",
    priceStory: "",
    priceVisit: "",
  });

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
      case 0:
        return form.name.trim().length > 0 && form.city.length > 0 && form.bio.trim().length > 0;
      case 1:
        return form.niche.length > 0 && form.followers.trim().length > 0 && form.engagementRate.trim().length > 0 && form.platforms.length > 0;
      case 2:
        return form.priceReel.trim().length > 0 && form.priceStory.trim().length > 0 && form.priceVisit.trim().length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to create a profile.", variant: "destructive" });
      navigate("/auth");
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

    // Update profile type
    if (!error) {
      await supabase.from("profiles").update({ user_type: "influencer", display_name: form.name }).eq("user_id", user.id);
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "🎉 Profile Created!",
        description: "Your influencer profile is now live. Brands can discover you!",
      });
      setTimeout(() => navigate("/"), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Header */}
      <div className="gradient-hero py-12 md:py-16">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Join as Influencer</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
              Create Your Profile
            </h1>
            <p className="text-primary-foreground/60 max-w-md mx-auto">
              Set up your profile and start getting booked by top brands
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-2xl -mt-8 pb-16 relative z-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
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
                        ? "gradient-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/10 border-2 border-primary text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 rounded transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
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
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Personal Information</h2>
                      <p className="text-sm text-muted-foreground">Tell brands who you are</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g. Rahul Sharma"
                          value={form.name}
                          onChange={(e) => update("name", e.target.value)}
                          maxLength={100}
                          className="mt-1.5"
                        />
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
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Describe what you create and what makes you unique..."
                          value={form.bio}
                          onChange={(e) => update("bio", e.target.value)}
                          maxLength={300}
                          className="mt-1.5 resize-none"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/300</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Platforms & Niche</h2>
                      <p className="text-sm text-muted-foreground">Where do you create content?</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Platforms</Label>
                        <div className="grid grid-cols-3 gap-3 mt-1.5">
                          {PLATFORMS.map((p) => {
                            const Icon = p.icon;
                            const selected = form.platforms.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => togglePlatform(p.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                  selected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/40 bg-card"
                                }`}
                              >
                                <Icon className={`w-6 h-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>
                                  {p.id}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label>Niche</Label>
                        <Select value={form.niche} onValueChange={(v) => update("niche", v)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select your niche" />
                          </SelectTrigger>
                          <SelectContent>
                            {NICHES.map((n) => (
                              <SelectItem key={n} value={n}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="followers">Followers</Label>
                          <Input
                            id="followers"
                            placeholder="e.g. 32K"
                            value={form.followers}
                            onChange={(e) => update("followers", e.target.value)}
                            maxLength={20}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="engagement">Engagement Rate (%)</Label>
                          <Input
                            id="engagement"
                            placeholder="e.g. 4.8"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={form.engagementRate}
                            onChange={(e) => update("engagementRate", e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Set Your Pricing</h2>
                      <p className="text-sm text-muted-foreground">How much do you charge per deliverable?</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: "priceReel" as const, label: "Reel Promotion", icon: "🎬", desc: "Short-form video content" },
                        { key: "priceStory" as const, label: "Story Promotion", icon: "📱", desc: "24-hour story feature" },
                        { key: "priceVisit" as const, label: "Visit & Review", icon: "📍", desc: "In-person visit with content" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 w-32">
                            <span className="text-muted-foreground font-medium">₹</span>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={form[item.key]}
                              onChange={(e) => update(item.key, e.target.value)}
                              className="text-right"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-display font-semibold mb-1">Review Your Profile</h2>
                      <p className="text-sm text-muted-foreground">Make sure everything looks good</p>
                    </div>

                    {/* Preview Card */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="gradient-primary p-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-2xl font-display font-bold">
                          {form.name.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-primary-foreground">{form.name || "Your Name"}</h3>
                          <p className="text-primary-foreground/70 text-sm flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {form.city || "City"}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <p className="text-sm text-muted-foreground">{form.bio || "No bio provided"}</p>

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="font-display font-bold">{form.followers || "—"}</p>
                            <p className="text-xs text-muted-foreground">Followers</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="font-display font-bold">{form.engagementRate ? `${form.engagementRate}%` : "—"}</p>
                            <p className="text-xs text-muted-foreground">Engagement</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="font-display font-bold">{form.niche || "—"}</p>
                            <p className="text-xs text-muted-foreground">Niche</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {form.platforms.map((p) => (
                            <span key={p} className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                              {p}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Reel", value: form.priceReel },
                            { label: "Story", value: form.priceStory },
                            { label: "Visit", value: form.priceVisit },
                          ].map((p) => (
                            <div key={p.label} className="text-center p-3 rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">{p.label}</p>
                              <p className="font-display font-bold text-primary">₹{p.value || "0"}</p>
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
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>

              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2 gradient-primary border-0 text-primary-foreground"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 gradient-primary border-0 text-primary-foreground"
                >
                  <CheckCircle className="w-4 h-4" /> {submitting ? "Creating..." : "Create Profile"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterInfluencer;
