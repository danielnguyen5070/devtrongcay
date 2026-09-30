import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BlogGrid } from "@/components/blog-grid";
import { JsonLd } from "@/components/json-ld";
import { routing } from "@/i18n/routing";
import { getPublishedPosts } from "@/lib/blog";
import { graph, postList } from "@/lib/seo/json-ld";
import { alternateOgLocale, localeToOg, siteNameFor } from "@/lib/site";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.metadata" });
  const siteName = siteNameFor(locale);
  const path = `/${locale}`;

  return {
    title: {
      absolute: t("title"),
    },
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: path,
      languages: {
        vi: "/vi",
        en: "/en",
        "x-default": `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: path,
      siteName,
      locale: localeToOg(locale),
      alternateLocale: [alternateOgLocale(locale)],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const blog = await getTranslations("blog");
  const posts = await getPublishedPosts(locale);

  return (
    <div className="home-page">
      <JsonLd data={graph(postList(locale, posts))} />
      <BlogGrid
        posts={posts}
        label={t("gridLabel")}
        emptyLabel={blog("empty")}
        searchLabel={t("search.label")}
        searchPlaceholder={t("search.placeholder")}
        clearSearchLabel={t("search.clear")}
        noResultsLabel={t("search.noResults")}
      />
    </div>
  );
}
