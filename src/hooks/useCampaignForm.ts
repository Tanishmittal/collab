import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const logoOptions = ["B", "C", "F", "M", "S", "T"];
const deliverableOptions = ["Reel", "Story", "Post", "UGC Video"] as const;

type DeliverableLabel = (typeof deliverableOptions)[number];

export interface CampaignFormData {
  brand: string;
  brandLogo: string;
  city: string;
  niche: string;
  budget: string;
  influencersNeeded: string;
  description: string;
  deadline: Date | undefined;
}

export interface CampaignActivitySummary {
  applicationsCount: number;
  acceptedCount: number;
  bookingsCount: number;
}

export const useCampaignForm = (
  onSuccess?: () => void,
  isEdit: boolean = false,
  campaignId?: string
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CampaignFormData>({
    brand: "",
    brandLogo: "B",
    city: "",
    niche: "",
    budget: "",
    influencersNeeded: "",
    description: "",
    deadline: undefined,
  });
  const [deliverableCounts, setDeliverableCounts] = useState<Record<DeliverableLabel, number>>({
    Reel: 0,
    Story: 0,
    Post: 0,
    "UGC Video": 0,
  });
  const [includeEventVisit, setIncludeEventVisit] = useState(false);
  const [activitySummary, setActivitySummary] = useState<CampaignActivitySummary>({
    applicationsCount: 0,
    acceptedCount: 0,
    bookingsCount: 0,
  });

  const update = (field: keyof CampaignFormData, value: string | Date | undefined) => {
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

  const canProceed = (step?: number): boolean => {
    if (isEdit) {
      // For edit mode, just check if required fields are filled
      return Boolean(form.brand && form.city && form.niche && form.description && form.budget && form.influencersNeeded);
    }

    // For create mode, check based on step
    if (step === 0) return Boolean(form.brand && form.city && form.niche);
    if (step === 1) return Boolean(form.description && form.budget && form.influencersNeeded);
    return campaignDeliverables.length > 0;
  };

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to create a campaign.", variant: "destructive" });
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
    onSuccess?.();
  };

  const handleUpdate = async (originalCampaign: any) => {
    if (!campaignId || !user) return;

    setSubmitting(true);

    const [
      { count: applicationsCount, error: applicationsError },
      { count: acceptedCount, error: acceptedError },
      { count: bookingsCount, error: bookingsError },
    ] = await Promise.all([
      supabase
        .from("campaign_applications")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId),
      supabase
        .from("campaign_applications")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("status", "accepted"),
      supabase
        .from("bookings" as any)
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId),
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
      .eq("id", campaignId)
      .eq("user_id", user.id);

    setSubmitting(false);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Campaign updated" });
    onSuccess?.();
  };

  const loadCampaign = async (id: string) => {
    if (!user) return null;

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
      return null;
    }

    const parsed = parseDeliverables(data.deliverables);
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

    return data;
  };

  return {
    submitting,
    form,
    update,
    deliverableCounts,
    setDeliverableCounts,
    updateDeliverable,
    includeEventVisit,
    setIncludeEventVisit,
    campaignDeliverables,
    canProceed,
    handleCreate,
    handleUpdate,
    loadCampaign,
    activitySummary,
    logoOptions,
    deliverableOptions,
  };
};

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