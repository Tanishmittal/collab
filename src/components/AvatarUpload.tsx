import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  initials: string;
  onUploaded: (url: string) => void;
  size?: "md" | "lg";
}

const AvatarUpload = ({ userId, currentUrl, initials, onUploaded, size = "lg" }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClass = size === "lg" ? "w-24 h-24 text-3xl" : "w-14 h-14 text-lg";
  const iconSize = size === "lg" ? 20 : 14;

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

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <Avatar className={`${sizeClass} ring-4 ring-card shadow-xl`}>
        {previewUrl ? (
          <AvatarImage src={previewUrl} alt="Profile photo" className="object-cover" />
        ) : null}
        <AvatarFallback className="gradient-primary text-primary-foreground font-display font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 size={iconSize} className="text-background animate-spin" />
        ) : (
          <Camera size={iconSize} className="text-background" />
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
    </div>
  );
};

export default AvatarUpload;
