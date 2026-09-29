import type { UIMessage } from "ai";
import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";

export const MAX_USER_MESSAGE_CHARS = 2000;
/** Messages sent to the model: the latest question plus recent history. */
const MAX_HISTORY_MESSAGES = 10;
const MAX_INCOMING_MESSAGES = 100;
const MAX_ASSISTANT_MESSAGE_CHARS = 4000;

export type ChatRequest = {
  locale: AppLocale;
  messages: UIMessage[];
};

function textOf(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .flatMap((part) =>
      part && typeof part === "object" && part.type === "text" && typeof part.text === "string"
        ? [part.text]
        : [],
    )
    .join("\n")
    .trim();
}

/**
 * Validates an untrusted chat request and rebuilds the history as text only.
 * Tool calls and results from earlier turns are dropped, so a client cannot
 * inject fake tool output (e.g. a price) and old results do not bloat the
 * context; the model re-runs tools for the current question.
 */
export function parseChatRequest(body: unknown): ChatRequest | null {
  if (!body || typeof body !== "object") return null;
  const { messages: rawMessages, locale: rawLocale } = body as Record<string, unknown>;

  const locale =
    typeof rawLocale === "string" && hasLocale(routing.locales, rawLocale)
      ? rawLocale
      : routing.defaultLocale;

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) return null;
  if (rawMessages.length > MAX_INCOMING_MESSAGES) return null;

  const messages: UIMessage[] = [];
  for (const raw of rawMessages.slice(-MAX_HISTORY_MESSAGES)) {
    if (!raw || typeof raw !== "object") return null;
    const { id, role, parts } = raw as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") continue;

    let text = textOf(parts);
    if (!text) continue;
    if (role === "user" && text.length > MAX_USER_MESSAGE_CHARS) return null;
    if (role === "assistant") text = text.slice(0, MAX_ASSISTANT_MESSAGE_CHARS);

    messages.push({
      id: typeof id === "string" ? id.slice(0, 100) : crypto.randomUUID(),
      role,
      parts: [{ type: "text", text }],
    });
  }

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  return { locale, messages };
}
