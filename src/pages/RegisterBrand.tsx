import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import BrandRegistrationForm from "@/components/BrandRegistrationForm";
import { useBrandRegistration } from "@/hooks/useBrandRegistration";
import { useAuth } from "@/contexts/AuthContext";

const RegisterBrand = () => {
  const navigate = useNavigate();
  const { loading, brandId } = useAuth();
  const {
    step,
    setStep,
    submitting,
    form,
    update,
    toggleArrayItem,
    canProceed,
    handleSubmit,
  } = useBrandRegistration(() => {
    navigate("/");
  });

  useEffect(() => {
    if (!loading && brandId) {
      navigate("/edit-brand-profile", { replace: true });
    }
  }, [loading, brandId, navigate]);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden">
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-teal-100/45 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
          <div className="mx-auto max-w-3xl pt-8 text-center sm:pt-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">
              <Sparkles className="h-3.5 w-3.5" />
              Brand setup
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl"
            >
              Build your brand
              <span className="text-orange-500"> profile</span>
            </motion.h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-lg">
              Set up one polished brand profile, define your creator fit, and be ready to launch campaigns with confidence.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-6xl pb-24 sm:mt-14 sm:pb-16">
            <BrandRegistrationForm
              step={step}
              setStep={setStep}
              submitting={submitting}
              form={form}
              update={update}
              toggleArrayItem={toggleArrayItem}
              canProceed={canProceed}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterBrand;
