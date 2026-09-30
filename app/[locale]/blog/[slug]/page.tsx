import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BentoGallery } from "@/components/blog/BentoGallery";
import { BlogImage } from "@/components/blog-image";
import { ProductBuyBox } from "@/components/cart/product-buy-box";
import { JsonLd } from "@/components/json-ld";
import { MdxContent } from "@/components/mdx-content";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getPostLocales,
  getPublishedPost,
  getPublishedSlugs,
} from "@/lib/blog";
import { blogPosting, breadcrumb, graph, product } from "@/lib/seo/json-ld";
import { SITE_AUTHOR, absoluteUrl, localeToOg, siteNameFor } from "@/lib/site";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

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

async function blogPostLanguages(slug: string) {
  const languages: Record<string, string> = {};

  for (const locale of await getPostLocales(slug)) {
    languages[locale] = `/${locale}/blog/${slug}`;
  }

  const defaultPath = languages[routing.defaultLocale];
  if (defaultPath) {
    languages["x-default"] = defaultPath;
  }

  return languages;
}

export async function generateStaticParams() {
  return getPublishedSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedPost(locale, slug);

  if (!post) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "home.metadata" });
  const siteName = siteNameFor(locale);
  const path = `/${locale}/blog/${slug}`;
  const image = post.coverImage;
  const keywords = [
    ...(post.category ? [post.category] : []),
    ...t("keywords").split(",").map((keyword) => keyword.trim()),
  ];
  const otherLocales = (await getPostLocales(slug)).filter((item) => item !== locale);

  return {
    title: post.title,
    description: post.description,
    keywords,
    authors: [{ name: SITE_AUTHOR, url: absoluteUrl("/") }],
    alternates: {
      canonical: path,
      languages: await blogPostLanguages(slug),
    },
    openGraph: {
      title: `${post.title} | ${siteName}`,
      description: post.description,
      url: path,
      siteName,
      locale: localeToOg(locale),
      alternateLocale: otherLocales.map(localeToOg),
      type: "article",
      publishedTime: toIsoDate(post.date),
      modifiedTime: toIsoDate(post.updatedAt),
      authors: [SITE_AUTHOR],
      section: post.category || undefined,
      images: [{ url: image, alt: post.title }],
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
  const post = await getPublishedPost(locale, slug);

  if (!post) {
    notFound();
  }

  const t = await getTranslations("blog");

  return (
    <article className="article-shell">
      <JsonLd
        data={graph(
          blogPosting(post, locale),
          breadcrumb(locale, t("breadcrumb.home"), post),
          product(post, locale),
        )}
      />
      <div className="article-frame">
        <nav aria-label={t("breadcrumb.label")}>
          <ol className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tracking-[0.3em] text-[#9da39a] uppercase">
            <li>
              <Link href="/" className="transition-colors hover:text-[#e7e9e3]">
                {t("breadcrumb.home")}
              </Link>
            </li>
            {post.category ? (
              <>
                <li aria-hidden="true">›</li>
                <li>{post.category}</li>
              </>
            ) : null}
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="min-w-0 max-w-full truncate text-[#d6dad2]">
              {post.title}
            </li>
          </ol>
        </nav>

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

        {post.gallery.length > 0 ? (
          <BentoGallery images={post.gallery} />
        ) : (
          <div className="relative mx-auto mt-10 flex aspect-square w-[72%] max-w-sm items-center justify-center">
            <BlogImage
              src={post.coverImage}
              alt={post.title}
              sizes="(max-width: 768px) 70vw, 384px"
              className="h-full w-full"
              priority
            />
          </div>
        )}

        {post.product.productStatus !== "draft" && post.product.priceVnd !== null ? (
          <ProductBuyBox
            initialProduct={{
              postId: post.product.id,
              slug: post.slug,
              title: post.title,
              coverImage: post.coverImage,
              priceVnd: post.product.priceVnd,
              stock: post.product.stock,
              productStatus: post.product.productStatus,
              published: true,
            }}
          />
        ) : null}

        <div className="prose prose-invert mt-12 max-w-none prose-headings:font-heading prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-[#e7e9e3] prose-p:font-sans prose-p:text-[#c4c9c0] prose-a:text-[#d6dad2] prose-strong:text-[#e7e9e3] prose-blockquote:border-white/20 prose-blockquote:text-[#9da39a] prose-code:text-[#e7e9e3] prose-li:text-[#c4c9c0] prose-hr:border-white/14">
          <MdxContent source={post.content} />
        </div>
      </div>
    </article>
  );
}
