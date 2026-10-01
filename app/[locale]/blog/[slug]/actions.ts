"use server";

import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/chat/rate-limit";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_NAME_MAX,
  type ReviewField,
  type SubmitReviewState,
} from "./state";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_REVIEWS_PER_WINDOW = 5;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Saves a pending review; it only becomes public once approved in Supabase. */
export async function submitReview(
  _previous: SubmitReviewState,
  formData: FormData,
): Promise<SubmitReviewState> {
  // Honeypot: real visitors never see this field, so report success and drop it.
  if (text(formData, "website")) return { status: "success" };

  const rawLocale = text(formData, "locale");
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;
  const slug = text(formData, "slug");
  const authorName = text(formData, "name");
  const comment = text(formData, "comment");
  const rating = Number(text(formData, "rating"));

  const fields: ReviewField[] = [];
  if (!authorName || authorName.length > REVIEW_NAME_MAX) fields.push("name");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fields.push("rating");
  if (!comment || comment.length > REVIEW_COMMENT_MAX) fields.push("comment");
  if (fields.length > 0) return { status: "error", error: "invalid", fields };

  if (!SLUG_PATTERN.test(slug)) return { status: "error", error: "not_found" };

  const limit = checkRateLimit(`review:${clientKeyFromHeaders(await headers())}`, {
    max: MAX_REVIEWS_PER_WINDOW,
  });
  if (!limit.allowed) return { status: "error", error: "rate_limited" };

  const supabase = getAdminSupabase();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (postError) {
    console.error("[reviews] Post lookup failed", postError.message, postError.code ?? "");
    return { status: "error", error: "generic" };
  }
  if (!post) return { status: "error", error: "not_found" };

  const { error } = await supabase.from("post_reviews").insert({
    post_id: post.id,
    locale,
    author_name: authorName,
    rating,
    comment,
  });

  if (error) {
    console.error("[reviews] Insert failed", error.message, error.code ?? "");
    return { status: "error", error: "generic" };
  }

  return { status: "success" };
}
