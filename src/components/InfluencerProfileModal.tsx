import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Star, Video, Image as ImageIcon, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InfluencerProfileModalProps {
  profile: any;
  children: React.ReactNode;
}

export default function InfluencerProfileModal({ profile, children }: InfluencerProfileModalProps) {
  const [open, setOpen] = useState(false);

  if (!profile) return <>{children}</>;

  const initials = profile.name?.split(" ").map((n: string) => n[0]).join("") || "?";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="font-semibold text-foreground hover:text-primary transition-colors text-sm text-left underline underline-offset-4 decoration-muted hover:decoration-primary">
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Influencer Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-28 h-28 relative overflow-hidden rounded-[1.5rem] ring-4 ring-muted shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold">
                 {initials}
               </div>
            )}
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold">{profile.name}</h3>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
              {profile.city && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city}</span>}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">{profile.niche}</Badge>
            {profile.is_verified && <Badge variant="default">Verified</Badge>}
          </div>

          <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center">
            <div className="bg-muted/50 p-3 rounded-lg">
              <Users size={16} className="mx-auto mb-1 text-muted-foreground" />
              <div className="font-semibold">{profile.followers || "N/A"}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Followers</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <Star size={16} className="mx-auto mb-1 text-muted-foreground" />
              <div className="font-semibold">{profile.rating || "N/A"}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Rating</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-base font-bold mb-1 text-muted-foreground">%</div>
              <div className="font-semibold">{profile.engagement_rate || "N/A"}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Engagement</div>
            </div>
          </div>

          {profile.bio && (
            <div className="w-full mt-2">
              <h4 className="text-sm font-semibold mb-1">About</h4>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          <div className="w-full mt-2">
            <h4 className="text-sm font-semibold mb-2">Pricing</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 border rounded-md bg-card">
                <Video size={14} className="mb-1" />
                <span className="text-xs font-medium">₹{profile.price_reel || 0}</span>
                <span className="text-[10px] text-muted-foreground">Reel</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded-md bg-card">
                <ImageIcon size={14} className="mb-1" />
                <span className="text-xs font-medium">₹{profile.price_story || 0}</span>
                <span className="text-[10px] text-muted-foreground">Story</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded-md bg-card">
                <Store size={14} className="mb-1" />
                <span className="text-xs font-medium">₹{profile.price_visit || 0}</span>
                <span className="text-[10px] text-muted-foreground">Visit</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
