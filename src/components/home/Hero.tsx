import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  Instagram,
  Twitter,
  Youtube,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

/* ───────────────────────── Star Field ───────────────────────── */
const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const stars = Array.from({ length: 250 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      opacity: Math.random() * 0.8 + 0.2,
      speed: 0.2 + Math.random() * 1.5,
      twinkleSpeed: 0.001 + Math.random() * 0.005,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const twinkle = Math.abs(Math.sin(Date.now() * s.twinkleSpeed));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * twinkle})`;
        ctx.shadowBlur = 4 * twinkle;
        ctx.shadowColor = "white";
        ctx.fill();
        ctx.shadowBlur = 0;
        s.y -= s.speed;
        if (s.y < 0) {
          s.y = canvas.height;
          s.x = Math.random() * canvas.width;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-70" />;
};

/* ───────────────────────── Glow Orb ───────────────────────── */
const GlowOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div
    className={`absolute rounded-full mix-blend-screen filter blur-[100px] animate-pulse ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

/* ───────────────────────── Influencer Data ───────────────────────── */
const influencers = [
  {
    name: "Sasha V.",
    niche: "High-Fashion & Tech",
    reach: "2.4M",
    engagement: "8.2%",
    color: "from-purple-500",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Marcus Chen",
    niche: "Urban Lifestyle",
    reach: "850K",
    engagement: "12.4%",
    color: "from-indigo-500",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Elena Rossi",
    niche: "Adventure Travel",
    reach: "1.2M",
    engagement: "9.1%",
    color: "from-pink-500",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Jordan Lee",
    niche: "Fitness & Biohacking",
    reach: "3.1M",
    engagement: "6.8%",
    color: "from-emerald-500",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  },
];

/* ───────────────────────── Hero Component ───────────────────────── */
const Hero = () => {
  const navigate = useNavigate();
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const reelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused || showFilters) return;
    const interval = setInterval(() => {
      if (reelContainerRef.current) {
        const next = (activeReelIndex + 1) % influencers.length;
        reelContainerRef.current.scrollTo({
          top: next * reelContainerRef.current.offsetHeight,
          behavior: "smooth",
        });
        setActiveReelIndex(next);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeReelIndex, isPaused, showFilters]);

  const handleManualScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const idx = Math.round(container.scrollTop / container.offsetHeight);
    if (idx !== activeReelIndex) setActiveReelIndex(idx);
  };

  return (
    <section className="relative overflow-hidden bg-[#050505] text-white">
      <StarField />

      <main className="relative min-h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12 md:py-16">
        <GlowOrb className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-600/20 -top-20 -left-20" delay={0} />
        <GlowOrb className="w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-purple-600/20 top-1/2 -right-20" delay={2} />

        <div className="max-w-7xl w-full mx-auto relative z-10 py-12 md:py-0">

          {/* ── Two-Column Layout ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in-up">
                <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                <span className="text-[10px] md:text-xs font-medium tracking-wider text-gray-300 uppercase">Discover the Elite 1%</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] md:leading-[1] mb-6 md:mb-8">
                The World's <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-400">Deepest Talent</span>
                <br />Pool.
              </h1>

              <p className="text-gray-400 text-base md:text-xl max-w-lg mb-8 md:mb-12 leading-relaxed">
                Connect with influencers who don't just post — they command attention. Our deep-reel technology lets you vet style, vibe, and metrics in seconds.
              </p>

              <div className="flex flex-wrap items-center gap-6 xl:gap-8 w-full mt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <button
                    className="w-full sm:w-auto group relative px-8 py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 overflow-hidden transition-all hover:bg-teal-50 shadow-xl shadow-white/10 shrink-0"
                    onClick={() => navigate("/auth")}
                  >
                    Launch Campaign
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/20 backdrop-blur-md shadow-lg shrink-0"
                    onClick={() => navigate("/auth")}
                  >
                    Join as Influencer
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex -space-x-3 shrink-0">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#050505] bg-gray-800 overflow-hidden relative z-10 transition-transform hover:z-20 hover:scale-110">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] md:text-sm font-semibold text-teal-400 whitespace-nowrap">
                    +2.4k active creators
                  </span>
                </div>
              </div>
            </div>

            {/* Deep Reel */}
            <div className="relative h-[450px] sm:h-[550px] md:h-[650px] w-full max-w-[400px] md:max-w-[450px] mx-auto mt-12 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent blur-[80px] md:blur-[100px] opacity-30 rounded-full" />

              <div
                ref={reelContainerRef}
                onScroll={handleManualScroll}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-sm"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {influencers.map((inf, idx) => (
                  <div key={idx} className="h-full w-full snap-start relative flex items-center justify-center p-4 md:p-6">
                    <div className={`relative w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group transition-all duration-700 ease-out ${activeReelIndex === idx ? "scale-100 opacity-100" : "scale-90 opacity-40 blur-sm"}`}>
                      <img src={inf.img} alt={inf.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                          <div className={`h-1 w-6 md:w-8 rounded-full bg-gradient-to-r ${inf.color} to-white`} />
                          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/80">{inf.niche}</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mb-1 text-white">{inf.name}</h3>

                        <div className="flex gap-4 md:gap-6 mt-4 md:mt-6">
                          <div>
                            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5 md:mb-1">Followers</p>
                            <p className="text-lg md:text-xl font-bold text-white">{inf.reach}</p>
                          </div>
                          <div className="h-8 md:h-10 w-[1px] bg-white/10" />
                          <div>
                            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5 md:mb-1">Engagement</p>
                            <p className="text-lg md:text-xl font-bold text-white">{inf.engagement}</p>
                          </div>
                        </div>

                        <button className="mt-6 md:mt-8 w-full py-2.5 md:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-bold text-[11px] md:text-sm hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 text-white">
                          View Deep Insights <ExternalLink size={14} />
                        </button>
                      </div>

                      <div className="absolute top-4 md:top-6 right-4 md:right-6 flex flex-col gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white"><Instagram size={16} /></div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white"><Twitter size={16} /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scroll dots */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                {influencers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      reelContainerRef.current?.scrollTo({ top: idx * (reelContainerRef.current?.offsetHeight || 0), behavior: "smooth" });
                      setActiveReelIndex(idx);
                    }}
                    className={`w-1 transition-all duration-300 rounded-full ${activeReelIndex === idx ? "h-6 md:h-8 bg-teal-500 shadow-[0_0_10px_#14b8a6]" : "h-1.5 md:h-2 bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>

              {/* Feed label */}
              <div className="absolute -bottom-10 lg:-bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Live Talent Feed</span>
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="w-1 h-1 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1 h-1 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
                <ChevronDown size={14} className="text-gray-600 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Inline Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; }
        select option { background-color: #050505; color: white; }
      `}} />
    </section>
  );
};

export default Hero;
