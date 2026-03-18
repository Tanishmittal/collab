import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Hash, Camera, DollarSign, CheckCircle, ArrowLeft, ArrowRight,
  Instagram, Youtube, Twitter, Loader2, Sparkles, ShieldCheck, Info,
  ExternalLink, Copy, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CITIES, NICHES } from "@/data/mockData";
import { useInfluencerRegistration, InfluencerFormData, PLATFORMS } from "@/hooks/useInfluencerRegistration";
import AvatarUpload from "@/components/AvatarUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PAGE_STEPS = [
  { icon: User, label: "Personal Info" },
  { icon: Hash, label: "Platforms & Niche" },
  { icon: DollarSign, label: "Pricing" },
  { icon: CheckCircle, label: "Review" },
];

const MODAL_STEPS = [
  { id: 0, title: "Appearance", icon: Camera },
  { id: 1, title: "About You", icon: User },
  { id: 2, title: "Verification", icon: ShieldCheck },
  { id: 3, title: "Pricing", icon: DollarSign },
  { id: 4, title: "Review", icon: CheckCircle },
];

const MODAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle", color: "text-pink-500" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@yourchannel", color: "text-red-500" },
  { id: "twitter", label: "X (Twitter)", icon: Twitter, placeholder: "https://x.com/yourhandle", color: "text-sky-500" },
];

