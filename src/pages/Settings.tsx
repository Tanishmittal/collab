import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Mail, User, Shield, Info, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/");
  };

  const email = user?.email || "Not available";
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar variant="minimal" title="Settings" />

      <main className="container max-w-2xl pt-6 px-4 space-y-6">
        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Account</h2>
          <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                    <Mail size={12} /> {email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* General */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">General</h2>
          <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                onClick={() => navigate("/profile")}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User size={18} className="text-blue-600" />
                </div>
                <span className="flex-1 font-medium text-slate-800 text-sm">Manage Profiles</span>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
              <button
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                onClick={() => navigate("/edit-profile")}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Shield size={18} className="text-purple-600" />
                </div>
                <span className="flex-1 font-medium text-slate-800 text-sm">Edit Influencer Profile</span>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">About</h2>
          <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <div className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Info size={18} className="text-slate-500" />
                </div>
                <span className="flex-1 font-medium text-slate-800 text-sm">App Version</span>
                <span className="text-sm text-slate-400">1.0.0</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-base gap-3 shadow-sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <><Loader2 size={18} className="animate-spin" /> Signing out...</>
            ) : (
              <><LogOut size={18} /> Sign Out</>
            )}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
