import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User, MapPin, DollarSign, CheckCircle, ArrowLeft, ArrowRight,
  Instagram, Youtube, Twitter, Loader2, ImageIcon,
  Sparkles, Camera, Globe, Info, ShieldCheck, Plus,
  X, ChevronRight, ChevronLeft, Upload, Check, ExternalLink, Copy, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AvatarUpload from "./AvatarUpload";

interface FormData {
  name: string;
  city: string;
  bio: string;
  niche: string;
  followers: string;
  engagementRate: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  priceReel: number;
  priceStory: number;
  priceVisit: number;
  avatarUrl: string | null;
  isVerified: boolean;
}

interface ListInfluencerModalProps {
  trigger: React.ReactNode;
  onCreated?: () => void;
}

const STEPS = [
  { id: 0, title: "Appearance", icon: Camera },
  { id: 1, title: "About You", icon: User },
  { id: 2, title: "Verification", icon: ShieldCheck },
  { id: 3, title: "Pricing", icon: DollarSign },
  { id: 4, title: "Review", icon: CheckCircle },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle", color: "text-pink-500" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@yourchannel", color: "text-red-500" },
  { id: "twitter", label: "X (Twitter)", icon: Twitter, placeholder: "https://x.com/yourhandle", color: "text-sky-500" },
];

