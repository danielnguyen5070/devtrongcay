"use server";

import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "../lib/auth";
import {
  REVIEW_STATUSES,
  type AdminReviewRow,
  type ReviewStatus,
} from "../types";

function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export async function listReviews(status: ReviewStatus = "pending"): Promise<AdminReviewRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("post_reviews")
    .select(
      `id, post_id, locale, author_name, rating, comment, status, created_at,
       post:posts!inner(slug, translations:post_translations(locale, title))`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (isReviewStatus(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin] listReviews failed", error.message, error.code ?? "");
    throw new Error("Failed to load reviews.");
  }

  return (data ?? []).map((row) => {
    const post = row.post as unknown as {
      slug: string | null;
      translations: { locale: string; title: string | null }[] | null;
    } | null;
    const title =
      post?.translations?.find((t) => t.locale === row.locale)?.title ??
      post?.translations?.[0]?.title ??
      null;

    return {
      id: row.id,
      postId: row.post_id,
      postSlug: post?.slug ?? null,
      postTitle: title,
      locale: row.locale,
      authorName: row.author_name,
      rating: row.rating,
      comment: row.comment,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  await requireAdmin();
  if (!isReviewStatus(status) || status === "pending") {
    return { ok: false as const, error: "invalid_status" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_reviews")
    .update({ status })
    .eq("id", id)
    .select("post_id, posts!inner(slug)")
    .maybeSingle();

  if (error || !data) {
    console.error("[admin] updateReviewStatus failed", error?.message, error?.code ?? "");
    return { ok: false as const, error: "update_failed" };
  }

  const slug = (data.posts as unknown as { slug: string } | null)?.slug;
  if (slug) {
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/blog/${slug}`);
    }
  }

  return { ok: true as const };
}
