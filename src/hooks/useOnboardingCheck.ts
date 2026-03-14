import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type OnboardingStatus = "loading" | "complete" | "needs-onboarding";

export const useOnboardingCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatus("complete"); // not logged in, no redirect needed
      return;
    }

    const check = async () => {
      try {
        // Check if user has an influencer or brand profile
        const [{ data: influencer }, { data: brand }] = await Promise.all([
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

        setStatus(influencer || brand ? "complete" : "needs-onboarding");
      } catch (error) {
        console.error("Onboarding check failed:", error);
        setStatus("needs-onboarding");
      }
    };

    check();
  }, [user, authLoading]);

  return { status, user };
};
