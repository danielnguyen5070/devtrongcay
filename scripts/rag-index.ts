/**
 * Chatbot knowledge index maintenance. Reads .env.local; needs
 * SUPABASE_SECRET_KEY and (except --dry-run) OPENAI_API_KEY.
 *
 *   npm run rag:index -- --all              queue every published translation, then drain
 *   npm run rag:index -- --pending          drain the queue (what the webhook does)
 *   npm run rag:index -- --post <slug>      re-index one post now
 *   npm run rag:index -- --prune            drop chunks of another model / unpublished posts
 *   npm run rag:index -- --dry-run [--post <slug>]   print chunks, no embedding or writes
 */
import {
  enqueueAll,
  indexTranslation,
  listPublishedTranslations,
  previewTranslation,
  processQueue,
  pruneChunks,
  type QueueRunSummary,
} from "@/lib/rag/indexer";

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const valueOf = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

function printSummary(summary: QueueRunSummary) {
  for (const { postId, locale, result } of summary.outcomes) {
    console.log(`${postId} [${locale}] ${JSON.stringify(result)}`);
  }
  console.log(`Processed ${summary.processed} job(s), ${summary.failed} failed.`);
}

async function dryRun(slug?: string) {
  const translations = await listPublishedTranslations(slug);
  for (const { postId, locale, slug: postSlug } of translations) {
    const chunks = await previewTranslation(postId, locale);
    console.log(`\n=== ${postSlug} [${locale}] ${chunks.length} chunk(s)`);
    for (const chunk of chunks) {
      console.log(`\n--- #${chunk.chunkIndex} ${chunk.content.length} chars, ~${chunk.tokenCount} tokens`);
      console.log(chunk.content);
    }
  }
}

async function main() {
  const slug = valueOf("--post");

  if (has("--dry-run")) {
    await dryRun(slug);
    return;
  }

  if (slug) {
    const translations = await listPublishedTranslations(slug);
    if (translations.length === 0) throw new Error(`No published post with slug "${slug}".`);
    for (const { postId, locale } of translations) {
      console.log(`${slug} [${locale}] ${JSON.stringify(await indexTranslation(postId, locale))}`);
    }
    return;
  }

  if (has("--prune")) {
    console.log("Pruned:", await pruneChunks());
    return;
  }

  if (has("--all")) {
    console.log(`Queued ${await enqueueAll()} translation(s).`);
    printSummary(await processQueue());
    return;
  }

  if (has("--pending")) {
    printSummary(await processQueue());
    return;
  }

  console.log("Usage: npm run rag:index -- --all | --pending | --post <slug> | --prune | --dry-run");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