const ListInfluencerModal = ({ trigger, onCreated }: ListInfluencerModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    city: "",
    bio: "",
    niche: "",
    followers: "",
    engagementRate: "",
    instagramUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    priceReel: 5000,
    priceStory: 2000,
    priceVisit: 8000,
    avatarUrl: null,
    isVerified: false,
  });

  const [verificationCode] = useState(() => {
    return Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  });

  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "", city: "", bio: "", niche: "", followers: "",
      engagementRate: "", instagramUrl: "", youtubeUrl: "",
      twitterUrl: "", priceReel: 5000, priceStory: 2000, priceVisit: 8000,
      avatarUrl: null, isVerified: false,
    });
    setStep(0);
    setVerifiedPlatforms(new Set());
    setCopied(false);
    setVerifying(null);
  };

  const update = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Paste this code in your social media bio." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (platformId: string) => {
    const urlKey = `${platformId}Url` as keyof FormData;
    const url = (formData[urlKey] as string)?.trim();

    if (!url) {
      toast({ title: "Enter URL first", description: "Please enter your profile URL before verifying.", variant: "destructive" });
      return;
    }

    setVerifying(platformId);
    try {
      const { data, error } = await supabase.functions.invoke("verify-social", {
        body: { platform: platformId, url, verificationCode },
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

        setFormData(prev => ({
          ...prev,
          isVerified: true,
          followers: data.stats?.followers || prev.followers,
          engagementRate: data.stats?.engagement_rate ? data.stats.engagement_rate.toString() : prev.engagementRate
        }));
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

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return formData.name.trim().length > 0 && formData.avatarUrl !== null;
      case 1: return formData.city.length > 0 && formData.bio.trim().length > 0 && formData.niche.length > 0;
      case 2: return true;
      case 3: return formData.priceReel > 0 && formData.priceStory > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to create a profile.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("influencer_profiles")
      .insert({
        user_id: user.id,
        name: formData.name,
        city: formData.city,
        bio: formData.bio,
        niche: formData.niche,
        followers: formData.followers || "0",
        engagement_rate: formData.engagementRate || "0",
        platforms: verifiedPlatforms.size > 0 ? Array.from(verifiedPlatforms).map(id => id.charAt(0).toUpperCase() + id.slice(1)) : ["Instagram"],
        price_reel: formData.priceReel,
        price_story: formData.priceStory,
        price_visit: formData.priceVisit,
        is_verified: formData.isVerified,
        instagram_url: formData.instagramUrl || null,
        youtube_url: formData.youtubeUrl || null,
        twitter_url: formData.twitterUrl || null,
        verification_code: verificationCode,
        avatar_url: formData.avatarUrl
      } as any)
      .select()
      .single();

    if (!error) {
      await supabase.from("profiles").update({
        user_type: "influencer",
        display_name: formData.name,
        avatar_url: formData.avatarUrl || null
      }).eq("user_id", user.id);
    }

    setSubmitting(false);

    const { refreshProfiles } = useAuth();
    
    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      await refreshProfiles();
      toast({ title: "🚀 Profile Created!", description: "Welcome to InfluFlow! Your profile is now live." });
      resetForm();
      setOpen(false);
      onCreated?.();
      navigate(`/influencer/${data.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
        <div className="gradient-hero py-6 px-6">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-2 w-fit backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Creator Setup</span>
            </div>
            <DialogTitle className="text-2xl font-display font-black text-primary-foreground tracking-tight">
              Build Your Profile
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6 px-2 max-w-xs mx-auto">
            {STEPS.map((s, i) => {
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
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500 ${i < step ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="min-h-[300px] mt-4">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.2 }}>

                {step === 0 && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3 py-2">
                      <AvatarUpload
                        userId={user?.id || "anonymous"}
                        currentUrl={formData.avatarUrl}
                        initials={formData.name?.substring(0, 2).toUpperCase() || "IF"}
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
                        value={formData.name}
                        onChange={e => update("name", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5 max-w-md mx-auto">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base City *</Label>
                      <Select value={formData.city} onValueChange={v => update("city", v)}>
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
                      <Select value={formData.niche} onValueChange={v => update("niche", v)}>
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
                        value={formData.bio}
                        onChange={e => update("bio", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-muted-foreground">Add this code to your bio to verify ownership and fetch stats:</p>
                        <Button variant="link" size="sm" onClick={() => setStep(3)} className="h-auto p-0 text-primary font-bold">Skip for now</Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-background px-3 py-2 rounded-lg font-mono text-sm border">{verificationCode}</code>
                        <Button variant="outline" size="sm" onClick={copyCode}>{copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}</Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {PLATFORMS.map((p) => {
                        const Icon = p.icon;
                        const isPlatformVerified = verifiedPlatforms.has(p.id);
                        const urlKey = `${p.id}Url` as keyof FormData;
                        return (
                          <div key={p.id} className="space-y-1.5">
                            <Label className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                              <span className="flex items-center gap-1.5"><Icon size={14} className={p.color} /> {p.label}</span>
                              {isPlatformVerified && (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-primary/10 text-primary border-none px-1.5 py-0">Verified</Badge>
                                  <span className="text-[10px] text-accent font-black">{formData.followers || "0"} Followers</span>
                                </div>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input value={formData[urlKey] as string} onChange={(e) => update(urlKey, e.target.value)} placeholder={p.placeholder} disabled={isPlatformVerified} className="rounded-xl h-10" />
                              <Button
                                variant={isPlatformVerified ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => handleVerify(p.id)}
                                disabled={!String(formData[urlKey] || "").trim() || verifying !== null || isPlatformVerified}
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
                )}

                {step === 3 && (
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
                          <Input type="number" value={formData[item.key]} onChange={e => update(item.key, parseInt(e.target.value) || 0)} className="text-right border-none bg-transparent h-8 p-0 pr-2 font-bold" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 pt-2 flex flex-col items-center">
                    <div className="text-center space-y-1">
                      <h3 className="font-display font-black text-xl uppercase italic text-primary">Ready to Go Live!</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Your profile will look like this:</p>
                    </div>

                    {/* Exact InfluencerCard Preview */}
                    <div className="w-full max-w-[280px] group relative rounded-[1.5rem] overflow-hidden shadow-2xl shadow-black/20">
                      <div className={`aspect-[3/4] relative overflow-hidden ${!formData.avatarUrl ? `bg-gradient-to-br from-teal-400 to-indigo-400` : 'bg-gray-900'}`}>
                        {formData.avatarUrl ? (
                          <img src={formData.avatarUrl} className="absolute inset-0 w-full h-full object-contain" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl font-display font-bold text-white/15">
                              {formData.name?.split(" ").map(n => n[0]).join("") || "IF"}
                            </span>
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {/* Top-right platform icons */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          {Array.from(verifiedPlatforms).map(p => (
                            <div key={p} className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                              {p === "instagram" ? <Instagram size={12} /> : p === "youtube" ? <Youtube size={12} /> : <Twitter size={12} />}
                            </div>
                          ))}
                        </div>

                        {/* Bottom content overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          {/* Niche tag */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-1 w-5 rounded-full bg-gradient-to-r from-teal-400 to-indigo-400" />
                            <span className="text-[8px] font-bold tracking-widest uppercase text-white/80">{formData.niche || "Creator"}</span>
                          </div>

                          {/* Name + verified */}
                          <div className="flex items-center gap-1 mb-0.5">
                            <h3 className="text-base font-black text-white truncate">{formData.name}</h3>
                            {formData.isVerified && <ShieldCheck size={12} className="text-teal-400 fill-teal-400/20" />}
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1 text-white/50 text-[10px] mb-3">
                            <MapPin size={9} />
                            <span>{formData.city}</span>
                          </div>

                          {/* Stats row */}
                          <div className="flex items-center gap-4 mb-3">
                            <div>
                              <p className="text-[7px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Followers</p>
                              <p className="text-xs font-bold text-white">{formData.followers || "0"}</p>
                            </div>
                            <div className="h-6 w-[1px] bg-white/15" />
                            <div>
                              <p className="text-[7px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Engage</p>
                              <p className="text-xs font-bold text-white">{formData.engagementRate || "0"}%</p>
                            </div>
                          </div>

                          {/* CTA Mockup */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-bold text-white flex items-center justify-center gap-1">
                              View Insights <ExternalLink size={10} />
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] uppercase tracking-wider text-gray-400 font-bold leading-none">from</p>
                              <p className="text-[10px] font-black text-white leading-none">₹{formData.priceReel.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-muted">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="rounded-xl h-10 font-bold px-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
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
      </DialogContent>
    </Dialog>
  );
};

export default ListInfluencerModal;
