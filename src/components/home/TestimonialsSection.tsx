import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Influgal helped us find micro-influencers in Jaipur who drove 3x more engagement than our previous national campaigns.",
    name: "Priya Sharma",
    role: "Marketing Head, StyleCraft India",
    avatar: "PS",
    gradient: "from-teal-400 to-emerald-400",
  },
  {
    quote: "As a food blogger, getting discovered by local restaurants used to be impossible. Influgal changed that overnight.",
    name: "Arjun Mehta",
    role: "Food & Travel Creator, 120K followers",
    avatar: "AM",
    gradient: "from-blue-400 to-cyan-400",
  },
  {
    quote: "The campaign analytics are a game-changer. We can see exactly which creators deliver ROI and scale our spend confidently.",
    name: "Neha Kapoor",
    role: "Brand Manager, FreshBrew Co.",
    avatar: "NK",
    gradient: "from-violet-400 to-purple-400",
  },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-24 bg-gray-50/60">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-teal-500 font-bold text-sm uppercase tracking-widest">Testimonials</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl text-gray-900 mt-3 tracking-tight">
          Loved by <span className="text-teal-500">Brands & Creators</span>
        </h2>
        <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg leading-relaxed">
          Don't take our word for it, hear from the people who use Influgal every day.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex gap-1 mb-5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={16} className="text-amber-400" fill="currentColor" />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                {t.avatar}
              </div>
              <div>
                <div className="font-display font-bold text-gray-900 text-sm">{t.name}</div>
                <div className="text-gray-400 text-xs">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
