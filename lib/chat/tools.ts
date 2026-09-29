import "server-only";
import { tool, type InferUITools } from "ai";
import { z } from "zod";
import type { AppLocale } from "@/i18n/routing";
import { findProducts } from "@/lib/chat/products";
import { detectLocale } from "@/lib/rag/language";
import { searchKnowledge } from "@/lib/rag/search";

/** Tools bound to the page locale of one chat request. */
export function createChatTools(locale: AppLocale) {
  return {
    searchPlantKnowledge: tool({
      description:
        "Search the shop's plant-care articles. Returns relevant passages with the article title and url.",
      inputSchema: z.object({
        query: z
          .string()
          .min(2)
          .max(300)
          .describe("Self-contained question including the plant name, in the user's language."),
      }),
      execute: async ({ query }) => {
        const hits = await searchKnowledge(query, detectLocale(query, locale));
        return {
          found: hits.length > 0,
          results: hits.map((hit) => ({
            title: hit.title,
            url: hit.url,
            section: hit.section,
            fromOtherLanguage: hit.fromOtherLanguage,
            content: hit.content,
          })),
        };
      },
    }),

    getProductInfo: tool({
      description:
        "Get the current price, stock and availability of plants sold by the shop, by plant name.",
      inputSchema: z.object({
        plantName: z.string().min(2).max(100).describe("Plant name, e.g. 'Alocasia Scalprum'."),
      }),
      execute: async ({ plantName }) => {
        const products = await findProducts(plantName, locale);
        return { found: products.length > 0, products };
      },
    }),
  };
}

export type ChatTools = InferUITools<ReturnType<typeof createChatTools>>;
