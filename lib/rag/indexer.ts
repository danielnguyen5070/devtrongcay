import "server-only";
import type { AppLocale } from "@/i18n/routing";
import { buildChunks, sourceHash, type Chunk, type ChunkSource } from "@/lib/rag/chunking";
import { EMBEDDING_MODEL, SYNC_BATCH_SIZE } from "@/lib/rag/config";
import { embedDocuments, toVectorLiteral } from "@/lib/rag/embeddings";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type IndexOutcome =
  /** Chunks were (re)written. */
  | { status: "indexed"; chunks: number; embedded: number }
  /** Source unchanged; existing chunks were marked fresh. */
  | { status: "unchanged"; chunks: number }
  /** Post unpublished or translation gone; chunks deleted. */
  | { status: "removed" }
  /** Content changed while indexing; the newer edit is still queued. */
  | { status: "stale" };

type LoadedSource = {
  source: ChunkSource;
  postId: string;
  categoryId: string | null;
  updatedAt: string;
  published: boolean;
};

function fail(what: string, error: { message: string; code?: string }): never {
  console.error(`[rag] Failed to ${what}: ${error.message}`, error.code ?? "");
  throw new Error(`Failed to ${what}.`);
}

async function loadSource(postId: string, locale: AppLocale): Promise<LoadedSource | null> {
  const { data, error } = await getAdminSupabase()
    .from("post_translations")
    .select(
      `title, description, body, updated_at,
       post:posts!inner(id, slug, status, category_id,
         category:categories(translations:category_translations(locale, name)))`,
    )
    .eq("post_id", postId)
    .eq("locale", locale)
    .maybeSingle();

  if (error) fail("load post translation", error);
  if (!data) return null;

  const categoryName =
    data.post.category?.translations.find((item) => item.locale === locale)?.name ?? "";

  return {
    postId: data.post.id,
    categoryId: data.post.category_id,
    updatedAt: data.updated_at,
    published: data.post.status === "published",
    source: {
      locale,
      slug: data.post.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      categoryName,
    },
  };
}

async function deleteChunks(postId: string, locale?: AppLocale) {
  let query = getAdminSupabase().from("document_chunks").delete().eq("post_id", postId);
  if (locale) query = query.eq("locale", locale);
  const { error } = await query;
  if (error) fail("delete chunks", error);
}

/** Chunks for one translation without embedding or writing (CLI --dry-run). */
export async function previewTranslation(postId: string, locale: AppLocale) {
  const loaded = await loadSource(postId, locale);
  return loaded ? buildChunks(loaded.source) : [];
}

/**
 * Re-indexes one post translation. Unchanged sources skip embedding, and
 * chunks whose text is unchanged reuse their stored embedding.
 */
export async function indexTranslation(postId: string, locale: AppLocale): Promise<IndexOutcome> {
  const supabase = getAdminSupabase();
  const loaded = await loadSource(postId, locale);

  if (!loaded || !loaded.published) {
    await deleteChunks(postId, locale);
    return { status: "removed" };
  }

  const hash = sourceHash(loaded.source);
  const { data: existing, error } = await supabase
    .from("document_chunks")
    .select("content_hash, embedding, source_hash, embedding_model")
    .eq("post_id", postId)
    .eq("locale", locale);
  if (error) fail("load existing chunks", error);

  const replace = (chunks: unknown[] | null) =>
    supabase.rpc("replace_document_chunks", {
      p_post_id: postId,
      p_locale: locale,
      p_source_updated_at: loaded.updatedAt,
      p_source_hash: hash,
      p_embedding_model: EMBEDDING_MODEL,
      // PostgREST sends SQL NULL for null; the generated Json type omits it.
      p_chunks: chunks as never,
    });

  if (
    existing.length > 0 &&
    existing.every((row) => row.source_hash === hash && row.embedding_model === EMBEDDING_MODEL)
  ) {
    const { data: fresh, error: touchError } = await replace(null);
    if (touchError) fail("mark chunks fresh", touchError);
    return fresh ? { status: "unchanged", chunks: existing.length } : { status: "stale" };
  }

  const chunks = buildChunks(loaded.source);
  const reusable = new Map(
    existing
      .filter((row) => row.embedding_model === EMBEDDING_MODEL)
      .map((row) => [row.content_hash, row.embedding]),
  );
  const missing = chunks.filter((chunk) => !reusable.has(chunk.contentHash));
  const vectors = await embedDocuments(missing.map((chunk) => chunk.content));
  missing.forEach((chunk, index) => reusable.set(chunk.contentHash, toVectorLiteral(vectors[index])));

  const payload = chunks.map((chunk: Chunk) => ({
    chunk_index: chunk.chunkIndex,
    heading: chunk.heading,
    content: chunk.content,
    content_hash: chunk.contentHash,
    token_count: chunk.tokenCount,
    embedding: reusable.get(chunk.contentHash),
    metadata: {
      slug: loaded.source.slug,
      title: loaded.source.title,
      category_id: loaded.categoryId,
      category_name: loaded.source.categoryName,
      heading_path: chunk.headingPath,
    },
  }));

  const { data: written, error: writeError } = await replace(payload);
  if (writeError) fail("write chunks", writeError);
  return written
    ? { status: "indexed", chunks: chunks.length, embedded: missing.length }
    : { status: "stale" };
}

