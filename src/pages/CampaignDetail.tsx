import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Users, IndianRupee, Clock, CheckCircle, XCircle, MessageSquare, Send, Loader2, Star, Zap,
  MoreVertical, Pencil, Trash2, Play, Pause, Archive, ClipboardList, Info, FileText
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatThread from "@/components/ChatThread";
import BookingModal from "@/components/BookingModal";
import ReviewForm from "@/components/ReviewForm";
import BrandAvatar from "@/components/BrandAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
import { navigateToBrandProfile } from "@/lib/brandProfiles";
import { goBackOr } from "@/lib/navigation";
import { getCampaignEligibility, type CampaignEligibilityResult } from "@/lib/campaignEligibility";

interface CampaignRow {
  id: string;
  user_id: string;
  brand: string;
  brand_logo: string;
  city: string;
  budget: number;
  influencers_needed: number;
  influencers_applied: number;
  deliverables: string[];
  niche: string;
  status: string;
  description: string;
  created_at: string;
  expires_at?: string | null;
  target_platforms?: string[];
  min_followers?: number | null;
  min_engagement_rate?: number | null;
  verified_socials_only?: boolean;
  portfolio_required?: boolean;
}

interface ApplicationRow {
  id: string;
  campaign_id: string;
  influencer_profile_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  influencer_profiles?: {
    id: string;
    name: string;
    city: string;
    niche: string;
    followers: string;
    engagement_rate: string | null;
    rating: number | null;
  } | null;
}

type InfluencerEligibilityProfile = {
  city: string;
  niche: string;
  followers: string;
  engagement_rate: string | null;
  platforms: string[];
  is_verified: boolean;
  price_reel: number;
  price_story: number;
  price_visit: number;
};

type BookingStatusRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "application_id" | "status"
>;

const isCampaignExpired = (campaign: CampaignRow) => {
  if (!campaign.expires_at) return false;
  return new Date(campaign.expires_at).getTime() < Date.now();
};

const collaborationStage = (bookingStatus?: string) => {
  if (!bookingStatus) {
    return {
      label: "Accepted",
      tone: "bg-teal-50 text-teal-700 border-teal-200",
      description: "The collaboration is unlocked. Create or wait for a booking to define the work.",
    };
  }

  if (bookingStatus === "pending") {
    return {
      label: "Booking Pending",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
      description: "A booking has been created and is waiting for the influencer to respond.",
    };
  }

  if (bookingStatus === "accepted") {
    return {
      label: "Ready To Start",
      tone: "bg-sky-50 text-sky-700 border-sky-200",
      description: "Both sides have agreed to the booking. The collaboration can move into execution.",
    };
  }

  if (bookingStatus === "in_progress") {
    return {
      label: "In Progress",
      tone: "bg-violet-50 text-violet-700 border-violet-200",
      description: "Deliverables are in production and the collaboration is actively underway.",
    };
  }

  if (bookingStatus === "completed") {
    return {
      label: "Completed",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "The collaboration is complete and both sides can leave a review.",
    };
  }

  return {
    label: bookingStatus,
    tone: "bg-slate-50 text-slate-700 border-slate-200",
    description: "This collaboration has an updated booking status.",
  };
};

