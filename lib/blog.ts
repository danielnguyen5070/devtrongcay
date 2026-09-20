import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import type { BlogPost, BlogPostMeta } from "@/types/blog";

const DEFAULT_COVER = "/images/blog/green-on-green.webp";

function blogFilePath(locale: string, fileName: string) {
  return path.join(process.cwd(), "content/blogs", locale, fileName);
}

function blogDir(locale: string) {
  return path.join(process.cwd(), "content/blogs", locale);
}

function getBlogDir(locale: string) {
  if (!hasLocale(routing.locales, locale)) {
    return null;
  }

  const dir = blogDir(locale);
  if (!fs.existsSync(dir)) {
    return null;
  }

  return dir;
}

function getMdxFileNames(locale: string): string[] {
  const dir = getBlogDir(locale);
  if (!dir) return [];

  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

function toSlug(fileName: string) {
  return fileName.replace(/\.mdx$/, "");
}

function requiredString(value: unknown, fallback: string) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function parsePost(locale: string, fileName: string): BlogPost | null {
  if (!hasLocale(routing.locales, locale)) {
    return null;
  }

  const fullPath = blogFilePath(locale, fileName);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fileSlug = toSlug(fileName);

  return {
    title: requiredString(data.title, fileSlug),
    description: requiredString(data.description, ""),
    slug: requiredString(data.slug, fileSlug),
    date: requiredString(data.date, ""),
    coverImage: requiredString(data.coverImage, DEFAULT_COVER),
    category: requiredString(data.category, ""),
    content,
  };
}

export function getPostCover(post: BlogPostMeta) {
  return post.coverImage || DEFAULT_COVER;
}

export function getAllSlugs(locale: string): string[] {
  return getMdxFileNames(locale)
    .map((fileName) => parsePost(locale, fileName)?.slug)
    .filter((slug): slug is string => Boolean(slug));
}

export function getAllPosts(locale: string): BlogPostMeta[] {
  return getMdxFileNames(locale)
    .map((fileName) => {
      const post = parsePost(locale, fileName);
      if (!post) return null;

      return {
        title: post.title,
        description: post.description,
        slug: post.slug,
        date: post.date,
        coverImage: post.coverImage,
        category: post.category,
      };
    })
    .filter((post): post is BlogPostMeta => post !== null)
    .sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
}

export function getPostBySlug(locale: string, slug: string): BlogPost | null {
  if (!slug || slug.includes("/") || slug.includes("..")) {
    return null;
  }

  const fromFile = parsePost(locale, `${slug}.mdx`);
  if (fromFile && fromFile.slug === slug) {
    return fromFile;
  }

  for (const fileName of getMdxFileNames(locale)) {
    const post = parsePost(locale, fileName);
    if (post?.slug === slug) {
      return post;
    }
  }

  return null;
}

export function hasPostInLocale(slug: string, locale: string) {
  return getPostBySlug(locale, slug) !== null;
}
