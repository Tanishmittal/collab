import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type OnboardingStatus = "loading" | "complete" | "needs-onboarding";

export const useOnboardingCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  useEffect(() => {
    console.log("[useOnboardingCheck] Effect triggered. authLoading:", authLoading, "userId:", user?.id);
    if (authLoading) return;
    if (!user) {
      console.log("[useOnboardingCheck] No user, skipping check.");
      setStatus("complete"); // not logged in, no redirect needed
      return;
    }
    const onboardingTimeout = setTimeout(() => {
      console.warn("[useOnboardingCheck] Timeout hit!");
      setStatus("needs-onboarding");
    }, 5000);

    const check = async () => {
      console.log("[useOnboardingCheck] Checking profiles for user:", user.id);
      try {
        // Check if user has an influencer or brand profile
        const [{ data: influencer, error: infErr }, { data: brand, error: brandErr }] = await Promise.all([
          supabase
            .from("influencer_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("brand_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        console.log("[useOnboardingCheck] Check result:", { 
          hasInfluencer: !!influencer, 
          hasBrand: !!brand,
          errors: { infErr, brandErr }
        });
        setStatus(influencer || brand ? "complete" : "needs-onboarding");
      } catch (error) {
        console.error("[useOnboardingCheck] Exception:", error);
        setStatus("needs-onboarding");
      } finally {
        clearTimeout(onboardingTimeout);
      }
    };

    check();
  }, [user, authLoading]);

  return { status, user };
};
