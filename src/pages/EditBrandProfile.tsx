import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvatarUpload from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useManagedOptions } from "@/hooks/useManagedOptions";
import { goBackOr } from "@/lib/navigation";
import { LocationPicker } from "@/components/LocationPicker";
import { LocationMultiPicker } from "@/components/LocationMultiPicker";

type BrandProfileRow = Database["public"]["Tables"]["brand_profiles"]["Row"];
type BrandProfileUpdate = Database["public"]["Tables"]["brand_profiles"]["Update"];

const BUSINESS_TYPES = ["Restaurant / Cafe", "Retail / E-commerce", "Gym / Fitness", "Salon / Beauty", "Tech / SaaS", "Events / Entertainment", "Other"];
const DELIVERABLE_OPTIONS = ["Reels", "Stories", "UGC", "Launch Events", "Store Visits", "Giveaways"];
const CAMPAIGN_GOALS = ["Brand Awareness", "Footfall", "Product Launch", "UGC", "Sales", "Local Reach"];
const RESPONSE_TIME_OPTIONS = ["Usually within 24 hours", "Usually within 2-3 days", "Within a week"];

const EditBrandProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, brandId } = useAuth();
  const { cities, niches } = useManagedOptions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [targetNiches, setTargetNiches] = useState<string[]>([]);
  const [targetCities, setTargetCities] = useState<string[]>([]);
  const [deliverablePreferences, setDeliverablePreferences] = useState<string[]>([]);
  const [campaignGoals, setCampaignGoals] = useState<string[]>([]);
  const [creatorRequirements, setCreatorRequirements] = useState("");
  const [campaignsPerMonth, setCampaignsPerMonth] = useState("");
  const [responseTimeExpectation, setResponseTimeExpectation] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast({ title: "No brand profile found", description: "Please register as a brand first.", variant: "destructive" });
        navigate("/register-brand");
        return;
      }

      const profile = data as BrandProfileRow;

      setProfileId(profile.id);
      setLogoUrl(profile.logo_url || null);
      setBusinessName(profile.business_name);
      setBusinessType(profile.business_type);
      setCity(profile.city);
      setBrandTagline(profile.brand_tagline || "");
      setDescription(profile.description || "");
      setContactName(profile.contact_name);
      setEmail(profile.email);
      setPhone(profile.phone || "");
      setWebsite(profile.website || "");
      setTargetNiches(profile.target_niches || []);
      setTargetCities(profile.target_cities || []);
      setDeliverablePreferences(profile.deliverable_preferences || []);
      setCampaignGoals(profile.campaign_goals || []);
      setCreatorRequirements(profile.creator_requirements || "");
      setCampaignsPerMonth(profile.campaigns_per_month ? String(profile.campaigns_per_month) : "");
      setResponseTimeExpectation(profile.response_time_expectation || "");
      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, navigate, toast]);

  const toggleArrayItem = (
    field: "targetNiches" | "targetCities" | "deliverablePreferences" | "campaignGoals",
    value: string
  ) => {
    const setterMap = {
      targetNiches: setTargetNiches,
      targetCities: setTargetCities,
      deliverablePreferences: setDeliverablePreferences,
      campaignGoals: setCampaignGoals,
    };

    const currentMap = {
      targetNiches,
      targetCities,
      deliverablePreferences,
      campaignGoals,
    };

    const current = currentMap[field];
    setterMap[field](current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleSave = async () => {
    if (!user || !profileId) return;

    if (!businessName.trim() || !businessType || !city || !description.trim() || !contactName.trim() || !email.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const updatePayload: BrandProfileUpdate = {
      business_name: businessName.trim().slice(0, 100),
      logo_url: logoUrl || null,
      business_type: businessType,
      city,
      brand_tagline: brandTagline.trim() || null,
      description: description.trim().slice(0, 1000),
      contact_name: contactName.trim().slice(0, 100),
      email: email.trim(),
      phone: phone.trim() || null,
      website: website.trim() || null,
      target_niches: targetNiches,
      target_cities: targetCities,
      deliverable_preferences: deliverablePreferences,
      campaign_goals: campaignGoals,
      creator_requirements: creatorRequirements.trim() || null,
      campaigns_per_month: campaignsPerMonth ? parseInt(campaignsPerMonth, 10) : null,
      response_time_expectation: responseTimeExpectation || null,
    };

    const { error } = await supabase
      .from("brand_profiles")
      .update(updatePayload)
      .eq("id", profileId);

    if (!error) {
      await supabase.from("profiles").update({ display_name: businessName.trim() }).eq("user_id", user.id);
    }

    setSaving(false);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Brand profile updated", description: "Your changes are now live." });
    navigate(`/brand/${profileId}?tab=brand`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Edit Brand Profile" />
        <div className="container max-w-3xl py-12 space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Edit Brand Profile" />

      <div className="container max-w-5xl py-6 pb-16 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 hidden px-0 text-muted-foreground hover:text-foreground md:inline-flex"
          onClick={() => goBackOr(navigate, brandId ? `/brand/${brandId}?tab=brand` : "/dashboard")}
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            {user ? (
              <AvatarUpload
                userId={user.id}
                currentUrl={logoUrl}
                initials={businessName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "B"}
                onUploaded={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl(null)}
                size="md"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Building2 size={24} />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Edit Brand Profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">Update your public brand identity and creator-fit details.</p>
            </div>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Brand Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Brand Avatar">
              <p className="mt-1.5 text-sm text-muted-foreground">Your logo appears on the public brand profile and across campaign surfaces.</p>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Business Name *">
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Business Type *">
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City *">
                <LocationPicker
                  value={city}
                  onChange={setCity}
                  className="mt-1.5 w-full justify-between rounded-md h-10 px-3 bg-background border-input"
                />
              </Field>
              <Field label="Tagline">
                <Input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} className="mt-1.5" maxLength={120} />
              </Field>
            </div>

            <Field label="About the Brand *">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 resize-none" rows={4} maxLength={1000} />
            </Field>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Creator Fit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <TagPicker label="Target Niches" options={niches} values={targetNiches} onToggle={(value) => toggleArrayItem("targetNiches", value)} />
            <div>
              <Label>Target Cities</Label>
              <LocationMultiPicker
                values={targetCities}
                onChange={(value) => toggleArrayItem("targetCities", value)}
                className="w-full h-10 mt-1.5"
              />
              {targetCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {targetCities.map((c) => (
                    <span key={c} className="flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {c}
                      <button onClick={() => toggleArrayItem("targetCities", c)} className="ml-2 text-slate-400 hover:text-slate-600">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <TagPicker label="Deliverable Preferences" options={DELIVERABLE_OPTIONS} values={deliverablePreferences} onToggle={(value) => toggleArrayItem("deliverablePreferences", value)} />
            <TagPicker label="Campaign Goals" options={CAMPAIGN_GOALS} values={campaignGoals} onToggle={(value) => toggleArrayItem("campaignGoals", value)} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Campaigns / Month">
                <Input value={campaignsPerMonth} onChange={(e) => setCampaignsPerMonth(e.target.value)} type="number" min="0" className="mt-1.5" />
              </Field>
              <Field label="Response Time">
                <Select value={responseTimeExpectation} onValueChange={setResponseTimeExpectation}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select response window" /></SelectTrigger>
                  <SelectContent>{RESPONSE_TIME_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Creator Requirements">
              <Textarea value={creatorRequirements} onChange={(e) => setCreatorRequirements(e.target.value)} className="mt-1.5 resize-none" rows={4} maxLength={1000} />
            </Field>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact Name *">
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Email *">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1.5" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
              </Field>
              <Field label="Website">
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1.5" />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full py-6 text-base font-semibold gradient-primary border-0 text-primary-foreground" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

const TagPicker = ({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) => (
  <div>
    <Label>{label}</Label>
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              selected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-muted-foreground hover:border-accent/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </div>
);

export default EditBrandProfile;
