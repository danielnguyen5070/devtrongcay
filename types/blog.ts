export type BlogPostMeta = {
  title: string;
  description: string;
  slug: string;
  date: string;
  coverImage: string;
  category: string;
  /** Genus-abbreviated botanical name, e.g. "P. ridleyi"; empty for care articles. */
  scientificNameShort: string;
};

export type BlogMedia = {
  src: string;
  alt: string;
};

export type BlogProduct = {
  id: string;
  priceVnd: number | null;
  stock: number;
  productStatus: "draft" | "active" | "archived";
};

export type PostReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PostReviewSummary = {
  reviews: PostReview[];
  count: number;
  /** Mean rating rounded to one decimal; 0 when there are no reviews. */
  average: number;
};

export type BlogPost = BlogPostMeta & {
  updatedAt?: string;
  content: string;
  gallery: BlogMedia[];
  product: BlogProduct;
};
