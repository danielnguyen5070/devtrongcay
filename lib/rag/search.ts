import "server-only";
import type { AppLocale } from "@/i18n/routing";
import {
  MATCH_COUNT,
  MATCH_THRESHOLD,
  MAX_CHUNKS_PER_POST,
  MAX_CONTEXT_CHARS,
  MIN_LOCALE_HITS,
} from "@/lib/rag/config";
import { embedQuery, toVectorLiteral } from "@/lib/rag/embeddings";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type MatchRow = Database["public"]["Functions"]["match_document_chunks"]["Returns"][number];

export type KnowledgeHit = {
  postId: string;
  slug: string;
  title: string;
  section: string;
  content: string;
  locale: AppLocale;
  similarity: number;
  url: string;
  /** Retrieved from the other locale because the requested one had too little. */
  fromOtherLanguage: boolean;
};

type MatchOptions = {
  locale: AppLocale | null;
  count: number;
  threshold: number;
  postIds?: string[];
  categoryIds?: string[];
};

async function match(embedding: string, options: MatchOptions): Promise<MatchRow[]> {
  const { data, error } = await getAdminSupabase().rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: options.count,
    match_threshold: options.threshold,
    filter_locale: options.locale ?? undefined,
    filter_post_ids: options.postIds,
    filter_category_ids: options.categoryIds,
  });

  if (error) {
    console.error(`[rag] match_document_chunks failed: ${error.message}`, error.code ?? "");
    throw new Error("Knowledge search failed.");
  }
  return data;
}

/**
 * Chunks relevant to a question, preferring the question's locale. Falls back
 * to all locales when the locale has too few hits. Results are capped per post
 * and by total size so the LLM context stays small.
 */
export async function searchKnowledge(
  query: string,
  locale: AppLocale,
  filters: { postIds?: string[]; categoryIds?: string[] } = {},
): Promise<KnowledgeHit[]> {
  const embedding = toVectorLiteral(await embedQuery(query));
  const base = { count: MATCH_COUNT * 2, threshold: MATCH_THRESHOLD, ...filters };

  const primary = await match(embedding, { ...base, locale });
  let rows = primary;

  if (primary.length < MIN_LOCALE_HITS) {
    const coveredPosts = new Set(primary.map((row) => row.post_id));
    const fallback = await match(embedding, { ...base, locale: null });
    rows = [
      ...primary,
      ...fallback.filter((row) => row.locale !== locale && !coveredPosts.has(row.post_id)),
    ];
  }

  const perPost = new Map<string, number>();
  const hits: KnowledgeHit[] = [];
  let size = 0;

  for (const row of rows) {
    if (hits.length >= MATCH_COUNT) break;
    const used = perPost.get(row.post_id) ?? 0;
    if (used >= MAX_CHUNKS_PER_POST) continue;
    if (size + row.content.length > MAX_CONTEXT_CHARS && hits.length > 0) break;

    perPost.set(row.post_id, used + 1);
    size += row.content.length;
    hits.push({
      postId: row.post_id,
      slug: row.slug,
      title: row.title,
      section: row.heading,
      content: row.content,
      locale: row.locale,
      similarity: row.similarity,
      url: `/${row.locale}/blog/${row.slug}`,
      fromOtherLanguage: row.locale !== locale,
    });
  }

  return hits;
}

/** Posts whose content best matches a plant name, for fuzzy product lookup. */
export async function findPostIdsByName(name: string, limit = 3): Promise<string[]> {
  const embedding = toVectorLiteral(await embedQuery(name));
  const rows = await match(embedding, { locale: null, count: 12, threshold: MATCH_THRESHOLD });
  return [...new Set(rows.map((row) => row.post_id))].slice(0, limit);
}

/** Unfiltered ranking for threshold tuning (scripts/rag-eval.ts). */
export async function rankForEval(query: string, locale: AppLocale | null) {
  const embedding = toVectorLiteral(await embedQuery(query));
  return match(embedding, { locale, count: 20, threshold: 0 });
}
