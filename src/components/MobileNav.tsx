import { Link, useLocation } from "react-router-dom";
import { Home, Search, MessageSquare, BarChart3, User, Zap, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import { isNativeApp } from "@/lib/platform";

type NavItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  isAnchor?: boolean;
};

const MobileNav = () => {
  const location = useLocation();
  const { user, influencerId, brandId } = useAuth();

  // Hide on certain pages or if Native & Unauthenticated
  if (
    location.pathname === "/register" || 
    location.pathname === "/register-brand" ||
    (isNativeApp() && !user)
  ) {
    return null;
  }

  const navItems: NavItem[] = user
    ? [
        { label: "Home", icon: Home, path: "/" },
        { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
        { label: "Messages", icon: MessageSquare, path: "/messages" },
        {
          label: influencerId || brandId ? "Profile" : "Join",
          icon: User,
          path: influencerId ? `/influencer/${influencerId}` : brandId ? `/brand/${brandId}` : "/onboarding",
        },
      ]
    : [
        { label: "Discover", icon: Search, path: "#discover", isAnchor: true },
        { label: "Features", icon: Zap, path: "#features", isAnchor: true },
        { label: "How", icon: Home, path: "#how-it-works", isAnchor: true },
        { label: "Reviews", icon: Star, path: "#testimonials", isAnchor: true },
      ];

  if (navItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[25] md:hidden pb-[var(--safe-area-bottom)]">
      <nav 
        className="flex items-center justify-between gap-1 px-2 h-16 bg-white/95 backdrop-blur-md border border-border/40 shadow-xl rounded-t-2xl overflow-hidden w-full"
      >
        {navItems.map((item) => {
          const active = item.isAnchor
            ? location.pathname === "/" && item.label === "Discover"
            : (item.label === "Home" && (location.pathname === "/" || location.pathname === "/index")) ||
              location.pathname === item.path;

          const content = (
            <div className={cn(
              "relative flex flex-col items-center justify-center w-14 h-12 rounded-full transition-all duration-200",
              active ? "bg-slate-100/50" : "hover:bg-slate-50 active:scale-95"
            )}>
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
            </div>
          );

          if (item.isAnchor) {
            return (
              <a
                key={item.label + item.path}
                href={location.pathname === "/" ? item.path : `/${item.path}`}
                className="outline-none"
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.label + item.path}
              to={item.path}
              className="outline-none"
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNav;
