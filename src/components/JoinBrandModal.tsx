import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Target,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Rocket,
  Info,
  Loader2,
  Briefcase,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBrandRegistration } from "@/hooks/useBrandRegistration";
import BrandRegistrationForm from "@/components/BrandRegistrationForm";

interface JoinBrandModalProps {
  trigger?: React.ReactNode;
}

const JoinBrandModal = ({ trigger }: JoinBrandModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    navigate("/");
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 rounded-xl border-muted px-5 font-bold transition-all hover:bg-muted">
            <Building2 className="h-4 w-4" /> Join as Brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden border-none p-0 shadow-2xl sm:rounded-[2rem]">
        <div className="gradient-primary relative overflow-hidden px-8 py-8">
          <div className="absolute right-0 top-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-white/5 blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <Rocket className="h-4 w-4 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Brand Setup</span>
            </div>
            <DialogTitle className="font-display text-3xl font-black leading-tight tracking-tight text-white">
              Build a Brand Profile Creators Can Trust
            </DialogTitle>
            <p className="mt-1 max-w-md text-sm font-medium text-white/70">
              Focus on brand story, creator fit, markets, and campaign style. Budget stays at campaign level.
            </p>
          </DialogHeader>
        </div>

        <BrandRegistrationForm
          step={step}
          setStep={setStep}
          submitting={submitting}
          form={form}
          update={update}
          toggleArrayItem={toggleArrayItem}
          canProceed={canProceed}
          handleSubmit={handleSubmit}
          isModal={true}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default JoinBrandModal;
