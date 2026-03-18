import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useInfluencerRegistration } from "@/hooks/useInfluencerRegistration";
import InfluencerRegistrationForm from "@/components/InfluencerRegistrationForm";

const RegisterInfluencer = () => {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    submitting,
    form,
    update,
    togglePlatform,
    canProceed,
    handleSubmit,
  } = useInfluencerRegistration(() => {
    navigate("/");
  }, false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Header */}
      <div className="gradient-hero py-12 md:py-16">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Join as Influencer</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
              Create Your Profile
            </h1>
            <p className="text-primary-foreground/60 max-w-md mx-auto">
              Set up your profile and start getting booked by top brands
            </p>
          </motion.div>
        </div>
      </div>

      <InfluencerRegistrationForm
        step={step}
        setStep={setStep}
        submitting={submitting}
        form={form}
        update={update}
        togglePlatform={togglePlatform}
        canProceed={canProceed}
        handleSubmit={handleSubmit}
        isModal={false}
      />
    </div>
  );
};

export default RegisterInfluencer;
