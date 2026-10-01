import "server-only";
import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { PostReviewSummary } from "@/types/blog";

/** Approved reviews of a published post, from every locale, newest first. */
export const getApprovedReviews = cache(
  async (postId: string): Promise<PostReviewSummary> => {
    const { data, error } = await getPublicSupabase()
      .from("post_reviews")
      .select("id, author_name, rating, comment, created_at")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`[reviews] Failed to load reviews: ${error.message}`, error.code ?? "");
      throw new Error("Failed to load reviews.");
    }

    const reviews = data.map((row) => ({
      id: row.id,
      authorName: row.author_name,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
    }));
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
      reviews,
      count: reviews.length,
      average: reviews.length > 0 ? Math.round((total / reviews.length) * 10) / 10 : 0,
    };
  },
);
