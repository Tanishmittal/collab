import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Instagram, Youtube, Twitter, Loader2, Copy, CheckCircle, ExternalLink, ShieldCheck, XCircle, RotateCcw, Link, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SocialVerificationProps {
  verificationCode: string; // This is the 'slug'
  isVerified: boolean;
  verifiedPlatforms: string[];
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  onInstagramChange: (v: string) => void;
  onYoutubeChange: (v: string) => void;
  onTwitterChange: (v: string) => void;
  igFollowers: string;
  ytSubscribers: string;
  twitterFollowers: string;
  onIgFollowersChange: (v: string) => void;
  onYtSubscribersChange: (v: string) => void;
  onTwitterFollowersChange: (v: string) => void;
  onVerified: () => void;
  onVerifiedPlatformsChange: (platforms: string[]) => void;
  onUnverified?: (platformId: string) => void;
  onStatsFetched?: (stats: { followers?: string; engagementRate?: string; platform?: string; totalFollowers?: number; verifiedFollowers?: number }) => void;
  onVerificationCodeChange?: (v: string) => void;
  totalFollowers?: number;
  showGuideInitial?: boolean;
  initialSlug?: string;
}

// STANDARD PLATFORMS (Sentence Case to match DB)
const PLATFORMS = [
  { id: "Instagram", label: "Instagram", icon: Instagram, placeholder: "@yourhandle", color: "text-pink-500" },
  { id: "YouTube", label: "YouTube", icon: Youtube, placeholder: "@yourchannel", color: "text-red-500" },
  { id: "Twitter", label: "X (Twitter)", icon: Twitter, placeholder: "@yourhandle", color: "text-sky-500" },
] as const;

