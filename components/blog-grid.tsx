"use client";

import type { SVGProps } from "react";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BlogPostMeta } from "@/types/blog";
import { BlogTile } from "./blog-tile";
import { ProximityScaleGrid } from "./proximity-scale-grid";

type BlogGridProps = {
  posts: BlogPostMeta[];
  label: string;
  emptyLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearchLabel: string;
  noResultsLabel: string;
};

/** Lowercases and strips diacritics so "cay" matches "Cây" and "dat" matches "Đất". */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function BlogGrid({
  posts,
  label,
  emptyLabel,
  searchLabel,
  searchPlaceholder,
  clearSearchLabel,
  noResultsLabel,
}: BlogGridProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (searchRef.current?.contains(target)) return;
      // Resetting the filter while a tile navigates would flash the full grid.
      if (target.closest(".blog-tile")) return;
      setQuery("");
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const searchIndex = useMemo(
    () =>
      posts.map((post) => ({
        post,
        text: normalize(`${post.title} ${post.description} ${post.category}`),
      })),
    [posts],
  );

  const filtered = useMemo(() => {
    const terms = normalize(deferredQuery).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return posts;
    return searchIndex
      .filter(({ text }) => terms.every((term) => text.includes(term)))
      .map(({ post }) => post);
  }, [deferredQuery, posts, searchIndex]);

  const itemsKey = filtered.map((post) => post.slug).join("|");

  function openSearch() {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setQuery("");
    setOpen(false);
  }

  if (posts.length === 0) {
    return (
      <main className="grid-area">
        <p className="px-6 py-16 text-center text-sm tracking-[0.3em] text-muted-foreground uppercase">
          {emptyLabel}
        </p>
      </main>
    );
  }

  return (
    <main className="grid-area">
      <div
        ref={searchRef}
        role="search"
        className="blog-search"
        data-open={open || undefined}
      >
        {open ? (
          <>
            <label htmlFor={inputId} className="sr-only">
              {searchLabel}
            </label>
            <SearchIcon className="blog-search-icon" />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") closeSearch();
              }}
            />
            <button
              type="button"
              className="blog-search-button"
              aria-label={clearSearchLabel}
              onClick={closeSearch}
            >
              <CloseIcon className="blog-search-icon" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="blog-search-button"
            aria-label={searchLabel}
            onClick={openSearch}
          >
            <SearchIcon className="blog-search-icon" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p
          className="px-6 py-16 text-center text-sm tracking-[0.3em] text-muted-foreground uppercase"
          role="status"
        >
          {noResultsLabel}
        </p>
      ) : (
        <ProximityScaleGrid aria-label={label} itemsKey={itemsKey}>
          {filtered.map((post, index) => (
            <BlogTile key={post.slug} post={post} priority={index < 5} />
          ))}
        </ProximityScaleGrid>
      )}
    </main>
  );
}

export { BlogGrid };
