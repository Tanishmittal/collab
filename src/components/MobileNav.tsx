import { Link, useLocation } from "react-router-dom";
import { Home, Search, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Explorer", icon: Search, path: "/campaigns" },
    { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t pb-[var(--safe-area-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all active:scale-90",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} className={isActive ? "fill-primary/10" : ""} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
