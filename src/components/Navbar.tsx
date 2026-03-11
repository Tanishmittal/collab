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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass-card border-b pt-[var(--safe-area-top)]">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
            IF
          </div>
          <span className="font-display font-bold text-xl">InfluFlow</span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <CreateCampaignModal
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <Building2 className="w-4 h-4" /> Create Campaign
                  </Button>
                }
              />
              {!influencerProfileId && (
                <ListInfluencerModal
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" /> List as Influencer
                    </Button>
                  }
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {(user.user_metadata?.display_name || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                    {user.user_metadata?.display_name || user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <BarChart3 className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {influencerProfileId && (
                    <DropdownMenuItem asChild>
                      <Link to={`/influencer/${influencerProfileId}`} className="flex items-center gap-2 cursor-pointer">
                        <UserCircle className="w-4 h-4" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="w-4 h-4" /> Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
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
              <Button variant="outline" size="sm" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
