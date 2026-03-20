import { useEffect, useState } from "react";
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
  verifiedPlatforms: string[];
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  onInstagramChange: (v: string) => void;
  onYoutubeChange: (v: string) => void;
  onTwitterChange: (v: string) => void;
  onVerified: () => void;
  onVerifiedPlatformsChange: (platforms: string[]) => void;
  onUnverified?: () => void;
  onStatsFetched?: (stats: { followers?: string; engagementRate?: string }) => void;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle", color: "text-pink-500" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@yourchannel", color: "text-red-500" },
  { id: "twitter", label: "X (Twitter)", icon: Twitter, placeholder: "https://x.com/yourhandle", color: "text-sky-500" },
] as const;

const toStoredPlatform = (platformId: string) =>
  platformId === "instagram" ? "Instagram" : platformId === "youtube" ? "YouTube" : "Twitter";

const toPlatformId = (platform: string) =>
  platform === "Instagram" ? "instagram" : platform === "YouTube" ? "youtube" : "twitter";

const SocialVerification = ({
  verificationCode,
  isVerified,
  verifiedPlatforms,
  instagramUrl,
  youtubeUrl,
  twitterUrl,
  onInstagramChange,
  onYoutubeChange,
  onTwitterChange,
  onVerified,
  onVerifiedPlatformsChange,
  onUnverified,
  onStatsFetched,
}: SocialVerificationProps) => {
  const { toast } = useToast();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifiedPlatformSet, setVerifiedPlatformSet] = useState<Set<string>>(
    () => new Set(verifiedPlatforms.map(toPlatformId))
  );

  useEffect(() => {
    setVerifiedPlatformSet(new Set(verifiedPlatforms.map(toPlatformId)));
  }, [verifiedPlatforms]);

  const urls: Record<string, string> = { instagram: instagramUrl, youtube: youtubeUrl, twitter: twitterUrl };
  const setters: Record<string, (v: string) => void> = { instagram: onInstagramChange, youtube: onYoutubeChange, twitter: onTwitterChange };

  const syncVerifiedPlatforms = (platformSet: Set<string>) => {
    const nextPlatforms = Array.from(platformSet).map(toStoredPlatform);
    setVerifiedPlatformSet(new Set(platformSet));
    onVerifiedPlatformsChange(nextPlatforms);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    toast({ title: "Copied", description: "Paste this code in your social media bio." });
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
        body: { platform: platformId, url, verificationCode },
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
        const nextVerified = new Set(verifiedPlatformSet);
        nextVerified.add(platformId);
        syncVerifiedPlatforms(nextVerified);
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

  const handleRemoveVerification = async (platformId: string) => {
    setRemoving(platformId);
    try {
      const platform = PLATFORMS.find((item) => item.id === platformId);
      if (!platform) return;

      const nextVerified = new Set(verifiedPlatformSet);
      nextVerified.delete(platformId);
      syncVerifiedPlatforms(nextVerified);
      setters[platformId]("");

      if (nextVerified.size === 0) {
        onUnverified?.();
      }

      toast({ title: "Verification removed", description: `${platform.label} verification has been removed.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not remove verification.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ShieldCheck size={20} className="text-primary" />
          Social Verification
          {isVerified && (
            <Badge className="ml-auto border-success/30 bg-success/20 text-xs text-success">
              <CheckCircle size={12} className="mr-1" /> Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <p className="mb-2 text-sm text-muted-foreground">
            Add this code to any of your social media bios, then click <strong>Verify</strong>:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground">
              {verificationCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyCode} className="shrink-0">
              {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isPlatformVerified = verifiedPlatformSet.has(platform.id);
          return (
            <div key={platform.id} className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Icon size={14} className={platform.color} /> {platform.label}
                {isPlatformVerified && (
                  <Badge className="ml-1 border-success/30 bg-success/20 px-1.5 py-0 text-[10px] text-success">
                    <CheckCircle size={10} className="mr-0.5" /> Verified
                  </Badge>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={urls[platform.id]}
                  onChange={(e) => setters[platform.id](e.target.value)}
                  placeholder={platform.placeholder}
                  className="flex-1"
                  disabled={isPlatformVerified}
                />
                {isPlatformVerified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveVerification(platform.id)}
                    disabled={removing !== null}
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {removing === platform.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(platform.id)}
                    disabled={!urls[platform.id]?.trim() || verifying !== null}
                    className="shrink-0"
                  >
                    {verifying === platform.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    Verify
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground">
          Only verified socials are shown publicly. Follower count and engagement rate can be refreshed from verified accounts.
        </p>
      </CardContent>
    </Card>
  );
};

export default SocialVerification;
