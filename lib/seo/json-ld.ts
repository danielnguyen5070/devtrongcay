import { SOCIAL_LINKS } from "@/components/floating-social-bar";
import { calculateShippingFee } from "@/lib/pricing";
import { SITE_LOGO_PATH, SITE_NAME, absoluteUrl, siteNameFor } from "@/lib/site";
import type { BlogPost, BlogPostMeta, PostReviewSummary } from "@/types/blog";

type JsonLdNode = Record<string, unknown>;

const SCHEMA = "https://schema.org";

const organizationId = () => absoluteUrl("/#organization");
const websiteId = (locale: string) => absoluteUrl(`/${locale}#website`);
const postUrl = (locale: string, slug: string) => absoluteUrl(`/${locale}/blog/${slug}`);

function toIsoDate(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function graph(...nodes: (JsonLdNode | null)[]): JsonLdNode {
  return {
    "@context": SCHEMA,
    "@graph": nodes.filter((node): node is JsonLdNode => node !== null),
  };
}

export function organization(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_LOGO_PATH),
      width: 512,
      height: 512,
    },
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  };
}

export function website(locale: string, description: string): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": websiteId(locale),
    name: siteNameFor(locale),
    url: absoluteUrl(`/${locale}`),
    description,
    inLanguage: locale,
    publisher: { "@id": organizationId() },
  };
}

export function postList(locale: string, posts: BlogPostMeta[]): JsonLdNode {
  return {
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: postUrl(locale, post.slug),
      name: post.title,
    })),
  };
}

export function blogPosting(post: BlogPost, locale: string): JsonLdNode {
  const url = postUrl(locale, post.slug);

  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: post.title,
    description: post.description,
    image: [post.coverImage, ...post.gallery.map((item) => item.src)],
    inLanguage: locale,
    datePublished: toIsoDate(post.date),
    dateModified: toIsoDate(post.updatedAt) ?? toIsoDate(post.date),
    articleSection: post.category || undefined,
    author: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
    isPartOf: { "@id": websiteId(locale) },
  };
}

export function breadcrumb(
  locale: string,
  homeLabel: string,
  post: Pick<BlogPost, "slug" | "title">,
): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: absoluteUrl(`/${locale}`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: post.title,
        item: postUrl(locale, post.slug),
      },
    ],
  };
}

function availability(product: BlogPost["product"]) {
  if (product.productStatus === "archived") return `${SCHEMA}/Discontinued`;
  if (product.stock <= 0) return `${SCHEMA}/OutOfStock`;
  return `${SCHEMA}/InStock`;
}

const MAX_JSON_LD_REVIEWS = 5;

function reviewNodes(reviews: PostReviewSummary): JsonLdNode {
  if (reviews.count === 0) return {};

  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: reviews.average,
      reviewCount: reviews.count,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.reviews.slice(0, MAX_JSON_LD_REVIEWS).map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.authorName },
      datePublished: toIsoDate(review.createdAt),
      reviewBody: review.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}

/** Null when the post is not sold (draft product or no price). */
export function product(
  post: BlogPost,
  locale: string,
  reviews: PostReviewSummary,
): JsonLdNode | null {
  const { priceVnd, productStatus } = post.product;
  if (productStatus === "draft" || priceVnd === null) return null;

  const url = postUrl(locale, post.slug);

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: post.title,
    description: post.description,
    image: [post.coverImage, ...post.gallery.map((item) => item.src)],
    url,
    category: post.category || undefined,
    brand: { "@id": organizationId() },
    offers: {
      "@type": "Offer",
      url,
      price: priceVnd,
      priceCurrency: "VND",
      availability: availability(post.product),
      seller: { "@id": organizationId() },
      availableDeliveryMethod: `${SCHEMA}/ParcelService`,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: calculateShippingFee(priceVnd),
          currency: "VND",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "VN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
    },
    ...reviewNodes(reviews),
  };
}