export type QueueRunSummary = {
  processed: number;
  failed: number;
  outcomes: { postId: string; locale: AppLocale; result: IndexOutcome | { status: "error"; message: string } }[];
};

/** Drains rag_index_queue. Safe to run concurrently: jobs are leased with SKIP LOCKED. */
export async function processQueue(maxJobs = Number.POSITIVE_INFINITY): Promise<QueueRunSummary> {
  const supabase = getAdminSupabase();
  const summary: QueueRunSummary = { processed: 0, failed: 0, outcomes: [] };

  while (summary.processed < maxJobs) {
    const { data: jobs, error } = await supabase.rpc("claim_rag_index_jobs", {
      p_limit: Math.min(SYNC_BATCH_SIZE, maxJobs - summary.processed),
    });
    if (error) fail("claim index jobs", error);
    if (jobs.length === 0) break;

    for (const job of jobs) {
      let jobError: string | undefined;
      try {
        const result = await indexTranslation(job.post_id, job.locale);
        summary.outcomes.push({ postId: job.post_id, locale: job.locale, result });
      } catch (caught) {
        jobError = caught instanceof Error ? caught.message : String(caught);
        summary.failed += 1;
        summary.outcomes.push({
          postId: job.post_id,
          locale: job.locale,
          result: { status: "error", message: jobError },
        });
      }
      summary.processed += 1;

      const { error: finishError } = await supabase.rpc("finish_rag_index_job", {
        p_post_id: job.post_id,
        p_locale: job.locale,
        p_requested_at: job.requested_at,
        p_error: jobError,
      });
      if (finishError) fail("finish index job", finishError);
    }
  }

  return summary;
}

/** Queues every published translation (or those of the given posts). */
export async function enqueueAll(postIds?: string[]) {
  const { data, error } = await getAdminSupabase().rpc("enqueue_rag_index_jobs", {
    p_post_ids: postIds,
  });
  if (error) fail("enqueue index jobs", error);
  return data;
}

/** Deletes chunks from another embedding model or of posts that are no longer published. */
export async function pruneChunks() {
  const supabase = getAdminSupabase();

  const { count: modelCount, error: modelError } = await supabase
    .from("document_chunks")
    .delete({ count: "exact" })
    .neq("embedding_model", EMBEDDING_MODEL);
  if (modelError) fail("prune chunks by model", modelError);

  const { data: hidden, error: hiddenError } = await supabase
    .from("posts")
    .select("id")
    .neq("status", "published");
  if (hiddenError) fail("load unpublished posts", hiddenError);

  let hiddenCount = 0;
  if (hidden.length > 0) {
    const { count, error } = await supabase
      .from("document_chunks")
      .delete({ count: "exact" })
      .in(
        "post_id",
        hidden.map((row) => row.id),
      );
    if (error) fail("prune unpublished chunks", error);
    hiddenCount = count ?? 0;
  }

  return { wrongModel: modelCount ?? 0, unpublished: hiddenCount };
}

/** Published (post, locale) pairs, optionally for one slug. */
export async function listPublishedTranslations(slug?: string) {
  let query = getAdminSupabase()
    .from("post_translations")
    .select("post_id, locale, post:posts!inner(slug, status)")
    .eq("post.status", "published");
  if (slug) query = query.eq("post.slug", slug);

  const { data, error } = await query;
  if (error) fail("list published translations", error);
  return data.map((row) => ({ postId: row.post_id, locale: row.locale, slug: row.post.slug }));
}
