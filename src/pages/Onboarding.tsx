import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Users, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || "there";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="gradient-hero py-12 md:py-16">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Welcome to InfluFlow</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
              Hey {displayName}! 👋
            </h1>
            <p className="text-primary-foreground/60 max-w-md mx-auto">
              Let's get you set up. How would you like to use InfluFlow?
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-2xl -mt-8 pb-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="glass-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group h-full"
              onClick={() => navigate("/register")}
            >
              <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">I'm an Influencer</h2>
                  <p className="text-sm text-muted-foreground">
                    Showcase your profile, connect with brands, and land exciting campaigns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="glass-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group h-full"
              onClick={() => navigate("/register-brand")}
            >
              <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">I'm a Brand</h2>
                  <p className="text-sm text-muted-foreground">
                    Find the perfect influencers, create campaigns, and grow your business.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
