import { useState } from "react";
import { 
  Loader2, Plus, Sparkles, Target, Users, IndianRupee, 
  Calendar as CalendarIcon, MapPin, Briefcase, Info, 
  CheckCircle, ArrowLeft, ArrowRight, Zap, Megaphone,
  Layers, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CITIES, NICHES } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

const emojiOptions = ["🏪", "🍔", "💪", "👗", "📱", "☕", "✨", "🚀", "🎯", "🎨", "🌮", "👟", "🏨", "🎮"];

interface CreateCampaignModalProps {
  trigger: React.ReactNode;
  onCreated?: () => void;
}

const CreateCampaignModal = ({ trigger, onCreated }: CreateCampaignModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    brand: "",
    brandLogo: "🚀",
    city: "",
    niche: "",
    budget: "",
    influencersNeeded: "",
    description: "",
    deliverables: "",
    deadline: undefined as Date | undefined,
  });

  const update = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      brand: "",
      brandLogo: "🚀",
      city: "",
      niche: "",
      budget: "",
      influencersNeeded: "",
      description: "",
      deliverables: "",
      deadline: undefined,
    });
    setStep(0);
  };

  const canProceed = () => {
    if (step === 0) return form.brand && form.city && form.niche;
    if (step === 1) return form.description && form.budget && form.influencersNeeded;
    if (step === 2) return true;
    return false;
  };

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to create a campaign.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const deliverables = form.deliverables.split(",").map(d => d.trim()).filter(Boolean);
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      brand: form.brand.trim().slice(0, 100),
      brand_logo: form.brandLogo,
      city: form.city,
      niche: form.niche,
      budget: parseInt(form.budget),
      influencers_needed: parseInt(form.influencersNeeded),
      deliverables,
      description: form.description.trim().slice(0, 1000),
      deadline: form.deadline?.toISOString(),
      status: "active",
    });
    setSubmitting(false);

    if (error) {
      console.error("Campaign creation error:", error);
      toast({ title: "Error", description: "Failed to create campaign. Please try again.", variant: "destructive" });
      return;
    }

    toast({ title: "🚀 Campaign Live!", description: "Your brand is now visible to influencers." });
    resetForm();
    setOpen(false);
    onCreated?.();
  };

  const steps = [
    { icon: Megaphone, label: "Identity" },
    { icon: Target, label: "Strategy" },
    { icon: Layers, label: "Logistics" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none sm:rounded-[2.5rem] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] h-[640px]">
          {/* Main Form Area */}
          <div className="bg-background p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-2 border border-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-primary text-[10px] font-black uppercase tracking-widest leading-none">Campaign Builder</span>
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight">Launch Campaign</h2>
              </div>
              
              <div className="flex gap-1.5">
                {steps.map((s, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-8 bg-primary shadow-sm shadow-primary/20" : "w-1.5 bg-muted"}`} />
                ))}
              </div>
            </div>

            <div className="flex-grow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {step === 0 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_80px] gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Brand Name *</Label>
                          <Input 
                            placeholder="e.g., Burger Cafe" 
                            className="rounded-2xl h-14 bg-muted/30 border-muted focus:bg-background transition-all font-bold text-lg px-5 shadow-none"
                            value={form.brand} 
                            onChange={e => update("brand", e.target.value)} 
                            maxLength={100} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1 text-center block">Logo</Label>
                          <Select value={form.brandLogo} onValueChange={v => update("brandLogo", v)}>
                            <SelectTrigger className="rounded-2xl h-14 bg-muted/30 border-muted text-2xl flex items-center justify-center p-0 transition-all hover:bg-muted/50 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="min-w-[120px] rounded-2xl border-muted p-2">
                              <div className="grid grid-cols-4 gap-1">
                                {emojiOptions.map(e => (
                                  <SelectItem key={e} value={e} className="rounded-xl h-10 w-10 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors text-xl p-0">
                                    {e}
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Primary City *</Label>
                          <Select value={form.city} onValueChange={v => update("city", v)}>
                            <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-muted font-bold px-5 shadow-none">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-muted">
                              {CITIES.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Core Niche *</Label>
                          <Select value={form.niche} onValueChange={v => update("niche", v)}>
                            <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-muted font-bold px-5 shadow-none">
                              <SelectValue placeholder="Industry type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-muted">
                              {NICHES.map(n => <SelectItem key={n} value={n} className="font-bold">{n}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Brief Description *</Label>
                        <Textarea 
                          placeholder="Describe the campaign goals and expectations..." 
                          className="rounded-2xl min-h-[160px] bg-muted/30 border-muted focus:bg-background transition-all font-medium text-sm p-5 resize-none shadow-none leading-relaxed"
                          value={form.description} 
                          onChange={e => update("description", e.target.value)} 
                          maxLength={1000} 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Estimate Budget (₹) *</Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              placeholder="e.g., 25000" 
                              className="rounded-2xl h-12 bg-muted/30 border-muted pl-10 font-bold shadow-none"
                              value={form.budget} 
                              onChange={e => update("budget", e.target.value)} 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Creators Needed *</Label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              placeholder="e.g., 10" 
                              className="rounded-2xl h-12 bg-muted/30 border-muted pl-10 font-bold shadow-none"
                              value={form.influencersNeeded} 
                              onChange={e => update("influencersNeeded", e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8">
                       <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Requested Deliverables</Label>
                        <Input 
                          placeholder="e.g., 1 Reel, 2 Stories (comma-separated)" 
                          className="rounded-2xl h-14 bg-muted/30 border-muted focus:bg-background transition-all font-bold px-5 shadow-none"
                          value={form.deliverables} 
                          onChange={e => update("deliverables", e.target.value)} 
                        />
                        <p className="text-[10px] text-muted-foreground font-medium italic mt-1.5 ml-1">
                          Split items by comma for better visibility.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Application Deadline</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full rounded-2xl h-14 bg-muted/30 border-muted justify-start text-left font-bold px-5 shadow-none hover:bg-muted/50 transition-all",
                                !form.deadline && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-3 h-5 w-5 text-primary opacity-70" />
                              {form.deadline ? format(form.deadline, "PPP") : <span>Set closing date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl border-muted shadow-2xl" align="start">
                            <Calendar
                              mode="single"
                              selected={form.deadline}
                              onSelect={(d) => update("deadline", d)}
                              initialFocus
                              disabled={(date) => date < new Date()}
                              className="rounded-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-start gap-4 mx-auto">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary mb-0.5 uppercase tracking-wider">Final Verification</p>
                          <p className="text-[11px] leading-relaxed text-primary/70 font-medium">
                            Double check your budget and deliverables. Once live, influencers will start applying based on these terms.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between pt-8 mt-4 border-t border-muted">
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="rounded-2xl h-12 px-8 border-muted font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {step < 2 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="rounded-2xl h-12 px-10 gradient-primary text-white font-black uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
                >
                  Continuue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={submitting || !canProceed()}
                  className="rounded-2xl h-12 px-10 gradient-primary text-white font-black uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching...</>
                  ) : (
                    <>Blast Off <Zap className="w-4 h-4 ml-2 fill-white" /></>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Live Preview Side Panel */}
          <div className="bg-muted/30 border-l border-muted p-8 hidden md:flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Preview</span>
              </div>

              {/* Preview Card */}
              <div className="bg-white rounded-[2rem] border border-muted shadow-xl shadow-black/5 p-6 flex flex-col transform hover:scale-[1.02] transition-transform duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl shadow-inner border border-muted/50">
                      {form.brandLogo}
                    </div>
                    <div>
                      <h4 className="font-display font-black text-base truncate max-w-[120px]">
                        {form.brand || "Brand Name"}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className="px-2 py-0 h-4 text-[8px] uppercase font-black bg-primary/10 text-primary border-none">
                          {form.niche || "Niche"}
                        </Badge>
                        <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-0.5">
                          <MapPin size={8} /> {form.city || "City"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2.5 py-1.5 bg-muted/40 rounded-xl border border-muted/30 text-right">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block leading-none mb-1">Budget</span>
                    <span className="text-sm font-black text-primary leading-none">₹{form.budget ? parseInt(form.budget).toLocaleString() : "0"}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed mb-4 min-h-[48px]">
                  {form.description || "Describe your campaign to see how it looks to influencers..."}
                </p>

                <div className="bg-muted/20 rounded-2xl p-4 mb-4 border border-muted/10">
                   <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Deadline</span>
                      <div className="flex items-center gap-1 text-[10px] font-black text-primary">
                        <Clock size={10} />
                        {form.deadline ? format(form.deadline, "dd MMM") : "TBD"}
                      </div>
                    </div>
                    <div>
                        <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5 text-right">Slots</span>
                        <div className="flex items-center gap-1 text-[10px] font-black text-primary justify-end">
                          <Users size={10} />
                          {form.influencersNeeded || "0"}
                        </div>
                    </div>
                   </div>

                   <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-muted-foreground uppercase block">Planned Deliverables</span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.deliverables ? form.deliverables.split(",").slice(0, 2).map((d, i) => (
                          <div key={i} className="text-[8px] font-bold px-2 py-1 bg-white rounded-lg border border-muted/50 text-foreground">
                            {d.trim() || "Item"}
                          </div>
                        )) : (
                          <div className="text-[8px] font-bold px-2 py-1 bg-white/50 rounded-lg border border-muted/30 text-muted-foreground italic">
                            No deliverables yet
                          </div>
                        )}
                        {form.deliverables.split(",").length > 2 && (
                          <span className="text-[8px] font-black text-muted-foreground pt-1">+{form.deliverables.split(",").length - 2}</span>
                        )}
                      </div>
                   </div>
                </div>

                <Button className="w-full h-10 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 mt-auto pointer-events-none">
                  Apply Now
                </Button>
              </div>

              <div className="mt-auto space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary fill-primary" />
                    </div>
                    <p className="text-[10px] font-bold leading-snug">
                       <span className="text-primary">Boost visibility</span> by adding high-quality deliverables.
                    </p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-[10px] font-bold leading-snug">
                       Targeting <span className="text-primary">{form.niche || "the right niche"}</span> increases apply rates.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignModal;
