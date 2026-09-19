import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BlogGrid } from "@/components/blog-grid";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/blog";
import { SITE_NAME, SITE_NAME_EN, localeToOg, alternateOgLocale } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.metadata" });
  const siteName = locale === "en" ? SITE_NAME_EN : SITE_NAME;
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
      images: [
        {
          url: "/images/og-home.svg",
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/images/og-home.svg"],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const blog = await getTranslations("blog");
  const posts = getAllPosts(locale);

  return (
    <div className="home-page">
      <BlogGrid
        posts={posts}
        label={t("gridLabel")}
        emptyLabel={blog("empty")}
      />
    </div>
  );
}
