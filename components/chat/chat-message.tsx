"use client";

import { Fragment, type ReactNode } from "react";
import type { UIDataTypes, UIMessage } from "ai";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ChatTools } from "@/lib/chat/tools";

export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatTools>;

const INLINE_PATTERN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Only site-relative links are rendered as links; anything else stays text. */
function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [, bold, label, href] = match;
    if (bold) {
      nodes.push(<strong key={match.index}>{bold}</strong>);
    } else if (label && href && isInternalHref(href)) {
      nodes.push(
        <Link key={match.index} href={href} className="underline underline-offset-2">
          {label}
        </Link>,
      );
    } else {
      nodes.push(label ?? match[0]);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Minimal Markdown: paragraphs, "-" / "1." lists, **bold** and internal links. */
function MarkdownText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^\s*([-*]|\d+\.)\s+/.test(line));
        if (isList) {
          return (
            <ul key={blockIndex} className="my-1 list-disc space-y-0.5 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={blockIndex} className="my-1">
            {lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function ChatMessage({ message, onNavigate }: { message: ChatUIMessage; onNavigate: () => void }) {
  const t = useTranslations("chat");

  if (message.role === "user") {
    const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
    return (
      <li className="ml-8 self-end rounded-sm bg-white/8 px-3 py-2 text-sm whitespace-pre-wrap text-[#e7e9e3]">
        {text}
      </li>
    );
  }

  const sources = new Map<string, string>();
  let pendingTool: "searchPlantKnowledge" | "getProductInfo" | null = null;
  for (const part of message.parts) {
    if (part.type === "tool-searchPlantKnowledge") {
      if (part.state === "output-available") {
        for (const result of part.output.results) sources.set(result.url, result.title);
      } else if (part.state === "input-streaming" || part.state === "input-available") {
        pendingTool = "searchPlantKnowledge";
      }
    } else if (part.type === "tool-getProductInfo") {
      if (part.state === "input-streaming" || part.state === "input-available") {
        pendingTool = "getProductInfo";
      }
    }
  }

  const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");

  return (
    <li
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) onNavigate();
      }}
      className="mr-8 text-sm leading-relaxed text-[#d6dad2]"
    >
      {text ? (
        <MarkdownText text={text} />
      ) : pendingTool ? (
        <p className="text-[#9da39a]">
          {pendingTool === "searchPlantKnowledge" ? t("searching") : t("checkingStock")}
        </p>
      ) : null}
      {text && sources.size > 0 ? (
        <div className="mt-2 text-xs text-[#9da39a]">
          <span>{t("sources")}: </span>
          {[...sources].map(([url, title], index) => (
            <Fragment key={url}>
              {index > 0 ? ", " : null}
              <Link href={url} className="underline underline-offset-2 hover:text-[#e7e9e3]">
                {title}
              </Link>
            </Fragment>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export { ChatMessage };