export const SocialVerification = ({
  verificationCode,
  isVerified,
  verifiedPlatforms,
  instagramUrl,
  youtubeUrl,
  twitterUrl,
  onInstagramChange,
  onYoutubeChange,
  onTwitterChange,
  igFollowers,
  ytSubscribers,
  twitterFollowers,
  onIgFollowersChange,
  onYtSubscribersChange,
  onTwitterFollowersChange,
  onVerified,
  onVerifiedPlatformsChange,
  onUnverified,
  onStatsFetched,
  onVerificationCodeChange,
  showGuideInitial = true,
  initialSlug,
}: SocialVerificationProps) => {
  const { toast } = useToast();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(showGuideInitial);
  
  // Uniqueness validation state
  const [isValidatingSlug, setIsValidatingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"available" | "taken" | "idle" | "too-short">("idle");

  const urls: Record<string, string> = { Instagram: instagramUrl, YouTube: youtubeUrl, Twitter: twitterUrl };
  const setters: Record<string, (v: string) => void> = { Instagram: onInstagramChange, YouTube: onYoutubeChange, Twitter: onTwitterChange };
  const followerValues: Record<string, string> = { Instagram: igFollowers, YouTube: ytSubscribers, Twitter: twitterFollowers };
  const followerSetters: Record<string, (v: string) => void> = { Instagram: onIgFollowersChange, YouTube: onYtSubscribersChange, Twitter: onTwitterFollowersChange };

  // Check slug uniqueness
  const checkSlugUniqueness = useCallback(async (slug: string) => {
    if (!slug || slug.length < 4) {
      setSlugStatus(slug.length > 0 ? "too-short" : "idle");
      return;
    }
    
    // Normalize: lowercase and alphanumeric
    const sanitized = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sanitized !== slug) {
       onVerificationCodeChange?.(sanitized);
       return;
    }

    // FIX: If it already belongs to us, it's available
    if (initialSlug && sanitized === initialSlug.toLowerCase()) {
      setSlugStatus("available");
      setIsValidatingSlug(false);
      return;
    }

    setIsValidatingSlug(true);
    try {
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("verification_code")
        .eq("verification_code", sanitized)
        .maybeSingle();

      if (error) throw error;
      
      setSlugStatus(data ? "taken" : "available");
    } catch (err) {
      console.error("Error checking slug:", err);
    } finally {
      setIsValidatingSlug(false);
    }
  }, [onVerificationCodeChange, initialSlug]);

  // Debounce slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkSlugUniqueness(verificationCode);
    }, 500);
    return () => clearTimeout(timer);
  }, [verificationCode, checkSlugUniqueness]);

  const copyCode = async () => {
    const fullString = `Collab: Influgal.com/${verificationCode}`;
    await navigator.clipboard.writeText(fullString);
    setCopied(true);
    toast({ title: "Copied", description: "Verification string copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (platformId: string) => {
    const socialUrl = urls[platformId]?.trim();
    if (!socialUrl) {
      toast({ title: "Enter Username", description: "Please enter your social media handle before verifying.", variant: "destructive" });
      return;
    }

    setVerifying(platformId);
    try {
      const { data, error } = await supabase.functions.invoke("social-service-apify", {
        body: {
          platform: platformId.toLowerCase(), // scraper expects lowercase
          url: socialUrl,
          verificationCode: verificationCode,
          action: "verify"
        },
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: data?.error || "Could not verify. Make sure the URL is correct and your profile is public.",
          variant: "destructive",
        });
        return;
      }

      if (data.stats) {
        onStatsFetched?.({
          followers: data.stats.followers,
          engagementRate: data.stats.engagement_rate,
          platform: platformId,
        });
      }

      if (data.verified) {
        const nextPlatforms = [...new Set([...verifiedPlatforms, platformId])];
        onVerifiedPlatformsChange(nextPlatforms);
        toast({
          title: "Verified",
          description: `Your account has been verified.${data.stats?.followers ? ` Followers: ${data.stats.followers}` : ""}`,
        });
        onVerified();
      } else {
        toast({
          title: "Code not found",
          description: data.message || "Make sure the code is in your bio and your profile is public.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      toast({ title: "Verification failed", description: message, variant: "destructive" });
    } finally {
      setVerifying(null);
    }
  };

  const handleRemoveVerification = (platformId: string) => {
    setRemoving(platformId);
    const nextPlatforms = verifiedPlatforms.filter(p => p !== platformId);
    onVerifiedPlatformsChange(nextPlatforms);
    setters[platformId]("");
    
    if (nextPlatforms.length === 0) {
      onUnverified?.(platformId);
    }
    
    toast({ title: "Verification removed", description: `${platformId} verification has been removed.` });
    setRemoving(null);
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      {/* 1. LINK / USERNAME BOX */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-3 sm:rounded-3xl sm:p-8">
        <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-orange-100 text-orange-600 shadow-sm border border-orange-200/50 flex-shrink-0">
            <Link className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">Branded Verification</h4>
            <p className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest truncate">Influgal Link</p>
          </div>
          {isVerified && (
            <Badge className="ml-auto border-success/30 bg-success/20 text-[10px] text-success hidden sm:flex">
              <CheckCircle size={10} className="mr-1" /> Profile Verified
            </Badge>
          )}
        </div>

        <div className="relative mb-3">
          <div className={cn(
            "flex items-center rounded-xl sm:rounded-2xl border bg-white px-2 sm:px-5 shadow-sm ring-offset-white transition-all focus-within:ring-2 focus-within:ring-slate-950/5",
            slugStatus === "taken" ? "border-red-300 focus-within:border-red-400" : "border-slate-200 focus-within:border-slate-400"
          )}>
            <span className="text-[8px] sm:text-[10px] font-black tracking-tighter text-slate-400 select-none whitespace-nowrap sm:tracking-widest">
              <span className="hidden xs:inline">COLLAB: </span>INFLUGAL.COM/
            </span>
            <input
              type="text"
              id="verification-slug"
              value={verificationCode}
              onChange={(e) => onVerificationCodeChange?.(e.target.value)}
              placeholder="USERNAME"
              className="flex-1 min-w-0 bg-transparent py-3 pl-1 text-sm font-bold tracking-tight text-slate-800 placeholder:text-slate-300 focus:outline-none sm:py-5 sm:pl-2 sm:text-xl"
            />
            {isValidatingSlug ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-slate-400" />
            ) : slugStatus === "available" ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
            ) : slugStatus === "taken" ? (
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            ) : slugStatus === "too-short" ? (
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            ) : null}
          </div>
        </div>
        
        <AnimatePresence>
          {slugStatus === "taken" && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-1 mb-4 flex items-center gap-1 text-[10px] font-bold text-red-500 sm:text-xs"
            >
              <AlertTriangle size={12} /> This handle is already taken.
            </motion.p>
          )}
          {slugStatus === "too-short" && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-1 mb-4 flex items-center gap-1 text-[10px] font-bold text-amber-600 sm:text-xs"
            >
              <AlertCircle size={12} /> Minimum 4 characters required.
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-800 shadow-sm transition-all active:scale-[0.98]"
            onClick={copyCode}
          >
            <Copy className="mr-2 h-5 w-5" />
            {copied ? "Copied!" : "Copy string"}
          </Button>
        </div>
      </div>

      {/* 2. GUIDE BOX */}
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50 transition-all">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between p-4 text-left focus:outline-none"
        >
          <h5 className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <Info className="h-3.5 w-3.5" />
            How to verify
          </h5>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            {showGuide ? "Hide" : "Show"}
          </span>
        </button>
        {showGuide && (
          <div className="px-4 pb-4">
            <ol className="ml-3 list-decimal space-y-1.5 text-[11px] leading-relaxed text-blue-800 font-medium">
              <li>Copy your professional link above</li>
              <li>Paste it into your Instagram, YouTube, or X bio</li>
              <li>Click "Verify" on the platforms below</li>
            </ol>
          </div>
        )}
      </div>

      {/* 3. PLATFORMS BOX */}
      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isPlatformVerified = verifiedPlatforms.includes(platform.id);
          return (
            <div key={platform.id} className="space-y-1.5">
              <Label className="flex items-center gap-1.5 font-bold text-slate-700">
                <Icon size={14} className={platform.color} /> {platform.label}
                {isPlatformVerified && (
                  <Badge className="border-success/30 bg-success/20 px-1.5 py-0 text-[10px] text-success ml-1">
                    <CheckCircle size={10} className="mr-0.5" /> Verified
                  </Badge>
                )}
              </Label>
              <div className="flex flex-row gap-1.5 sm:gap-3 pt-2 w-full">
                <div className="flex-1 min-w-0 relative">
                  <div className={cn(
                    "absolute left-3 top-0 z-10 -translate-y-1/2 px-1 text-[8px] font-bold uppercase tracking-wider transition-colors bg-white",
                    isPlatformVerified ? "text-emerald-500" : "text-slate-400"
                  )}>
                    Username
                  </div>
                  <Input
                    value={urls[platform.id]}
                    onChange={(e) => setters[platform.id](e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full rounded-xl border-slate-200 h-10 sm:h-12 font-medium px-2 sm:px-3 text-xs sm:text-sm bg-white"
                    disabled={isPlatformVerified}
                  />
                </div>
                <div className="w-16 sm:w-32 relative flex-shrink-0">
                  <div className={cn(
                    "absolute left-2 sm:left-3 top-0 z-10 -translate-y-1/2 px-1 text-[8px] font-bold uppercase tracking-wider transition-colors bg-white",
                    isPlatformVerified ? "text-emerald-500" : "text-slate-400"
                  )}>
                    Followers
                  </div>
                  <Input
                    type="number"
                    value={followerValues[platform.id]}
                    onChange={(e) => followerSetters[platform.id](e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border-slate-200 h-10 sm:h-12 font-bold px-2 sm:px-3 text-xs sm:text-sm bg-white"
                    disabled={isPlatformVerified}
                  />
                </div>
                {isPlatformVerified ? (
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(platform.id)}
                      disabled={verifying !== null}
                      className="h-10 sm:h-12 w-10 sm:w-12 rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50 p-0"
                    >
                      {verifying === platform.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveVerification(platform.id)}
                      disabled={removing !== null}
                      className="h-10 sm:h-12 w-10 sm:w-12 rounded-xl border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 p-0"
                    >
                      {removing === platform.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleVerify(platform.id)}
                    disabled={!urls[platform.id]?.trim() || verifying !== null}
                    className="h-10 sm:h-12 px-3 sm:px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex-shrink-0 border-none"
                  >
                    {verifying === platform.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-[11px] font-medium text-slate-400 italic">
        Verified socials are automatically updated with real-time metrics. Unverified platform metrics must be updated manually.
      </p>
    </div>
  );
};

