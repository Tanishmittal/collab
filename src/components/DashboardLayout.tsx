import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Bell, Search, Menu } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { user, influencerId, brandId } = useAuth();

  // Helper to get title from path
  const getPageTitle = (path: string) => {
    if (path === "/") return "Discover Creators";
    if (path.startsWith("/dashboard")) return "Dashboard Overview";
    if (path.startsWith("/messages")) return "Inbox";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/influencer")) return "Influencer Profile";
    if (path.startsWith("/brand")) return "Brand Workspace";
    return "InfluFlow";
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar (Desktop Only) */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-white/50 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Welcome back to your workspace</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Profile Switcher (Only on own profile) */}
            {(influencerId && brandId && (location.pathname.includes(`/influencer/${influencerId}`) || location.pathname.includes(`/brand/${brandId}`))) && (
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                <Link 
                  to={`/influencer/${influencerId}`}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    location.pathname.includes("/influencer/") 
                      ? "bg-white text-teal-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Influencer
                </Link>
                <Link 
                  to={`/brand/${brandId}`}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    location.pathname.includes("/brand/") 
                      ? "bg-white text-teal-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Brand
                </Link>
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-slate-100/50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 w-64 transition-all"
              />
            </div>

            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative group">
              <Bell size={20} className="group-hover:text-teal-600 transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-10 w-[1px] bg-slate-200" />
            
            <Link 
              to={influencerId ? `/influencer/${influencerId}` : (brandId ? `/brand/${brandId}` : `/onboarding`)}
              className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-100 rounded-xl transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform">
                {(user?.user_metadata?.display_name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">View Profile</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
