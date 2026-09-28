import type { MetadataRoute } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPublishedSlugs } from "@/lib/blog";
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
): MetadataRoute.Sitemap[number] {
  const alternates = languages ?? {
    vi: localeUrl("vi", path),
    en: localeUrl("en", path),
  };

  return {
    url: alternates[routing.defaultLocale] ?? Object.values(alternates)[0],
    priority,
    alternates: { languages: alternates },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isNoIndexSite()) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [entry("", 1)];

  const localesBySlug = new Map<string, Set<AppLocale>>();
  for (const { slug, locale } of await getPublishedSlugs()) {
    const locales = localesBySlug.get(slug) ?? new Set<AppLocale>();
    locales.add(locale);
    localesBySlug.set(slug, locales);
  }

  for (const [slug, locales] of localesBySlug) {
    const languages: Record<string, string> = {};

    for (const locale of routing.locales) {
      if (!locales.has(locale)) continue;
      languages[locale] = localeUrl(locale, `/blog/${slug}`);
    }

    if (Object.keys(languages).length === 0) continue;
    entries.push(entry(`/blog/${slug}`, 0.8, languages));
  }

  return entries;
}
