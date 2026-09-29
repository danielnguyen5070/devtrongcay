import { createDeepSeek } from "@ai-sdk/deepseek";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import { checkRateLimit, clientKey } from "@/lib/chat/rate-limit";
import { createChatTools } from "@/lib/chat/tools";
import { parseChatRequest } from "@/lib/chat/validate";

export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 64 * 1024;
const MAX_STEPS = 4;

let deepseek: ReturnType<typeof createDeepSeek> | undefined;

function getModel() {
  if (!deepseek) {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY must be set.");
    deepseek = createDeepSeek({ apiKey });
  }
  return deepseek(process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash");
}

function error(code: string, status: number, headers: Record<string, string> = {}) {
  return Response.json({ error: code }, { status, headers: { ...NO_STORE, ...headers } });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return error("rate_limited", 429, { "Retry-After": String(limit.retryAfterSeconds) });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return error("too_large", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_json", 400);
  }

  const chat = parseChatRequest(body);
  if (!chat) return error("invalid_messages", 400);

  let model;
  try {
    model = getModel();
  } catch (caught) {
    console.error("[chat] Model unavailable:", caught instanceof Error ? caught.message : caught);
    return error("chat_unavailable", 503);
  }

  const result = streamText({
    model,
    instructions: buildSystemPrompt(chat.locale),
    messages: await convertToModelMessages(chat.messages),
    tools: createChatTools(chat.locale),
    // Retrieve before answering; never end on a tool call without an answer.
    prepareStep: ({ stepNumber }) => ({
      toolChoice: stepNumber === 0 ? "required" : stepNumber === MAX_STEPS - 1 ? "none" : "auto",
    }),
    stopWhen: isStepCount(MAX_STEPS),
    temperature: 0.3,
    maxOutputTokens: 800,
    abortSignal: request.signal,
    providerOptions: { deepseek: { thinking: { type: "disabled" } } },
    onError: ({ error: streamError }) => {
      console.error(
        "[chat] Stream failed:",
        streamError instanceof Error ? streamError.message : streamError,
      );
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, onError: () => "chat_failed" }),
    headers: NO_STORE,
  });
}
