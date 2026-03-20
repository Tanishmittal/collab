import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BUSINESS_TYPES = ["Restaurant / Cafe", "Retail / E-commerce", "Gym / Fitness", "Salon / Beauty", "Tech / SaaS", "Events / Entertainment", "Other"];
export const DELIVERABLE_OPTIONS = ["Reels", "Stories", "UGC", "Launch Events", "Store Visits", "Giveaways"];
export const CAMPAIGN_GOALS = ["Brand Awareness", "Footfall", "Product Launch", "UGC", "Sales", "Local Reach"];
export const RESPONSE_TIME_OPTIONS = ["Usually within 24 hours", "Usually within 2-3 days", "Within a week"];

export interface BrandFormData {
  logoUrl: string;
  businessName: string;
  businessType: string;
  city: string;
  brandTagline: string;
  description: string;
  targetNiches: string[];
  targetCities: string[];
  deliverablePreferences: string[];
  campaignGoals: string[];
  creatorRequirements: string;
  campaignsPerMonth: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  responseTimeExpectation: string;
}

export const useBrandRegistration = (onSuccess?: () => void) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, refreshProfiles } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BrandFormData>({
    logoUrl: "",
    businessName: "",
    businessType: "",
    city: "",
    brandTagline: "",
    description: "",
    targetNiches: [],
    targetCities: [],
    deliverablePreferences: [],
    campaignGoals: [],
    creatorRequirements: "",
    campaignsPerMonth: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    responseTimeExpectation: "",
  });

  const update = (field: keyof BrandFormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (
    field: "targetNiches" | "targetCities" | "deliverablePreferences" | "campaignGoals",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return form.businessName.trim().length > 0 && form.businessType.length > 0 && form.city.length > 0;
      case 1:
        return form.targetNiches.length > 0 && form.targetCities.length > 0 && form.deliverablePreferences.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", description: "You need an account to create a profile.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("brand_profiles").insert({
      user_id: user.id,
      logo_url: form.logoUrl || null,
      business_name: form.businessName,
      business_type: form.businessType,
      city: form.city,
      brand_tagline: form.brandTagline,
      description: form.description,
      target_niches: form.targetNiches,
      target_cities: form.targetCities,
      deliverable_preferences: form.deliverablePreferences,
      campaign_goals: form.campaignGoals,
      creator_requirements: form.creatorRequirements,
      campaigns_per_month: parseInt(form.campaignsPerMonth) || 0,
      contact_name: form.contactName,
      email: form.email,
      phone: form.phone,
      website: form.website,
      response_time_expectation: form.responseTimeExpectation,
    });

    // Update profile type
    if (!error) {
      await supabase.from("profiles").update({ user_type: "brand", display_name: form.businessName }).eq("user_id", user.id);
      await refreshProfiles?.();
      await queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
    }

    setSubmitting(false);

    if (error) {
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "🎉 Brand Profile Created!",
        description: "Your brand profile is now live. Influencers can discover you!",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => navigate("/"), 1500);
      }
    }
  };

  return {
    step,
    setStep,
    submitting,
    form,
    update,
    toggleArrayItem,
    canProceed,
    handleSubmit,
  };
};
