/**
 * Retrieval quality check for tuning MATCH_THRESHOLD in lib/rag/config.ts.
 * Needs an indexed database, SUPABASE_SECRET_KEY and OPENAI_API_KEY.
 *
 *   npm run rag:eval
 *
 * For each question, prints the rank and similarity of the first chunk from
 * the expected post and the best chunk from any other post. A good threshold
 * sits below most "expected" scores and above most "other" scores.
 */
import type { AppLocale } from "@/i18n/routing";
import { MATCH_THRESHOLD } from "@/lib/rag/config";
import { detectLocale } from "@/lib/rag/language";
import { rankForEval } from "@/lib/rag/search";

type Case = { question: string; expected: string; pageLocale: AppLocale };

const CASES: Case[] = [
  { question: "Alocasia Scalprum cần bao nhiêu ánh sáng?", expected: "alocasia-scalprum", pageLocale: "vi" },
  { question: "How much light does Alocasia Scalprum need?", expected: "alocasia-scalprum", pageLocale: "en" },
  { question: "Bao lâu thì tưới Monstera một lần?", expected: "watering-monstera", pageLocale: "vi" },
  { question: "How often should I water my Monstera?", expected: "watering-monstera", pageLocale: "en" },
  { question: "Tại sao lá cây bị vàng?", expected: "yellow-leaves", pageLocale: "vi" },
  { question: "Why are my plant's leaves turning yellow?", expected: "yellow-leaves", pageLocale: "en" },
  { question: "Giá thể cho Alocasia Bambino Pink Var gồm những gì?", expected: "alocasia-bambino-pink-var", pageLocale: "vi" },
  { question: "What soil mix does Alocasia Bambino need?", expected: "alocasia-bambino-pink-var", pageLocale: "en" },
  { question: "Cách chăm sóc Platycerium ridleyi", expected: "platycerium-ridleyi", pageLocale: "vi" },
  { question: "How do I care for a staghorn fern Platycerium ridleyi?", expected: "platycerium-ridleyi", pageLocale: "en" },
  { question: "Anthurium warocqueanum cần độ ẩm bao nhiêu?", expected: "anthurium-warocqueanum", pageLocale: "vi" },
  { question: "Is Anthurium warocqueanum suitable for beginners?", expected: "anthurium-warocqueanum", pageLocale: "en" },
  { question: "Alocasia Nobilis co de trong khong", expected: "alocasia-nobilis", pageLocale: "vi" },
];

async function main() {
  let found = 0;
  let aboveThreshold = 0;

  for (const { question, expected, pageLocale } of CASES) {
    const locale = detectLocale(question, pageLocale);
    const rows = await rankForEval(question, locale);
    const rank = rows.findIndex((row) => row.slug === expected);
    const hit = rank >= 0 ? rows[rank] : undefined;
    const other = rows.find((row) => row.slug !== expected);

    if (rank >= 0 && rank < 6) found += 1;
    if (hit && hit.similarity >= MATCH_THRESHOLD) aboveThreshold += 1;

    console.log(
      [
        `[${locale}] ${question}`,
        `  expected ${expected}: ${hit ? `rank ${rank + 1}, sim ${hit.similarity.toFixed(3)}` : "not in top 20"}`,
        `  best other: ${other ? `${other.slug}, sim ${other.similarity.toFixed(3)}` : "-"}`,
      ].join("\n"),
    );
  }

  console.log(
    `\nExpected post in top 6: ${found}/${CASES.length}; ` +
      `above threshold ${MATCH_THRESHOLD}: ${aboveThreshold}/${CASES.length}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
