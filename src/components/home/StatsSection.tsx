import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const stats = [
  { value: 500, suffix: "+", label: "Active Creators", color: "text-teal-500" },
  { value: 2, suffix: "M+", prefix: "₹", label: "Campaign Value", color: "text-blue-500" },
  { value: 50, suffix: "+", label: "Cities Covered", color: "text-violet-500" },
  { value: 4.8, suffix: "★", label: "Avg. Rating", color: "text-amber-500", isDecimal: true },
];

const AnimatedNumber = ({ value, suffix = "", prefix = "", isDecimal = false }: { value: number; suffix?: string; prefix?: string; isDecimal?: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const start = Date.now();
    const step = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(isDecimal ? parseFloat((eased * value).toFixed(1)) : Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value, isDecimal]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
};

const StatsSection = () => (
  <section className="py-20 bg-gray-900 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.08),transparent_70%)]" />
    <div className="container relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <div className={`font-display font-black text-4xl md:text-5xl ${s.color}`}>
              <AnimatedNumber value={s.value} suffix={s.suffix} prefix={s.prefix || ""} isDecimal={s.isDecimal || false} />
            </div>
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
