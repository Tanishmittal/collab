import { motion } from "framer-motion";
import { Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import StarField from "@/components/ui/StarField";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="container pb-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-gray-800 p-6 py-12 md:p-20 text-center shadow-2xl"
      >
        <StarField className="opacity-50" />
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-teal-400/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-2"
          >
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-6xl text-white mb-4 tracking-tight leading-[1.1]">
              Ready to <span className="text-teal-400">Amplify</span> Your Story?
            </h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed opacity-80">
              Join the elite circle of brands and creators moving the needle with authentic, hyperlocal influence.
            </p>
          </motion.div>

          {/* From-Scratch Fluid Button Container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full max-w-sm sm:max-w-none mx-auto px-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="group relative flex w-full sm:w-auto items-center justify-center gap-3 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base md:text-lg font-bold uppercase tracking-widest shadow-[0_0_25px_rgba(20,184,166,0.3)] transition-all duration-300 overflow-hidden"
              onClick={() => navigate("/register-brand")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Building2 className="w-5 h-5 shrink-0" />
              <span className="relative z-10 text-center">Join as Brand</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base md:text-lg font-bold uppercase tracking-widest transition-all duration-300"
              onClick={() => navigate("/register")}
            >
              <User className="w-5 h-5 shrink-0" />
              <span className="relative z-10 text-center">Join as Influencer</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
