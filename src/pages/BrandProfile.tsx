import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Globe, Building2, Mail, Phone,
  ExternalLink, MessageSquare, Plus, Pencil, ShieldCheck,
  Target, Users, Briefcase
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const BrandProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [brand, setBrand] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchBrandData = async () => {
      setLoading(true);
      try {
        // Fetch brand profile
        const { data: brandData, error: brandError } = await supabase
          .from("brand_profiles")
          .select("*")
          .eq("id", id!)
          .maybeSingle();

        if (brandError) throw brandError;
        
        if (!brandData) {
          setLoading(false);
          return;
        }

        setBrand(brandData);
        setIsOwner(user?.id === brandData.user_id);

        // Fetch active campaigns for this brand
        const { data: campaignsData, error: campaignsError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("user_id", brandData.user_id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (campaignsError) throw campaignsError;
        setCampaigns(campaignsData || []);

      } catch (error: any) {
        console.error("Error fetching brand data:", error);
        toast({
          title: "Error",
          description: "Failed to load brand profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBrandData();
  }, [id, user, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {!user && <Navbar variant="minimal" title="Brand Profile" />}
        <div className="h-48 md:h-56 bg-muted animate-pulse" />
        <div className="container -mt-16 relative z-10 space-y-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background">
        {!user && <Navbar variant="minimal" title="Brand Profile" />}
        <div className="container py-20 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="font-display font-bold text-2xl text-foreground">Brand not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to Discovery</Link>
        </div>
      </div>
    );
  }

  const initials = brand.business_name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {!user && <Navbar variant="minimal" title={brand.business_name} />}

      {/* Hero Banner */}
      <div className="h-48 md:h-56 relative overflow-hidden bg-gradient-to-r from-teal-500 to-blue-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
        <div className="container relative h-full flex items-end pb-0">
          <Link to="/" className="absolute top-4 left-4 md:left-8 flex items-center gap-1.5 text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white hover:bg-white/30 transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      <div className="container -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Brand Info */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card overflow-visible shadow-xl">
                <CardContent className="p-6 pt-0 text-center">
                  <div className="w-32 h-32 -mt-16 mx-auto relative group">
                    <div className="absolute inset-0 bg-card rounded-[2rem] ring-4 ring-background shadow-2xl" />
                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-4xl">
                      {initials}
                    </div>
                  </div>
                  
                  <h1 className="font-display font-bold text-2xl mt-4 text-foreground flex items-center justify-center gap-2">
                    {brand.business_name}
                    <ShieldCheck size={20} className="text-primary" fill="currentColor" />
                  </h1>
                  <Badge variant="secondary" className="mt-1">{brand.business_type}</Badge>
                  
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mt-3">
                    <MapPin size={14} />
                    <span>{brand.city}</span>
                  </div>

                  {brand.website && (
                    <a 
                      href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary text-sm font-medium mt-3 hover:underline"
                    >
                      <Globe size={14} />
                      {brand.website.replace(/^https?:\/\//, '')}
                      <ExternalLink size={12} />
                    </a>
                  )}

                  <div className="mt-6 pt-6 border-t space-y-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Target size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Niches</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {brand.target_niches?.map((niche: string) => (
                            <Badge key={niche} variant="outline" className="text-[10px] px-1.5 py-0">{niche}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign Capacity</div>
                        <div className="text-sm font-medium text-foreground">{brand.campaigns_per_month || 0} Campaigns / Month</div>
                      </div>
                    </div>
                  </div>

                  {isOwner ? (
                    <Button 
                      className="w-full mt-8 gradient-primary border-0 text-primary-foreground font-semibold h-11"
                      onClick={() => navigate("/dashboard")}
                    >
                      <Pencil size={16} className="mr-2" /> Manage Dashboard
                    </Button>
                  ) : (
                    <Button 
                      className="w-full mt-8 gradient-primary border-0 text-primary-foreground font-semibold h-11"
                      onClick={() => toast({ title: "Coming Soon", description: "Direct messaging will be available shortly!" })}
                    >
                      <MessageSquare size={16} className="mr-2" /> Message Brand
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold text-foreground mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-muted-foreground" />
                      <span className="text-foreground">{brand.email}</span>
                    </div>
                    {brand.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone size={16} className="text-muted-foreground" />
                        <span className="text-foreground">{brand.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 size={16} className="text-muted-foreground" />
                      <span className="text-foreground">{brand.contact_name} (Primary Contact)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - About & Campaigns */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h2 className="font-display font-bold text-xl text-foreground mb-4">About the Brand</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {brand.description || "No description provided yet."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Tabs defaultValue="campaigns" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-8">
                  <TabsTrigger 
                    value="campaigns" 
                    className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 pb-3 bg-transparent font-display font-bold text-lg"
                  >
                    Active Campaigns ({campaigns.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="pt-6">
                  {campaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((campaign) => (
                        <Link key={campaign.id} to={`/campaign/${campaign.id}`}>
                          <Card className="hover:shadow-md transition-shadow transition-transform hover:-translate-y-1 overflow-hidden border-teal-100">
                            <CardContent className="p-0">
                              <div className="h-32 bg-muted relative">
                                {campaign.brand_logo ? (
                                  <img src={campaign.brand_logo} alt={campaign.brand} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold opacity-80">
                                    {campaign.brand}
                                  </div>
                                )}
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-white/90 text-primary backdrop-blur-sm border-0 font-bold">
                                    ₹{campaign.budget.toLocaleString()}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-4">
                                <h3 className="font-bold text-foreground line-clamp-1">{campaign.description}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-[10px]">{campaign.niche}</Badge>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <MapPin size={10} /> {campaign.city}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-muted">
                      <div className="text-4xl mb-3">📢</div>
                      <h3 className="text-lg font-bold text-foreground">No active campaigns</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto mt-1">This brand isn't currently recruiting for any campaigns.</p>
                      {isOwner && (
                        <Button className="mt-4 gradient-primary" onClick={() => navigate("/dashboard")}>
                          <Plus size={16} className="mr-2" /> Launch a Campaign
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="h-20 md:h-24" />
    </div>
  );
};

export default BrandProfile;
