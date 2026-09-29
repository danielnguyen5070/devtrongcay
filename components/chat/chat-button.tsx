"use client";

import type { SVGProps } from "react";
import { useTranslations } from "next-intl";
import { useChatStore } from "@/lib/chat/store";

function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M5 5h14v10H9l-4 4V5Z" />
    </svg>
  );
}

function ChatButton() {
  const t = useTranslations("chat");
  const open = useChatStore((state) => state.open);

  return (
    <button type="button" onClick={open} aria-label={t("open")} className="chat-button">
      <ChatIcon className="size-4" />
      <span>{t("label")}</span>
    </button>
  );
}

export { ChatButton };
