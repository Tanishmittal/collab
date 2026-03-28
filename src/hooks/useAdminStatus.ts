import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/platform";

export const useAdminStatus = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) {
        return;
      }

      if (!user || isNativeApp()) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("admin_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(Boolean(data));
      } catch (err) {
        console.error("Error checking admin link visibility:", err);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  return { isAdmin, checkingAdmin };
};
