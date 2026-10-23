import type { AppLocale } from "@/i18n/routing";

const VIETNAMESE_CHARS =
  /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

/** Frequent words in unaccented Vietnamese typing vs. English questions. */
const VI_WORDS = new Set([
  "cay", "la", "tuoi", "nuoc", "bao", "nhieu", "khong", "co", "gia", "con", "hang",
  "nhu", "the", "nao", "sao", "bi", "vang", "anh", "sang", "cham", "soc", "trong",
  "chau", "dat", "phan", "bon", "may", "lan", "ngay", "tuan", "can", "de", "cho",
  "minh", "shop", "oi", "a", "nhe", "vay", "gi", "ko", "k",
]);
const EN_WORDS = new Set([
  "the", "is", "are", "how", "what", "why", "when", "does", "do", "much", "many",
  "often", "water", "light", "plant", "leaves", "leaf", "care", "price", "stock",
  "it", "my", "i", "should", "can", "for", "in", "of", "to", "and", "available",
]);

/**
 * Language of a user question for retrieval. Diacritics decide Vietnamese;
 * otherwise common-word counts decide, falling back to the page locale.
 */
export function detectLocale(text: string, fallback: AppLocale): AppLocale {
  if (VIETNAMESE_CHARS.test(text)) return "vi";

  let vi = 0;
  let en = 0;
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (VI_WORDS.has(word)) vi += 1;
    if (EN_WORDS.has(word)) en += 1;
  }

  if (vi === en) return fallback;
  return vi > en ? "vi" : "en";
}
