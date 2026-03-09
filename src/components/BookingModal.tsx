import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, IndianRupee, Minus, Plus, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Influencer } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BookingModalProps {
  influencer: Influencer;
  influencerUserId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookingItem {
  type: string;
  price: number;
  qty: number;
}

const BookingModal = ({ influencer, influencerUserId, open, onOpenChange }: BookingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<BookingItem[]>([
    { type: "Reel Promotion", price: influencer.priceReel, qty: 0 },
    { type: "Story Promotion", price: influencer.priceStory, qty: 0 },
    { type: "Visit & Review", price: influencer.priceVisit, qty: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "done">("select");
  const [submitting, setSubmitting] = useState(false);

  const updateQty = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, qty: Math.max(0, Math.min(10, item.qty + delta)) } : item
    ));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const selectedItems = items.filter(i => i.qty > 0);

  const handleConfirm = async () => {
    if (!user || !influencerUserId) {
      toast({ title: "Error", description: "Missing user information.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("bookings" as any).insert({
      brand_user_id: user.id,
      influencer_user_id: influencerUserId,
      influencer_profile_id: influencer.id,
      items: selectedItems.map(i => ({ type: i.type, price: i.price, qty: i.qty })),
      notes: notes.trim().slice(0, 500),
      total_amount: total,
      status: "pending",
    } as any);
    setSubmitting(false);

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
      return;
    }

    setStep("done");
    toast({ title: "Booking request sent!" });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("select");
      setItems(prev => prev.map(i => ({ ...i, qty: 0 })));
      setNotes("");
    }, 300);
  };

  const initials = influencer.name.split(" ").map(n => n[0]).join("");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {step === "done" ? "Booking Confirmed!" : `Book ${influencer.name}`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{influencer.name}</div>
                  <div className="text-xs text-muted-foreground">{influencer.city} · {influencer.niche}</div>
                </div>
              </div>

              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <div className="font-medium text-sm text-foreground">{item.type}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <IndianRupee size={11} />{item.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(i, -1)} disabled={item.qty === 0}>
                        <Minus size={14} />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold text-foreground">{item.qty}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(i, 1)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div><Label className="text-xs">Notes for the influencer</Label><Textarea placeholder="Any specific requirements..." value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 text-sm" rows={2} maxLength={500} /></div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display font-bold text-xl text-foreground flex items-center"><IndianRupee size={16} />{total.toLocaleString()}</span>
              </div>

              <Button className="w-full gradient-primary border-0 text-primary-foreground" disabled={total === 0} onClick={() => setStep("confirm")}>
                <ShoppingCart size={16} className="mr-2" /> Proceed to Book
              </Button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                {selectedItems.map(item => (
                  <div key={item.type} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.qty}x {item.type}</span>
                    <span className="font-semibold text-foreground">₹{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-display font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">₹{total.toLocaleString()}</span>
                </div>
              </div>
              {notes && <div className="p-3 rounded-lg border text-sm text-muted-foreground"><span className="font-medium text-foreground">Notes:</span> {notes}</div>}
              <p className="text-xs text-muted-foreground">Payment will be held in escrow until the influencer delivers the content and you approve it.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>Back</Button>
                <Button className="flex-1 gradient-primary border-0 text-primary-foreground" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Sending..." : "Confirm & Pay"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <Check size={32} className="text-success" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">Booking Sent!</h3>
                <p className="text-sm text-muted-foreground mt-1">{influencer.name} will review your request and respond shortly.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Amount in escrow: </span>
                <span className="font-semibold text-foreground">₹{total.toLocaleString()}</span>
              </div>
              <Button className="w-full" variant="outline" onClick={handleClose}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
