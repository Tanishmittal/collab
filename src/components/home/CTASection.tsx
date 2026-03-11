import { motion } from "framer-motion";
import { Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="container pb-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-gray-800 p-12 md:p-20 text-center shadow-2xl"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-teal-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white mb-6 tracking-tight">
              Ready to <span className="text-teal-400">Amplify</span> Your Story?
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
              Join the elite circle of brands and creators moving the needle with authentic, hyperlocal influence.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-400 text-white rounded-2xl px-10 h-16 text-lg font-bold uppercase tracking-widest shadow-[0_0_25px_rgba(20,184,166,0.3)] hover:shadow-teal-500/50 transition-all duration-300 transform hover:scale-105 border-none"
              onClick={() => navigate("/register-brand")}
            >
              <Building2 size={20} className="mr-3" /> Get Started as Brand
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-2xl px-10 h-16 text-lg font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate("/register")}
            >
              <User size={20} className="mr-3" /> Join as Influencer
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
