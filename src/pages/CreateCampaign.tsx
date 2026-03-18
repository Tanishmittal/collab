import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  IndianRupee,
  Layers,
  Loader2,
  MapPin,
  Megaphone,
  Minus,
  Plus,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const logoOptions = ["B", "C", "F", "M", "S", "T"];
const deliverableOptions = ["Reel", "Story", "Post", "UGC Video"] as const;
const nicheColors: Record<string, string> = {
  Food: "text-orange-600 border-orange-200 bg-orange-50",
  Fitness: "text-green-600 border-green-200 bg-green-50",
  Fashion: "text-pink-600 border-pink-200 bg-pink-50",
  Tech: "text-blue-600 border-blue-200 bg-blue-50",
  Travel: "text-teal-600 border-teal-200 bg-teal-50",
  Lifestyle: "text-amber-600 border-amber-200 bg-amber-50",
  Beauty: "text-rose-600 border-rose-200 bg-rose-50",
  Comedy: "text-yellow-600 border-yellow-200 bg-yellow-50",
};

const steps = [
  { icon: Megaphone, label: "Identity" },
  { icon: Target, label: "Strategy" },
  { icon: Layers, label: "Logistics" },
];

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user, brandId } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    brandLogo: "B",
    city: "",
    niche: "",
    budget: "",
    influencersNeeded: "",
    description: "",
    deadline: undefined as Date | undefined,
  });
  const [deliverableCounts, setDeliverableCounts] = useState<Record<(typeof deliverableOptions)[number], number>>({
    Reel: 0,
    Story: 0,
    Post: 0,
    "UGC Video": 0,
  });
  const [includeEventVisit, setIncludeEventVisit] = useState(false);

  const update = (field: keyof typeof form, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 0) return Boolean(form.brand && form.city && form.niche);
    if (step === 1) return Boolean(form.description && form.budget && form.influencersNeeded);
    return Object.values(deliverableCounts).some((count) => count > 0) || includeEventVisit;
  };

  const campaignDeliverables = [
    ...deliverableOptions
      .filter((label) => deliverableCounts[label] > 0)
      .map((label) => `${deliverableCounts[label]} ${label}${deliverableCounts[label] > 1 ? "s" : ""}`),
    ...(includeEventVisit ? ["Event Visit"] : []),
  ];

  const updateDeliverable = (label: (typeof deliverableOptions)[number], delta: number) => {
    setDeliverableCounts((prev) => ({
      ...prev,
      [label]: Math.max(0, prev[label] + delta),
    }));
  };

  const previewBudget = form.budget ? parseInt(form.budget, 10) : 0;
  const previewSlots = form.influencersNeeded ? parseInt(form.influencersNeeded, 10) : 0;
  const previewApplied = previewSlots > 0 ? Math.max(1, Math.min(previewSlots - 1, Math.floor(previewSlots * 0.6))) : 0;
  const previewProgress = previewSlots > 0 ? Math.min((previewApplied / previewSlots) * 100, 100) : 0;
  const previewSlotsLeft = Math.max(0, previewSlots - previewApplied);
  const previewIsUrgent = previewProgress >= 80 && previewSlotsLeft > 0;
  const previewNicheStyle = nicheColors[form.niche] || "text-teal-600 border-teal-200 bg-teal-50";

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to create a campaign.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      brand: form.brand.trim().slice(0, 100),
      brand_logo: form.brandLogo,
      city: form.city,
      niche: form.niche,
      budget: parseInt(form.budget, 10),
      influencers_needed: parseInt(form.influencersNeeded, 10),
      deliverables: campaignDeliverables,
      description: form.description.trim().slice(0, 1000),
      expires_at: form.deadline?.toISOString(),
      status: "active",
    });

    setSubmitting(false);

    if (error) {
      console.error("Campaign creation error:", error);
      toast({ title: "Error", description: "Failed to create campaign. Please try again.", variant: "destructive" });
      return;
    }

    toast({ title: "Campaign live", description: "Your campaign is now visible to influencers." });
    navigate("/dashboard");
  };

  if (!brandId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Create Campaign" />
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Building2 size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Create a brand profile first</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Campaign creation is available only for brand accounts. Complete your brand profile, then launch campaigns from the dashboard.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate("/register-brand")}>
                Complete Brand Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Create Campaign" />
      <div className="container px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_360px]">
          <div className="p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                  <Zap size={12} />
                  Campaign Builder
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Launch Campaign</h1>
                <p className="mt-1 text-sm text-slate-500">Define the brief, budget, and creator requirements in one flow.</p>
              </div>

              <div className="hidden gap-1.5 md:flex">
                {steps.map((item, index) => (
                  <div
                    key={item.label}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === step ? "w-8 bg-teal-500" : "w-1.5 bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-1.5 md:hidden">
                {steps.map((item, index) => (
                  <div
                    key={item.label}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      index === step ? "w-8 bg-teal-500" : "w-1.5 bg-slate-200"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {step === 0 && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-[1fr_88px]">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brand Name *</Label>
                      <Input
                        placeholder="e.g. Burger Cafe"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-lg font-bold shadow-none"
                        value={form.brand}
                        onChange={(e) => update("brand", e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Mark</Label>
                      <Select value={form.brandLogo} onValueChange={(value) => update("brandLogo", value)}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-xl font-bold shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200">
                          {logoOptions.map((option) => (
                            <SelectItem key={option} value={option} className="font-bold">
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Primary City *</Label>
                      <Select value={form.city} onValueChange={(value) => update("city", value)}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200">
                          {CITIES.map((city) => (
                            <SelectItem key={city} value={city} className="font-bold">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Core Niche *</Label>
                      <Select value={form.niche} onValueChange={(value) => update("niche", value)}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none">
                          <SelectValue placeholder="Select niche" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200">
                          {NICHES.map((niche) => (
                            <SelectItem key={niche} value={niche} className="font-bold">
                              {niche}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brief Description *</Label>
                    <Textarea
                      placeholder="Describe the campaign goals, audience, and what kind of creators you want."
                      className="min-h-[180px] rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed shadow-none"
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      maxLength={1000}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Budget (Rs.) *</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="number"
                          placeholder="e.g. 25000"
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none"
                          value={form.budget}
                          onChange={(e) => update("budget", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Creators Needed *</Label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="number"
                          placeholder="e.g. 10"
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none"
                          value={form.influencersNeeded}
                          onChange={(e) => update("influencersNeeded", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Requested Deliverables</Label>
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      {deliverableOptions.map((label) => (
                        <div key={label} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{label}</p>
                            <p className="text-xs text-slate-400">Adjust how many of this deliverable you want.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl border-slate-200"
                              onClick={() => updateDeliverable(label, -1)}
                              disabled={deliverableCounts[label] === 0}
                            >
                              <Minus size={16} />
                            </Button>
                            <div className="w-10 text-center text-base font-bold text-slate-900">{deliverableCounts[label]}</div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl border-slate-200"
                              onClick={() => updateDeliverable(label, 1)}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Event Visit</p>
                          <p className="text-xs text-slate-400">Turn this on if the creator needs to appear in person.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "rounded-xl border-slate-200 px-4 font-semibold",
                            includeEventVisit && "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                          )}
                          onClick={() => setIncludeEventVisit((current) => !current)}
                        >
                          {includeEventVisit ? "Included" : "Add"}
                        </Button>
                      </div>
                    </div>
                    <p className="ml-1 text-[10px] font-medium italic text-slate-400">Select at least one deliverable to continue.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Application Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-14 w-full justify-start rounded-2xl border-slate-200 bg-slate-50 px-5 text-left font-bold shadow-none hover:bg-slate-100",
                            !form.deadline && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-teal-600/80" />
                          {form.deadline ? format(form.deadline, "PPP") : <span>Set closing date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto rounded-2xl border-slate-200 p-0 shadow-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={form.deadline}
                          onSelect={(date) => update("deadline", date)}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-start gap-4 rounded-3xl border border-teal-100 bg-teal-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <CheckCircle className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-teal-700">Final Check</p>
                      <p className="text-[11px] font-medium leading-relaxed text-teal-700/80">
                        Double check the budget, slots, and deliverables. Influencers will apply based on these terms.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => (step === 0 ? navigate(-1) : setStep((current) => current - 1))}
                className="h-12 w-full rounded-2xl border-slate-200 px-8 font-bold sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {step === 0 ? "Back" : "Previous"}
              </Button>

              {step < 2 ? (
                <Button
                  onClick={() => setStep((current) => current + 1)}
                  disabled={!canProceed()}
                  className="h-12 w-full rounded-2xl bg-slate-900 px-10 font-bold text-white hover:bg-slate-800 sm:w-auto"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={submitting || !canProceed()}
                  className="h-12 w-full rounded-2xl bg-teal-600 px-10 font-bold text-white hover:bg-teal-700 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      Launch Campaign
                      <Zap className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <aside className="hidden border-l border-slate-200 bg-slate-50/70 p-8 lg:flex">
            <div className="flex h-full flex-col">
              <div className="mb-6 inline-flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Live Preview</span>
              </div>

              <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
                <div className="relative z-10 flex flex-grow flex-col p-6">
                  <div className="mb-5 flex items-start">
                    <div className="min-w-0 flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-3xl text-gray-900 shadow-sm">
                        {form.brandLogo}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate font-display text-xl font-black tracking-wide text-gray-900">
                          {form.brand || "Brand Name"}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge className={`rounded-md px-2 py-0 text-[10px] font-bold uppercase tracking-widest shadow-none ${previewNicheStyle}`}>
                            {form.niche || "Niche"}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <MapPin size={10} className="text-gray-400" />
                            {form.city || "City"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mb-6 min-h-[40px] whitespace-pre-wrap break-all text-sm leading-relaxed text-gray-600">
                    {form.description || "Describe your campaign to preview how it appears to influencers."}
                  </p>

                  <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="mb-5 flex items-end justify-between">
                      <div>
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Campaign Budget</p>
                        <div className="flex items-end gap-1">
                          <span className="mb-0.5 text-lg font-bold text-teal-600">Rs.</span>
                          <span className="text-3xl font-black tracking-tight text-gray-900">{previewBudget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 shadow-sm">
                          <Clock size={12} className={previewIsUrgent ? "text-rose-500" : "text-teal-600"} />
                          {form.deadline ? format(form.deadline, "dd MMM") : "TBD"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        <Target size={10} /> Required Deliverables
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {campaignDeliverables.length > 0 ? (
                          campaignDeliverables.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium tracking-wide text-gray-700 shadow-sm">
                              <Zap size={10} className="text-teal-500" />
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium tracking-wide text-gray-400 shadow-sm">
                            <Zap size={10} className="text-gray-300" />
                            No deliverables yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="mb-4 flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          <span className={previewIsUrgent ? "text-rose-600" : "text-teal-600"}>
                            {previewSlots === 0 ? "No slots set" : previewSlotsLeft === 0 ? "No slots left" : `${previewSlotsLeft} slots left`}
                          </span>
                        </p>
                      </div>

                      {previewApplied > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(previewApplied, 3))].map((_, index) => (
                              <div key={index} className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-white bg-gray-100 text-gray-400 shadow-sm">
                                <Users size={12} />
                              </div>
                            ))}
                            {previewApplied > 3 && (
                              <div className="z-0 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-white bg-gray-100 text-[10px] font-bold text-gray-600">
                                +{previewApplied - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-500">{previewApplied} applied</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${previewIsUrgent ? "bg-rose-500" : "bg-teal-500"}`}
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>

                    <Button className="w-full rounded-xl bg-gray-900 py-3 font-bold tracking-wide text-white pointer-events-none hover:bg-gray-900">
                      Apply Now
                    </Button>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-teal-50/[0.18]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
