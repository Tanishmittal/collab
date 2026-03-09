import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CITIES, NICHES } from "@/data/mockData";

const emojiOptions = ["🏪", "🍔", "💪", "👗", "📱", "☕", "✨", "🚀", "🎯", "🎨"];

interface CreateCampaignModalProps {
  trigger: React.ReactNode;
  onCreated?: () => void;
}

const CreateCampaignModal = ({ trigger, onCreated }: CreateCampaignModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formBrand, setFormBrand] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formInfluencers, setFormInfluencers] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDeliverables, setFormDeliverables] = useState("");
  const [formBrandLogo, setFormBrandLogo] = useState("🏪");

  const resetForm = () => {
    setFormBrand(""); setFormCity(""); setFormNiche(""); setFormBudget("");
    setFormInfluencers(""); setFormDescription(""); setFormDeliverables(""); setFormBrandLogo("🏪");
  };

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to create a campaign.", variant: "destructive" });
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
      toast({ title: "Error", description: "Failed to create campaign.", variant: "destructive" });
      return;
    }
    toast({ title: "Campaign created!", description: "Your campaign is now live." });
    resetForm();
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
                <SelectContent>{emojiOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City *</Label>
              <Select value={formCity} onValueChange={setFormCity}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Niche *</Label>
              <Select value={formNiche} onValueChange={setFormNiche}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select niche" /></SelectTrigger>
                <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Budget (₹) *</Label><Input type="number" placeholder="15000" className="mt-1" value={formBudget} onChange={e => setFormBudget(e.target.value)} min={1} /></div>
            <div><Label>Influencers Needed *</Label><Input type="number" placeholder="5" className="mt-1" value={formInfluencers} onChange={e => setFormInfluencers(e.target.value)} min={1} /></div>
          </div>
          <div><Label>Description *</Label><Textarea placeholder="Describe your campaign..." className="mt-1" value={formDescription} onChange={e => setFormDescription(e.target.value)} maxLength={1000} /></div>
          <div><Label>Deliverables</Label><Input placeholder="e.g., 1 Reel, 2 Stories (comma-separated)" className="mt-1" value={formDeliverables} onChange={e => setFormDeliverables(e.target.value)} /></div>
          <Button className="w-full gradient-primary border-0 text-primary-foreground" onClick={handleCreate} disabled={submitting}>
            {submitting ? <><Loader2 size={14} className="mr-2 animate-spin" /> Creating...</> : "Create Campaign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignModal;
