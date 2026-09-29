import "server-only";
import { createHash } from "node:crypto";
import type { AppLocale } from "@/i18n/routing";
import {
  CHUNK_MAX_CHARS,
  CHUNK_OVERLAP_CHARS,
  CHUNK_TARGET_CHARS,
  EMBEDDING_MODEL,
} from "@/lib/rag/config";
import { parseSections, type Section } from "@/lib/rag/markdown";

/** Bump when chunk output changes so every post is re-embedded. */
const CHUNKER_VERSION = 1;

export type ChunkSource = {
  locale: AppLocale;
  slug: string;
  title: string;
  description: string;
  body: string;
  categoryName: string;
};

export type Chunk = {
  chunkIndex: number;
  heading: string;
  headingPath: string[];
  content: string;
  contentHash: string;
  tokenCount: number;
};

const LABELS = {
  vi: { plant: "Cây", category: "Danh mục", section: "Mục", overview: "Tổng quan" },
  en: { plant: "Plant", category: "Category", section: "Section", overview: "Overview" },
} as const;

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Changes whenever anything that affects the stored chunks changes. */
export function sourceHash(source: ChunkSource) {
  return sha256(
    JSON.stringify([
      CHUNKER_VERSION,
      EMBEDDING_MODEL,
      source.locale,
      source.slug,
      source.title,
      source.description,
      source.body,
      source.categoryName,
    ]),
  );
}

/** Rough token estimate; Vietnamese averages ~3 characters per token. */
function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 3));
}

function splitSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  return sentences.flatMap((sentence) => {
    if (sentence.length <= CHUNK_MAX_CHARS) return [sentence];
    const parts: string[] = [];
    for (let start = 0; start < sentence.length; start += CHUNK_TARGET_CHARS) {
      parts.push(sentence.slice(start, start + CHUNK_TARGET_CHARS));
    }
    return parts;
  });
}

/** Tail of the previous piece, starting on a word boundary. */
function overlapTail(text: string) {
  if (text.length <= CHUNK_OVERLAP_CHARS) return text;
  const tail = text.slice(-CHUNK_OVERLAP_CHARS);
  const space = tail.indexOf(" ");
  return `…${space >= 0 ? tail.slice(space + 1) : tail}`;
}

/** Packs blocks into pieces near the target size, splitting oversized blocks by sentence. */
function packBlocks(blocks: string[]): string[] {
  const units = blocks.flatMap((block) =>
    block.length > CHUNK_MAX_CHARS
      ? splitSentences(block).map((text, index) => ({ text, separator: index === 0 ? "\n\n" : " " }))
      : [{ text: block, separator: "\n\n" }],
  );

  const pieces: string[] = [];
  let current = "";
  for (const unit of units) {
    const joined = current ? `${current}${unit.separator}${unit.text}` : unit.text;
    if (current && joined.length > CHUNK_TARGET_CHARS) {
      pieces.push(current);
      current = `${overlapTail(current)} ${unit.text}`;
    } else {
      current = joined;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

type Piece = { headingPath: string[]; text: string };

function sameParent(a: string[], b: string[]) {
  return (
    a.length > 1 &&
    a.length === b.length &&
    a.slice(0, -1).every((part, index) => part === b[index])
  );
}

/**
 * Sibling sections that are short together (e.g. "Light", "Water" under
 * "Care") share one chunk under their parent heading.
 */
function mergeShortSiblings(sections: Section[]): Piece[] {
  const pieces: (Piece & { leafPath: string[] })[] = [];

  for (const section of sections) {
    const text = section.blocks.join("\n\n");
    const previous = pieces[pieces.length - 1];
    const leaf = section.headingPath[section.headingPath.length - 1];

    if (
      previous &&
      sameParent(previous.leafPath, section.headingPath) &&
      previous.text.length + text.length + leaf.length + 4 <= CHUNK_TARGET_CHARS
    ) {
      if (previous.headingPath.length === previous.leafPath.length) {
        const previousLeaf = previous.leafPath[previous.leafPath.length - 1];
        previous.text = `${previousLeaf}:\n${previous.text}`;
        previous.headingPath = previous.leafPath.slice(0, -1);
      }
      previous.text = `${previous.text}\n\n${leaf}:\n${text}`;
      previous.leafPath = section.headingPath;
      continue;
    }

    pieces.push({ headingPath: section.headingPath, leafPath: section.headingPath, text });
  }

  return pieces.map(({ headingPath, text }) => ({ headingPath, text }));
}

function withHeader(source: ChunkSource, headingPath: string[], text: string) {
  const labels = LABELS[source.locale];
  const lines = [`${labels.plant}: ${source.title}`];
  if (source.categoryName) lines.push(`${labels.category}: ${source.categoryName}`);
  lines.push(`${labels.section}: ${headingPath.length > 0 ? headingPath.join(" > ") : labels.overview}`);
  return `${lines.join("\n")}\n\n${text}`.trim();
}

/**
 * Post translation -> ordered, self-contained chunks. Chunk 0 is the summary
 * (description + intro); the rest follow the body's heading structure.
 */
export function buildChunks(source: ChunkSource): Chunk[] {
  const [intro, ...sections] = parseSections(source.body);
  const summaryBlocks = [source.description.trim(), ...(intro?.blocks ?? [])].filter(Boolean);

  const pieces: Piece[] = [
    ...packBlocks(summaryBlocks.length > 0 ? summaryBlocks : [source.title]).map((text) => ({
      headingPath: [],
      text,
    })),
    ...mergeShortSiblings(sections).flatMap((piece) =>
      packBlocks(piece.text.split("\n\n")).map((text) => ({
        headingPath: piece.headingPath,
        text,
      })),
    ),
  ];

  return pieces.map((piece, chunkIndex) => {
    const content = withHeader(source, piece.headingPath, piece.text);
    return {
      chunkIndex,
      heading: piece.headingPath.join(" > "),
      headingPath: piece.headingPath,
      content,
      contentHash: sha256(content),
      tokenCount: estimateTokens(content),
    };
  });
}
