import type { MetadataRoute } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSitemapPosts } from "@/lib/blog";
import { getSiteUrl, isNoIndexSite } from "@/lib/site";

export const revalidate = 3600;

function localeUrl(locale: AppLocale, path: string) {
  const base = getSiteUrl().replace(/\/$/, "");
  return path === "" ? `${base}/${locale}` : `${base}/${locale}${path}`;
}

function entry(
  path: string,
  priority: number,
  languages?: Record<string, string>,
  lastModified?: string,
): MetadataRoute.Sitemap[number] {
  const alternates = languages ?? {
    vi: localeUrl("vi", path),
    en: localeUrl("en", path),
  };

  return {
    url: alternates[routing.defaultLocale] ?? Object.values(alternates)[0],
    lastModified,
    priority,
    alternates: { languages: alternates },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isNoIndexSite()) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [entry("", 1)];

  for (const { slug, updatedAt } of await getSitemapPosts()) {
    const languages: Record<string, string> = {};

    for (const locale of routing.locales) {
      if (!updatedAt[locale]) continue;
      languages[locale] = localeUrl(locale, `/blog/${slug}`);
    }

    if (Object.keys(languages).length === 0) continue;

    const primary = updatedAt[routing.defaultLocale] ?? Object.values(updatedAt)[0];
    entries.push(entry(`/blog/${slug}`, 0.8, languages, primary));
  }

  return entries;
}
