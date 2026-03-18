import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  IndianRupee,
  Loader2,
  MapPin,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CITIES, NICHES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const logoOptions = ["B", "C", "F", "M", "S", "T"];
const deliverableOptions = ["Reel", "Story", "Post", "UGC Video"] as const;

type DeliverableLabel = (typeof deliverableOptions)[number];

const parseDeliverables = (deliverables: string[] | null | undefined) => {
  const counts: Record<DeliverableLabel, number> = {
    Reel: 0,
    Story: 0,
    Post: 0,
    "UGC Video": 0,
  };
  let includeEventVisit = false;

  (deliverables || []).forEach((item) => {
    const normalized = item.toLowerCase();
    if (normalized === "event visit") {
      includeEventVisit = true;
      return;
    }

    const matched = deliverableOptions.find((label) => normalized.includes(label.toLowerCase()));
    if (!matched) return;

    const quantity = parseInt(item, 10);
    counts[matched] = Number.isNaN(quantity) ? 1 : quantity;
  });

  return { counts, includeEventVisit };
};

const EditCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, brandId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalCampaign, setOriginalCampaign] = useState<any | null>(null);
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
  const [deliverableCounts, setDeliverableCounts] = useState<Record<DeliverableLabel, number>>({
    Reel: 0,
    Story: 0,
    Post: 0,
    "UGC Video": 0,
  });
  const [includeEventVisit, setIncludeEventVisit] = useState(false);
  const [activitySummary, setActivitySummary] = useState({
    applicationsCount: 0,
    acceptedCount: 0,
    bookingsCount: 0,
  });

  const targetingLocked = activitySummary.applicationsCount > 0;
  const commercialLocked = activitySummary.acceptedCount > 0 || activitySummary.bookingsCount > 0;

  useEffect(() => {
    const loadCampaign = async () => {
      if (!id || !user) return;

      const [
        { data, error },
        { count: applicationsCount },
        { count: acceptedCount },
        { count: bookingsCount },
      ] = await Promise.all([
        supabase
          .from("campaigns")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("campaign_applications")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", id),
        supabase
          .from("campaign_applications")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", id)
          .eq("status", "accepted"),
        supabase
          .from("bookings" as any)
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", id),
      ]);

      if (error || !data) {
        toast({ title: "Campaign not found", description: "You can only edit your own campaigns.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }

      const parsed = parseDeliverables(data.deliverables);
      setOriginalCampaign(data);

      setForm({
        brand: data.brand || "",
        brandLogo: data.brand_logo || "B",
        city: data.city || "",
        niche: data.niche || "",
        budget: String(data.budget || ""),
        influencersNeeded: String(data.influencers_needed || ""),
        description: data.description || "",
        deadline: data.expires_at ? new Date(data.expires_at) : undefined,
      });
      setDeliverableCounts(parsed.counts);
      setIncludeEventVisit(parsed.includeEventVisit);
      setActivitySummary({
        applicationsCount: applicationsCount || 0,
        acceptedCount: acceptedCount || 0,
        bookingsCount: bookingsCount || 0,
      });
      setLoading(false);
    };

    loadCampaign();
  }, [id, user, navigate, toast]);

  const update = (field: keyof typeof form, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDeliverable = (label: DeliverableLabel, delta: number) => {
    setDeliverableCounts((prev) => ({
      ...prev,
      [label]: Math.max(0, prev[label] + delta),
    }));
  };

  const campaignDeliverables = [
    ...deliverableOptions
      .filter((label) => deliverableCounts[label] > 0)
      .map((label) => `${deliverableCounts[label]} ${label}${deliverableCounts[label] > 1 ? "s" : ""}`),
    ...(includeEventVisit ? ["Event Visit"] : []),
  ];

  const handleSave = async () => {
    if (!id || !user) return;

    setSubmitting(true);

    const [
      { count: applicationsCount, error: applicationsError },
      { count: acceptedCount, error: acceptedError },
      { count: bookingsCount, error: bookingsError },
    ] = await Promise.all([
      supabase
        .from("campaign_applications")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id),
      supabase
        .from("campaign_applications")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id)
        .eq("status", "accepted"),
      supabase
        .from("bookings" as any)
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", id),
    ]);

    if (applicationsError || acceptedError || bookingsError) {
      setSubmitting(false);
      toast({
        title: "Save failed",
        description: applicationsError?.message || acceptedError?.message || bookingsError?.message || "Could not validate campaign activity.",
        variant: "destructive",
      });
      return;
    }

    const nextActivitySummary = {
      applicationsCount: applicationsCount || 0,
      acceptedCount: acceptedCount || 0,
      bookingsCount: bookingsCount || 0,
    };
    setActivitySummary(nextActivitySummary);

    const shouldLockTargeting = nextActivitySummary.applicationsCount > 0;
    const shouldLockCommercial = nextActivitySummary.acceptedCount > 0 || nextActivitySummary.bookingsCount > 0;
    const originalDeliverables = (originalCampaign?.deliverables || []) as string[];

    const updatePayload = {
      brand: form.brand.trim().slice(0, 100),
      brand_logo: form.brandLogo,
      city: shouldLockTargeting ? originalCampaign?.city || form.city : form.city,
      niche: shouldLockTargeting ? originalCampaign?.niche || form.niche : form.niche,
      budget: shouldLockCommercial ? originalCampaign?.budget || parseInt(form.budget, 10) : parseInt(form.budget, 10),
      influencers_needed: shouldLockTargeting
        ? originalCampaign?.influencers_needed || parseInt(form.influencersNeeded, 10)
        : parseInt(form.influencersNeeded, 10),
      deliverables: shouldLockTargeting ? originalDeliverables : campaignDeliverables,
      description: form.description.trim().slice(0, 1000),
      expires_at: shouldLockTargeting ? originalCampaign?.expires_at || null : form.deadline?.toISOString() ?? null,
    };

    const { error } = await supabase
      .from("campaigns")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id);

    setSubmitting(false);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Campaign updated" });
    navigate("/dashboard");
  };

  if (!brandId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Edit Campaign" />
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Building2 size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Brand profile required</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Only brand accounts can edit campaigns.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Edit Campaign" />
        <div className="container px-4 py-6 md:px-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Edit Campaign" />
      <div className="container max-w-4xl px-4 py-6 md:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                <Zap size={12} />
                Campaign Editor
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Edit Campaign</h1>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="space-y-8">
            {(targetingLocked || commercialLocked) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {commercialLocked
                  ? "This campaign already has accepted creators or linked bookings. Budget, targeting, deliverables, deadline, and required creator count are locked."
                  : "This campaign already has applications. Keep the targeting stable for applicants, so creator count, niche, city, deliverables, and deadline are locked."}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[1fr_88px]">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brand Name *</Label>
                <Input className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-lg font-bold shadow-none" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="block text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Mark</Label>
                <Select value={form.brandLogo} onValueChange={(value) => update("brandLogo", value)}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-xl font-bold shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    {logoOptions.map((option) => (
                      <SelectItem key={option} value={option} className="font-bold">{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Primary City *</Label>
                <Select value={form.city} onValueChange={(value) => update("city", value)}>
                  <SelectTrigger disabled={targetingLocked} className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">{CITIES.map((city) => <SelectItem key={city} value={city} className="font-bold">{city}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Core Niche *</Label>
                <Select value={form.niche} onValueChange={(value) => update("niche", value)}>
                  <SelectTrigger disabled={targetingLocked} className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold shadow-none"><SelectValue placeholder="Select niche" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">{NICHES.map((niche) => <SelectItem key={niche} value={niche} className="font-bold">{niche}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Brief Description *</Label>
              <Textarea className="min-h-[160px] rounded-2xl border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed shadow-none" value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Budget (Rs.) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input type="number" disabled={commercialLocked} className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Creators Needed *</Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input type="number" disabled={targetingLocked} className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold shadow-none" value={form.influencersNeeded} onChange={(e) => update("influencersNeeded", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Requested Deliverables</Label>
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {deliverableOptions.map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400">Adjust how many of this deliverable you want.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => updateDeliverable(label, -1)} disabled={targetingLocked || deliverableCounts[label] === 0}>
                        <Minus size={16} />
                      </Button>
                      <div className="w-10 text-center text-base font-bold text-slate-900">{deliverableCounts[label]}</div>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => updateDeliverable(label, 1)} disabled={targetingLocked}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Event Visit</p>
                    <p className="text-xs text-slate-400">Turn this on if the creator needs to appear in person.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={targetingLocked}
                    className={cn("rounded-xl border-slate-200 px-4 font-semibold", includeEventVisit && "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100")}
                    onClick={() => setIncludeEventVisit((current) => !current)}
                  >
                    {includeEventVisit ? "Included" : "Add"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Application Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={targetingLocked}
                    className={cn("h-14 w-full justify-start rounded-2xl border-slate-200 bg-slate-50 px-5 text-left font-bold shadow-none hover:bg-slate-100", !form.deadline && "text-slate-400")}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-teal-600/80" />
                    {form.deadline ? format(form.deadline, "PPP") : <span>Set closing date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl border-slate-200 p-0 shadow-xl" align="start">
                  <Calendar mode="single" selected={form.deadline} onSelect={(date) => update("deadline", date)} initialFocus className="rounded-2xl" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-6">
              <Button className="rounded-2xl bg-teal-600 px-10 font-bold text-white hover:bg-teal-700" onClick={handleSave} disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <>Save Campaign <CheckCircle className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;
