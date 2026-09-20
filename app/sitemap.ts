import type { MetadataRoute } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { getAllPosts } from "@/lib/blog";
import { getSiteUrl, isNoIndexSite } from "@/lib/site";

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

export default function sitemap(): MetadataRoute.Sitemap {
  if (isNoIndexSite()) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [entry("", 1)];

  const postsByLocale = Object.fromEntries(
    routing.locales.map((locale) => [locale, getAllPosts(locale)]),
  ) as Record<AppLocale, ReturnType<typeof getAllPosts>>;

  const blogSlugs = new Set(
    routing.locales.flatMap((locale) =>
      postsByLocale[locale].map((post) => post.slug),
    ),
  );

  for (const slug of blogSlugs) {
    const languages: Record<string, string> = {};

    for (const locale of routing.locales) {
      const post = postsByLocale[locale].find((item) => item.slug === slug);
      if (!post) continue;
      languages[locale] = localeUrl(locale, `/blog/${slug}`);
    }

    if (Object.keys(languages).length === 0) continue;
    entries.push(entry(`/blog/${slug}`, 0.8, languages));
  }

  return entries;
}
