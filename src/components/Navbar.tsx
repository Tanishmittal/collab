import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Building2, LogOut, UserCircle, BarChart3, MessageSquare, Bell, ArrowLeft, Home, Search, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CreateCampaignModal from "@/components/CreateCampaignModal";
import ListInfluencerModal from "@/components/ListInfluencerModal";
import JoinBrandModal from "@/components/JoinBrandModal"; // Added this import

interface NavbarProps {
  variant?: "full" | "minimal";
  title?: string;
}

const Navbar = ({ variant = "full", title }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/auth";
  const { user, loading, influencerProfileId, brandProfileId, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const desktopNavLinks = [
    { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
    { label: "Messages", path: "/messages", icon: MessageSquare },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-xl transition-all duration-300">

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden">
        {variant === "minimal" ? (
          /* Minimal: back arrow + page title */
          <div className="container flex items-center h-14 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-lg text-slate-900 truncate">{title || "Back"}</h1>
            <div className="flex-1" />
            {user && (
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
            )}
          </div>
        ) : (
          /* Full: logo + sign-in / bell */
          <div className="container flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-display font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-teal-500 transition-colors">InfluFlow</span>
            </Link>
            <div className="flex items-center gap-1">
              {user ? (
                <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  onClick={() => navigate(isAuthPage ? "/" : "/auth")}
                >
                  {isAuthPage ? "Home" : "Sign In"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP HEADER (always global) ── */}
      <div className="hidden md:block">
        <div className="container flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <span className="font-display font-extrabold text-2xl tracking-tight text-gray-900 group-hover:text-teal-500 transition-colors">InfluFlow</span>
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
                      {brandProfileId ? (
                        <CreateCampaignModal
                          trigger={
                            <Button size="sm" className="gradient-primary border-0 text-primary-foreground rounded-xl h-9 px-4 font-semibold text-xs gap-2">
                              <Building2 className="w-4 h-4" /> New Campaign
                            </Button>
                          }
                        />
                      ) : (
                        <JoinBrandModal
                          trigger={
                            <Button size="sm" className="gradient-primary border-0 text-primary-foreground rounded-xl h-9 px-4 font-semibold text-xs gap-2">
                              <Building2 className="w-4 h-4" /> Join as Brand
                            </Button>
                          }
                        />
                      )}
                      {!influencerProfileId && (
                        <ListInfluencerModal
                          trigger={
                            <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-semibold text-xs gap-2">
                              <User className="w-4 h-4" /> Join as Influencer
                            </Button>
                          }
                        />
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
                      {influencerProfileId && (
                        <DropdownMenuItem asChild>
                          <Link to={`/influencer/${influencerProfileId}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                            <UserCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">My Profile</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Profile Hub</span>
                        </Link>
                      </DropdownMenuItem>
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
