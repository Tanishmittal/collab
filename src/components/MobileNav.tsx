import { Link, useLocation } from "react-router-dom";
import { Home, Search, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

const MobileNav = () => {
  const location = useLocation();
  const [scrollInfo, setScrollInfo] = useState({ pos: 0, vel: 0 });
  const lastScrollPos = useRef(0);
  const lastTime = useRef(Date.now());
  const smoothedVelocity = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const currentTime = Date.now();
      const deltaTime = Math.max(1, currentTime - lastTime.current);

      const currentVelocity = (currentScroll - lastScrollPos.current) / deltaTime;
      // Exponential smoothing for the velocity to create a "fluid" feel
      smoothedVelocity.current = smoothedVelocity.current * 0.92 + currentVelocity * 0.08;

      setScrollInfo({
        pos: currentScroll,
        vel: smoothedVelocity.current
      });

      lastScrollPos.current = currentScroll;
      lastTime.current = currentTime;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Explorer", icon: Search, path: "/campaigns" },
    { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
  ];

  // Dynamic distortion parameters
  // The scale increases with velocity, but has a high base for "Wow" factor
  const baseScale = 90; // Optimized from 165 to prevent clipping
  const velocityScale = Math.min(80, Math.abs(scrollInfo.vel) * 300);
  const totalScale = -(baseScale + velocityScale); // Negative for refractive look

  // The turbulence offset combines the absolute position with a velocity-based "slosh"
  const turbOffset = (scrollInfo.pos * 0.15) + (scrollInfo.vel * 20);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[25] flex justify-center px-4 md:hidden pb-[var(--safe-area-bottom)]">
      <div
        className="relative flex items-center justify-center overflow-hidden transition-all duration-[400ms] ease-out px-2"
        style={{
          width: "auto",
          height: "64px",
          borderRadius: "32px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: `blur(16px) saturate(2) url("#liquid-oily-filter")`,
          willChange: "backdrop-filter",
          boxShadow: `
            rgba(255, 255, 255, 0.25) 0px 0px 0px 0.5px inset,
            rgba(0, 0, 0, 0.2) 0px 10px 30px -10px,
            rgba(20, 184, 166, 0.1) 0px 0px 20px 0px
          `,
        }}
      >
        {/* High-Intensity Liquid Oily Filter SVG */}
        <svg className="absolute invisible w-0 h-0">
          <defs>
            <filter id="liquid-oily-filter" colorInterpolationFilters="sRGB" x="-100%" y="-100%" width="300%" height="300%">
              {/* Large, slow, oily turbulence blobs */}
              <feTurbulence
                type="turbulence"
                baseFrequency="0.012 0.04"
                numOctaves="2"
                seed="5"
                result="noise"
              >
                <animate
                  attributeName="seed"
                  from="5" to="50"
                  dur="60s"
                  repeatCount="indefinite"
                />
              </feTurbulence>

              {/* Offset the noise map based on scroll + slosh velocity */}
              <feOffset in="noise" dy={turbOffset} result="offsetNoise" />

              {/* Boost contrast of noise to make "thicker" liquid edges */}
              <feComponentTransfer in="offsetNoise" result="highContrastNoise">
                <feFuncR type="gamma" amplitude="2.2" exponent="0.6" offset="0" />
                <feFuncG type="gamma" amplitude="2.2" exponent="0.6" offset="0" />
              </feComponentTransfer>

              {/* Internal Oily Sheen - Makes effect visible on solid backgrounds */}
              <feSpecularLighting surfaceScale="5" specularConstant="1.2" specularExponent="35" lightingColor="#ffffff" in="highContrastNoise" result="sheen">
                <feDistantLight azimuth="45" elevation="45" />
              </feSpecularLighting>
              <feComposite in="sheen" in2="SourceGraphic" operator="arithmetic" k1="0" k2="0.15" k3="1" k4="0" result="sheenLit" />

              {/* Aggressive Displacement for "Wow" warping */}
              <feDisplacementMap
                in="sheenLit"
                in2="highContrastNoise"
                scale={totalScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="warped"
              />

              {/* Chromatic Aberration built into the warp */}
              <feDisplacementMap
                in="sheenLit"
                in2="highContrastNoise"
                scale={totalScale * 1.3}
                xChannelSelector="R"
                yChannelSelector="G"
                result="warpedRed"
              />
              <feDisplacementMap
                in="sheenLit"
                in2="highContrastNoise"
                scale={totalScale * 0.7}
                xChannelSelector="R"
                yChannelSelector="G"
                result="warpedBlue"
              />

              <feColorMatrix in="warpedRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
              <feColorMatrix in="warped" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
              <feColorMatrix in="warpedBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />

              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="chromatic" />

              <feGaussianBlur in="chromatic" stdDeviation="0.3" />
            </filter>
          </defs>
        </svg>

        <div className="flex items-center justify-center gap-1 z-10 px-2 h-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-14 h-12 transition-all active:scale-90"
              >
                <span className={cn(
                  "relative z-10 transition-colors duration-300",
                  isActive ? "text-teal-400" : "text-white/60 hover:text-white"
                )}>
                  <item.icon className={cn("h-6 w-6 transition-transform duration-300", isActive && "scale-110")} />
                </span>
                {isActive && (
                  <div
                    className="absolute -bottom-1 h-1 w-6 rounded-full bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.8)]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
