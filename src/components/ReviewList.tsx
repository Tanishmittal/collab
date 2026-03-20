import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

interface Review {
  id: string;
  campaign_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_type: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
  campaign_brand?: string;
}

interface ReviewListProps {
  userId: string;
  refreshKey?: number;
}

const ReviewList = ({ userId, refreshKey }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        ((data || []) as ReviewRow[]).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", review.reviewer_id)
            .maybeSingle();

          const { data: campaign } = await supabase
            .from("campaigns")
            .select("brand")
            .eq("id", review.campaign_id)
            .maybeSingle();

          return {
            ...review,
            reviewer_name: profile?.display_name || "Anonymous",
            campaign_brand: campaign?.brand || "Campaign",
          };
        })
      );
      setReviews(enriched);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshKey]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / reviews.length) * 100,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="glass-card md:col-span-1">
        <CardContent className="p-5 text-center">
          <div className="font-display font-bold text-4xl text-foreground">{avgRating}</div>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={i < Math.round(Number(avgRating)) ? "text-warning fill-warning" : "text-muted"} />
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</div>
          <div className="mt-4 space-y-1.5">
            {ratingDist.map((r) => (
              <div key={r.star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{r.star}</span>
                <Star size={10} className="text-warning fill-warning" />
                <Progress value={r.pct} className="h-1.5 flex-1" />
                <span className="w-4 text-muted-foreground text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                      {review.reviewer_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{review.reviewer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {review.campaign_brand} · {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} className={j < review.rating ? "text-warning fill-warning" : "text-muted"} />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
