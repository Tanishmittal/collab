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

const stats = [
  { value: "10K+", label: "Creators", icon: Users },
  { value: "5K+", label: "Brands", icon: Zap },
  { value: "50K+", label: "Collaborations", icon: Star },
];

const NativeLanding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding-check`,
      },
    });

    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      setLoading(false);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#060816] px-6 py-12 text-white">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.12),_transparent_30%)]" />
      <StarField className="opacity-70" />

      <div className="relative z-10 flex flex-col items-center">
        {/* App Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4 h-20 w-20"
          >
            <img
              src="/influgal_icon.png"
              alt="Influgal"
              className="h-full w-full object-contain"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl font-extrabold tracking-tight"
          >
            Influgal
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-slate-300"
          >
            The creator marketplace in your pocket
          </motion.p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden rounded-[2.5rem] border-0 bg-white shadow-2xl">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  <Sparkles size={12} />
                  Native Access
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">
                  Get Started
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sign in or create your account to continue.
                </p>
              </div>

              <Tabs defaultValue="login">
                <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-2xl bg-slate-100 p-1">
                  <TabsTrigger value="login" className="rounded-xl font-semibold">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-xl font-semibold">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-slate-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-slate-900 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password" title="slate800">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-slate-900 focus:bg-white"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="h-13 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 py-6 text-base font-bold text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]">
                      {loading ? "Signing in..." : "Sign In"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-slate-900 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Min 6 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-slate-900 focus:bg-white"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="h-13 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 py-6 text-base font-bold text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]">
                      {loading ? "Creating..." : "Create Account"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 font-semibold text-slate-400">Or</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="h-14 w-full rounded-2xl border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]" disabled={loading} onClick={handleGoogleSignIn}>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mini Stats / Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default NativeLanding;
