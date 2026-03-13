import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, MessageSquare, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [influencerProfileId, setInfluencerProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setInfluencerProfileId(null);
      return;
    }

    supabase
      .from("influencer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setInfluencerProfileId(data?.id ?? null));
  }, [user]);

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[25] flex justify-center px-4 md:hidden pb-[var(--safe-area-bottom)]">
      <nav 
        className="flex items-center justify-between gap-1 px-2 h-16 bg-white/95 backdrop-blur-md border border-border/40 shadow-xl rounded-full overflow-hidden"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path && item.label !== "Profile"; 
          // Special case for profile to avoid double active state if dashboard is also active
          const isProfileActive = item.label === "Profile" && location.pathname === "/dashboard";
          const active = isActive || isProfileActive;

          return (
            <Link
              key={item.label + item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center w-14 h-12 rounded-full transition-all duration-200",
                active ? "bg-slate-100/50" : "hover:bg-slate-50 active:scale-95"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-0.5 transition-colors duration-200", 
                  active ? "text-primary" : "text-slate-500"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                active ? "text-primary" : "text-slate-500"
              )}>
                {item.label}
              </span>
              
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNav;