const rejectPendingApplicationsForCampaign = async (campaignId: string) => {
  const { error } = await supabase
    .from("campaign_applications")
    .update({ status: "rejected" })
    .eq("campaign_id", campaignId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
};

const maybeCompleteCampaign = async (campaignId: string) => {
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError || !campaign || campaign.status !== "closed") {
    return false;
  }

  const [{ data: acceptedApplications, error: acceptedError }, { data: linkedBookings, error: bookingsError }] = await Promise.all([
    supabase
      .from("campaign_applications")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("status", "accepted"),
    supabase
      .from("bookings")
      .select("application_id, status")
      .eq("campaign_id", campaignId),
  ]);

  if (acceptedError || bookingsError) {
    throw acceptedError || bookingsError;
  }

  const acceptedIds = (acceptedApplications || []).map((application) => application.id);
  if (acceptedIds.length === 0) {
    return false;
  }

  const bookingStatusByApplication = new Map<string, string>();
  const bookingRows = (linkedBookings ?? []) as BookingStatusRow[];
  bookingRows.forEach((booking) => {
    if (booking.application_id) {
      bookingStatusByApplication.set(booking.application_id, booking.status);
    }
  });

  const allAcceptedCompleted = acceptedIds.every((applicationId) => bookingStatusByApplication.get(applicationId) === "completed");
  if (!allAcceptedCompleted) {
    return false;
  }

  const { error } = await supabase.from("campaigns").update({ status: "completed" }).eq("id", campaignId);
  if (error) {
    throw error;
  }

  return true;
};

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, influencerId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState<{ id: string; status: string } | null>(null);
  const [bookingTarget, setBookingTarget] = useState<ApplicationRow | null>(null);
  const [bookingStatusByApplication, setBookingStatusByApplication] = useState<Record<string, string>>({});
  const [applicationCount, setApplicationCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [eligibilityProfile, setEligibilityProfile] = useState<InfluencerEligibilityProfile | null>(null);
  const [hasPortfolio, setHasPortfolio] = useState(false);

  const isOwner = user && campaign && campaign.user_id === user.id;

  const fetchCampaign = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const [{ data, error }, { count: totalApplications }, { count: acceptedApplications }] = await Promise.all([
      supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
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
    ]);
    if (!error && data) setCampaign(data as CampaignRow);
    setApplicationCount(totalApplications || 0);
    setAcceptedCount(acceptedApplications || 0);
    setLoading(false);
  }, [id]);

  const checkExistingApplication = useCallback(async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from("campaign_applications")
      .select("id, status")
      .eq("campaign_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    setHasApplied(!!data);
    setMyApplication(data ? { id: data.id, status: data.status } : null);
  }, [id, user]);

  const fetchApplications = useCallback(async () => {
    if (!id) return;

    const { data } = await supabase
      .from("campaign_applications")
      .select("*, influencer_profiles(id, name, city, niche, followers, engagement_rate, rating)")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false });
    if (data) {
      const nextApplications = data as ApplicationRow[];
      setApplications(nextApplications);
      setApplicationCount(nextApplications.length);
      setAcceptedCount(nextApplications.filter((application) => application.status === "accepted").length);
    }
  }, [id]);

  const fetchBookingStatuses = useCallback(async () => {
    if (!id) return;

    const { data } = await supabase
      .from("bookings")
      .select("application_id, status")
      .eq("campaign_id", id);

    if (!data) return;

    const next: Record<string, string> = {};
    (data as BookingStatusRow[]).forEach((booking) => {
      if (booking.application_id) {
        next[booking.application_id] = booking.status;
      }
    });
    setBookingStatusByApplication(next);
  }, [id]);

  useEffect(() => {
    fetchCampaign();
    if (user) {
      checkExistingApplication();
    }
  }, [checkExistingApplication, fetchCampaign, user]);

  useEffect(() => {
    if (isOwner && id) {
      fetchApplications();
    }
  }, [fetchApplications, id, isOwner]);

  useEffect(() => {
    fetchBookingStatuses();
  }, [fetchBookingStatuses]);

  useEffect(() => {
    const fetchEligibilityProfile = async () => {
      if (!influencerId) {
        setEligibilityProfile(null);
        setHasPortfolio(false);
        return;
      }

      const [{ data: profile }, { count }] = await Promise.all([
        supabase
          .from("influencer_profiles")
          .select("city, niche, followers, engagement_rate, platforms, is_verified, price_reel, price_story, price_visit")
          .eq("id", influencerId)
          .maybeSingle(),
        supabase
          .from("portfolio_items")
          .select("*", { count: "exact", head: true })
          .eq("influencer_profile_id", influencerId),
      ]);

      setEligibilityProfile((profile as InfluencerEligibilityProfile | null) || null);
      setHasPortfolio((count || 0) > 0);
    };

    fetchEligibilityProfile();
  }, [influencerId]);

  const handleApply = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to apply.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!influencerId) {
      toast({ title: "No influencer profile", description: "Please register as an influencer first.", variant: "destructive" });
      navigate("/register");
      return;
    }
    if (!campaign) return;

    const eligibilityCheck = getCampaignEligibility(
      {
        city: campaign.city,
        niche: campaign.niche,
        deliverables: campaign.deliverables,
        min_followers: campaign.min_followers ?? null,
        min_engagement_rate: campaign.min_engagement_rate ?? null,
        target_platforms: campaign.target_platforms ?? [],
        verified_socials_only: campaign.verified_socials_only ?? false,
        portfolio_required: campaign.portfolio_required ?? false,
      },
      eligibilityProfile,
      hasPortfolio
    );

    const campaignFull = acceptedCount >= campaign.influencers_needed;
    const campaignExpired = isCampaignExpired(campaign);
    const campaignUnavailable = campaign.status !== "active" || campaignFull || campaignExpired;

    if (campaignUnavailable) {
      toast({
        title: "Campaign unavailable",
        description: campaignExpired
          ? "This campaign has expired."
          : campaignFull
            ? "This campaign is already full."
            : `This campaign is ${campaign.status}.`,
        variant: "destructive",
      });
      return;
    }

    if (!eligibilityCheck.eligible) {
      toast({
        title: "You can't apply yet",
        description: eligibilityCheck.reasons[0] || "Your profile does not match this campaign's requirements.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("campaign_applications").insert({
      campaign_id: id!,
      influencer_profile_id: influencerId,
      user_id: user.id,
      message: applyMessage.trim().slice(0, 500),
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await createNotification({
        userId: campaign.user_id,
        type: "campaign_application_received",
        title: "New campaign application",
        body: `${user.user_metadata?.display_name || "A creator"} applied to ${campaign.brand}.`,
        actionUrl: `/campaign/${campaign.id}`,
        metadata: { campaignId: campaign.id, influencerProfileId: influencerId },
      }).catch(() => undefined);
      toast({ title: "Application sent!", description: "The brand will review your application." });
      setApplyOpen(false);
      setApplyMessage("");
      setHasApplied(true);
      setApplicationCount((current) => current + 1);
      await queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["campaign-applications", user.id] });
    }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    const { data: application, error: applicationError } = await supabase
      .from("campaign_applications")
      .select("id, campaign_id, user_id, status")
      .eq("id", appId)
      .maybeSingle();

    if (applicationError || !application || !campaign) {
      toast({ title: "Error", description: applicationError?.message || "Application not found.", variant: "destructive" });
      return;
    }

    if (status === "accepted") {
      const { data, error } = await supabase.rpc('accept_campaign_application', { p_application_id: appId });

      if (error || !data?.success) {
        toast({ title: "Error", description: error?.message || data?.error || "Failed to accept application", variant: "destructive" });
        return;
      }

      const { campaign_id, brand_user_id, brand_name, influencer_user_id, campaign_closed } = data;

      const { count: existingMessagesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("application_id", appId);

      if (!existingMessagesCount) {
        await supabase.from("messages").insert({
          application_id: appId,
          campaign_id,
          sender_id: brand_user_id,
          receiver_id: influencer_user_id,
          content: `Your application for ${brand_name} has been accepted. You can chat here to coordinate next steps.`,
          read: false,
        });
      }

      await createNotification({
        userId: influencer_user_id,
        type: "campaign_application_accepted",
        title: "Application accepted",
        body: `Your application for ${brand_name} was accepted.`,
        actionUrl: `/campaign/${campaign_id}`,
        metadata: { campaignId: campaign_id, applicationId: appId },
      }).catch(() => undefined);

      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
      setAcceptedCount((prev) => prev + 1);
      if (campaign_closed) {
        setCampaign((prev) => (prev ? { ...prev, status: "closed" } : prev));
      }
      fetchBookingStatuses();
      toast({ title: "Application accepted" });
      return;
    }

    const { error } = await supabase
      .from("campaign_applications")
      .update({ status })
      .eq("id", appId);
    if (!error) {
      await createNotification({
        userId: application.user_id,
        type: "campaign_application_rejected",
        title: "Application update",
        body: `Your application for ${campaign.brand} was ${status}.`,
        actionUrl: `/campaign/${campaign.id}`,
        metadata: { campaignId: campaign.id, applicationId: application.id, status },
      }).catch(() => undefined);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast({ title: `Application ${status}` });
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    let nextStatus = "active";
    if (currentStatus === "active") nextStatus = "paused";
    else if (currentStatus === "paused") nextStatus = "active";
    else if (currentStatus === "closed") nextStatus = "active";

    const { error } = await supabase
      .from("campaigns")
      .update({ status: nextStatus })
      .eq("id", campaignId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCampaign(prev => prev ? { ...prev, status: nextStatus } : prev);
      toast({ title: `Campaign ${nextStatus}` });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campaign deleted" });
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Campaign" />
        <div className="container max-w-3xl py-12 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Campaign" />
        <div className="container py-20 text-center">
          <div className="text-5xl mb-4">?</div>
          <h1 className="font-display font-bold text-2xl text-foreground">Campaign not found</h1>
          <Link to="/?tab=campaigns" className="text-primary mt-4 inline-block hover:underline">Back to Campaigns</Link>
        </div>
      </div>
    );
  }

  const progress = campaign.influencers_needed > 0
    ? Math.round((applicationCount / campaign.influencers_needed) * 100)
    : 0;
  const campaignExpired = isCampaignExpired(campaign);
  const campaignFull = acceptedCount >= campaign.influencers_needed;
  const canApply = campaign.status === "active" && !campaignExpired && !campaignFull;
  const eligibility: CampaignEligibilityResult | null = influencerId
    ? getCampaignEligibility(
        {
          city: campaign.city,
          niche: campaign.niche,
          deliverables: campaign.deliverables,
          min_followers: campaign.min_followers ?? null,
          min_engagement_rate: campaign.min_engagement_rate ?? null,
          target_platforms: campaign.target_platforms ?? [],
          verified_socials_only: campaign.verified_socials_only ?? false,
          portfolio_required: campaign.portfolio_required ?? false,
        },
        eligibilityProfile,
        hasPortfolio
      )
    : null;
  const backTo = (location.state as { backTo?: string } | null)?.backTo || "/?tab=campaigns";
  const backLabel =
    backTo === "/dashboard"
      ? "Back to Dashboard"
      : backTo.startsWith("/influencer/") || backTo.startsWith("/brand/")
        ? "Back to Profile"
        : "Back to Campaigns";
  const openBrandProfile = async (event: React.MouseEvent) => {
    event.preventDefault();
    await navigateToBrandProfile(navigate, campaign.user_id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Campaign" />

      <div className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" className="mb-4 hidden md:inline-flex" onClick={() => goBackOr(navigate, backTo)}>
          <ArrowLeft size={16} className="mr-1" /> {backLabel}
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={openBrandProfile} className="shrink-0">
                    <BrandAvatar
                      brand={campaign.brand}
                      brandLogo={campaign.brand_logo}
                      className="h-14 w-14 rounded-2xl bg-muted border shadow-sm"
                      fallbackClassName="text-2xl font-display"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button type="button" onClick={openBrandProfile} className="text-left block w-full">
                      <h1 className="font-display font-bold text-2xl text-foreground tracking-tight transition-colors hover:text-primary truncate leading-none">{campaign.brand}</h1>
                    </button>
                    <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                      <div className="flex items-center gap-1 opacity-80">
                         {campaign.city}
                      </div>
                      <span className="opacity-30">•</span>
                      <div className="flex items-center gap-1 opacity-80">
                         {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="bg-slate-900 text-white hover:bg-slate-800 transition-colors px-3 py-1 font-semibold text-[11px] rounded-full">{campaign.niche}</Badge>
                  
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100">
                          <MoreVertical size={18} strokeWidth={2} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 glass-card">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                          Campaign Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/edit-campaign/${campaign.id}`} className="flex items-center cursor-pointer w-full">
                            <Pencil size={14} className="mr-2" /> Edit Campaign
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                          Status
                        </DropdownMenuLabel>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                        >
                          {campaign.status === "paused" ? (
                            <><Play size={14} className="mr-2 text-green-500" /> Set Active</>
                          ) : (
                            <><Pause size={14} className="mr-2 text-amber-500" /> Pause Campaign</>
                          )}
                        </DropdownMenuItem>
                        {campaign.status !== "closed" && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => toggleCampaignStatus(campaign.id, "closed")}
                          >
                            <Archive size={14} className="mr-2" /> Close Campaign
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 size={14} className="mr-2" /> Delete Campaign
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-card border-destructive/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your campaign
                                and all associated influencer applications.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="glass-card">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteCampaign(campaign.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-muted-foreground text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {campaign.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {campaign.deliverables.map((item) => (
                    <Badge key={item} variant="outline" className="px-3.5 py-1.5 bg-white border-slate-200 text-slate-700 font-semibold tracking-tight rounded-full text-[11px] hover:bg-slate-50 transition-colors">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50/40 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Creator Requirements</h4>
                  <Badge variant="outline" className="rounded-full border-amber-200 text-amber-700 bg-white px-3 py-1 text-[10px] font-bold shadow-sm">
                    Check fit
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-5">Built from the same profile information creators submit.</p>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 rounded-full px-3.5 py-0.5 font-bold text-[11px]">{campaign.city}</Badge>
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 rounded-full px-3.5 py-0.5 font-bold text-[11px]">{campaign.niche}</Badge>
                    {(campaign.target_platforms || []).map((platform) => (
                      <Badge key={platform} variant="outline" className="bg-white border-slate-200 text-slate-700 rounded-full px-3.5 py-0.5 font-bold text-[11px] capitalize">{platform}</Badge>
                    ))}
                  </div>
                  
                  {eligibility && !eligibility.eligible && (
                    <div className="rounded-[20px] border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
                      <p className="font-bold text-[14px] text-amber-900/90 mb-2.5">
                        Why you can't apply yet
                      </p>
                      <ul className="space-y-2 text-[13px] text-amber-800/90 font-medium list-none pl-0">
                        {eligibility.reasons.map((reason) => (
                          <li key={reason} className="flex items-start gap-2 leading-snug">
                            <span className="text-amber-400 text-[18px] leading-none">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {eligibility && eligibility.eligible && (
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm text-xs text-emerald-800 flex items-center gap-2 font-bold uppercase tracking-wider">
                      <CheckCircle size={16} className="text-emerald-500" /> You meet all requirements!
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-6 rounded-[24px] bg-slate-50/40 border border-slate-100">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-2xl mb-1 tracking-tight">
                    <IndianRupee size={22} className="text-slate-400 -mt-1" strokeWidth={2.5} /> {campaign.budget.toLocaleString()}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Budget</span>
                </div>
                <div className="p-6 rounded-[24px] bg-slate-50/40 border border-slate-100">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-2xl mb-1 tracking-tight">
                    <Users size={22} className="text-slate-400 -mt-1" strokeWidth={2.5} /> {campaign.influencers_needed}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Creators needed</span>
                </div>
              </div>

              <div className="mt-8 pb-4">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">
                  <span>{applicationCount} applied</span>
                  <span>{campaign.influencers_needed} needed</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2 rounded-full bg-slate-100" />
              </div>

              {(!canApply || campaign.status !== "active") && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  {campaignExpired
                    ? "This campaign has expired and is no longer accepting applications."
                    : campaignFull
                      ? "This campaign is full and is no longer accepting applications."
                      : `This campaign is ${campaign.status} and is not accepting applications right now.`}
                </div>
              )}

              {!isOwner && (
                <div className="mt-6">
                  {!user ? (
                    <Button className="w-full gradient-primary border-0 text-primary-foreground font-semibold" onClick={() => navigate("/auth")}>
                      Sign In to Apply
                    </Button>
                  ) : hasApplied ? (
                    <Button disabled className="w-full" variant="secondary">
                      <CheckCircle size={16} className="mr-2" /> Already Applied
                    </Button>
                  ) : !influencerId ? (
                    <Button 
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0 font-semibold shadow-lg hover:shadow-teal-500/30 transition-all hover:scale-[1.01]" 
                      onClick={() => navigate("/register")}
                    >
                      <Zap size={16} className="mr-2" /> Complete Profile
                    </Button>
                  ) : !canApply ? (
                    <Button disabled className="w-full" variant="secondary">
                      <XCircle size={16} className="mr-2" /> Applications Closed
                    </Button>
                  ) : eligibility && !eligibility.eligible ? (
                    <Button disabled className="w-full" variant="secondary">
                      <XCircle size={16} className="mr-2" /> Not Eligible Yet
                    </Button>
                  ) : (
                    <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gradient-primary border-0 text-primary-foreground font-semibold">
                          <Send size={16} className="mr-2" /> Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-display">Apply to {campaign.brand}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div>
                            <label className="text-sm font-medium text-foreground">Why should they pick you?</label>
                            <Textarea
                              placeholder="Tell the brand why you're a great fit for this campaign..."
                              value={applyMessage}
                              onChange={e => setApplyMessage(e.target.value)}
                              maxLength={500}
                              className="mt-1.5"
                              rows={4}
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-right">{applyMessage.length}/500</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                          <Button className="gradient-primary border-0 text-primary-foreground" onClick={handleApply} disabled={submitting}>
                            {submitting ? <><Loader2 size={14} className="mr-2 animate-spin" /> Sending...</> : "Submit Application"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* Chat & Review for accepted influencer */}
        {!isOwner && user && myApplication?.status === "accepted" && campaign && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
            <Accordion type="single" collapsible defaultValue="workspace" className="w-full">
              <AccordionItem value="workspace" className="border rounded-xl bg-card px-4 border-slate-200">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-primary" />
                    <span className="font-semibold">Collaboration with {campaign.brand}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4 pt-1">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Workspace Status</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                          {collaborationStage(bookingStatusByApplication[myApplication.id]).label}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {collaborationStage(bookingStatusByApplication[myApplication.id]).description}
                        </p>
                      </div>
                      <Badge variant="outline" className={`w-fit border px-3 py-1 text-xs font-semibold ${collaborationStage(bookingStatusByApplication[myApplication.id]).tone}`}>
                        {bookingStatusByApplication[myApplication.id] || "Pending"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border bg-background px-3 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Application</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">Accepted</div>
                      </div>
                      <div className="rounded-xl border bg-background px-3 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Booking</div>
                        <div className="mt-1 text-sm font-semibold capitalize text-foreground">
                          {bookingStatusByApplication[myApplication.id] || "Not created"}
                        </div>
                      </div>
                      <div className="rounded-xl border bg-background px-3 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Review</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                          {bookingStatusByApplication[myApplication.id] === "completed" ? "Ready" : "Locked"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 h-[450px] overflow-hidden">
                      <ChatThread
                        applicationId={myApplication.id}
                        campaignId={campaign.id}
                        otherUserId={campaign.user_id}
                        otherUserName={campaign.brand}
                        hideIntro={true}
                      />
                    </div>

                    {bookingStatusByApplication[myApplication.id] === "completed" && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-display font-bold text-lg mb-3">Leave a Review</h4>
                        <ReviewForm
                          campaignId={campaign.id}
                          revieweeId={campaign.user_id}
                          reviewerType="influencer"
                          revieweeName={campaign.brand}
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        )}


        {/* Applicants section - only visible to campaign owner */}
        {isOwner && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
            <h2 className="font-display font-bold text-xl mb-4">
              Applicants ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Users size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No applications yet. Share your campaign to attract influencers!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {applications.map((app, i) => {
                  const profile = app.influencer_profiles;
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="glass-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold">
                                {profile?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <Link
                                  to={`/influencer/${profile?.id}`}
                                  className="font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {profile?.name || "Unknown"}
                                </Link>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                  {profile?.city && <span className="flex items-center gap-0.5"><MapPin size={10} /> {profile.city}</span>}
                                  {profile?.total_followers_count !== undefined && profile?.total_followers_count !== null && (
                                    <span>• {formatFollowers(profile.total_followers_count)} followers</span>
                                  )}
                                  {profile?.rating && <span className="flex items-center gap-1"><Star size={10} className="fill-current" /> {profile.rating}</span>}
                                </div>
                              </div>
                            </div>
                            <Badge variant={
                              app.status === "accepted" ? "default" :
                              app.status === "rejected" ? "destructive" : "secondary"
                            }>
                              {app.status}
                            </Badge>
                          </div>

                          {app.message && (
                            <div className="mt-3 p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <MessageSquare size={12} /> Message
                              </div>
                              <p className="text-sm text-foreground">{app.message}</p>
                            </div>
                          )}

                          {app.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="gradient-primary border-0 text-primary-foreground flex-1"
                                onClick={() => updateApplicationStatus(app.id, "accepted")}
                              >
                                <CheckCircle size={14} className="mr-1" /> Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => updateApplicationStatus(app.id, "rejected")}
                              >
                                <XCircle size={14} className="mr-1" /> Reject
                              </Button>
                            </div>
                          )}                          {app.status === "accepted" && (
                            <div className="mt-4">
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="collaboration" className="border rounded-xl bg-card px-4 border-slate-200">
                                  <AccordionTrigger className="hover:no-underline py-3">
                                    <div className="flex items-center gap-2">
                                      <Zap size={14} className="text-primary" />
                                      <span className="font-semibold text-xs text-slate-700">Collaboration Details</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-4 space-y-4 pt-1">
                                    <div className="rounded-xl border bg-muted/30 p-3">
                                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                        <div>
                                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Workspace Status</p>
                                          <p className="mt-1 text-sm font-semibold text-foreground">
                                            {collaborationStage(bookingStatusByApplication[app.id]).label}
                                          </p>
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {collaborationStage(bookingStatusByApplication[app.id]).description}
                                          </p>
                                        </div>
                                        <Badge variant="outline" className={`w-fit border px-2.5 py-1 text-[11px] font-semibold ${collaborationStage(bookingStatusByApplication[app.id]).tone}`}>
                                          {bookingStatusByApplication[app.id] || "No booking"}
                                        </Badge>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {bookingStatusByApplication[app.id] !== "completed" ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-[10px] font-bold uppercase tracking-tight"
                                            onClick={() => setBookingTarget(app)}
                                          >
                                            <ClipboardList size={12} className="mr-1" /> {bookingStatusByApplication[app.id] ? "Update Booking" : "Create Booking"}
                                          </Button>
                                        ) : (
                                          <ReviewForm
                                            campaignId={campaign.id}
                                            revieweeId={app.user_id}
                                            reviewerType="brand"
                                            revieweeName={profile?.name || "Influencer"}
                                            trigger={
                                              <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-tight">
                                                <Star size={12} className="mr-1" /> Leave Review
                                              </Button>
                                            }
                                          />
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 h-[400px] overflow-hidden">
                                      <ChatThread
                                        applicationId={app.id}
                                        campaignId={campaign.id}
                                        otherUserId={app.user_id}
                                        otherUserName={profile?.name || "Influencer"}
                                        hideIntro={true}
                                      />
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground mt-2">
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {bookingTarget && campaign && bookingTarget.influencer_profiles && (
          <BookingModal
            applicationId={bookingTarget.id}
            campaignId={campaign.id}
            influencer={bookingTarget.influencer_profiles}
            influencerUserId={bookingTarget.user_id}
            isOpen={!!bookingTarget}
            onClose={() => {
              setBookingTarget(null);
              fetchBookingStatuses();
              if (campaign.id) {
                maybeCompleteCampaign(campaign.id)
                  .then((completed) => {
                    if (completed) {
                      setCampaign((prev) => (prev ? { ...prev, status: "completed" } : prev));
                    }
                  })
                  .catch(() => undefined);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
