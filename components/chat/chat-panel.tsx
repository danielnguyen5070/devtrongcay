"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { CloseIcon } from "@/components/cart/icons";
import { useChatStore } from "@/lib/chat/store";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/chat/validate";
import { ChatMessage, type ChatUIMessage } from "./chat-message";

const SUGGESTIONS = ["suggestion1", "suggestion2", "suggestion3"] as const;

function ChatPanel() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isOpen = useChatStore((state) => state.isOpen);
  const close = useChatStore((state) => state.close);
  const [input, setInput] = useState("");
  const [transport] = useState(
    () => new DefaultChatTransport<ChatUIMessage>({ api: "/api/chat" }),
  );
  const { messages, sendMessage, regenerate, setMessages, stop, status, error, clearError } =
    useChat<ChatUIMessage>({ transport });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, status]);

  function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    clearError();
    void sendMessage({ text: question }, { body: { locale } });
    setInput("");
  }

  function reset() {
    stop();
    clearError();
    setMessages([]);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="chat-panel-title"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="chat-panel"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/14 px-5 py-4">
          <h2
            id="chat-panel-title"
            className="text-[11px] tracking-[0.3em] text-[#d6dad2] uppercase"
          >
            {t("title")}
          </h2>
          <div className="flex items-center gap-4">
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={reset}
                className="text-[10px] tracking-[0.2em] text-[#9da39a] uppercase transition-colors hover:text-[#e7e9e3]"
              >
                {t("newChat")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="grid size-8 place-items-center text-[#9da39a] transition-colors hover:text-[#e7e9e3]"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        </header>

        <ul
          ref={listRef}
          aria-live="polite"
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
        >
          {messages.length === 0 ? (
            <li className="text-sm text-[#9da39a]">
              <p>{t("welcome")}</p>
              <div className="mt-4 flex flex-col items-start gap-2">
                {SUGGESTIONS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => send(t(key))}
                    className="border border-white/14 px-3 py-1.5 text-left text-xs text-[#d6dad2] transition-colors hover:border-white/30"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </li>
          ) : null}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onNavigate={close} />
          ))}

          {status === "submitted" ? (
            <li className="text-sm text-[#9da39a]">{t("thinking")}</li>
          ) : null}

          {error ? (
            <li className="text-sm text-[#e7a59a]">
              <p>{error.message.includes("rate_limited") ? t("rateLimited") : t("error")}</p>
              <button
                type="button"
                onClick={() => void regenerate({ body: { locale } })}
                className="mt-1 text-xs underline underline-offset-2"
              >
                {t("retry")}
              </button>
            </li>
          ) : null}
        </ul>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="border-t border-white/14 px-5 pt-4 pb-5"
        >
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(input);
                }
              }}
              maxLength={MAX_USER_MESSAGE_CHARS}
              rows={2}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="min-h-[44px] flex-1 resize-none border border-white/14 bg-transparent px-3 py-2 text-sm text-[#e7e9e3] placeholder:text-[#6f756d] focus:border-white/30 focus:outline-none"
            />
            {busy ? (
              <button
                type="button"
                onClick={stop}
                className="h-[44px] border border-white/14 px-4 text-[10px] tracking-[0.2em] text-[#d6dad2] uppercase hover:border-white/30"
              >
                {t("stop")}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-[44px] border border-white/14 px-4 text-[10px] tracking-[0.2em] text-[#d6dad2] uppercase hover:border-white/30 disabled:opacity-40"
              >
                {t("send")}
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[#6f756d]">{t("disclaimer")}</p>
        </form>
      </div>
    </dialog>
  );
}

export { ChatPanel };
