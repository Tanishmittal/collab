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
  isVerified: boolean;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  verificationCode: string;
}

export const PLATFORMS = [
  { id: "Instagram", icon: "Instagram", color: "from-pink-500 to-purple-500" },
  { id: "YouTube", icon: "Youtube", color: "from-red-500 to-red-600" },
  { id: "Twitter", icon: "Twitter", color: "from-sky-400 to-sky-500" },
] as const;

const createVerificationCode = () =>
  Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();

export const useInfluencerRegistration = (onSuccess?: () => void) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

    platforms: [],
    priceReel: "",
    priceStory: "",
    priceVisit: "",
    avatarUrl: null,
    isVerified: false,
    instagramUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    verificationCode: createVerificationCode(),
  });

  const update = (
    field: keyof InfluencerFormData,
    value: string | string[] | number | boolean | null
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.avatarUrl !== null;
      case 1:
        return form.city.length > 0 && form.bio.trim().length > 0 && form.niche.length > 0;
      case 2:
        return true;
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
      total_followers_count: parseFollowerCount(form.followers),
      total_verified_followers_count: 0,

      platforms: form.platforms,
      price_reel: Number.parseInt(form.priceReel, 10) || 0,
      price_story: Number.parseInt(form.priceStory, 10) || 0,
      price_visit: Number.parseInt(form.priceVisit, 10) || 0,
      is_verified: form.platforms.length > 0,
      instagram_url: form.platforms.includes("Instagram") ? form.instagramUrl || null : null,
      youtube_url: form.platforms.includes("YouTube") ? form.youtubeUrl || null : null,
      twitter_url: form.platforms.includes("Twitter") ? form.twitterUrl || null : null,
      verification_code: form.verificationCode,
      avatar_url: form.avatarUrl,
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
  };
};
