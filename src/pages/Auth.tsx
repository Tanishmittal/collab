import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles, Users, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarField from "@/components/ui/StarField";
import { useEffect } from "react";

declare global {
  interface Window {
    google: any;
  }
}

const stats = [
  { value: "10K+", label: "Creators", icon: Users },
  { value: "5K+", label: "Brands", icon: Zap },
  { value: "50K+", label: "Collaborations", icon: Star },
];

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: "popup"
        });

        const buttonElement = document.getElementById("google-sigin-custom-button");
        if (buttonElement) {
          window.google.accounts.id.renderButton(
            buttonElement,
            { theme: "outline", size: "large", width: "100%", shape: "pill", text: "continue_with" }
          );
        }
      }
    };

    // Load check logic
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initializeGoogleSignIn);
      }
    }
  }, []);

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;

      toast({ title: "Welcome back!", description: "Signing you in now." });
      navigate("/onboarding-check");
    } catch (error: any) {
      toast({ 
        title: "Google sign-in failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      toast({ 
        title: "Google Sign-In not ready", 
        description: "Checking script status...", 
        variant: "destructive" 
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "Checking your account setup now." });
      navigate("/onboarding-check");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding-check`,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created!",
        description: "Check your email if confirmation is required. We'll route you to the right next step.",
      });
      navigate("/onboarding-check");
    }
  };

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.2),_transparent_28%),radial-gradient(circle_at_75%_30%,_rgba(45,212,191,0.18),_transparent_22%),linear-gradient(180deg,_#0c1122_0%,_#060816_100%)]" />
          <StarField className="opacity-90" />

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-10 xl:px-16">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-white"
              >
                <img
                  src="/influgal_icon.png"
                  alt="Influgal"
                  className="h-14 w-14 shrink-0 object-contain"
                />
                Influgal
              </button>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200">
                Starlight access
              </div>
            </div>

            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200">
                <Sparkles className="h-3.5 w-3.5" />
                Creator marketplace
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 font-display text-6xl font-semibold leading-[0.95] tracking-tight"
              >
                Find and hire
                <span className="mt-2 block bg-gradient-to-r from-orange-300 via-orange-400 to-teal-300 bg-clip-text text-transparent">
                  top creators
                </span>
              </motion.h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Connect with Instagram, YouTube, and Twitter creators. Launch campaigns, manage collaborations, and grow your brand in one polished workspace.
              </p>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-orange-300">
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-300">
              {["Instagram", "YouTube", "Twitter"].map((platform) => (
                <span key={platform} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 sm:px-6 lg:px-10">
          <div className="absolute inset-0 lg:hidden bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.12),_transparent_30%),radial-gradient(circle_at_85%_15%,_rgba(45,212,191,0.12),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]" />

          <div className="relative z-10 w-full max-w-xl">
            <div className="mb-8 text-center lg:hidden">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-slate-950"
              >
                <img
                  src="/influgal_icon.png"
                  alt="Influgal"
                  className="h-12 w-12 shrink-0 object-contain"
                />
                Influgal
              </button>
              <p className="mt-3 text-sm text-slate-500">Access your campaigns, creators, and conversations.</p>
            </div>

            <Card className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-none">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Sign in or create
                    <span className="block text-slate-950">
                      your <span className="text-orange-500">Influgal</span> account
                    </span>
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    One account for brand setup, creator discovery, messaging, campaigns, and collaboration tracking.
                  </p>
                </div>

                <Tabs defaultValue="login">
                  <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-2xl bg-slate-100 p-1">
                    <TabsTrigger value="login" className="rounded-xl font-semibold">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-xl font-semibold">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="h-12 rounded-2xl border-slate-200 pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative mt-1.5">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="h-12 rounded-2xl border-slate-200 pl-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-500 hover:to-orange-500">
                        {loading ? "Signing in..." : "Sign In"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div>
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="h-12 rounded-2xl border-slate-200 pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative mt-1.5">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="h-12 rounded-2xl border-slate-200 pl-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-500 hover:to-orange-500">
                        {loading ? "Creating account..." : "Create Account"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div id="google-sigin-custom-button" className="w-full" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Auth;
