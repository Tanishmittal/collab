import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  campaignId: string;
  revieweeId: string;
  reviewerType: "brand" | "influencer";
  revieweeName: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm = ({ campaignId, revieweeId, reviewerType, revieweeName, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      campaign_id: campaignId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      reviewer_type: reviewerType,
      rating,
      comment: comment.trim().slice(0, 500),
    });
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already reviewed", description: "You have already submitted a review for this collaboration.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Review submitted!", description: `Your review for ${revieweeName} has been posted.` });
      setRating(0);
      setComment("");
      onReviewSubmitted?.();
    }
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-4 space-y-3">
        <h4 className="font-display font-semibold text-sm text-foreground">Rate {revieweeName}</h4>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={24}
                className={`transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "text-warning fill-warning"
                    : "text-muted"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Share your experience working together..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{comment.length}/500</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="gradient-primary border-0 text-primary-foreground"
          >
            {submitting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Submitting...</> : "Submit Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
