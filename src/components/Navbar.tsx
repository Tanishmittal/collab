import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Building2, LogOut, UserCircle, BarChart3, MessageSquare, Bell, ArrowLeft, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { goBackOr } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface NavbarProps {
  variant?: "full" | "minimal";
  title?: string;
}

const Navbar = ({ variant = "full", title }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, influencerId, brandId, signOut } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const desktopNavLinks = [
    { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
    { label: "Messages", path: "/messages", icon: MessageSquare },
    { label: "Notifications", path: "/notifications", icon: Bell },
  ];
  const showMinimalHeaderAction =
    !!user &&
    (location.pathname.startsWith("/influencer/") || location.pathname.startsWith("/brand/"));

  const minimalFallback =
    location.pathname === "/register" || location.pathname === "/register-brand"
      ? "/onboarding"
      : location.pathname === "/create-campaign" || location.pathname === "/edit-campaign"
        ? "/dashboard"
        : location.pathname === "/edit-profile"
          ? (influencerId ? `/influencer/${influencerId}?tab=influencer` : "/dashboard")
          : location.pathname === "/edit-brand-profile"
            ? (brandId ? `/brand/${brandId}?tab=brand` : "/dashboard")
            : location.pathname.startsWith("/campaign/")
              ? "/?tab=campaigns"
              : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-xl transition-all duration-300">

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden">
        {variant === "minimal" ? (
          /* Minimal: back arrow + page title */
          <div className="container flex items-center h-14 gap-3">
            <button
              onClick={() => {
                if (location.pathname.startsWith("/campaign/")) {
                  const backTo = (location.state as { backTo?: string } | null)?.backTo || "/?tab=campaigns";
                  navigate(backTo);
                  return;
                }

                goBackOr(navigate, minimalFallback);
              }}
              className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-lg text-slate-900 truncate">{title || "Back"}</h1>
            <div className="flex-1" />
            {showMinimalHeaderAction && (
              <button
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                onClick={() => navigate("/settings")}
                aria-label="Open settings"
              >
                <Settings2 size={18} />
              </button>
            )}
          </div>
        ) : (
          /* Full: logo + sign-in / bell */
          <div className="container flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/influgal_icon.png"
                alt="Influgal"
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="font-display font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-teal-500 transition-colors">Influgal</span>
            </Link>
            <div className="flex min-w-10 items-center justify-end">
              {user && (
                <button
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                  onClick={() => navigate("/notifications")}
                  aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP HEADER (Guest only or specific pages) ── */}
      <div className={cn("hidden md:block", user && "md:hidden")}>
        <div className="container flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3.5 group shrink-0">
            <img
              src="/influgal_icon.png"
              alt="Influgal"
              className="h-12 w-12 shrink-0 object-contain"
            />
            <span className="font-display font-extrabold text-2xl tracking-tight text-gray-900 group-hover:text-teal-500 transition-colors">Influgal</span>
          </Link>

          {/* Right side content: Nav links + actions */}
          <div className="flex items-center gap-6">
            {/* Nav links */}
            <div className="flex items-center gap-1">
              {!user ? (
                // Guest links (Home sections)
                <>
                  <a
                    href="#discover"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Discover
                  </a>
                  <a
                    href="#features"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    How it Works
                  </a>
                  <a
                    href="#testimonials"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Testimonials
                  </a>
                </>
              ) : (
                // Authenticated links
                desktopNavLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      <link.icon size={16} />
                      {link.label}
                    </Link>
                  );
                })
              )}
            </div>

            {/* Action buttons + avatar */}
            <div className="flex items-center gap-3 shrink-0">
              {user ? (
                <>
                  {!loading && (
                    <>
                      {brandId ? (
                        <Button size="sm" className="gradient-primary border-0 text-primary-foreground rounded-xl h-9 px-4 font-semibold text-xs gap-2" onClick={() => navigate("/create-campaign")}>
                          <Building2 className="w-4 h-4" /> New Campaign
                        </Button>
                      ) : (
                        <Button size="sm" className="gradient-primary border-0 text-primary-foreground rounded-xl h-9 px-4 font-semibold text-xs gap-2" onClick={() => navigate("/register-brand")}>
                          <Building2 className="w-4 h-4" /> Join as Brand
                        </Button>
                      )}
                      {!influencerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-9 px-4 font-semibold text-xs gap-2"
                          onClick={() => navigate("/register")}
                        >
                          <User className="w-4 h-4" /> Join as Influencer
                        </Button>
                      )}
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-xl h-9 px-3 gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {(user.user_metadata?.display_name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="max-w-[100px] truncate text-sm font-medium text-gray-700">
                          {user.user_metadata?.display_name || user.email?.split("@")[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl">
                      {influencerId && brandId ? (
                        <DropdownMenuItem asChild>
                          <Link to={`/influencer/${influencerId}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                            <UserCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <>
                          {influencerId && (
                            <DropdownMenuItem asChild>
                              <Link to={`/influencer/${influencerId}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                                <UserCircle className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Influencer Profile</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {brandId && (
                            <DropdownMenuItem asChild>
                              <Link to={`/brand/${brandId}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Brand Profile</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                          <Settings2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-red-500 hover:text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  className="gradient-primary border-0 text-primary-foreground rounded-xl h-10 px-6 font-semibold text-sm"
                  onClick={() => navigate(isAuthPage ? "/" : "/auth")}
                >
                  {isAuthPage ? "Home" : "Sign In"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
