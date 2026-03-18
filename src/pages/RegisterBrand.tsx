import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useBrandRegistration } from '@/hooks/useBrandRegistration';
import BrandRegistrationForm from '@/components/BrandRegistrationForm';

const RegisterBrand = () => {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    submitting,
    form,
    update,
    toggleArrayItem,
    canProceed,
    handleSubmit,
  } = useBrandRegistration();

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />

      {/* Hero Header */}
      <div className='gradient-hero py-12 md:py-16'>
        <div className='container text-center'>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className='inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-4'>
              <Sparkles className='w-4 h-4 text-primary' />
              <span className='text-primary text-sm font-medium'>Join as Brand</span>
            </div>
            <h1 className='text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2'>
              Create Your Brand Profile
            </h1>
            <p className='text-primary-foreground/60 max-w-md mx-auto'>
              Set up your profile and start collaborating with top influencers
            </p>
          </motion.div>
        </div>
      </div>

      <div className='container max-w-4xl -mt-8 pb-16 relative z-10'>
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
  );
};

export default RegisterBrand;
