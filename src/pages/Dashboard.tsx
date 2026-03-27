import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import {
  BarChart3, Users, IndianRupee, Plus, MapPin, Clock,
  CheckCircle, XCircle, MessageSquare, Send, Trash2, Pause, Play, Archive, ShoppingCart, Hourglass, Pencil,
  Megaphone, Star, TrendingUp, Eye, MoreVertical
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDashboardData } from "@/hooks/useQuery";
import InfluencerProfileModal from "@/components/InfluencerProfileModal";
import BrandAvatar from "@/components/BrandAvatar";
import { createNotification } from "@/lib/notifications";
import { navigateToBrandProfile } from "@/lib/brandProfiles";
import type { Database, Json } from "@/integrations/supabase/types";

interface CampaignRow {
  id: string; user_id: string; brand: string; brand_logo: string; city: string;
  budget: number; influencers_needed: number; influencers_applied: number;
  deliverables: string[]; niche: string; status: string; description: string; created_at: string;
}

interface ApplicationRow {
  id: string; campaign_id: string; influencer_profile_id: string; user_id: string;
  message: string; status: string; created_at: string;
  influencer_profiles?: {
    id: string; name: string; city: string; niche: string;
    followers: string; engagement_rate: string | null; rating: number | null; avatar_url: string | null;
  } | null;
}

interface MyApplicationRow {
  id: string; message: string; status: string; created_at: string;
  campaigns: {
    id: string; user_id: string; brand: string; brand_logo: string; city: string;
    budget: number; niche: string; description: string; status: string;
  } | null;
}

interface BookingRow {
  id: string; application_id?: string | null; brand_user_id: string; campaign_id?: string | null; influencer_user_id: string; influencer_profile_id: string;
  items: { type: string; price: number; qty: number }[];
  notes: string; total_amount: number; status: string; created_at: string;
  influencer_name?: string; brand_name?: string;
}

type BookingTableRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingStatusUpdate = Database["public"]["Tables"]["bookings"]["Update"]["status"];
type BookingStatusLookupRow = Pick<BookingTableRow, "application_id" | "status">;
type BookingNotificationLookupRow = Pick<BookingTableRow, "id" | "campaign_id" | "brand_user_id" | "influencer_user_id">;

interface BookingItem {
  type: string;
  price: number;
  qty: number;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isBookingItemArray = (value: Json): value is BookingItem[] =>
  Array.isArray(value) &&
  value.every((item) =>
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    "qty" in item &&
    typeof item.type === "string" &&
    typeof item.qty === "number"
  );

const formatBookingItems = (items: BookingRow["items"] | Json) => {
  if (isBookingItemArray(items)) {
    return items.map((item) => `${item.qty}x ${item.type}`).join(", ");
  }

  return "";
};

type Role = "brand" | "influencer";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", icon: <Hourglass size={12} />, variant: "secondary" },
  accepted: { label: "Accepted", icon: <CheckCircle size={12} />, variant: "default" },
  rejected: { label: "Rejected", icon: <XCircle size={12} />, variant: "destructive" },
  cancelled: { label: "Cancelled", icon: <Archive size={12} />, variant: "outline" },
};

const bookingBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "accepted" || status === "completed") return "default";
  if (status === "rejected" || status === "cancelled") return "destructive";
  if (status === "in_progress") return "outline";
  return "secondary";
};

const collaborationStage = (bookingStatus?: string) => {
  if (!bookingStatus) {
    return {
      label: "Accepted",
      tone: "border-teal-200 bg-teal-50 text-teal-700",
      description: "Accepted, but no booking has been created yet.",
    };
  }

  if (bookingStatus === "pending") {
    return {
      label: "Booking Pending",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      description: "A booking is waiting for influencer confirmation.",
    };
  }

  if (bookingStatus === "accepted") {
    return {
      label: "Ready To Start",
      tone: "border-sky-200 bg-sky-50 text-sky-700",
      description: "Booking accepted by influencer. Brand can start work.",
    };
  }

  if (bookingStatus === "in_progress") {
    return {
      label: "In Progress",
      tone: "border-violet-200 bg-violet-50 text-violet-700",
      description: "Deliverables are actively being worked on.",
    };
  }

  if (bookingStatus === "completed") {
    return {
      label: "Completed",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      description: "Collaboration is finished and review can be left.",
    };
  }

  if (bookingStatus === "cancelled") {
    return {
      label: "Cancelled",
      tone: "border-slate-200 bg-slate-50 text-slate-400",
      description: "This collaboration has been cancelled.",
    };
  }

  return {
    label: bookingStatus,
    tone: "border-slate-200 bg-slate-50 text-slate-700",
    description: "The collaboration has an updated booking status.",
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
    return;
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
    return;
  }

  const bookingStatusByApplication = new Map<string, string>();
  (linkedBookings || []).forEach((booking: BookingStatusLookupRow) => {
    if (booking.application_id) {
      bookingStatusByApplication.set(booking.application_id, booking.status);
    }
  });

  const allAcceptedCompleted = acceptedIds.every((applicationId) => bookingStatusByApplication.get(applicationId) === "completed");
  if (allAcceptedCompleted) {
    const { error } = await supabase.from("campaigns").update({ status: "completed" }).eq("id", campaignId);
    if (error) {
      throw error;
    }
  }
};

