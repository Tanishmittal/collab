import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  initials: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  size?: "md" | "lg";
}

const AvatarUpload = ({ userId, currentUrl, initials, onUploaded, onRemove, size = "lg" }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClass = size === "lg" ? "w-44 h-44 text-4xl" : "w-16 h-16 text-xl";
  const iconSize = size === "lg" ? 24 : 16;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const urlWithCache = `${publicUrl}?t=${Date.now()}`;
    setPreviewUrl(urlWithCache);
    onUploaded(urlWithCache);
    setUploading(false);
    toast({ title: "Photo updated!" });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onRemove?.();
    toast({ title: "Photo removed" });
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <div className={`${sizeClass} relative rounded-lg overflow-hidden ring-4 ring-card shadow-xl`}>
        {previewUrl ? (
          <div className="w-full h-full rounded-lg overflow-hidden bg-muted border border-muted">
            <img
              src={previewUrl}
              alt="Profile photo"
              className="w-full h-full object-cover object-center"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-primary text-primary-foreground font-display font-bold">
            {initials}
          </div>
        )}
      </div>
      <div className="absolute inset-0 rounded-lg bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 size={iconSize} className="text-background animate-spin" />
        ) : (
          <div className="flex gap-2">
            <Camera size={iconSize} className="text-background" />
            {previewUrl && (
              <X
                size={iconSize}
                className="text-background hover:text-destructive transition-colors"
                onClick={handleRemove}
              />
            )}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
    </div>
  );
};

export default AvatarUpload;
