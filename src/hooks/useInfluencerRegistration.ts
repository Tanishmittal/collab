import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseFollowerCount } from "@/lib/campaignEligibility";

export interface InfluencerFormData {
  name: string;
  city: string;
  bio: string;
  niche: string;
  followers: string;

  platforms: string[];
  priceReel: string;
  priceStory: string;
  priceVisit: string;
  avatarUrl: string | null;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  igFollowers: string;
  ytFollowers: string;
  twitterFollowers: string;
  igVerified: boolean;
  ytVerified: boolean;
  twitterVerified: boolean;
  verificationCode: string;
}

export const PLATFORMS = [
  { id: "Instagram", icon: "Instagram", color: "from-pink-500 to-purple-500" },
  { id: "YouTube", icon: "Youtube", color: "from-red-500 to-red-600" },
  { id: "Twitter", icon: "Twitter", color: "from-sky-400 to-sky-500" },
] as const;

const createVerificationCode = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();

const sanitizeSlug = (name: string) => 
  name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

export const useInfluencerRegistration = (onSuccess?: () => void) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, refreshProfiles } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isValidatingSlug, setIsValidatingSlug] = useState(false);

  const [form, setForm] = useState<InfluencerFormData>({
    name: "",
    city: "",
    bio: "",
    niche: "",
    followers: "",

    platforms: [],
    priceReel: "",
    priceStory: "",
    priceVisit: "",
    avatarUrl: null,
    isVerified: false,
    instagramUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    igFollowers: "",
    ytFollowers: "",
    twitterFollowers: "",
    igVerified: false,
    ytVerified: false,
    twitterVerified: false,
    verificationCode: "", // Now stores just the slug
    slug: "", // Helper for the branded string
  });

  const update = (
    field: keyof InfluencerFormData | "slug",
    value: string | string[] | number | boolean | null
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      
      // Keep verificationCode synced with slug if slug is edited
      if (field === "slug") {
        next.verificationCode = value as string;
      }
      
      return next;
    });
  };

  const findUniqueSlug = async (baseName: string) => {
    const baseSlug = sanitizeSlug(baseName);
    if (!baseSlug) return "";

    setIsValidatingSlug(true);
    try {
      // 1. Get all profiles that START with this slug to check local gap
      const { data: existing, error } = await supabase
        .from("influencer_profiles")
        .select("verification_code")
        .ilike("verification_code", `${baseSlug}%`)
        .limit(20);

      if (error) throw error;

      const taken = new Set(existing.map(p => p.verification_code?.toLowerCase()));

      // 2. If base is free, use it
      if (!taken.has(baseSlug)) {
        setIsValidatingSlug(false);
        return baseSlug;
      }

      // 3. Otherwise, try numeric suffixes alex1, alex2...
      // Start with random 3 digits to jump ahead of simple names
      let candidate = baseSlug + Math.floor(Math.random() * 900 + 100);
      let attempts = 0;
      
      while (taken.has(candidate) && attempts < 5) {
        candidate = baseSlug + Math.floor(Math.random() * 900 + 100);
        attempts++;
      }

      setIsValidatingSlug(false);
      return candidate;
    } catch (error) {
      console.error("Error checking slug uniqueness:", error);
      setIsValidatingSlug(false);
      return baseSlug + Math.floor(Math.random() * 1000);
    }
  };

  const nextStep = async () => {
    if (step === 0 && !form.verificationCode) {
      // On moving from name step, generate the unique slug
      const uniqueSlug = await findUniqueSlug(form.name);
      setForm(prev => ({ 
        ...prev, 
        slug: uniqueSlug,
        verificationCode: uniqueSlug 
      }));
    }
    setStep((prev) => prev + 1);
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.name.trim().length >= 4 && form.avatarUrl !== null;
      case 1:
        return form.city.length > 0 && form.bio.trim().length > 0 && form.niche.length > 0;
      case 2:
        const hasIgInput = form.instagramUrl.trim().length > 0;
        const hasYtInput = form.youtubeUrl.trim().length > 0;
        const hasTwitterInput = form.twitterUrl.trim().length > 0;
        
        // If they entered a handle, they MUST enter followers if not verified
        if (hasIgInput && !form.igVerified && !form.igFollowers) return false;
        if (hasYtInput && !form.ytVerified && !form.ytFollowers) return false;
        if (hasTwitterInput && !form.twitterVerified && !form.twitterFollowers) return false;
        
        // ADDED: Must have at least one platform with followers > 0 total to proceed
        const totalFollowers = 
          (Number.parseInt(form.igFollowers, 10) || 0) + 
          (Number.parseInt(form.ytFollowers, 10) || 0) + 
          (Number.parseInt(form.twitterFollowers, 10) || 0);

        return totalFollowers > 0;
      case 3:
        return (
          Number.parseInt(form.priceReel, 10) > 0 &&
          Number.parseInt(form.priceStory, 10) > 0 &&
          Number.parseInt(form.priceVisit, 10) > 0
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Please sign in first",
        description: "You need an account to create a profile.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setSubmitting(true);

    const profileData = {
      user_id: user.id,
      name: form.name,
      city: form.city,
      bio: form.bio,
      niche: form.niche,
      total_followers_count: 
        (Number.parseInt(form.igFollowers, 10) || 0) + 
        (Number.parseInt(form.ytFollowers, 10) || 0) + 
        (Number.parseInt(form.twitterFollowers, 10) || 0),
      total_verified_followers_count: 0,
      ig_followers: Number.parseInt(form.igFollowers, 10) || 0,
      yt_subscribers: Number.parseInt(form.ytFollowers, 10) || 0,
      twitter_followers: Number.parseInt(form.twitterFollowers, 10) || 0,

      platforms: form.platforms,
      price_reel: Number.parseInt(form.priceReel, 10) || 0,
      price_story: Number.parseInt(form.priceStory, 10) || 0,
      price_visit: Number.parseInt(form.priceVisit, 10) || 0,
      is_verified: form.igVerified || form.ytVerified || form.twitterVerified,
      instagram_url: form.instagramUrl || null,
      youtube_url: form.youtubeUrl || null,
      twitter_url: form.twitterUrl || null,
      verification_code: form.verificationCode,
      avatar_url: form.avatarUrl,
      email: user.email,
    };

    const { data, error } = await supabase
      .from("influencer_profiles")
      .insert(profileData)
      .select()
      .single();

    if (!error) {
      await supabase
        .from("profiles")
        .update({
          user_type: "influencer",
          display_name: form.name,
          avatar_url: form.avatarUrl,
        })
        .eq("user_id", user.id);

      await refreshProfiles();
      await queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
    }

    setSubmitting(false);

    if (error) {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile created",
      description: "Your creator profile is now live and ready for brands to discover.",
    });

    if (data?.id) {
      navigate(`/influencer/${data.id}`);
    } else {
      navigate("/");
    }

    onSuccess?.();
  };

  return {
    step,
    setStep,
    submitting,
    form,
    update,
    canProceed,
    handleSubmit,
    nextStep,
    isValidatingSlug
  };
};
