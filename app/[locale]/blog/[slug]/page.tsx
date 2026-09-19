import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BlogImage } from "@/components/blog-image";
import { MdxContent } from "@/components/mdx-content";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllSlugs, getPostBySlug, getPostCover } from "@/lib/blog";
import {
  SITE_NAME,
  SITE_NAME_EN,
  alternateOgLocale,
  localeToOg,
} from "@/lib/site";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

function toIsoDate(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function formatDate(value: string, locale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function blogPostLanguages(slug: string) {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    if (getPostBySlug(locale, slug)) {
      languages[locale] = `/${locale}/blog/${slug}`;
    }
  }

  const defaultPath = languages[routing.defaultLocale];
  if (defaultPath) {
    languages["x-default"] = defaultPath;
  }

  return languages;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);

  if (!post) {
    return {};
  }

  const siteName = locale === "en" ? SITE_NAME_EN : SITE_NAME;
  const path = `/${locale}/blog/${slug}`;
  const image = getPostCover(post);
  const publishedTime = toIsoDate(post.date);

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: path,
      languages: blogPostLanguages(slug),
    },
    openGraph: {
      title: `${post.title} | ${siteName}`,
      description: post.description,
      url: path,
      siteName,
      locale: localeToOg(locale),
      alternateLocale: [alternateOgLocale(locale)],
      type: "article",
      publishedTime,
      images: [
        {
          url: image,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${siteName}`,
      description: post.description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);

  if (!post) {
    notFound();
  }

  const t = await getTranslations("blog");
  const cover = getPostCover(post);

  return (
    <article className="article-shell">
      <div className="article-frame">
        <Link
          href="/"
          className="text-[11px] tracking-[0.3em] text-[#9da39a] uppercase transition-colors hover:text-[#e7e9e3]"
        >
          {t("back")}
        </Link>

        <header className="mt-10 border-t border-white/14 pt-10">
          {post.category ? (
            <p className="text-[11px] tracking-[0.3em] text-[#9da39a] uppercase">
              {post.category}
            </p>
          ) : null}

          <h1 className="mt-4 font-heading text-3xl font-normal tracking-tight text-[#e7e9e3] md:text-4xl">
            {post.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#9da39a]">
            {post.description}
          </p>

          {post.date ? (
            <time
              dateTime={post.date}
              className="mt-5 block text-[11px] tracking-[0.24em] text-[#9da39a] uppercase"
            >
              {formatDate(post.date, locale)}
            </time>
          ) : null}
        </header>

        <div className="relative mx-auto mt-10 flex aspect-square w-[72%] max-w-sm items-center justify-center">
          <BlogImage
            src={cover}
            alt={post.title}
            sizes="(max-width: 768px) 70vw, 384px"
            className="h-full w-full"
            priority
          />
        </div>

        <div className="prose prose-invert mt-12 max-w-none prose-headings:font-heading prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-[#e7e9e3] prose-p:font-sans prose-p:text-[#c4c9c0] prose-a:text-[#d6dad2] prose-strong:text-[#e7e9e3] prose-blockquote:border-white/20 prose-blockquote:text-[#9da39a] prose-code:text-[#e7e9e3] prose-li:text-[#c4c9c0] prose-hr:border-white/14">
          <MdxContent source={post.content} />
        </div>
      </div>
    </article>
  );
}
