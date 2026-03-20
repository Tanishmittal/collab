import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PortfolioMediaUploadProps {
  userId: string;
  itemId: string;
  kind: "media" | "thumbnail";
  mediaType: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

const isVideoLike = (url?: string | null, mediaType?: string) => {
  const cleanUrl = url?.split("?")[0].toLowerCase() || "";

  if (/\.(mp4|mov|webm|m4v|avi|mkv)$/.test(cleanUrl)) {
    return true;
  }

  return !!mediaType && ["video", "reel", "story"].includes(mediaType);
};

const PortfolioMediaUpload = ({
  userId,
  itemId,
  kind,
  mediaType,
  currentUrl,
  onUploaded,
}: PortfolioMediaUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const acceptsVideo = kind === "media" && (mediaType === "auto" || ["video", "reel", "story"].includes(mediaType));
  const accept = acceptsVideo ? "image/*,video/*" : "image/*";

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isAllowed =
      file.type.startsWith("image/") || (acceptsVideo && file.type.startsWith("video/"));

    if (!isAllowed) {
      toast({
        title: "Invalid file",
        description: acceptsVideo ? "Upload an image or video file." : "Upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: file.type.startsWith("video/") ? "Video max size is 50MB." : "Image max size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const extension = file.name.split(".").pop() || "bin";
    const path = `${userId}/${itemId}/${kind}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from("portfolio-media").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio-media").getPublicUrl(path);

    const urlWithCache = `${publicUrl}?t=${Date.now()}`;
    onUploaded(urlWithCache);
    setUploading(false);
    toast({ title: kind === "media" ? "Media uploaded" : "Thumbnail uploaded" });
  };

  const preview = currentUrl ? currentUrl.split("?")[0] : null;
  const previewIsVideo = kind === "media" && isVideoLike(currentUrl, mediaType);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center p-4 text-left transition-colors hover:bg-slate-100"
        >
          <div className="flex w-full items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              {acceptsVideo ? <Film size={22} /> : <ImagePlus size={22} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">
                {kind === "media" ? "Upload portfolio media" : "Upload thumbnail"}
              </div>
              <div className="text-xs text-slate-500">
                {acceptsVideo ? "Image or video supported" : "Image supported"}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span>{uploading ? "Uploading" : "Choose file"}</span>
            </div>
          </div>
        </button>

        {preview && (
          <div className="border-t border-slate-200 bg-white p-3">
            {previewIsVideo ? (
              <video src={currentUrl || undefined} className="max-h-56 w-full rounded-xl bg-black object-cover" controls playsInline />
            ) : (
              <img src={currentUrl || undefined} alt="Portfolio preview" className="max-h-56 w-full rounded-xl object-cover" />
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleUpload} disabled={uploading} />
    </div>
  );
};

export default PortfolioMediaUpload;
