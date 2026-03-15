import { motion } from "framer-motion";
import { Search, Zap, BarChart3, Shield, Users, Globe } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Find the perfect influencers for your brand with AI-powered search across niches, cities, and engagement metrics.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    icon: Users,
    title: "Seamless Collaboration",
    description: "Manage your entire influencer relationship — from outreach to content approval — in one unified workspace.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track campaign performance with live dashboards. Views, engagement, ROI — all at your fingertips.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description: "Every influencer is vetted for authenticity. No fake followers, no inflated stats — just real reach.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Zap,
    title: "Instant Campaigns",
    description: "Launch campaigns in minutes, not days. Set your budget, pick deliverables, and start receiving applications.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Globe,
    title: "Hyperlocal Reach",
    description: "Target creators in specific cities and neighbourhoods. Perfect for local businesses and regional brands.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-gray-50/60">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-teal-500 font-bold text-sm uppercase tracking-widest">Platform Features</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl text-gray-900 mt-3 tracking-tight">
          Everything You Need to <span className="text-teal-500">Win</span>
        </h2>
        <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          InfluFlow gives brands and creators the tools to discover, connect, and grow — all in one beautifully simple platform.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={item}
            className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <f.icon size={22} className={f.color} />
            </div>
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
