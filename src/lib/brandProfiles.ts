import type { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const navigateToBrandProfile = async (
  navigate: NavigateFunction,
  userId?: string | null
) => {
  if (!userId) return;

  const { data } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.id) {
    navigate(`/brand/${data.id}?tab=brand`);
  }
};
