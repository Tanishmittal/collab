import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CITIES as FALLBACK_CITIES, NICHES as FALLBACK_NICHES } from "@/data/mockData";

type CityRow = Database["public"]["Tables"]["cities"]["Row"];
type NicheRow = Database["public"]["Tables"]["niches"]["Row"];

export const useManagedOptions = () => {
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);
  const [citiesByState, setCitiesByState] = useState<Record<string, string[]>>({ "Other": FALLBACK_CITIES });
  const [niches, setNiches] = useState<string[]>(FALLBACK_NICHES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      const [{ data: cityRows, error: cityError }, { data: nicheRows, error: nicheError }] = await Promise.all([
        supabase.from("cities").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("niches").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      ]);

      if (!active) return;

      if (!cityError && cityRows && cityRows.length > 0) {
        const typedRows = cityRows as CityRow[];
        setCities(typedRows.map((city) => city.name));
        
        const grouped = typedRows.reduce((acc, city) => {
          const stateName = city.state || "Other";
          if (!acc[stateName]) acc[stateName] = [];
          acc[stateName].push(city.name);
          return acc;
        }, {} as Record<string, string[]>);
        
        setCitiesByState(grouped);
      }

      if (!nicheError && nicheRows && nicheRows.length > 0) {
        setNiches((nicheRows as NicheRow[]).map((niche) => niche.name));
      }

      setLoading(false);
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => ({
      cities,
      citiesByState,
      niches,
      loading,
    }),
    [cities, citiesByState, niches, loading]
  );
};
