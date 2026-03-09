import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import CampaignCard from "@/components/CampaignCard";
import { CITIES, NICHES } from "@/data/mockData";
import type { Campaign } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Campaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [niche, setNiche] = useState("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formBrand, setFormBrand] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formInfluencers, setFormInfluencers] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDeliverables, setFormDeliverables] = useState("");
  const [formBrandLogo, setFormBrandLogo] = useState("🏪");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: Campaign[] = data.map((row) => ({
        id: row.id,
        brand: row.brand,
        brandLogo: row.brand_logo || "🏪",
        city: row.city,
        budget: row.budget,
        influencersNeeded: row.influencers_needed,
        influencersApplied: row.influencers_applied,
        deliverables: row.deliverables || [],
        niche: row.niche,
        status: (row.status as Campaign["status"]) || "active",
        postedAt: new Date(row.created_at).toLocaleDateString(),
        description: row.description || "",
      }));
      setCampaigns(mapped);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormBrand("");
    setFormCity("");
    setFormNiche("");
    setFormBudget("");
    setFormInfluencers("");
    setFormDescription("");
    setFormDeliverables("");
    setFormBrandLogo("🏪");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to create a campaign.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!formBrand.trim() || !formCity || !formNiche || !formBudget || !formInfluencers || !formDescription.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const budget = parseInt(formBudget);
    const influencersNeeded = parseInt(formInfluencers);
    if (isNaN(budget) || budget <= 0 || isNaN(influencersNeeded) || influencersNeeded <= 0) {
      toast({ title: "Invalid values", description: "Budget and influencers needed must be positive numbers.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const deliverables = formDeliverables.split(",").map(d => d.trim()).filter(Boolean);

    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      brand: formBrand.trim().slice(0, 100),
      brand_logo: formBrandLogo,
      city: formCity,
      niche: formNiche,
      budget,
      influencers_needed: influencersNeeded,
      deliverables,
      description: formDescription.trim().slice(0, 1000),
      status: "active",
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: "Failed to create campaign. Please try again.", variant: "destructive" });
      return;
    }

    toast({ title: "Campaign created!", description: "Your campaign is now live." });
    resetForm();
    setDialogOpen(false);
    fetchCampaigns();
  };

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = c.brand.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
      const matchCity = city === "all" || c.city === city;
      const matchNiche = niche === "all" || c.niche === niche;
      return matchSearch && matchCity && matchNiche;
    });
  }, [search, city, niche, campaigns]);

  const emojiOptions = ["🏪", "🍔", "💪", "👗", "📱", "☕", "✨", "🚀", "🎯", "🎨"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-3xl">Campaign Feed</h1>
            <p className="text-muted-foreground mt-1">Browse active campaigns and apply</p>
          </div>
          {user ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0 text-primary-foreground">
                  <Plus size={18} className="mr-2" /> Post Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display">Create Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label>Brand Name *</Label>
                      <Input placeholder="e.g., Burger Cafe" className="mt-1" value={formBrand} onChange={e => setFormBrand(e.target.value)} maxLength={100} />
                    </div>
                    <div>
                      <Label>Logo</Label>
                      <Select value={formBrandLogo} onValueChange={setFormBrandLogo}>
                        <SelectTrigger className="mt-1 w-16"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {emojiOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>City *</Label>
                      <Select value={formCity} onValueChange={setFormCity}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select city" /></SelectTrigger>
                        <SelectContent>{CITIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Niche *</Label>
                      <Select value={formNiche} onValueChange={setFormNiche}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select niche" /></SelectTrigger>
                        <SelectContent>{NICHES.map(n=><SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Budget (₹) *</Label><Input type="number" placeholder="15000" className="mt-1" value={formBudget} onChange={e => setFormBudget(e.target.value)} min={1} /></div>
                    <div><Label>Influencers Needed *</Label><Input type="number" placeholder="5" className="mt-1" value={formInfluencers} onChange={e => setFormInfluencers(e.target.value)} min={1} /></div>
                  </div>
                  <div><Label>Description *</Label><Textarea placeholder="Describe your campaign..." className="mt-1" value={formDescription} onChange={e => setFormDescription(e.target.value)} maxLength={1000} /></div>
                  <div><Label>Deliverables</Label><Input placeholder="e.g., 1 Reel, 2 Stories (comma-separated)" className="mt-1" value={formDeliverables} onChange={e => setFormDeliverables(e.target.value)} /></div>
                  <Button className="w-full gradient-primary border-0 text-primary-foreground" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button className="gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/auth")}>
              <Plus size={18} className="mr-2" /> Sign In to Post
            </Button>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="All Cities" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Cities</SelectItem>{CITIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="All Niches" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Niches</SelectItem>{NICHES.map(n=><SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus size={40} className="text-primary" />
            </div>
            {campaigns.length === 0 ? (
              <>
                <h3 className="font-display font-semibold text-xl text-foreground">No campaigns yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">Be the first brand to post a campaign and connect with local influencers in your city.</p>
                {user ? (
                  <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={() => setDialogOpen(true)}>
                    <Plus size={16} className="mr-2" /> Post Your First Campaign
                  </Button>
                ) : (
                  <Button className="mt-6 gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/auth")}>
                    Sign In to Post a Campaign
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="font-display font-semibold text-xl text-foreground">No campaigns found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCity("all"); setNiche("all"); }}>
                  Clear Filters
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
