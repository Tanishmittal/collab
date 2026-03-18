import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InfluencerFormData {
  name: string;
  city: string;
  bio: string;
  niche: string;
  followers: string;
  engagementRate: string;
  platforms: string[];
  priceReel: string;
  priceStory: string;
  priceVisit: string;
  // Modal-specific fields
  avatarUrl?: string | null;
  isVerified?: boolean;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  verificationCode?: string;
}

export const PLATFORMS = [
  { id: "Instagram", icon: "Instagram", color: "from-pink-500 to-purple-500" },
  { id: "YouTube", icon: "Youtube", color: "from-red-500 to-red-600" },
  { id: "Twitter", icon: "Twitter", color: "from-sky-400 to-sky-500" },
];

export const useInfluencerRegistration = (
  onSuccess?: () => void,
  isModal: boolean = false
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfiles } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<InfluencerFormData>({
    name: "",
    city: "",
    bio: "",
    niche: "",
    followers: "",
    engagementRate: "",
    platforms: [],
    priceReel: isModal ? "5000" : "",
    priceStory: isModal ? "2000" : "",
    priceVisit: isModal ? "8000" : "",
    ...(isModal && {
      avatarUrl: null,
      isVerified: false,
      instagramUrl: "",
      youtubeUrl: "",
      twitterUrl: "",
      verificationCode: Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    }),
  });

  const update = (field: keyof InfluencerFormData, value: string | string[] | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const canProceed = () => {
    if (isModal) {
      // Modal has 5 steps
      switch (step) {
        case 0: return form.name.trim().length > 0 && form.avatarUrl !== null;
        case 1: return form.city.length > 0 && form.bio.trim().length > 0 && form.niche.length > 0;
        case 2: return true; // Verification step can be skipped
        case 3: return parseInt(form.priceReel) > 0 && parseInt(form.priceStory) > 0;
        case 4: return true;
        default: return false;
      }
    } else {
      // Page has 4 steps
      switch (step) {
        case 0: return form.name.trim().length > 0 && form.city.length > 0 && form.bio.trim().length > 0;
        case 1: return form.niche.length > 0 && form.followers.trim().length > 0 && form.engagementRate.trim().length > 0 && form.platforms.length > 0;
        case 2: return form.priceReel.trim().length > 0 && form.priceStory.trim().length > 0 && form.priceVisit.trim().length > 0;
        case 3: return true;
        default: return false;
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to create a profile.", variant: "destructive" });
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
      followers: form.followers || "0",
      engagement_rate: form.engagementRate || "0",
      platforms: form.platforms.length > 0 ? form.platforms : ["Instagram"],
      price_reel: parseInt(form.priceReel) || 0,
      price_story: parseInt(form.priceStory) || 0,
      price_visit: parseInt(form.priceVisit) || 0,
      ...(isModal && {
        is_verified: form.isVerified || false,
        instagram_url: form.instagramUrl || null,
        youtube_url: form.youtubeUrl || null,
        twitter_url: form.twitterUrl || null,
        verification_code: form.verificationCode,
        avatar_url: form.avatarUrl,
      }),
    };

    const { data, error } = await supabase
      .from("influencer_profiles")
      .insert(profileData)
      .select()
      .single();

    if (!error) {
      await supabase.from("profiles").update({
        user_type: "influencer",
        display_name: form.name,
        ...(isModal && { avatar_url: form.avatarUrl }),
      }).eq("user_id", user.id);
      await refreshProfiles();
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      const successMessage = isModal
        ? "🚀 Profile Created! Welcome to InfluFlow! Your profile is now live."
        : "🎉 Profile Created! Your influencer profile is now live. Brands can discover you!";

      toast({ title: "Profile Created!", description: successMessage });

      if (isModal && data?.id) {
        navigate(`/influencer/${data.id}`);
      } else {
        navigate("/");
      }

      onSuccess?.();
    }
  };

  return {
    step,
    setStep,
    submitting,
    form,
    update,
    togglePlatform,
    canProceed,
    handleSubmit,
  };
};