import "server-only";
import type { List, Nodes, RootContent, Table } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

/** Body text under one heading path. Blocks are paragraphs, list items, table rows. */
export type Section = {
  headingPath: string[];
  blocks: string[];
};

const processor = unified().use(remarkParse).use(remarkGfm);

function inline(node: Nodes) {
  return toString(node, { includeImageAlt: false }).replace(/\s+/g, " ").trim();
}

function listBlocks(list: List, depth: number): string[] {
  const indent = "  ".repeat(depth);
  return list.children.flatMap((item, index) => {
    const marker = list.ordered ? `${(list.start ?? 1) + index}.` : "-";
    const text = item.children
      .filter((child) => child.type !== "list")
      .map(inline)
      .filter(Boolean)
      .join(" ");
    const nested = item.children.flatMap((child) =>
      child.type === "list" ? listBlocks(child, depth + 1) : [],
    );
    return [...(text ? [`${indent}${marker} ${text}`] : []), ...nested];
  });
}

/** Rows become "Header: value; Header: value" so each row reads on its own. */
function tableBlocks(table: Table): string[] {
  const [head, ...rows] = table.children;
  if (!head) return [];
  const headers = head.children.map(inline);
  if (rows.length === 0) return [headers.join(" | ")];

  return rows.map((row) =>
    row.children
      .map((cell, index) => {
        const value = inline(cell);
        const header = headers[index];
        return header ? `${header}: ${value}` : value;
      })
      .filter(Boolean)
      .join("; "),
  );
}

function blocksOf(node: RootContent): string[] {
  switch (node.type) {
    case "paragraph": {
      const text = inline(node);
      return text ? [text] : [];
    }
    case "list":
      return [listBlocks(node, 0).join("\n")];
    case "table":
      return tableBlocks(node);
    case "blockquote":
      return node.children.flatMap(blocksOf);
    case "code":
      return node.value.trim() ? [node.value.trim()] : [];
    default:
      return [];
  }
}

/**
 * Splits GFM into sections by heading. Links keep their text, images and raw
 * HTML are dropped. Text before the first heading has an empty heading path.
 */
export function parseSections(markdown: string): Section[] {
  const tree = processor.parse(markdown);
  const sections: Section[] = [{ headingPath: [], blocks: [] }];
  const stack: { depth: number; text: string }[] = [];

  for (const node of tree.children) {
    if (node.type === "heading") {
      const text = inline(node);
      if (!text) continue;
      while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) stack.pop();
      stack.push({ depth: node.depth, text });
      sections.push({ headingPath: stack.map((item) => item.text), blocks: [] });
      continue;
    }
    sections[sections.length - 1].blocks.push(...blocksOf(node));
  }

  return sections.filter((section, index) => index === 0 || section.blocks.length > 0);
}
