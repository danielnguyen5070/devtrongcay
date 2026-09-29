/** Tuning for indexing and retrieval. Changing the model requires a full re-index. */

export const EMBEDDING_MODEL = "text-embedding-3-small";
/** Must match `vector(1536)` in supabase/migrations/*_rag_document_chunks.sql. */
export const EMBEDDING_DIMENSIONS = 1536;

/** Characters, not tokens: Vietnamese costs ~1.5-2x more tokens per word. */
export const CHUNK_TARGET_CHARS = 1400;
export const CHUNK_MAX_CHARS = 2200;
export const CHUNK_OVERLAP_CHARS = 200;

export const MATCH_COUNT = 6;
export const MATCH_THRESHOLD = 0.3;
/** Fewer hits than this in the question's locale triggers a cross-locale search. */
export const MIN_LOCALE_HITS = 2;
export const MAX_CHUNKS_PER_POST = 2;
/** Upper bound on retrieved text sent to the LLM per search (~3,000 tokens). */
export const MAX_CONTEXT_CHARS = 9000;

/** Jobs processed per sync request; each job embeds one post translation. */
export const SYNC_BATCH_SIZE = 5;
export const SYNC_MAX_JOBS_PER_RUN = 20;
