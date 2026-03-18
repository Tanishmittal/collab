import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useInfluencerRegistration } from "@/hooks/useInfluencerRegistration";
import InfluencerRegistrationForm from "@/components/InfluencerRegistrationForm";

interface ListInfluencerModalProps {
  trigger: React.ReactNode;
  onCreated?: () => void;
}

const ListInfluencerModal = ({ trigger, onCreated }: ListInfluencerModalProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
    setOpen(false);
    onCreated?.();
  }, true);

  const resetForm = () => {
    // Reset logic is handled in the hook
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
        <div className="gradient-hero py-6 px-6">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-2 w-fit backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Creator Setup</span>
            </div>
            <DialogTitle className="text-2xl font-display font-black text-primary-foreground tracking-tight">
              Build Your Profile
            </DialogTitle>
          </DialogHeader>
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
          isModal={true}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ListInfluencerModal;
