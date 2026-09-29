import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/rag/config";

let provider: ReturnType<typeof createOpenAI> | undefined;

function getModel() {
  if (!provider) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY must be set.");
    provider = createOpenAI({ apiKey });
  }
  return provider.embeddingModel(EMBEDDING_MODEL);
}

function assertDimensions(embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS}-dimension embeddings, got ${embedding.length}.`,
    );
  }
  return embedding;
}

/** pgvector text input format. */
export function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

const QUERY_CACHE_SIZE = 500;
const queryCache = new Map<string, number[]>();

/** Embeds a search query. Repeated questions are served from a per-instance LRU cache. */
export async function embedQuery(query: string): Promise<number[]> {
  const key = query.trim().toLowerCase().replace(/\s+/g, " ");
  const cached = queryCache.get(key);
  if (cached) {
    queryCache.delete(key);
    queryCache.set(key, cached);
    return cached;
  }

  const { embedding } = await embed({ model: getModel(), value: key, maxRetries: 2 });
  assertDimensions(embedding);

  queryCache.set(key, embedding);
  if (queryCache.size > QUERY_CACHE_SIZE) {
    queryCache.delete(queryCache.keys().next().value!);
  }
  return embedding;
}

/** Embeds document chunks in input order. */
export async function embedDocuments(values: string[]): Promise<number[][]> {
  if (values.length === 0) return [];
  const { embeddings } = await embedMany({
    model: getModel(),
    values,
    maxParallelCalls: 2,
    maxRetries: 3,
  });
  return embeddings.map(assertDimensions);
}
