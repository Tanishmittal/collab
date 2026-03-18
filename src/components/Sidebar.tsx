import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, MessageSquare, Search, UserCircle, Building2, 
  Settings2, LogOut, ChevronRight, Star, Megaphone, Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, influencerId, brandId, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navGroups = [
    {
      label: "Primary",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
        { label: "Discover", path: "/", icon: Search },
        { label: "Messages", path: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: "Management",
      items: [
        influencerId && brandId
          ? { label: "My Profile", path: `/influencer/${influencerId}`, icon: UserCircle }
          : influencerId
            ? { label: "Influencer Profile", path: `/influencer/${influencerId}`, icon: Star }
            : { label: "Join as Influencer", path: "/register", icon: UserCircle },
        !(influencerId && brandId) && (brandId
          ? { label: "Brand Profile", path: `/brand/${brandId}`, icon: Building2 }
          : { label: "Join as Brand", path: "/register-brand", icon: Building2 }),
      ].filter(Boolean) as any[]
    },
    {
      label: "Account",
      items: [
        { label: "Settings", path: "/settings", icon: Settings2 },
      ]
    }
  ];

  if (!user) return null;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 z-40">
      {/* Logo Area */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-white font-display font-bold text-lg">I</span>
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">InfluFlow</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8">
        {navGroups.map((group, idx) => (
          <div key={group.label}>
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              {group.label}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                      isActive 
                        ? "bg-teal-50 text-teal-700 shadow-sm shadow-teal-100/50" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <item.icon size={18} className={cn(
                      "transition-colors",
                      isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full"
                      />
                    )}
                    <ChevronRight size={14} className={cn(
                      "opacity-0 transition-opacity",
                      isActive ? "" : "group-hover:opacity-40"
                    )} />
                  </Link>
                );
              })}
            </nav>
            {idx < navGroups.length - 1 && group.items.length > 0 && <Separator className="mt-6 opacity-40 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
        <Link 
          to={influencerId ? `/influencer/${influencerId}` : (brandId ? `/brand/${brandId}` : `/onboarding`)}
          className="flex items-center gap-3 px-2 py-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm mb-3 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/10">
            {(user.user_metadata?.display_name || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {user.user_metadata?.display_name || user.email?.split("@")[0]}
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
              {brandId ? <Megaphone size={10} className="text-teal-500" /> : <Star size={10} className="text-amber-500" />}
              {brandId ? "Brand Partner" : "Creator"}
            </p>
          </div>
        </Link>
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full justify-start gap-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
};

// Dummy motion component to avoid framer-motion dependency errors if not perfectly handled
const motion = {
  div: ({ children, className }: any) => <div className={className}>{children}</div>
};

export default Sidebar;
