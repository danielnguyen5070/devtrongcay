import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { SYNC_MAX_JOBS_PER_RUN } from "@/lib/rag/config";
import { processQueue } from "@/lib/rag/indexer";

export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

function isAuthorized(request: Request, secret: string) {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Called by the Supabase Database Webhook on rag_index_queue (and optionally
 * pg_cron). Responds immediately; the queue is drained after the response.
 */
export async function POST(request: Request) {
  const secret = process.env.RAG_SYNC_SECRET?.trim();
  if (!secret) {
    console.error("[rag] RAG_SYNC_SECRET is not set; sync requests are rejected.");
    return Response.json({ error: "sync_disabled" }, { status: 503, headers: NO_STORE });
  }

  if (!isAuthorized(request, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  after(async () => {
    try {
      const summary = await processQueue(SYNC_MAX_JOBS_PER_RUN);
      if (summary.processed > 0) {
        console.log(`[rag] Sync processed ${summary.processed} job(s), ${summary.failed} failed.`);
      }
      for (const outcome of summary.outcomes) {
        if (outcome.result.status === "error") {
          console.error(`[rag] Index failed for ${outcome.postId} [${outcome.locale}]: ${outcome.result.message}`);
        }
      }
    } catch (caught) {
      console.error("[rag] Sync failed:", caught instanceof Error ? caught.message : caught);
    }
  });

  return Response.json({ accepted: true }, { status: 202, headers: NO_STORE });
}
