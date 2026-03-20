import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, HelpCircle, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, influencerId, brandId } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || "there";
  const deferredOnboardingKey = user ? `influflow:onboarding-deferred:${user.id}` : null;

  const clearDeferredOnboarding = () => {
    if (deferredOnboardingKey && typeof window !== "undefined") {
      window.localStorage.removeItem(deferredOnboardingKey);
    }
  };

  const deferOnboarding = () => {
    if (deferredOnboardingKey && typeof window !== "undefined") {
      window.localStorage.setItem(deferredOnboardingKey, "true");
    }
  };

  const handleInfluencerPath = () => {
    clearDeferredOnboarding();
    if (influencerId) {
      navigate("/edit-profile");
      return;
    }
    navigate("/register");
  };

  const handleBrandPath = () => {
    clearDeferredOnboarding();
    if (brandId) {
      navigate("/edit-brand-profile");
      return;
    }
    navigate("/register-brand");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Get Started" />

      <div className="relative overflow-hidden bg-white">
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute left-1/2 top-16 h-44 w-44 -translate-x-1/2 rounded-full bg-amber-50 blur-3xl" />

        <div className="container relative py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome to Influgal
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Choose how you want to
              <span className="block text-slate-900">
                <span className="text-orange-600">show up</span> on the platform
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Hey {displayName}. Pick the path that fits best right now. You can always explore first and complete the rest later.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container pb-16 ">
        <div className="mx-auto mb-6 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Select your role</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <Card
              className="group h-full cursor-pointer rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-[0_18px_45px_-18px_rgba(15,23,42,0.18)]"
              onClick={handleInfluencerPath}
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border border-teal-100 bg-teal-50 text-teal-700">
                    <Users className="h-6 w-6" />
                  </div>
                  {influencerId ? (
                    <div className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                      Edit
                    </div>
                  ) : (
                    <div className="rounded-full border border-slate-200 p-2 text-slate-400 transition-colors group-hover:border-teal-200 group-hover:text-teal-700">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">For Creators</p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">I&apos;m an Influencer</h2>
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  Build your profile, upload your portfolio, connect socials, and apply to campaigns from brands that fit your audience.
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">Portfolio</span>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Campaigns</span>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Reviews</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
          >
            <Card
              className="group h-full cursor-pointer rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_18px_45px_-18px_rgba(15,23,42,0.18)]"
              onClick={handleBrandPath}
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border border-orange-100 bg-orange-50 text-orange-700">
                    <Building2 className="h-6 w-6" />
                  </div>
                  {brandId ? (
                    <div className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700">
                      Edit
                    </div>
                  ) : (
                    <div className="rounded-full border border-slate-200 p-2 text-slate-400 transition-colors group-hover:border-orange-200 group-hover:text-orange-700">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">For Brands</p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">I&apos;m a Brand</h2>
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  Set up your brand profile, launch campaigns, review applicants, and manage bookings in one clean workflow.
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">Campaigns</span>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Applicants</span>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Bookings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            <Card
              className="group h-full cursor-pointer rounded-[1.4rem] border border-slate-200 bg-slate-50/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_45px_-18px_rgba(15,23,42,0.18)]"
              onClick={() => {
                deferOnboarding();
                navigate("/");
              }}
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border border-slate-200 bg-slate-50 text-slate-700">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div className="rounded-full border border-slate-200 p-2 text-slate-400 transition-colors group-hover:border-slate-300 group-hover:text-slate-700">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Explore First</p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">Decide Later</h2>
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  Browse the platform first, understand how campaigns and profiles work, and complete your setup when you&apos;re ready.
                </p>

                <div className="mt-5 rounded-[1.15rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-left">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Best for</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    People who want a quick look around before choosing a creator or brand workflow.
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
