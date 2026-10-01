import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isAuthorized } from "@/lib/webhook-auth";

const NO_STORE = { "Cache-Control": "no-store" };

type ReviewRow = { post_id: string; status: string };

function reviewRow(value: unknown): ReviewRow | null {
  if (!value || typeof value !== "object") return null;
  const { post_id, status } = value as Record<string, unknown>;
  return typeof post_id === "string" && typeof status === "string" ? { post_id, status } : null;
}

/**
 * Called by the Supabase Database Webhook on post_reviews (UPDATE, DELETE).
 * Re-renders the post pages whenever an approved review appears, changes or
 * disappears; pending and rejected reviews are never shown, so they are ignored.
 */
export async function POST(request: Request) {
  const secret = process.env.REVIEWS_REVALIDATE_SECRET?.trim();
  if (!secret) {
    console.error("[reviews] REVIEWS_REVALIDATE_SECRET is not set; revalidate requests are rejected.");
    return Response.json({ error: "revalidate_disabled" }, { status: 503, headers: NO_STORE });
  }

  if (!isAuthorized(request, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400, headers: NO_STORE });
  }

  const { record, old_record: oldRecord } = (payload ?? {}) as Record<string, unknown>;
  const rows = [reviewRow(record), reviewRow(oldRecord)].filter(
    (row): row is ReviewRow => row !== null,
  );

  if (!rows.some((row) => row.status === "approved")) {
    return Response.json({ revalidated: [] }, { headers: NO_STORE });
  }

  const postIds = [...new Set(rows.map((row) => row.post_id))];
  const { data, error } = await getAdminSupabase()
    .from("posts")
    .select("slug")
    .in("id", postIds);

  if (error) {
    console.error("[reviews] Post lookup failed", error.message, error.code ?? "");
    return Response.json({ error: "lookup_failed" }, { status: 500, headers: NO_STORE });
  }

  const paths = data.flatMap((post) =>
    routing.locales.map((locale) => `/${locale}/blog/${post.slug}`),
  );
  for (const path of paths) revalidatePath(path);

  return Response.json({ revalidated: paths }, { headers: NO_STORE });
}
