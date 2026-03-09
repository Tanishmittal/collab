import { useState } from "react";
import { Instagram, Youtube, Twitter, Loader2, Copy, CheckCircle, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SocialVerificationProps {
  verificationCode: string;
  isVerified: boolean;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  onInstagramChange: (v: string) => void;
  onYoutubeChange: (v: string) => void;
  onTwitterChange: (v: string) => void;
  onVerified: () => void;
  onUnverified?: () => void;
  onStatsFetched?: (stats: { followers?: string; engagementRate?: string }) => void;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle", color: "text-pink-500", urlKey: "instagram_url" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@yourchannel", color: "text-red-500", urlKey: "youtube_url" },
  { id: "twitter", label: "X (Twitter)", icon: Twitter, placeholder: "https://x.com/yourhandle", color: "text-sky-500", urlKey: "twitter_url" },
];

const SocialVerification = ({
  verificationCode,
  isVerified,
  instagramUrl,
  youtubeUrl,
  twitterUrl,
  onInstagramChange,
  onYoutubeChange,
  onTwitterChange,
  onVerified,
  onUnverified,
  onStatsFetched,
}: SocialVerificationProps) => {
  const { toast } = useToast();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (isVerified) {
      if (instagramUrl?.trim()) initial.add("instagram");
      if (youtubeUrl?.trim()) initial.add("youtube");
      if (twitterUrl?.trim()) initial.add("twitter");
    }
    return initial;
  });

  const urls: Record<string, string> = { instagram: instagramUrl, youtube: youtubeUrl, twitter: twitterUrl };
  const setters: Record<string, (v: string) => void> = { instagram: onInstagramChange, youtube: onYoutubeChange, twitter: onTwitterChange };

  const copyCode = async () => {
    await navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Paste this code in your social media bio." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (platformId: string) => {
    const url = urls[platformId]?.trim();
    if (!url) {
      toast({ title: "Enter URL first", description: "Please enter your profile URL before verifying.", variant: "destructive" });
      return;
    }

    setVerifying(platformId);
    try {
      const { data, error } = await supabase.functions.invoke("verify-social", {
        body: { platform: platformId, url },
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
        });
      }

      if (data.verified) {
        setVerifiedPlatforms(prev => new Set(prev).add(platformId));
        toast({ title: "✅ Verified!", description: `Your account has been verified!${data.stats?.followers ? ` Followers: ${data.stats.followers}` : ""}` });
        onVerified();
      } else {
        toast({
          title: "Code not found",
          description: data.message || "Make sure the code is in your bio and your profile is public.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message || "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setVerifying(null);
    }
  };

  const handleRemoveVerification = async (platformId: string) => {
    setRemoving(platformId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const platform = PLATFORMS.find(p => p.id === platformId);
      if (!platform) return;

      // Clear the URL and unverify
      const updateData: Record<string, any> = { [platform.urlKey]: null };

      // Check if any other platforms remain verified
      const newVerified = new Set(verifiedPlatforms);
      newVerified.delete(platformId);

      // If no platforms remain verified, unset is_verified and clear stats
      if (newVerified.size === 0) {
        updateData.is_verified = false;
        updateData.followers = "";
        updateData.engagement_rate = null;
      }

      await supabase
        .from("influencer_profiles")
        .update(updateData)
        .eq("user_id", user.id);

      setVerifiedPlatforms(newVerified);
      setters[platformId]("");

      if (newVerified.size === 0) {
        onUnverified?.();
      }

      toast({ title: "Verification removed", description: `${platform.label} verification has been removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not remove verification.", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" />
          Social Verification
          {isVerified && (
            <Badge className="bg-success/20 text-success border-success/30 text-xs ml-auto">
              <CheckCircle size={12} className="mr-1" /> Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Code */}
        <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-2">
            Add this code to any of your social media bios, then click <strong>Verify</strong>:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background px-3 py-2 rounded-lg font-mono text-sm text-foreground border border-border">
              {verificationCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyCode} className="shrink-0">
              {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Platform URLs */}
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const isPlatformVerified = verifiedPlatforms.has(p.id);
          return (
            <div key={p.id} className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Icon size={14} className={p.color} /> {p.label}
                {isPlatformVerified && (
                  <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-1.5 py-0 ml-1">
                    <CheckCircle size={10} className="mr-0.5" /> Verified
                  </Badge>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={urls[p.id]}
                  onChange={(e) => setters[p.id](e.target.value)}
                  placeholder={p.placeholder}
                  className="flex-1"
                  disabled={isPlatformVerified}
                />
                {isPlatformVerified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveVerification(p.id)}
                    disabled={removing !== null}
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {removing === p.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(p.id)}
                    disabled={!urls[p.id]?.trim() || verifying !== null}
                    className="shrink-0"
                  >
                    {verifying === p.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    Verify
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground">
          Your social URLs are kept private. Only verified badges are shown publicly. Use <strong>Stats</strong> to auto-fill follower count & engagement rate from Instagram.
        </p>
      </CardContent>
    </Card>
  );
};

export default SocialVerification;
