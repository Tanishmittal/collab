import StarField from "@/components/ui/StarField";

interface AppSplashProps {
  title?: string;
  subtitle?: string;
}

const AppSplash = ({
  title = "Influgal",
  subtitle = "Loading your workspace",
}: AppSplashProps) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060816] px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(45,212,191,0.16),_transparent_28%),linear-gradient(180deg,_#0a1022_0%,_#060816_100%)]" />
      <StarField className="opacity-80" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center">
          <img
            src="/influgal_icon.png"
            alt="Influgal"
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

        <div className="mt-8 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};

export default AppSplash;
