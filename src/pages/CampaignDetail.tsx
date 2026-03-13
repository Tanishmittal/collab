import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Users, IndianRupee, Clock, CheckCircle, XCircle, MessageSquare, Send, Loader2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatThread from "@/components/ChatThread";
import ReviewForm from "@/components/ReviewForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState<{ id: string; status: string } | null>(null);
  const [influencerProfileId, setInfluencerProfileId] = useState<string | null>(null);

  const isOwner = user && campaign && campaign.user_id === user.id;

  useEffect(() => {
    if (id) {
      fetchCampaign();
      if (user) {
        checkExistingApplication();
        fetchInfluencerProfile();
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (isOwner && id) fetchApplications();
  }, [isOwner, id]);

  const fetchCampaign = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id!)
      .maybeSingle();
    if (!error && data) setCampaign(data as CampaignRow);
    setLoading(false);
  };

  const checkExistingApplication = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("campaign_applications")
      .select("id, status")
      .eq("campaign_id", id!)
      .eq("user_id", user.id)
      .maybeSingle();
    setHasApplied(!!data);
    setMyApplication(data ? { id: data.id, status: data.status } : null);
  };

  const fetchInfluencerProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("influencer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setInfluencerProfileId(data?.id || null);
  };

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("campaign_applications")
      .select("*, influencer_profiles(id, name, city, niche, followers, engagement_rate, rating)")
      .eq("campaign_id", id!)
      .order("created_at", { ascending: false });
    if (data) setApplications(data as ApplicationRow[]);
  };

  const handleApply = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to apply.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!influencerProfileId) {
      toast({ title: "No influencer profile", description: "Please register as an influencer first.", variant: "destructive" });
      navigate("/register");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("campaign_applications").insert({
      campaign_id: id!,
      influencer_profile_id: influencerProfileId,
      user_id: user.id,
      message: applyMessage.trim().slice(0, 500),
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Application sent!", description: "The brand will review your application." });
      setApplyOpen(false);
      setApplyMessage("");
      setHasApplied(true);
    }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    const { error } = await supabase
      .from("campaign_applications")
      .update({ status })
      .eq("id", appId);
    if (!error) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast({ title: `Application ${status}` });
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
          <div className="text-5xl mb-4">😕</div>
          <h1 className="font-display font-bold text-2xl text-foreground">Campaign not found</h1>
          <Link to="/?tab=campaigns" className="text-primary mt-4 inline-block hover:underline">← Back to Campaigns</Link>
        </div>
      </div>
    );
  }

  const progress = campaign.influencers_needed > 0
    ? Math.round((campaign.influencers_applied / campaign.influencers_needed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Campaign" />

      <div className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/")}>
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-3xl">
                  {campaign.brand_logo}
                </div>
                <div className="flex-1">
                  <h1 className="font-display font-bold text-2xl text-foreground">{campaign.brand}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <MapPin size={14} /> {campaign.city}
                    <span className="mx-1">·</span>
                    <Clock size={14} /> {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="secondary">{campaign.niche}</Badge>
              </div>

              <p className="text-muted-foreground">{campaign.description}</p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {campaign.deliverables.map(d => (
                  <Badge key={d} variant="outline">{d}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-1 text-foreground font-bold text-lg">
                    <IndianRupee size={16} /> {campaign.budget.toLocaleString()}
                  </div>
                  <span className="text-sm text-muted-foreground">Budget</span>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-1 text-foreground font-bold text-lg">
                    <Users size={16} /> {campaign.influencers_needed}
                  </div>
                  <span className="text-sm text-muted-foreground">Influencers needed</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{campaign.influencers_applied} applied</span>
                  <span className="text-muted-foreground">{campaign.influencers_needed} needed</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Chat with {campaign.brand}</h2>
            <ChatThread
              applicationId={myApplication.id}
              campaignId={campaign.id}
              otherUserId={campaign.user_id}
              otherUserName={campaign.brand}
            />
            {campaign.status === "closed" && (
              <>
                <h2 className="font-display font-bold text-xl">Leave a Review</h2>
                <ReviewForm
                  campaignId={campaign.id}
                  revieweeId={campaign.user_id}
                  reviewerType="influencer"
                  revieweeName={campaign.brand}
                />
              </>
            )}
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
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  {profile?.city && <span className="flex items-center gap-0.5"><MapPin size={10} /> {profile.city}</span>}
                                  {profile?.followers && <span>· {profile.followers} followers</span>}
                                  {profile?.rating && <span>· ⭐ {profile.rating}</span>}
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
                          )}

                          {app.status === "accepted" && (
                            <div className="mt-3 space-y-3">
                              <ChatThread
                                applicationId={app.id}
                                campaignId={campaign.id}
                                otherUserId={app.user_id}
                                otherUserName={profile?.name || "Influencer"}
                              />
                              {campaign.status === "closed" && (
                                <ReviewForm
                                  campaignId={campaign.id}
                                  revieweeId={app.user_id}
                                  reviewerType="brand"
                                  revieweeName={profile?.name || "Influencer"}
                                />
                              )}
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
      </div>
    </div>
  );
};

export default CampaignDetail;
