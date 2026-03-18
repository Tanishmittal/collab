import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Bell, Search } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar (Desktop Only) */}
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 md:flex">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Welcome back to your workspace</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 transition-colors group-focus-within:text-teal-500" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all focus:border-teal-200 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
              />
            </div>

            <button className="group relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100">
              <Bell size={20} className="group-hover:text-teal-600 transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-10 w-[1px] bg-slate-200" />

            <Link
              to={influencerId ? `/influencer/${influencerId}` : (brandId ? `/brand/${brandId}` : `/onboarding`)}
              className="group flex items-center gap-3 rounded-xl p-1 pr-3 transition-all hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white font-bold shadow-sm shadow-teal-500/20 transition-transform group-hover:scale-105">
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
