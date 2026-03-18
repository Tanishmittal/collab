import { motion } from "framer-motion";
import { UserPlus, Search, Handshake, TrendingUp } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up as a brand or influencer. Set up your profile with your niche, city, pricing, and portfolio.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    num: "02",
    icon: Search,
    title: "Discover & Connect",
    description: "Brands browse verified influencers by city, niche, and engagement. Influencers explore open campaigns.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    num: "03",
    icon: Handshake,
    title: "Collaborate & Create",
    description: "Send proposals, agree on deliverables, and manage the entire workflow through our built-in messaging system.",
    color: "from-violet-500 to-purple-500",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Measure & Grow",
    description: "Track campaign results in real time. Iterate, scale what works, and build long-term partnerships.",
    color: "from-amber-500 to-orange-500",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-teal-500 font-bold text-sm uppercase tracking-widest">How It Works</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl text-gray-900 mt-3 tracking-tight">
          Four Simple Steps to <span className="text-teal-500">Success</span>
        </h2>
        <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          Whether you're a brand looking for creators or an influencer seeking opportunities, getting started takes minutes.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Connecting line (desktop) */}
        <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-teal-200 via-violet-200 to-amber-200" />

        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="relative text-center"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10`}>
              <s.icon size={24} className="text-white" />
            </div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Step {s.num}</span>
            <h3 className="font-display font-bold text-xl text-gray-900 mt-2 mb-2">{s.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
