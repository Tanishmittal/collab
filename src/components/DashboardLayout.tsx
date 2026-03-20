import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Bell } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, influencerId, brandId } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  // Helper to get title from path
  const getPageTitle = (path: string) => {
    if (path === "/") return "Discover Creators";
    if (path.startsWith("/dashboard")) return "Dashboard Overview";
    if (path.startsWith("/messages")) return "Inbox";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/influencer")) return "Influencer Profile";
    if (path.startsWith("/brand")) return "Brand Workspace";
    return "Influgal";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* TopBar (Desktop Only) */}
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 md:flex">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Welcome back to your workspace</p>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
              onClick={() => navigate("/notifications")}
              className="group relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <Bell size={20} className="group-hover:text-teal-600 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
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
        <div className="flex-1 min-h-0 w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
