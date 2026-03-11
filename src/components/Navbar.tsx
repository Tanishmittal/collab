import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Building2, LogOut, Send, UserCircle, BarChart3, MessageSquare } from "lucide-react";
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

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/auth";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const [influencerProfileId, setInfluencerProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setInfluencerProfileId(null); return; }
    supabase
      .from("influencer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setInfluencerProfileId(data?.id ?? null));
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm pt-[var(--safe-area-top)] transition-all duration-300">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3 group">

          <span className="font-display font-extrabold text-2xl tracking-tight text-gray-900 group-hover:text-teal-500 transition-colors">InfluFlow</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <CreateCampaignModal
                trigger={
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl h-10 px-5 font-bold uppercase tracking-wider text-[11px] gap-2">
                    <Building2 className="w-4 h-4 text-teal-400" /> Create Campaign
                  </Button>
                }
              />
              {!influencerProfileId && (
                <ListInfluencerModal
                  trigger={
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl h-10 px-5 font-bold uppercase tracking-wider text-[11px] gap-2">
                      <User className="w-4 h-4 text-teal-400" /> List as Influencer
                    </Button>
                  }
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl h-10 px-4 font-bold gap-3 border-none">
                    <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-black shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                      {(user.user_metadata?.display_name || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">
                      {user.user_metadata?.display_name || user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0a1224]/95 backdrop-blur-2xl border-white/5 p-2 rounded-2xl shadow-2xl">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 text-white/80 transition-colors">
                      <BarChart3 className="w-4 h-4 text-teal-400" />
                      <span className="font-bold uppercase tracking-wider text-[11px]">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {influencerProfileId && (
                    <DropdownMenuItem asChild>
                      <Link to={`/influencer/${influencerProfileId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 text-white/80 transition-colors">
                        <UserCircle className="w-4 h-4 text-teal-400" />
                        <span className="font-bold uppercase tracking-wider text-[11px]">My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 text-white/80 transition-colors">
                      <MessageSquare className="w-4 h-4 text-teal-400" />
                      <span className="font-bold uppercase tracking-wider text-[11px]">Messages</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5 my-2" />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-red-500/10 text-red-400 transition-colors font-bold uppercase tracking-wider text-[11px]">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              className="bg-white/5 border border-white/10 backdrop-blur-md text-black hover:bg-white hover:text-black hover:border-white rounded-2xl h-11 px-8 font-bold uppercase tracking-[0.15em] text-[10px] transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[40px_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
              onClick={() => navigate(isAuthPage ? "/" : "/auth")}
            >
              {isAuthPage ? "Home" : "Sign In"}
            </Button>
          )}
        </div>

        <button className="md:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-2">
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <CreateCampaignModal
                  trigger={
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Building2 className="w-4 h-4" /> Create Campaign
                    </Button>
                  }
                  onCreated={() => setMobileOpen(false)}
                />
                {!influencerProfileId && (
                  <ListInfluencerModal
                    trigger={
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <User className="w-4 h-4" /> List as Influencer
                      </Button>
                    }
                    onCreated={() => setMobileOpen(false)}
                  />
                )}
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <BarChart3 className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
                {influencerProfileId && (
                  <Link to={`/influencer/${influencerProfileId}`} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <UserCircle className="w-4 h-4" /> My Profile
                    </Button>
                  </Link>
                )}
                <Link to="/messages" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <MessageSquare className="w-4 h-4" /> Messages
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="w-full bg-white/5 border-white/10 text-white rounded-xl py-6 font-bold uppercase tracking-wider text-xs" 
                onClick={() => { navigate(isAuthPage ? "/" : "/auth"); setMobileOpen(false); }}
              >
                {isAuthPage ? "Home" : "Sign In"}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
