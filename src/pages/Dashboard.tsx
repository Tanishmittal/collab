import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3, Users, IndianRupee, Plus, MapPin, Clock,
  CheckCircle, XCircle, MessageSquare, Send, Trash2, Pause, Play, Archive, ShoppingCart, Hourglass,
  Megaphone, Star, TrendingUp, Eye
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CreateCampaignModal from "@/components/CreateCampaignModal";
import InfluencerProfileModal from "@/components/InfluencerProfileModal";
import ListInfluencerModal from "@/components/ListInfluencerModal";
import JoinBrandModal from "@/components/JoinBrandModal";

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
    id: string; brand: string; brand_logo: string; city: string;
    budget: number; niche: string; description: string; status: string;
  } | null;
}

interface BookingRow {
  id: string; brand_user_id: string; influencer_user_id: string; influencer_profile_id: string;
  items: { type: string; price: number; qty: number }[];
  notes: string; total_amount: number; status: string; created_at: string;
  influencer_name?: string; brand_name?: string;
}

type Role = "brand" | "influencer";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", icon: <Hourglass size={12} />, variant: "secondary" },
  accepted: { label: "Accepted", icon: <CheckCircle size={12} />, variant: "default" },
  rejected: { label: "Rejected", icon: <XCircle size={12} />, variant: "destructive" },
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplicationRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Dual identity state
  const [hasInfluencerProfile, setHasInfluencerProfile] = useState(false);
  const [hasBrandProfile, setHasBrandProfile] = useState(false);
  const [influencerStats, setInfluencerStats] = useState<{
    name: string; followers: string; rating: number | null; engagement_rate: string | null;
  } | null>(null);
  const [activeRole, setActiveRole] = useState<Role>("brand");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch profiles to determine identity
      const [infRes, brandRes] = await Promise.all([
        supabase.from("influencer_profiles").select("name, followers, rating, engagement_rate").eq("user_id", user!.id).maybeSingle(),
        supabase.from("brand_profiles").select("id").eq("user_id", user!.id).maybeSingle(),
      ]);

      const hasInf = !!infRes.data;
      const hasBrand = !!brandRes.data;
      setHasInfluencerProfile(hasInf);
      setHasBrandProfile(hasBrand);
      if (infRes.data) setInfluencerStats(infRes.data as any);

      // Default to influencer view if they have it, brand otherwise
      if (hasInf && !hasBrand) setActiveRole("influencer");
      else if (hasBrand) setActiveRole("brand");

      const [campaignsRes, appsRes, myAppsRes, bookingsRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("campaign_applications").select("*, influencer_profiles(*)").order("created_at", { ascending: false }),
        supabase.from("campaign_applications")
          .select("id, message, status, created_at, campaigns(id, brand, brand_logo, city, budget, niche, description, status)")
          .eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("bookings" as any).select("*")
          .or(`brand_user_id.eq.${user!.id},influencer_user_id.eq.${user!.id}`)
          .order("created_at", { ascending: false }),
      ]);

      if (campaignsRes.data) setCampaigns(campaignsRes.data as CampaignRow[]);

      if (appsRes.data && campaignsRes.data) {
        const campaignIds = new Set(campaignsRes.data.map(c => c.id));
        setApplications((appsRes.data as ApplicationRow[]).filter(a => campaignIds.has(a.campaign_id)));
      }

      if (myAppsRes.data) setMyApplications(myAppsRes.data as MyApplicationRow[]);

      if (bookingsRes.data) {
        const enriched = await Promise.all(
          (bookingsRes.data as any[]).map(async (b: any) => {
            const otherId = b.brand_user_id === user!.id ? b.influencer_user_id : b.brand_user_id;
            const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", otherId).maybeSingle();
            const { data: infProfile } = await supabase.from("influencer_profiles").select("name").eq("id", b.influencer_profile_id).maybeSingle();
            return { ...b, influencer_name: infProfile?.name || "Influencer", brand_name: profile?.display_name || "Brand" } as BookingRow;
          })
        );
        setBookings(enriched);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({ title: "Could not load dashboard", description: "Please refresh and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ---- Stats ----
  const brandStats = useMemo(() => {
    const active = campaigns.filter(c => c.status === "active").length;
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const totalApps = applications.length;
    const accepted = applications.filter(a => a.status === "accepted").length;
    return [
      { label: "Active Campaigns", value: String(active), icon: BarChart3, sub: `${campaigns.length} total` },
      { label: "Total Budget", value: `₹${totalBudget.toLocaleString()}`, icon: IndianRupee, sub: `across ${campaigns.length} campaigns` },
      { label: "Received Apps", value: String(totalApps), icon: Send, sub: `${applications.filter(a => a.status === "pending").length} pending` },
      { label: "Accepted", value: String(accepted), icon: Users, sub: `${accepted} influencers hired` },
    ];
  }, [campaigns, applications]);

  const influencerStatsCards = useMemo(() => {
    const pending = myApplications.filter(a => a.status === "pending").length;
    const accepted = myApplications.filter(a => a.status === "accepted").length;
    const myBookings = bookings.filter(b => b.influencer_user_id === user?.id);
    const earnings = myBookings.filter(b => b.status === "accepted").reduce((s, b) => s + b.total_amount, 0);
    return [
      { label: "Applications", value: String(myApplications.length), icon: Send, sub: `${pending} pending` },
      { label: "Accepted", value: String(accepted), icon: CheckCircle, sub: "collaborations" },
      { label: "Bookings", value: String(myBookings.length), icon: ShoppingCart, sub: `${myBookings.filter(b => b.status === "pending").length} pending` },
      { label: "Earnings", value: `₹${earnings.toLocaleString()}`, icon: IndianRupee, sub: "from accepted bookings" },
    ];
  }, [myApplications, bookings, user]);

  // ---- Handlers ----
  const handleCampaignCreated = () => fetchData();

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from("bookings" as any).update({ status } as any).eq("id", bookingId);
    if (!error) { setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b)); toast({ title: `Booking ${status}` }); }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    const { error } = await supabase.from("campaign_applications").update({ status }).eq("id", appId);
    if (!error) { setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a)); toast({ title: `Application ${status}` }); }
  };

  const toggleCampaignStatus = async (campaignId: string, newStatus: string) => {
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaignId);
    if (!error) { setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: newStatus } : c)); toast({ title: `Campaign ${newStatus}` }); }
  };

  const deleteCampaign = async (campaignId: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
    if (!error) { setCampaigns(prev => prev.filter(c => c.id !== campaignId)); setApplications(prev => prev.filter(a => a.campaign_id !== campaignId)); toast({ title: "Campaign deleted" }); }
  };

  // ---- Loading/Auth states ----
  if (authLoading || loading) {
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

  const pendingApps = applications.filter(a => a.status === "pending");
  const getCampaignName = (campaignId: string) => campaigns.find(c => c.id === campaignId)?.brand || "Unknown";
  const currentStats = activeRole === "brand" ? brandStats : influencerStatsCards;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar variant="minimal" title="Dashboard" />
      <div className="container py-6 px-4">

        {/* Identity Switcher */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeRole === "brand" ? "Manage campaigns & hiring" : "Track applications & earnings"}
              </p>
            </div>
            {activeRole === "brand" && (
              <CreateCampaignModal
                trigger={
                  <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-9">
                    <Plus size={16} className="mr-1" /> Campaign
                  </Button>
                }
                onCreated={handleCampaignCreated}
              />
            )}
          </div>

          {/* Role pills */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveRole("brand")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeRole === "brand"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Megaphone size={16} /> Brand
            </button>
            <button
              onClick={() => setActiveRole("influencer")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
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
        <div className="grid grid-cols-2 gap-3 mb-6">
          {currentStats.map((s, i) => (
            <motion.div key={`${activeRole}-${i}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <s.icon size={18} className="text-primary" />
                  </div>
                  <div className="font-display font-bold text-xl text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
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
                user={user}
                navigate={navigate}
                handleCampaignCreated={handleCampaignCreated}
                updateApplicationStatus={updateApplicationStatus}
                toggleCampaignStatus={toggleCampaignStatus}
                deleteCampaign={deleteCampaign}
                updateBookingStatus={updateBookingStatus}
                hasBrandProfile={hasBrandProfile}
              />
            </motion.div>
          ) : (
            <motion.div key="influencer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <InfluencerDashboard
                myApplications={myApplications}
                bookings={bookings.filter(b => b.influencer_user_id === user.id)}
                hasProfile={hasInfluencerProfile}
                profileStats={influencerStats}
                navigate={navigate}
                updateBookingStatus={updateBookingStatus}
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
  user: any;
  navigate: any;
  handleCampaignCreated: () => void;
  updateApplicationStatus: (id: string, status: string) => void;
  toggleCampaignStatus: (id: string, status: string) => void;
  deleteCampaign: (id: string) => void;
  updateBookingStatus: (id: string, status: string) => void;
  hasBrandProfile: boolean;
}

const BrandDashboard = ({
  campaigns, applications, bookings, pendingApps, getCampaignName,
  user, navigate, handleCampaignCreated,
  updateApplicationStatus, toggleCampaignStatus, deleteCampaign, updateBookingStatus,
  hasBrandProfile
}: BrandDashboardProps) => (
  <Tabs defaultValue="campaigns" className="w-full">
    <TabsList className="w-full grid grid-cols-3 mb-4">
      <TabsTrigger value="campaigns" className="font-display text-xs">Campaigns</TabsTrigger>
      <TabsTrigger value="received-apps" className="font-display text-xs">
        Apps ({pendingApps.length})
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
              <CreateCampaignModal
                trigger={
                  <Button className="mt-4 gradient-primary border-0 text-primary-foreground">
                    <Plus size={16} className="mr-2" /> Create Campaign
                  </Button>
                }
                onCreated={handleCampaignCreated}
              />
            ) : (
              <JoinBrandModal
                trigger={
                  <Button className="mt-4 gradient-primary border-0 text-primary-foreground">
                    <Plus size={16} className="mr-2" /> Join as Brand
                  </Button>
                }
              />
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
                <Card className="glass-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">{c.brand_logo}</div>
                        <div className="min-w-0">
                          <Link to={`/campaign/${c.id}`} className="font-display font-semibold text-foreground hover:text-primary transition-colors truncate block text-sm">{c.brand}</Link>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <MapPin size={10} /> {c.city} <span>·</span> <Clock size={10} /> {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge
                              variant={c.status === "active" ? "default" : c.status === "paused" ? "outline" : "secondary"}
                              className={`cursor-pointer text-[10px] h-5 ${c.status === "active" ? "gradient-primary border-0 text-primary-foreground" : c.status === "paused" ? "border-warning text-warning" : ""}`}
                            >
                              {c.status === "active" && <Play size={8} className="mr-0.5" />}
                              {c.status === "paused" && <Pause size={8} className="mr-0.5" />}
                              {c.status === "closed" && <Archive size={8} className="mr-0.5" />}
                              {c.status}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {c.status !== "active" && <DropdownMenuItem onClick={() => toggleCampaignStatus(c.id, "active")} className="gap-2 text-success"><Play size={14} /> Set Active</DropdownMenuItem>}
                            {c.status !== "paused" && <DropdownMenuItem onClick={() => toggleCampaignStatus(c.id, "paused")} className="gap-2 text-warning"><Pause size={14} /> Pause</DropdownMenuItem>}
                            {c.status !== "closed" && <DropdownMenuItem onClick={() => toggleCampaignStatus(c.id, "closed")} className="gap-2 text-muted-foreground"><Archive size={14} /> Close</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete campaign?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{c.brand}" and all its applications.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteCampaign(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3">
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
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-[10px]">{initials}</div>
                                        <div>
                                          <InfluencerProfileModal profile={profile}>{profile?.name || "Unknown"}</InfluencerProfileModal>
                                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                                            {profile?.city && <span className="flex items-center gap-0.5"><MapPin size={8} /> {profile.city}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="text-[9px] h-4">{app.status}</Badge>
                                    </div>
                                    {app.status === "pending" && (
                                      <div className="flex gap-1.5 mt-2">
                                        <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => updateApplicationStatus(app.id, "accepted")}>Accept</Button>
                                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateApplicationStatus(app.id, "rejected")}>Reject</Button>
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
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xs">{initials}</div>
                        <div>
                          <InfluencerProfileModal profile={profile}>{profile?.name || "Unknown"}</InfluencerProfileModal>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            for <Link to={`/campaign/${app.campaign_id}`} className="text-primary hover:underline">{getCampaignName(app.campaign_id)}</Link>
                          </div>
                        </div>
                      </div>
                      <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"}>{app.status}</Badge>
                    </div>
                    {app.message && (
                      <div className="mt-2 p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-foreground">{app.message}</p>
                      </div>
                    )}
                    {app.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-7 px-3 text-xs" onClick={() => updateApplicationStatus(app.id, "accepted")}><CheckCircle size={12} className="mr-1" /> Accept</Button>
                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => updateApplicationStatus(app.id, "rejected")}><XCircle size={12} className="mr-1" /> Reject</Button>
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
        <Card className="glass-card"><CardContent className="p-10 text-center"><ShoppingCart size={28} className="mx-auto text-muted-foreground mb-3" /><h3 className="font-display font-semibold text-foreground">No bookings yet</h3><p className="text-muted-foreground text-sm mt-1">Direct bookings will appear here.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">{booking.influencer_name?.charAt(0) || "?"}</div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">Booking for {booking.influencer_name}</div>
                        <div className="text-[10px] text-muted-foreground">{(booking.items || []).map((item: any) => `${item.qty}x ${item.type}`).join(", ")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground flex items-center"><IndianRupee size={10} />{booking.total_amount.toLocaleString()}</span>
                      <Badge variant={booking.status === "accepted" ? "default" : booking.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">{booking.status}</Badge>
                    </div>
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

// ==================== INFLUENCER DASHBOARD ====================
interface InfluencerDashboardProps {
  myApplications: MyApplicationRow[];
  bookings: BookingRow[];
  hasProfile: boolean;
  profileStats: { name: string; followers: string; rating: number | null; engagement_rate: string | null } | null;
  navigate: any;
  updateBookingStatus: (id: string, status: string) => void;
}

const InfluencerDashboard = ({
  myApplications, bookings, hasProfile, profileStats, navigate, updateBookingStatus,
}: InfluencerDashboardProps) => {
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
          <ListInfluencerModal
            trigger={
              <Button className="mt-4 gradient-primary border-0 text-primary-foreground">
                Join as Influencer
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="applications" className="w-full">
      <TabsList className="w-full grid grid-cols-2 mb-4">
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
              <Button className="mt-4 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/")}>Browse Campaigns</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myApplications.map((app, i) => {
              const campaign = app.campaigns;
              const cfg = statusConfig[app.status] || statusConfig.pending;
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" onClick={() => campaign && navigate(`/campaign/${campaign.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">{campaign?.brand_logo || "🏪"}</div>
                          <div>
                            <h3 className="font-display font-semibold text-sm text-foreground">{campaign?.brand || "Unknown"}</h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                              {campaign?.city && <span className="flex items-center gap-0.5"><MapPin size={9} /> {campaign.city}</span>}
                              {campaign?.budget && <><span>·</span><span className="flex items-center gap-0.5"><IndianRupee size={9} />{campaign.budget.toLocaleString()}</span></>}
                            </div>
                          </div>
                        </div>
                        <Badge variant={cfg.variant} className="gap-1 shrink-0 text-[10px]">{cfg.icon} {cfg.label}</Badge>
                      </div>
                      {app.message && (
                        <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 rounded-lg p-2 line-clamp-2">"{app.message}"</p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                        <Clock size={10} /> Applied {new Date(app.created_at).toLocaleDateString()}
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
              <p className="text-muted-foreground text-sm mt-1">Booking requests from brands will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <motion.div key={booking.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm text-foreground">From {booking.brand_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{(booking.items || []).map((item: any) => `${item.qty}x ${item.type}`).join(", ")}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs flex items-center"><IndianRupee size={10} />{booking.total_amount.toLocaleString()}</span>
                        <Badge variant={booking.status === "accepted" ? "default" : booking.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">{booking.status}</Badge>
                      </div>
                    </div>
                    {booking.notes && <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 rounded-lg p-2">{booking.notes}</p>}
                    {booking.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="gradient-primary border-0 text-primary-foreground h-7 px-3 text-xs" onClick={() => updateBookingStatus(booking.id, "accepted")}><CheckCircle size={12} className="mr-1" /> Accept</Button>
                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => updateBookingStatus(booking.id, "rejected")}><XCircle size={12} className="mr-1" /> Reject</Button>
                      </div>
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
};

export default Dashboard;