interface InfluencerRegistrationFormProps {
  step: number;
  setStep: (step: number) => void;
  submitting: boolean;
  form: InfluencerFormData;
  update: (field: keyof InfluencerFormData, value: string | string[] | number | boolean | null) => void;
  togglePlatform: (platform: string) => void;
  canProceed: () => boolean;
  handleSubmit: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

const InfluencerRegistrationForm = ({
  step,
  setStep,
  submitting,
  form,
  update,
  togglePlatform,
  canProceed,
  handleSubmit,
  isModal = false,
  onClose,
}: InfluencerRegistrationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    const code = form.verificationCode || "";
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied!", description: "Paste this code in your social media bio." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (platformId: string) => {
    const urlKey = `${platformId}Url` as keyof InfluencerFormData;
    const url = (form[urlKey] as string)?.trim();

    if (!url) {
      toast({ title: "Enter URL first", description: "Please enter your profile URL before verifying.", variant: "destructive" });
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
          description: "Could not verify. Make sure the URL is correct and your profile is public.",
          variant: "destructive",
        });
        return;
      }

      if (data?.verified) {
        setVerifiedPlatforms(prev => new Set(prev).add(platformId));
        toast({ title: "✅ Verified!", description: `${platformId} account has been verified!` });

        update("isVerified", true);
        if (data.stats?.followers) update("followers", data.stats.followers);
        if (data.stats?.engagement_rate) update("engagementRate", data.stats.engagement_rate.toString());
      } else {
        toast({
          title: "Code not found",
          description: data?.message || "Make sure the code is in your bio and your profile is public.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setVerifying(null);
    }
  };

  const renderStepContent = () => {
    if (isModal) {
      // Modal-specific rendering
      switch (step) {
        case 0:
          return (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 py-2">
                <AvatarUpload
                  userId={user?.id || "anonymous"}
                  currentUrl={form.avatarUrl || null}
                  initials={form.name?.substring(0, 2).toUpperCase() || "IF"}
                  onUploaded={(url) => update("avatarUrl", url)}
                  onRemove={() => update("avatarUrl", null)}
                  size="lg"
                />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl h-12 bg-muted/30 border-muted"
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                />
              </div>
            </div>
          );

        case 1:
          return (
            <div className="space-y-5 max-w-md mx-auto">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base City *</Label>
                <Select value={form.city} onValueChange={v => update("city", v)}>
                  <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-muted">
                    <SelectValue placeholder="Where are you based?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Niche *</Label>
                <Select value={form.niche} onValueChange={v => update("niche", v)}>
                  <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-muted">
                    <SelectValue placeholder="What's your niche?" />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short Bio *</Label>
                <Textarea
                  placeholder="e.g. Food explorer from Delhi sharing hidden gems..."
                  className="rounded-xl bg-muted/30 border-muted min-h-[100px]"
                  value={form.bio}
                  onChange={e => update("bio", e.target.value)}
                />
              </div>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-muted-foreground">Add this code to your bio to verify ownership and fetch stats:</p>
                  <Button variant="link" size="sm" onClick={() => setStep(3)} className="h-auto p-0 text-primary font-bold">Skip for now</Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded-lg font-mono text-sm border">{form.verificationCode}</code>
                  <Button variant="outline" size="sm" onClick={copyCode}>{copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}</Button>
                </div>
              </div>
              <div className="space-y-4">
                {MODAL_PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const isPlatformVerified = verifiedPlatforms.has(p.id);
                  const urlKey = `${p.id}Url` as keyof InfluencerFormData;
                  return (
                    <div key={p.id} className="space-y-1.5">
                      <Label className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Icon size={14} className={p.color} /> {p.label}</span>
                        {isPlatformVerified && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-none px-1.5 py-0">Verified</Badge>
                            <span className="text-[10px] text-accent font-black">{form.followers || "0"} Followers</span>
                          </div>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input value={form[urlKey] as string} onChange={(e) => update(urlKey, e.target.value)} placeholder={p.placeholder} disabled={isPlatformVerified} className="rounded-xl h-10" />
                        <Button
                          variant={isPlatformVerified ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => handleVerify(p.id)}
                          disabled={!String(form[urlKey] || "").trim() || verifying !== null || isPlatformVerified}
                          className="rounded-xl"
                        >
                          {verifying === p.id ? <Loader2 size={14} className="animate-spin" /> : isPlatformVerified ? <CheckCircle size={14} className="text-emerald-500" /> : <ExternalLink size={14} />}
                          <span className="ml-1.5">{isPlatformVerified ? "Verified" : "Verify"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );

        case 3:
          return (
            <div className="space-y-4 max-w-md mx-auto">
              {[
                { key: "priceReel" as const, label: "Reel Promotion", icon: "🎬" },
                { key: "priceStory" as const, label: "Story Feature", icon: "📱" },
                { key: "priceVisit" as const, label: "Store Visit", icon: "📍" },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-4 p-4 rounded-2xl border bg-card">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">{item.icon}</div>
                  <div className="flex-1 font-bold text-sm">{item.label}</div>
                  <div className="flex items-center gap-1.5 w-28 bg-muted/50 p-1 rounded-lg border">
                    <span className="text-accent font-black pl-2 text-xs">₹</span>
                    <Input type="number" value={form[item.key]} onChange={e => update(item.key, e.target.value)} className="text-right border-none bg-transparent h-8 p-0 pr-2 font-bold" />
                  </div>
                </div>
              ))}
            </div>
          );

        case 4:
          return (
            <div className="space-y-6 pt-2 flex flex-col items-center">
              <div className="text-center space-y-1">
                <h3 className="font-display font-black text-xl uppercase italic text-primary">Ready to Go Live!</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Your profile will look like this:</p>
              </div>

              {/* InfluencerCard Preview */}
              <div className="w-full max-w-[280px] group relative rounded-[1.5rem] overflow-hidden shadow-2xl shadow-black/20">
                <div className={`aspect-[3/4] relative overflow-hidden ${!form.avatarUrl ? `bg-gradient-to-br from-teal-400 to-indigo-400` : 'bg-gray-900'}`}>
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl font-display font-bold text-white/15">
                        {form.name?.split(" ").map(n => n[0]).join("") || "IF"}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {Array.from(verifiedPlatforms).map(p => (
                      <div key={p} className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                        {p === "instagram" ? <Instagram size={12} /> : p === "youtube" ? <Youtube size={12} /> : <Twitter size={12} />}
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-1 w-5 rounded-full bg-gradient-to-r from-teal-400 to-indigo-400" />
                      <span className="text-[8px] font-bold tracking-widest uppercase text-white/80">{form.niche || "Creator"}</span>
                    </div>

                    <div className="flex items-center gap-1 mb-0.5">
                      <h3 className="text-base font-black text-white truncate">{form.name}</h3>
                      {form.isVerified && <ShieldCheck size={12} className="text-teal-400 fill-teal-400/20" />}
                    </div>

                    <div className="flex items-center gap-1 text-white/50 text-[10px] mb-3">
                      <MapPin size={9} />
                      <span>{form.city}</span>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <p className="text-[7px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Followers</p>
                        <p className="text-xs font-bold text-white">{form.followers || "0"}</p>
                      </div>
                      <div className="h-6 w-[1px] bg-white/15" />
                      <div>
                        <p className="text-[7px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Engage</p>
                        <p className="text-xs font-bold text-white">{form.engagementRate || "0"}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-bold text-white flex items-center justify-center gap-1">
                        View Insights <ExternalLink size={10} />
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] uppercase tracking-wider text-gray-400 font-bold leading-none">from</p>
                        <p className="text-[10px] font-black text-white leading-none">₹{parseInt(form.priceReel).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    } else {
      // Page-specific rendering
      switch (step) {
        case 0:
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
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
            </motion.div>
          );

        case 1:
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-semibold mb-1">Platforms & Niche</h2>
                <p className="text-sm text-muted-foreground">Where do you create content?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Platforms</Label>
                  <div className="grid grid-cols-3 gap-3 mt-1.5">
                    {PLATFORMS.map((p) => {
                      const Icon = p.icon as any;
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
            </motion.div>
          );

        case 2:
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
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
            </motion.div>
          );

        case 3:
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-semibold mb-1">Review Your Profile</h2>
                <p className="text-sm text-muted-foreground">Make sure everything looks good</p>
              </div>

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
            </motion.div>
          );

        default:
          return null;
      }
    }
  };

  if (isModal) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6 px-2 max-w-xs mx-auto">
          {MODAL_STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 relative group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isDone ? "gradient-hero text-primary-foreground" :
                    isActive ? "bg-primary/10 border-2 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" :
                      "bg-muted text-muted-foreground"
                    }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                </div>
                {i < MODAL_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="min-h-[300px] mt-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.2 }}>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-muted">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="rounded-xl h-10 font-bold px-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step < MODAL_STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="rounded-xl h-10 px-6 gradient-primary font-bold uppercase tracking-tight shadow-lg shadow-primary/20">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl h-10 px-8 gradient-primary font-black uppercase tracking-tight shadow-lg shadow-primary/20">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : <>Go Live <CheckCircle className="w-4 h-4 ml-2" /></>}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Page layout
  return (
    <div className="container max-w-2xl -mt-8 pb-16 relative z-10">
      <div className="flex items-center justify-between mb-8 px-2">
        {PAGE_STEPS.map((s, i) => {
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
              {i < PAGE_STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 rounded transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
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
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

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
              {PAGE_STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>

            {step < PAGE_STEPS.length - 1 ? (
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
  );
};

export default InfluencerRegistrationForm;