const Dashboard = () => {
  const { user, loading: authLoading, influencerId, brandId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const openBrandProfile = async (event: React.MouseEvent, userId?: string | null) => {
    event.stopPropagation();
    await navigateToBrandProfile(navigate, userId);
  };
  const [activeRole, setActiveRole] = useState<Role>("brand");

  // Fetch all dashboard data with React Query (replaces 26+ queries)
  const { data: dashboardData, isLoading, refetch } = useDashboardData(user?.id);

  // ---- Stats ----
  const brandStats = useMemo(() => {
    if (!dashboardData?.campaigns) return [];
    const campaigns = dashboardData.campaigns;
    const applications = dashboardData.applications_received;

    const active = campaigns.filter(c => c.status === "active").length;
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const totalApps = applications.length;
    const accepted = applications.filter(a => a.status === "accepted").length;
    return [
      { label: "Active Campaigns", value: String(active), icon: BarChart3, sub: `${campaigns.length} total` },
      { label: "Total Budget", value: `Rs. ${totalBudget.toLocaleString()}`, icon: IndianRupee, sub: `across ${campaigns.length} campaigns` },
      { label: "Received Apps", value: String(totalApps), icon: Send, sub: `${applications.filter(a => a.status === "pending").length} pending` },
      { label: "Accepted", value: String(accepted), icon: Users, sub: `${accepted} influencers hired` },
    ];
  }, [dashboardData?.campaigns, dashboardData?.applications_received]);

  const influencerStatsCards = useMemo(() => {
    if (!dashboardData) return [];
    const myApplications = dashboardData.my_applications;
    const bookings = dashboardData.bookings;

    const pending = myApplications.filter(a => a.status === "pending").length;
    const accepted = myApplications.filter(a => a.status === "accepted").length;
    const myBookings = bookings.filter(b => b.influencer_user_id === user?.id);
    const earnings = myBookings.filter(b => b.status === "accepted").reduce((s, b) => s + b.total_amount, 0);
    return [
      { label: "Applications", value: String(myApplications.length), icon: Send, sub: `${pending} pending` },
      { label: "Accepted", value: String(accepted), icon: CheckCircle, sub: "collaborations" },
      { label: "Bookings", value: String(myBookings.length), icon: ShoppingCart, sub: `${myBookings.filter(b => b.status === "pending").length} pending` },
      { label: "Earnings", value: `Rs. ${earnings.toLocaleString()}`, icon: IndianRupee, sub: "from accepted bookings" },
    ];
  }, [dashboardData, user?.id]);

  const hasInfluencerProfile = !!influencerId || !!dashboardData?.influencer_profile;
  const hasBrandProfile = !!brandId || !!dashboardData?.brand_profile;

  const defaultRole = useMemo<Role>(() => {
    if (hasInfluencerProfile && !hasBrandProfile) {
      return "influencer";
    }
    return "brand";
  }, [hasInfluencerProfile, hasBrandProfile]);

  useEffect(() => {
    setActiveRole((currentRole) => {
      if (currentRole === "brand" && defaultRole === "influencer" && !hasBrandProfile) {
        return "influencer";
      }
      if (currentRole === "influencer" && defaultRole === "brand" && !hasInfluencerProfile) {
        return "brand";
      }
      return currentRole;
    });
  }, [defaultRole, hasBrandProfile, hasInfluencerProfile]);

  // ---- Handlers ----
  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, campaign_id, brand_user_id, influencer_user_id")
      .eq("id", bookingId)
      .maybeSingle<BookingNotificationLookupRow>();

    if (bookingError || !booking) {
      toast({ title: "Booking update failed", description: bookingError?.message || "Booking not found.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("bookings").update({ status: status as BookingStatusUpdate }).eq("id", bookingId);
    if (error) {
      toast({ title: "Booking update failed", description: error.message, variant: "destructive" });
      return;
    }

    const recipientUserId = user?.id === booking.brand_user_id ? booking.influencer_user_id : booking.brand_user_id;
    if (recipientUserId) {
      await createNotification({
        userId: recipientUserId,
        type: "booking_status_updated",
        title: "Booking updated",
        body: `A booking moved to ${status.replace(/_/g, " ")}.`,
        actionUrl: booking.campaign_id ? `/campaign/${booking.campaign_id}` : "/dashboard",
        metadata: { bookingId, campaignId: booking.campaign_id, status },
      }).catch(() => undefined);
    }

    if (status === "completed" && booking.campaign_id) {
      try {
        await maybeCompleteCampaign(booking.campaign_id);
      } catch (completionError: unknown) {
        toast({ title: "Booking updated", description: getErrorMessage(completionError, "Campaign completion check failed."), variant: "destructive" });
        refetch();
        return;
      }
    }

    refetch();
    toast({ title: `Booking ${status}` });
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    const { data: application, error: applicationError } = await supabase
      .from("campaign_applications")
      .select("id, campaign_id, user_id, status")
      .eq("id", appId)
      .maybeSingle();

    if (applicationError || !application) {
      toast({ title: "Error", description: applicationError?.message || "Application not found.", variant: "destructive" });
      return;
    }

    if (status === "accepted") {
      const { data, error } = await supabase.rpc('accept_campaign_application', { p_application_id: appId });

      if (error || !data?.success) {
        toast({ title: "Error", description: error?.message || data?.error || "Failed to accept application", variant: "destructive" });
        return;
      }

      const { campaign_id, brand_user_id, brand_name, influencer_user_id } = data;

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

      refetch();
      toast({ title: "Application accepted" });
      return;
    }

    const { error } = await supabase.from("campaign_applications").update({ status }).eq("id", appId);
    if (!error) {
      if (status === "rejected") {
        await createNotification({
          userId: application.user_id,
          type: "campaign_application_rejected",
          title: "Application update",
          body: `Your application was ${status}.`,
          actionUrl: `/campaign/${application.campaign_id}`,
          metadata: { campaignId: application.campaign_id, applicationId: application.id, status },
        }).catch(() => undefined);
      }
      refetch(); // Refresh dashboard data
      toast({ title: `Application ${status}` });
    }
  };

  const toggleCampaignStatus = async (campaignId: string, newStatus: string) => {
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaignId);
    if (error) {
      toast({ title: "Campaign update failed", description: error.message, variant: "destructive" });
      return;
    }

    if (newStatus === "closed") {
      try {
        await rejectPendingApplicationsForCampaign(campaignId);
        await maybeCompleteCampaign(campaignId);
      } catch (statusError: unknown) {
        toast({ title: "Campaign updated", description: getErrorMessage(statusError, "Pending applications could not be resolved."), variant: "destructive" });
        refetch();
        return;
      }
    }

    refetch();
    toast({ title: `Campaign ${newStatus}` });
  };

  const deleteCampaign = async (campaignId: string) => {
    const { count: applicationsCount, error: applicationsError } = await supabase
      .from("campaign_applications")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId);

    if (applicationsError) {
      toast({ title: "Delete failed", description: applicationsError.message, variant: "destructive" });
      return;
    }

    const { count: linkedBookingsCount, error: bookingsError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId);

    if (bookingsError) {
      toast({ title: "Delete failed", description: bookingsError.message, variant: "destructive" });
      return;
    }

    if ((applicationsCount || 0) > 0 || (linkedBookingsCount || 0) > 0) {
      toast({
        title: "Cannot delete campaign",
        description: "This campaign already has applications or bookings. Close it instead of deleting it.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
    if (!error) {
      refetch(); // Refresh dashboard data
      toast({ title: "Campaign deleted" });
    }
  };

  // ---- Loading/Auth states ----
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Dashboard" />
        <div className="container py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Dashboard" />
        <div className="container py-20 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground">Sign in to access your dashboard</h1>
          <Button className="mt-4 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const campaigns = dashboardData?.campaigns || [];
  const applications = dashboardData?.applications_received || [];
  const myApplications = dashboardData?.my_applications || [];
  const bookings = dashboardData?.bookings || [];
  const influencerProfile = dashboardData?.influencer_profile;
  const pendingApps = applications.filter(a => a.status === "pending");
  const getCampaignName = (campaignId: string) => campaigns.find(c => c.id === campaignId)?.brand || "Unknown";
  const currentStats = activeRole === "brand" ? brandStats : influencerStatsCards;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar variant="minimal" title="Dashboard" />
      <div className="container py-6 px-4">

        {/* Identity Switcher */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeRole === "brand" ? "Manage campaigns & hiring" : "Track applications & earnings"}
              </p>
            </div>
            {activeRole === "brand" && (
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-9" onClick={() => navigate("/create-campaign")}>
                <Plus size={16} className="mr-1" /> Campaign
              </Button>
            )}
          </div>

          {/* Role pills */}
          <div className="flex w-full gap-2 rounded-xl bg-muted/50 p-1 sm:w-fit">
            <button
              onClick={() => setActiveRole("brand")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
                activeRole === "brand"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Megaphone size={16} /> Brand
            </button>
            <button
              onClick={() => setActiveRole("influencer")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
                activeRole === "influencer"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star size={16} /> Influencer
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3">
          {currentStats.map((s, i) => (
            <motion.div key={`${activeRole}-${i}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="border-slate-200/70 bg-white shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8 sm:h-9 sm:w-9">
                    <s.icon size={16} className="text-primary sm:h-[18px] sm:w-[18px]" />
                  </div>
                  <div className="font-display text-[1.65rem] font-bold leading-none text-foreground sm:text-xl">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs sm:normal-case sm:tracking-normal">{s.label}</div>
                  <div className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-[10px]">{s.sub}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Role-specific content */}
        <AnimatePresence mode="wait">
          {activeRole === "brand" ? (
            <motion.div key="brand" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <BrandDashboard
                campaigns={campaigns}
                applications={applications}
                bookings={bookings.filter(b => b.brand_user_id === user.id)}
                pendingApps={pendingApps}
                getCampaignName={getCampaignName}
                navigate={navigate}
                updateApplicationStatus={updateApplicationStatus}
                toggleCampaignStatus={toggleCampaignStatus}
                deleteCampaign={deleteCampaign}
                updateBookingStatus={updateBookingStatus}
                hasBrandProfile={hasBrandProfile}
                openBrandProfile={openBrandProfile}
              />
            </motion.div>
          ) : (
            <motion.div key="influencer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <InfluencerDashboard
                myApplications={myApplications}
                bookings={bookings.filter(b => b.influencer_user_id === user.id)}
                hasProfile={hasInfluencerProfile}
                profileStats={influencerProfile}
                navigate={navigate}
                updateBookingStatus={updateBookingStatus}
                updateApplicationStatus={updateApplicationStatus}
                openBrandProfile={openBrandProfile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ==================== BRAND DASHBOARD ====================
interface BrandDashboardProps {
  campaigns: CampaignRow[];
  applications: ApplicationRow[];
  bookings: BookingRow[];
  pendingApps: ApplicationRow[];
  getCampaignName: (id: string) => string;
  navigate: NavigateFunction;
  updateApplicationStatus: (id: string, status: string) => void;
  toggleCampaignStatus: (id: string, status: string) => void;
  deleteCampaign: (id: string) => void;
  updateBookingStatus: (id: string, status: string) => void;
  hasBrandProfile: boolean;
  openBrandProfile: (event: React.MouseEvent, userId?: string | null) => void;
}

function BrandDashboard({
  campaigns, applications, bookings, pendingApps, getCampaignName,
  navigate,
  updateApplicationStatus, toggleCampaignStatus, deleteCampaign, updateBookingStatus,
  hasBrandProfile,
  openBrandProfile
}: BrandDashboardProps) {

  return (
  <Tabs defaultValue="campaigns" className="w-full">
    <TabsList className="mb-4 grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-3">
      <TabsTrigger value="campaigns" className="font-display text-xs">Campaigns</TabsTrigger>
      <TabsTrigger value="received-apps" className="font-display text-xs">
        Applications ({pendingApps.length})
      </TabsTrigger>
      <TabsTrigger value="bookings" className="font-display text-xs">
        Bookings ({bookings.filter(b => b.status === "pending").length})
      </TabsTrigger>
    </TabsList>

    {/* Campaigns Tab */}
    <TabsContent value="campaigns">
      {campaigns.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus size={24} className="text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">No campaigns yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">Create your first campaign to connect with influencers.</p>
            {hasBrandProfile ? (
              <Button className="mt-4 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/create-campaign")}>
                <Plus size={16} className="mr-2" /> Create Campaign
              </Button>
            ) : (
              <Button className="mt-4 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/register-brand")}>
                <Plus size={16} className="mr-2" /> Join as Brand
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c, i) => {
            const campaignApps = applications.filter(a => a.campaign_id === c.id);
            const accepted = campaignApps.filter(a => a.status === "accepted").length;
            const pending = campaignApps.filter(a => a.status === "pending").length;
            const progress = c.influencers_needed > 0 ? Math.min(Math.round((accepted / c.influencers_needed) * 100), 100) : 0;

            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card 
                  className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/campaign/${c.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={(event) => openBrandProfile(event, c.user_id)} className="shrink-0">
                          <BrandAvatar
                            brand={c.brand}
                            brandLogo={c.brand_logo}
                            className="h-11 w-11 shrink-0 rounded-xl bg-muted"
                            fallbackClassName="text-xl"
                          />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/campaign/${c.id}`);
                            }}
                            className="block truncate text-left font-display text-sm font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {c.brand}
                          </button>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <MapPin size={10} /> {c.city} <span>•</span> <Clock size={10} /> {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant={
                            c.status === "active"
                              ? "default"
                              : c.status === "paused"
                                ? "outline"
                                : c.status === "completed"
                                  ? "default"
                                  : "secondary"
                          }
                          className={`text-[10px] h-5 px-2 ${
                            c.status === "active"
                              ? "gradient-primary border-0 text-primary-foreground"
                              : c.status === "paused"
                                ? "border-warning text-warning"
                                : c.status === "completed"
                                  ? "border-0 bg-emerald-100 text-emerald-700 font-medium"
                                  : ""
                          }`}
                        >
                          {c.status === "active" && <Play size={8} className="mr-0.5 fill-current" />}
                          {c.status === "paused" && <Pause size={8} className="mr-0.5 fill-current" />}
                          {c.status === "closed" && <Archive size={8} className="mr-0.5" />}
                          {c.status === "completed" && <CheckCircle size={8} className="mr-0.5" />}
                          {c.status}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                              <MoreVertical size={16} className="text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">Actions</DropdownMenuLabel>
                            {c.status !== "completed" && (
                              <DropdownMenuItem onClick={() => navigate(`/edit-campaign/${c.id}`)} className="gap-2 cursor-pointer">
                                <Pencil size={14} /> Edit Campaign
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">Status</DropdownMenuLabel>
                            
                            {c.status !== "active" && c.status !== "completed" && (
                              <DropdownMenuItem onClick={() => toggleCampaignStatus(c.id, "active")} className="gap-2 text-success cursor-pointer">
                                <Play size={14} /> Set Active
                              </DropdownMenuItem>
                            )}
                            {c.status !== "paused" && c.status !== "completed" && (
                              <DropdownMenuItem onClick={() => toggleCampaignStatus(c.id, "paused")} className="gap-2 text-warning cursor-pointer">
                                <Pause size={14} /> Pause
                              </DropdownMenuItem>
                            )}
                            {c.status !== "closed" && c.status !== "completed" && (
                              <DropdownMenuItem onClick={() => toggleCampaignStatus(c.id, "closed")} className="gap-2 text-muted-foreground cursor-pointer">
                                <Archive size={14} /> Close
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 text-destructive cursor-pointer">
                                  <Trash2 size={14} /> Delete Campaign
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{c.brand}" and all its applications. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteCampaign(c.id)} 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="p-1.5 rounded-lg bg-muted/50 text-center">
                        <div className="font-semibold text-xs text-foreground flex items-center justify-center gap-0.5"><IndianRupee size={10} />{c.budget.toLocaleString()}</div>
                        <span className="text-[10px] text-muted-foreground">Budget</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-muted/50 text-center">
                        <div className="font-semibold text-xs text-foreground">{campaignApps.length}</div>
                        <span className="text-[10px] text-muted-foreground">Applied</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-muted/50 text-center">
                        <div className="font-semibold text-xs text-foreground">{accepted}</div>
                        <span className="text-[10px] text-muted-foreground">Accepted</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-muted/50 text-center">
                        <div className="font-semibold text-xs text-foreground">{pending}</div>
                        <span className="text-[10px] text-muted-foreground">Pending</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">{accepted} accepted</span>
                        <span className="text-muted-foreground">{c.influencers_needed} needed</span>
                      </div>
                      <Progress value={progress} className="h-1" />
                    </div>

                    {campaignApps.length > 0 && (
                      <Accordion type="single" collapsible className="mt-3 w-full">
                        <AccordionItem value="applications" className="border-none">
                          <AccordionTrigger className="text-xs py-1.5 hover:no-underline">
                            <span className="flex items-center gap-2"><Users size={14} /> Applications ({campaignApps.length})</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-0">
                            <div className="space-y-2">
                              {campaignApps.map((app) => {
                                const profile = app.influencer_profiles;
                                const initials = profile?.name?.split(" ").map(n => n[0]).join("") || "?";
                                return (
                                  <div key={app.id} className="p-2.5 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-[10px]">{initials}</div>
                                        <div className="min-w-0">
                                          <InfluencerProfileModal profile={profile}>{profile?.name || "Unknown"}</InfluencerProfileModal>
                                          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
                                            {profile?.city && <span className="flex items-center gap-0.5"><MapPin size={8} /> {profile.city}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="h-4 w-fit text-[9px]">{app.status}</Badge>
                                    </div>
                                    {app.status === "pending" && (
                                      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
                                        <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => updateApplicationStatus(app.id, "accepted")}>Accept</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => updateApplicationStatus(app.id, "rejected")}>Reject</Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </TabsContent>

    {/* Received Applications Tab */}
    <TabsContent value="received-apps">
      {applications.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-10 text-center">
            <Users size={28} className="mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display font-semibold text-foreground">No applications yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Applications from influencers will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app, i) => {
            const profile = app.influencer_profiles;
            const initials = profile?.name?.split(" ").map(n => n[0]).join("") || "?";
            return (
              <motion.div key={app.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xs">{initials}</div>
                        <div>
                          <InfluencerProfileModal profile={profile}>{profile?.name || "Unknown"}</InfluencerProfileModal>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              for <Link to={`/campaign/${app.campaign_id}`} state={{ backTo: "/dashboard" }} className="text-primary hover:underline">{getCampaignName(app.campaign_id)}</Link>
                            </div>
                        </div>
                      </div>
                      <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="w-fit">{app.status}</Badge>
                    </div>
                    {app.message && (
                      <div className="mt-2 p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-foreground">{app.message}</p>
                      </div>
                    )}
                    {app.status === "pending" && (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-8 px-3 text-xs" onClick={() => updateApplicationStatus(app.id, "accepted")}><CheckCircle size={12} className="mr-1" /> Accept</Button>
                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => updateApplicationStatus(app.id, "rejected")}><XCircle size={12} className="mr-1" /> Reject</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </TabsContent>

    {/* Bookings Tab */}
    <TabsContent value="bookings">
      {bookings.length === 0 ? (
        <Card className="glass-card"><CardContent className="p-10 text-center"><ShoppingCart size={28} className="mx-auto text-muted-foreground mb-3" /><h3 className="font-display font-semibold text-foreground">No bookings yet</h3><p className="text-muted-foreground text-sm mt-1">Bookings created from accepted campaign applications will appear here.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="mb-3 rounded-xl border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Collaboration Stage</div>
                        <div className="mt-1 text-xs font-semibold text-foreground">{collaborationStage(booking.status).label}</div>
                      </div>
                      <Badge variant="outline" className={`border text-[10px] font-semibold ${collaborationStage(booking.status).tone}`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{collaborationStage(booking.status).description}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">{booking.influencer_name?.charAt(0) || "?"}</div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">Booking for {booking.influencer_name}</div>
                        <div className="text-[10px] text-muted-foreground">{formatBookingItems(booking.items)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="font-bold text-xs text-foreground flex items-center"><IndianRupee size={10} />{booking.total_amount.toLocaleString()}</span>
                      <Badge variant={booking.status === "accepted" ? "default" : booking.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">{booking.status}</Badge>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="mt-3 w-full border-t border-slate-100">
                    <AccordionItem value="details" className="border-none">
                      <AccordionTrigger className="text-xs py-2 hover:no-underline text-muted-foreground">
                        Booking Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-3">
                        <div className="space-y-2 text-xs">
                          <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                            <h4 className="font-medium text-slate-700">Line Items</h4>
                            {Array.isArray(booking.items) && booking.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-slate-600">
                                <span>{item.description}</span>
                                <span className="font-medium">₹{item.price.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
                              <span>Total</span>
                              <span>₹{booking.total_amount.toLocaleString()}</span>
                            </div>
                          </div>
                          {booking.notes && (
                            <div className="rounded-lg bg-slate-50 p-3">
                              <h4 className="font-medium text-slate-700 mb-1">Notes</h4>
                              <p className="text-slate-600 italic">"{booking.notes}"</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.status === "accepted" && (
                      <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-8 px-3 text-xs" onClick={() => updateBookingStatus(booking.id, "in_progress")}><Play size={12} className="mr-1" /> Start Work</Button>
                    )}
                    {booking.status === "in_progress" && (
                      <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-8 px-3 text-xs" onClick={() => updateBookingStatus(booking.id, "completed")}><CheckCircle size={12} className="mr-1" /> Mark Complete</Button>
                    )}
                    {(booking.status === "pending" || booking.status === "accepted") && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10" 
                        onClick={() => updateBookingStatus(booking.id, "cancelled")}
                      >
                        <Archive size={12} className="mr-1" /> Cancel Booking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </TabsContent>
  </Tabs>
  );
}

// ==================== INFLUENCER DASHBOARD ====================
interface InfluencerDashboardProps {
  myApplications: MyApplicationRow[];
  bookings: BookingRow[];
  hasProfile: boolean;
  profileStats: { name: string; followers: string; rating: number | null; engagement_rate: string | null } | null;
  navigate: NavigateFunction;
  updateBookingStatus: (id: string, status: string) => void;
  updateApplicationStatus: (id: string, status: string) => void;
  openBrandProfile: (event: React.MouseEvent, userId?: string | null) => void;
}

function InfluencerDashboard({
  myApplications, bookings, hasProfile, profileStats, navigate, 
  updateBookingStatus, updateApplicationStatus, openBrandProfile,
}: InfluencerDashboardProps) {
  const bookingByApplication = new Map(
    bookings
      .filter((booking) => booking.application_id)
      .map((booking) => [booking.application_id as string, booking])
  );

  if (!hasProfile) {
    return (
      <Card className="glass-card">
        <CardContent className="p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Star size={28} className="text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground">Set up your influencer profile</h3>
          <p className="text-muted-foreground mt-1 text-sm max-w-sm mx-auto">
            Create your influencer profile to start applying to campaigns, receiving bookings, and tracking your collaborations.
          </p>
          <Button className="mt-4 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/register")}>
            Join as Influencer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="applications" className="w-full">
      <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-2">
        <TabsTrigger value="applications" className="font-display text-xs">My Applications</TabsTrigger>
        <TabsTrigger value="bookings" className="font-display text-xs">
          Bookings ({bookings.filter(b => b.status === "pending").length})
        </TabsTrigger>
      </TabsList>

      {/* Applications Tab */}
      <TabsContent value="applications">
        {myApplications.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-10 text-center">
              <Send size={28} className="mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display font-semibold text-foreground">No applications yet</h3>
              <p className="text-muted-foreground mt-1 text-sm">Browse campaigns and apply to start collaborating.</p>
              <Button className="mt-4 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/?tab=campaigns")}>Browse Campaigns</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myApplications.map((app, i) => {
              const campaign = app.campaigns;
              const cfg = statusConfig[app.status] || statusConfig.pending;
              const linkedBooking = bookingByApplication.get(app.id);
              const stage = app.status === "accepted" ? collaborationStage(linkedBooking?.status) : null;
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" onClick={() => campaign && navigate(`/campaign/${campaign.id}`, { state: { backTo: "/dashboard" } })}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(event) => openBrandProfile(event, campaign?.user_id)}
                            className="shrink-0"
                          >
                            <BrandAvatar
                              brand={campaign?.brand || "Brand"}
                              brandLogo={campaign?.brand_logo}
                              className="h-10 w-10 rounded-xl bg-muted"
                              fallbackClassName="text-lg"
                            />
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={(event) => openBrandProfile(event, campaign?.user_id)}
                              className="text-left"
                            >
                              <h3 className="font-display text-sm font-semibold text-foreground transition-colors hover:text-primary">
                                {campaign?.brand || "Unknown"}
                              </h3>
                            </button>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                              {campaign?.city && <span className="flex items-center gap-0.5"><MapPin size={9} /> {campaign.city}</span>}
                              {campaign?.budget && <><span>•</span><span className="flex items-center gap-0.5"><IndianRupee size={9} />{campaign.budget.toLocaleString()}</span></>}
                            </div>
                          </div>
                        </div>
                        <Badge variant={cfg.variant} className="w-fit gap-1 shrink-0 text-[10px]">{cfg.icon} {cfg.label}</Badge>
                      </div>
                      {app.message && (
                        <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 rounded-lg p-2 line-clamp-2">"{app.message}"</p>
                      )}
                      {stage && (
                        <div className="mt-3 rounded-xl border bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Collaboration Stage</div>
                              <div className="mt-1 text-xs font-semibold text-foreground">{stage.label}</div>
                            </div>
                            <Badge variant="outline" className={`border text-[10px] font-semibold ${stage.tone}`}>
                              {linkedBooking?.status || "No booking"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-[11px] text-muted-foreground">{stage.description}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock size={10} /> Applied {new Date(app.created_at).toLocaleDateString()}
                        </div>
                        {app.status === "pending" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateApplicationStatus(app.id, "cancelled");
                            }}
                          >
                            Cancel Application
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Bookings Tab */}
      <TabsContent value="bookings">
        {bookings.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-10 text-center">
              <ShoppingCart size={28} className="mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display font-semibold text-foreground">No bookings yet</h3>
              <p className="text-muted-foreground text-sm mt-1">Bookings created from accepted campaigns will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <motion.div key={booking.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="mb-3 rounded-xl border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Collaboration Stage</div>
                          <div className="mt-1 text-xs font-semibold text-foreground">{collaborationStage(booking.status).label}</div>
                        </div>
                        <Badge variant="outline" className={`border text-[10px] font-semibold ${collaborationStage(booking.status).tone}`}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">{collaborationStage(booking.status).description}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold text-sm text-foreground">From {booking.brand_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{formatBookingItems(booking.items)}</div>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="font-bold text-xs flex items-center"><IndianRupee size={10} />{booking.total_amount.toLocaleString()}</span>
                        <Badge variant={bookingBadgeVariant(booking.status)} className="text-[10px]">{booking.status}</Badge>
                      </div>
                    </div>
                    {booking.campaign_id && (
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        <Link to={`/campaign/${booking.campaign_id}`} state={{ backTo: "/dashboard" }} className="text-primary hover:underline">Open linked campaign</Link>
                      </div>
                    )}
                    
                    <Accordion type="single" collapsible className="mt-3 w-full border-t border-slate-100">
                      <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="text-xs py-2 hover:no-underline text-muted-foreground">
                          Booking Details
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-3">
                          <div className="space-y-2 text-xs">
                            <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                              <h4 className="font-medium text-slate-700">Line Items</h4>
                              {Array.isArray(booking.items) && booking.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-slate-600">
                                  <span>{item.description}</span>
                                  <span className="font-medium">₹{item.price.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
                                <span>Total</span>
                                <span>₹{booking.total_amount.toLocaleString()}</span>
                              </div>
                            </div>
                            {booking.notes && (
                              <div className="rounded-lg bg-slate-50 p-3">
                                <h4 className="font-medium text-slate-700 mb-1">Notes</h4>
                                <p className="text-slate-600 italic">"{booking.notes}"</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  {booking.status === "pending" && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-8 px-3 text-xs" onClick={() => updateBookingStatus(booking.id, "accepted")}><CheckCircle size={12} className="mr-1" /> Accept</Button>
                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => updateBookingStatus(booking.id, "rejected")}><XCircle size={12} className="mr-1" /> Reject</Button>
                    </div>
                  )}
                  {booking.status === "accepted" && (
                    <div className="mt-3 text-[11px] text-muted-foreground">Waiting for the brand to start work.</div>
                  )}
                  {booking.status === "in_progress" && (
                    <div className="mt-3 text-[11px] text-muted-foreground">Work in progress. The brand will mark this complete when done.</div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default Dashboard;
